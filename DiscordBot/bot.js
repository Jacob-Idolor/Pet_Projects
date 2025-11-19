import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  REST, Routes, SlashCommandBuilder, ChannelType,
} from 'discord.js';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { verifyLicense, tierFeatures, formatTier } from './license-manager.js';

const {
  DISCORD_TOKEN: TOKEN,
  CLIENT_ID,
  GUILD_ID,
  PREFIX = '!',
  OPENAI_API_KEY,
  EARNINGS_UTC_HOUR = '15',
  SALES_URL = 'https://yourdomain.com/discord-bot',
  SUPPORT_EMAIL = 'support@example.com',
  TRIAL_DAYS = '7',
  FREE_WATCH_LIMIT = '3',
  FREE_MIN_INTERVAL = '300',
} = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID or GUILD_ID in .env');
  process.exit(1);
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/* ---------------- Persistence ---------------- */
const DATA_PATH = path.resolve('./server-config.json');
/**
 store per guild:
 {
   [guildId]: {
     // watchlist
     channelId, messageId, intervalMs, running, tickers: [],
    // earnings
    earnings: { channelId, hourUTC, running, lastPostISO }
  }
}
*/
let store = {};
const timers = new Map();      // watchlist timers
let dailyTicker;               // earnings scheduler

async function loadStore() {
  try { store = JSON.parse(await fs.readFile(DATA_PATH, 'utf8') || '{}'); }
  catch { store = {}; }
}
async function saveStore() { await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2)); }

let savePending = false;
function scheduleSave() {
  if (savePending) return;
  savePending = true;
  setTimeout(async () => {
    savePending = false;
    try { await saveStore(); }
    catch (err) { console.error('save error:', err?.message || err); }
  }, 0);
}

const TRIAL_DURATION_MS = Math.max(1, Number(TRIAL_DAYS) || 7) * 86400e3;
const WATCH_LIMIT_FREE = Math.max(1, Number(FREE_WATCH_LIMIT) || 3);
const WATCH_MIN_INTERVAL_FREE = Math.max(60, Number(FREE_MIN_INTERVAL) || 300);

function cfgFor(gid) {
  if (!store[gid]) store[gid] = {};
  const c = store[gid];
  if (!c.tickers) c.tickers = [];
  if (!c.intervalMs) c.intervalMs = 60000;
  if (c.running === undefined) c.running = false;
  if (!c.earnings) c.earnings = { channelId: null, hourUTC: Number(EARNINGS_UTC_HOUR) || 15, running: false, lastPostISO: null };
  if (!c.subscription) {
    const expiresAt = new Date(Date.now() + TRIAL_DURATION_MS).toISOString();
    c.subscription = {
      tier: 'trial',
      activatedAt: new Date().toISOString(),
      expiresAt,
      source: 'auto-trial'
    };
    scheduleSave();
  }
  return c;
}

function subscriptionTier(c) {
  const sub = c.subscription;
  if (!sub) return 'free';
  const { tier = 'free', expiresAt } = sub;
  if (expiresAt) {
    const exp = new Date(expiresAt).getTime();
    if (!Number.isNaN(exp) && exp < Date.now()) {
      if (tier !== 'free') {
        sub.tier = 'free';
        sub.expiresAt = null;
        sub.licenseKey = null;
        sub.lastInvalidReason = 'expired';
        scheduleSave();
      }
      return 'free';
    }
  }
  return tier || 'free';
}

function effectiveTier(gid) {
  return subscriptionTier(cfgFor(gid));
}

function hasFeature(gid, feature) {
  const tier = effectiveTier(gid);
  return tierFeatures(tier).has(feature);
}

function featureGateMessage(gid, feature) {
  const c = cfgFor(gid);
  const tier = subscriptionTier(c);
  const sub = c.subscription || {};
  const tierLabel = formatTier(tier, sub.expiresAt);
  const label = FEATURE_LABELS[feature] || feature;
  const upsell = `Upgrade required for ${label} features. Visit ${SALES_URL} or run \`/plans\` to compare tiers.`;
  if (tier === 'trial' && sub.expiresAt) {
    return `${upsell}\nYour trial expires on ${new Date(sub.expiresAt).toISOString().slice(0, 10)}.`;
  }
  return `${upsell}\nCurrent plan: ${tierLabel}. Need help? Email ${SUPPORT_EMAIL}.`;
}

const FEATURE_LABELS = {
  quotes: 'Real-time quotes',
  'watch-basic': `Watchlist (${WATCH_LIMIT_FREE} tickers)`,
  'watch-pro': 'Unlimited watchlist + rapid refresh',
  analysis: 'AI-powered analysis',
  earnings: 'Automated earnings digest',
  pl: 'Options P/L calculator',
  ai: 'AI enhancements',
  webhooks: 'CRM/Webhook integrations'
};

function enforceWatchLimits(gid) {
  const c = cfgFor(gid);
  if (hasFeature(gid, 'watch-pro')) return c;
  if (c.tickers.length > WATCH_LIMIT_FREE) {
    c.tickers = c.tickers.slice(0, WATCH_LIMIT_FREE);
    scheduleSave();
  }
  if ((c.intervalMs || 60000) < WATCH_MIN_INTERVAL_FREE * 1000) {
    c.intervalMs = WATCH_MIN_INTERVAL_FREE * 1000;
    if (c.running) startWatch(gid, c.intervalMs);
    scheduleSave();
  }
  return c;
}

async function requireFeatureSlash(ix, feature) {
  const gid = ix.guildId;
  if (!gid) return true;
  if (hasFeature(gid, feature)) return true;
  await ix.reply({ content: featureGateMessage(gid, feature), ephemeral: true });
  return false;
}

async function requireFeatureMessage(msg, feature) {
  const gid = msg.guild?.id;
  if (!gid) return true;
  if (hasFeature(gid, feature)) return true;
  await msg.reply(featureGateMessage(gid, feature));
  return false;
}

/* ---------------- Utilities ---------------- */
function chunk(arr, n) { const out=[]; for(let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n)); return out; }

async function fetchQuoteSafe(t) {
  try {
    const q = await yahooFinance.quote(t);
    if (!q || q.regularMarketPrice == null) return { ticker: t, error: 'No data' };
    const price = Number(q.regularMarketPrice);
    const prevClose = q.regularMarketPreviousClose != null ? Number(q.regularMarketPreviousClose) : null;
    const dayLow = q.regularMarketDayLow != null ? Number(q.regularMarketDayLow) : null;
    const dayHigh = q.regularMarketDayHigh != null ? Number(q.regularMarketDayHigh) : null;
    const currency = q.currency || '';
    let changeTxt = 'N/A';
    if (prevClose && prevClose !== 0) {
      const ch = price - prevClose;
      const pct = (ch / prevClose) * 100;
      changeTxt = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
    }
    return { ticker: t, price, currency, changeTxt, dayLow, dayHigh };
  } catch { return { ticker: t, error: 'API error' }; }
}

async function buildAnalysisEmbed(ticker) {
  const q = await fetchQuoteSafe(ticker);
  if (q.error) return { error: q.error };

  let targetHigh, targetLow, targetMean;
  try {
    const qs = await yahooFinance.quoteSummary(ticker, { modules: ['financialData'] });
    const fd = qs?.financialData;
    targetHigh = fd?.targetHighPrice != null ? Number(fd.targetHighPrice) : null;
    targetLow = fd?.targetLowPrice != null ? Number(fd.targetLowPrice) : null;
    targetMean = fd?.targetMeanPrice != null ? Number(fd.targetMeanPrice) : null;
  } catch {}

  let perf5d = null, lastChange = null, outlier = false;
  try {
    const hist = await yahooFinance.historical(ticker, { period1: new Date(Date.now() - 7*86400e3), interval: '1d' });
    if (hist.length >= 2) {
      const start = hist[0].close;
      const end = hist[hist.length - 1].close;
      perf5d = ((end - start) / start) * 100;
      const prev = hist[hist.length - 2].close;
      lastChange = ((end - prev) / prev) * 100;
      outlier = Math.abs(lastChange) >= 5;
    }
  } catch {}

  let bull = '', bear = '';
  if (openai) {
    try {
      const prompt = `Give two concise bullet points each for bullish and bearish cases for ${ticker}.` +
        `\nFormat as:\nBullish:\n- ...\n- ...\nBearish:\n- ...\n- ...`;
      const r = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = r.choices?.[0]?.message?.content || '';
      const parts = text.split(/Bearish:/i);
      bull = parts[0]?.replace(/Bullish:/i, '').trim();
      bear = parts[1]?.trim() || '';
    } catch { bull = bear = 'AI error'; }
  } else {
    bull = bear = 'OpenAI not configured';
  }

  const fields = [
    { name: 'Price', value: `${q.price.toFixed(2)} ${q.currency}`, inline: true },
    { name: 'Change', value: q.changeTxt, inline: true },
  ];
  if (perf5d != null) fields.push({ name: '5d Perf', value: `${perf5d >= 0 ? '+' : ''}${perf5d.toFixed(2)}%`, inline: true });
  if (targetMean != null) {
    const tgt = `Low ${targetLow?.toFixed(2) || 'N/A'} / Mean ${targetMean.toFixed(2)} / High ${targetHigh?.toFixed(2) || 'N/A'}`;
    fields.push({ name: 'Price Targets', value: tgt, inline: false });
  }
  if (bull) fields.push({ name: 'Bullish', value: bull, inline: false });
  if (bear) fields.push({ name: 'Bearish', value: bear, inline: false });
  if (outlier && lastChange != null) {
    fields.push({ name: '⚠️ Outlier Move', value: `${lastChange >= 0 ? '+' : ''}${lastChange.toFixed(2)}% today`, inline: false });
  }
  return new EmbedBuilder().setTitle(`${ticker} Analysis`).addFields(fields).setColor(0x2b7).setTimestamp(new Date());
}

/* ---------------- Watchlist rendering ---------------- */
async function renderWatchEmbed(gid) {
  const c = cfgFor(gid); const tickers = (c.tickers || []).map(s => s.toUpperCase());
  if (!tickers.length) {
    return new EmbedBuilder().setTitle('📈 Watchlist')
      .setDescription(`No tickers.\nUse \`${PREFIX}watch add AAPL TSLA SPY\` or \`/watch add\`.`)
      .setColor(0x2b7);
  }
  const results = [];
  for (const g of chunk(tickers, 8)) {
    results.push(...await Promise.all(g.map(fetchQuoteSafe)));
    await new Promise(r => setTimeout(r, 300));
  }
  const fields = results.map(r => {
    if (r.error) return { name: r.ticker, value: `⚠️ ${r.error}`, inline: true };
    const range = (r.dayLow != null && r.dayHigh != null) ? `• Range: ${r.dayLow.toFixed(2)}–${r.dayHigh.toFixed(2)}` : '';
    return { name: r.ticker, value: `**${r.price.toFixed(2)} ${r.currency}**\n• Change: ${r.changeTxt}\n${range}`, inline: true };
  });
  return new EmbedBuilder()
    .setTitle('📈 Live Watchlist')
    .setDescription(`Tickers: ${tickers.join(', ')}`)
    .addFields(fields)
    .setFooter({ text: `Auto-updates every ${Math.round((c.intervalMs || 60000)/1000)}s` })
    .setColor(0x2b7)
    .setTimestamp(new Date());
}

async function postOrUpdateWatchMessage(gid) {
  const c = cfgFor(gid); if (!c.channelId) return;
  try {
    const channel = await client.channels.fetch(c.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;
    const embed = await renderWatchEmbed(gid);
    if (c.messageId) {
      try { const m = await channel.messages.fetch(c.messageId); await m.edit({ embeds: [embed] }); return; }
      catch { /* recreate if missing */ }
    }
    const newMsg = await channel.send({ embeds: [embed] });
    c.messageId = newMsg.id; await saveStore();
  } catch (e) { console.error('watch update error:', e?.message || e); }
}
function startWatch(gid, ms) { stopWatch(gid); timers.set(gid, setInterval(() => postOrUpdateWatchMessage(gid), ms)); const c = cfgFor(gid); c.running = true; c.intervalMs = ms; saveStore(); }
function stopWatch(gid) { const t = timers.get(gid); if (t) clearInterval(t); timers.delete(gid); const c = cfgFor(gid); c.running = false; saveStore(); }

/* ---------------- Options P/L (single leg) ---------------- */
function computePL({ type, strike, premium, target, contractSize = 100 }) {
  const sT = target;
  const intrinsic = type === 'CALL' ? Math.max(0, sT - strike) : Math.max(0, strike - sT);
  const pnlPerShare = intrinsic - premium;
  const pnl = pnlPerShare * contractSize;
  const breakeven = type === 'CALL' ? strike + premium : strike - premium;
  const maxLoss = premium * contractSize;
  const maxGain = type === 'CALL' ? Infinity : premium * contractSize; // simple floor assumption
  return { intrinsic, pnlPerShare, pnl, breakeven, maxLoss, maxGain };
}

function plansEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('💼 GrowthBot Plans')
    .setColor(0x2b7)
    .setDescription(`Turn your trading community into recurring revenue. Learn more at ${SALES_URL}.`)
    .addFields(
      {
        name: 'Free',
        value: [
          '• 3 watchlist tickers (5 min refresh)',
          '• Live quotes & options P/L',
          '• Community upsell drip',
          `Trial: ${Math.max(1, Number(TRIAL_DAYS) || 7)} days of Pro features`
        ].join('\n'),
        inline: false
      },
      {
        name: 'Pro — $19/mo per server',
        value: [
          '• Unlimited tickers & 60s refresh',
          '• AI-powered analysis summaries',
          '• Automated earnings digests',
          '• Reseller dashboard & license keys'
        ].join('\n'),
        inline: false
      },
      {
        name: 'Enterprise — $49/mo',
        value: [
          '• Everything in Pro',
          '• SLA + priority support',
          '• Webhook + CRM integrations (beta)',
          `• Concierge onboarding — ${SUPPORT_EMAIL}`
        ].join('\n'),
        inline: false
      }
    );
  return embed;
}

function licenseStatusEmbed(gid) {
  const c = cfgFor(gid);
  const tier = subscriptionTier(c);
  const expiresAt = c.subscription?.expiresAt || null;
  const features = Array.from(tierFeatures(tier) || []).map(f => `• ${FEATURE_LABELS[f] || f}`).join('\n') || '• quotes\n• pl';
  return new EmbedBuilder()
    .setTitle('🔐 License Status')
    .addFields(
      { name: 'Plan', value: formatTier(tier, expiresAt), inline: true },
      { name: 'Auto Trial Started', value: c.subscription?.activatedAt ? new Date(c.subscription.activatedAt).toISOString().slice(0, 10) : 'N/A', inline: true },
      { name: 'Features', value: features, inline: false }
    )
    .setFooter({ text: `Need help? ${SUPPORT_EMAIL}` })
    .setColor(0x2b7);
}

function tierTag(gid) {
  const c = cfgFor(gid);
  const tier = subscriptionTier(c);
  const expiresAt = c.subscription?.expiresAt;
  return formatTier(tier, expiresAt);
}

function onboardingEmbed(guild, gid) {
  return new EmbedBuilder()
    .setTitle('🚀 Welcome to GrowthBot')
    .setColor(0x2b7)
    .setDescription([
      `Thanks for inviting me to **${guild.name}**!`,
      '',
      'What happens next:',
      '1. Use /plans to review Free vs Pro perks.',
      `2. Start your auto-trial (${Math.max(1, Number(TRIAL_DAYS) || 7)} days) by running /license status.`,
      '3. Set up your first watchlist: /watch add AAPL TSLA and /watch channel #trading.',
      '',
      `Ready to resell signals? Activate a license key from ${SALES_URL}.`
    ].join('\n'))
    .addFields(
      { name: 'Current Plan', value: tierTag(gid), inline: true },
      { name: 'Support', value: SUPPORT_EMAIL, inline: true }
    )
    .setFooter({ text: 'Turn your Discord community into passive income.' });
}

/* ---------------- Earnings Digest ---------------- */
async function fetchEarningsFor(ticker) {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, { modules: ['calendarEvents'] });
    const ed = summary?.calendarEvents?.earnings?.earningsDate;
    if (!ed) return null;
    const dates = Array.isArray(ed) ? ed : [ed];
    const iso = dates.map(d => (d?.toISOString ? d.toISOString() : (d?.fmt ? d.fmt : null))).filter(Boolean);
    return { ticker, dates: iso };
  } catch { return null; }
}
async function runDailyEarningsDigest() {
  for (const [gid] of Object.entries(store)) {
    try {
      const c = cfgFor(gid);
      if (!c.earnings.running || !c.earnings.channelId || !(c.tickers?.length)) continue;
      const channel = await client.channels.fetch(c.earnings.channelId);
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      const now = new Date();
      const weekAhead = new Date(now.getTime() + 7*24*3600*1000);
      const results = [];
      for (const g of chunk(c.tickers, 10)) {
        results.push(...(await Promise.all(g.map(fetchEarningsFor))).filter(Boolean));
        await new Promise(r => setTimeout(r, 350));
      }
      const lines = [];
      for (const r of results) {
        const next = r.dates?.map(d => new Date(d)).sort((a,b)=>a-b)[0];
        if (next && next >= now && next <= weekAhead) lines.push(`• **${r.ticker}** — ${next.toISOString().slice(0,10)}`);
      }
      if (!lines.length) await channel.send('📅 No watchlist earnings in the next 7 days.');
      else {
        const embed = new EmbedBuilder().setTitle('📅 Upcoming Earnings (7 days)').setDescription(lines.join('\n')).setTimestamp(new Date()).setColor(0x2b7);
        await channel.send({ embeds: [embed] });
      }
      c.earnings.lastPostISO = new Date().toISOString(); await saveStore();
    } catch (e) { console.error('earnings digest error:', e?.message || e); }
  }
}
function scheduleDailyDigest() {
  if (dailyTicker) clearInterval(dailyTicker);
  dailyTicker = setInterval(async () => {
    const now = new Date();
    for (const [gid] of Object.entries(store)) {
      const c = cfgFor(gid);
      enforceWatchLimits(gid);
      if (!c.earnings.running) continue;
      const targetHour = Number(c.earnings.hourUTC ?? 15);
      const lastISO = c.earnings.lastPostISO;
      const lastDay = lastISO ? new Date(lastISO).toISOString().slice(0,10) : null;
      const today = now.toISOString().slice(0,10);
      if (now.getUTCHours() === targetHour && today !== lastDay) await runDailyEarningsDigest();
    }
  }, 60 * 1000);
}

/* ---------------- Slash commands ---------------- */
const slashDefs = [
  new SlashCommandBuilder().setName('ping').setDescription('Bot health check'),
  new SlashCommandBuilder().setName('help').setDescription('Show available commands'),
  new SlashCommandBuilder().setName('plans').setDescription('See pricing tiers and features'),

  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a quick stock/ETF quote')
    .addStringOption(o => o.setName('ticker').setDescription('Ticker (e.g., AAPL)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('analysis')
    .setDescription('Detailed stock analysis')
    .addStringOption(o => o.setName('ticker').setDescription('Ticker (e.g., AAPL)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('pl')
    .setDescription('Single-leg option P/L at target')
    .addStringOption(o => o.setName('ticker').setDescription('Underlying ticker').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('CALL or PUT').setRequired(true)
      .addChoices({name:'CALL', value:'CALL'}, {name:'PUT', value:'PUT'}))
    .addNumberOption(o => o.setName('strike').setDescription('Strike price').setRequired(true))
    .addNumberOption(o => o.setName('premium').setDescription('Premium paid per share').setRequired(true))
    .addStringOption(o => o.setName('expiry').setDescription('YYYY-MM-DD (informational)').setRequired(true))
    .addNumberOption(o => o.setName('target').setDescription('Target stock price at expiry').setRequired(true)),

  new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Manage live watchlist')
    .addSubcommand(sc => sc.setName('add').setDescription('Add tickers')
      .addStringOption(o => o.setName('tickers').setDescription('AAPL TSLA SPY').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Remove a ticker')
      .addStringOption(o => o.setName('ticker').setDescription('Symbol').setRequired(true)))
    .addSubcommand(sc => sc.setName('list').setDescription('Show current tickers'))
    .addSubcommand(sc => sc.setName('channel').setDescription('Set watch channel')
      .addChannelOption(o => o.setName('channel').setDescription('Text channel').setRequired(true)))
    .addSubcommand(sc => sc.setName('start').setDescription('Start auto-updates')
      .addIntegerOption(o => o.setName('interval').setDescription('Seconds (>=15)')))
    .addSubcommand(sc => sc.setName('stop').setDescription('Stop auto-updates'))
    .addSubcommand(sc => sc.setName('interval').setDescription('Change interval')
      .addIntegerOption(o => o.setName('seconds').setDescription('Seconds >=15').setRequired(true))),

  new SlashCommandBuilder()
    .setName('earnings')
    .setDescription('Upcoming earnings (from watchlist)')
    .addSubcommand(sc => sc.setName('channel').setDescription('Set digest channel')
      .addChannelOption(o => o.setName('channel').setDescription('Text channel').setRequired(true)))
    .addSubcommand(sc => sc.setName('start').setDescription('Enable daily digest')
      .addIntegerOption(o => o.setName('utchour').setDescription('UTC hour 0-23')))
    .addSubcommand(sc => sc.setName('stop').setDescription('Disable daily digest')),

  new SlashCommandBuilder()
    .setName('license')
    .setDescription('Manage subscription license')
    .addSubcommand(sc => sc.setName('status').setDescription('Show current plan'))
    .addSubcommand(sc => sc.setName('activate').setDescription('Activate a license key')
      .addStringOption(o => o.setName('key').setDescription('License key string').setRequired(true)))
    .addSubcommand(sc => sc.setName('revoke').setDescription('Revert to free plan'))
].map(c => c.toJSON());

async function registerSlash() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: slashDefs });
  console.log('✅ Slash commands registered.');
}

/* ---------------- Client ---------------- */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await loadStore();
  await registerSlash();
  // restore watch
  for (const [gid] of Object.entries(store)) {
    const c = cfgFor(gid);
    if (c.running && c.channelId && c.tickers?.length) startWatch(gid, c.intervalMs || 60000);
  }
  scheduleDailyDigest();
});

client.on('guildCreate', async (guild) => {
  try {
    const gid = guild.id;
    const c = cfgFor(gid);
    if (c?.subscription?.welcomeSent) return;
    let channel = null;
    if (guild.systemChannelId) {
      channel = await guild.channels.fetch(guild.systemChannelId).catch(() => null);
      if (channel?.type !== ChannelType.GuildText) channel = null;
    }
    if (!channel) {
      try {
        const fetched = await guild.channels.fetch();
        channel = fetched.find(ch => ch?.type === ChannelType.GuildText);
      } catch {}
    }
    if (!channel) return;
    await channel.send({
      content: `Hi ${guild.name}! I'm GrowthBot — your automated finance sidekick.`,
      embeds: [onboardingEmbed(guild, gid)]
    });
    if (c?.subscription) { c.subscription.welcomeSent = true; scheduleSave(); }
  } catch (e) {
    console.error('guildCreate welcome error:', e?.message || e);
  }
});

/* ---------------- Slash handler ---------------- */
client.on('interactionCreate', async (ix) => {
  try {
    if (!ix.isChatInputCommand()) return;
    const gid = ix.guildId; const c = cfgFor(gid);

    if (ix.commandName === 'ping') return ix.reply({ content: 'pong', ephemeral: true });
    if (ix.commandName === 'help') return ix.reply({ embeds: [helpEmbed()], ephemeral: true });
    if (ix.commandName === 'plans') return ix.reply({ embeds: [plansEmbed()], ephemeral: true });

    if (ix.commandName === 'quote') {
      const t = ix.options.getString('ticker', true).toUpperCase();
      await ix.deferReply();
      const r = await fetchQuoteSafe(t);
      if (r.error) return ix.editReply(`No live data for \`${t}\`.`);
      const fields = [
        { name: 'Price', value: `${r.price.toFixed(2)} ${r.currency}`, inline: true },
        { name: 'Change', value: r.changeTxt, inline: true },
      ];
      if (r.dayLow != null && r.dayHigh != null) fields.push({ name: 'Day Range', value: `${r.dayLow.toFixed(2)}–${r.dayHigh.toFixed(2)}`, inline: true });
      const embed = new EmbedBuilder().setTitle(`${t} Quote`).addFields(fields).setColor(0x2b7);
      return ix.editReply({ embeds: [embed] });
    }

    if (ix.commandName === 'analysis') {
      if (!(await requireFeatureSlash(ix, 'analysis'))) return;
      const t = ix.options.getString('ticker', true).toUpperCase();
      await ix.deferReply();
      const embed = await buildAnalysisEmbed(t);
      if (embed?.error) return ix.editReply(`No data for \`${t}\`.`);
      return ix.editReply({ embeds: [embed] });
    }

    if (ix.commandName === 'pl') {
      const type = ix.options.getString('type', true).toUpperCase();
      const strike = ix.options.getNumber('strike', true);
      const premium = ix.options.getNumber('premium', true);
      const expiry = ix.options.getString('expiry', true);
      const target = ix.options.getNumber('target', true);
      const out = computePL({ type, strike, premium, target });
      const embed = new EmbedBuilder()
        .setTitle(`P/L — ${type} ${strike} (prem ${premium}) @ target ${target}`)
        .setDescription(`Expiry: ${expiry}`)
        .addFields(
          { name: 'Breakeven', value: out.breakeven.toFixed(2), inline: true },
          { name: 'Max Loss', value: `$${out.maxLoss.toFixed(2)}`, inline: true },
          { name: 'P/L at Target', value: `$${out.pnl.toFixed(2)}`, inline: true },
          { name: 'Intrinsic @ Target', value: out.intrinsic.toFixed(2), inline: true }
        )
        .setColor(0x2b7);
      return ix.reply({ embeds: [embed] });
    }

    if (ix.commandName === 'watch') {
      const sub = ix.options.getSubcommand();
      if (sub === 'add') {
        const toAdd = ix.options.getString('tickers', true).split(/[,\s]+/).map(s=>s.toUpperCase()).filter(Boolean);
        c.tickers = Array.from(new Set([...(c.tickers||[]), ...toAdd])); await saveStore();
        enforceWatchLimits(gid);
        if (!hasFeature(gid, 'watch-pro') && c.tickers.length >= WATCH_LIMIT_FREE) {
          if (c.running) await postOrUpdateWatchMessage(gid);
          return ix.reply(`✅ Added (Free plan limit ${WATCH_LIMIT_FREE}). Current: ${c.tickers.join(', ')}`);
        }
        if (c.running) await postOrUpdateWatchMessage(gid);
        return ix.reply(`✅ Added: ${toAdd.join(', ')}\nCurrent: ${c.tickers.join(', ')}`);
      }
      if (sub === 'remove') {
        const sym = ix.options.getString('ticker', true).toUpperCase();
        c.tickers = (c.tickers||[]).filter(s=>s!==sym); await saveStore();
        enforceWatchLimits(gid);
        if (c.running) await postOrUpdateWatchMessage(gid);
        return ix.reply(`🗑️ Removed: ${sym}\nCurrent: ${c.tickers.join(', ') || '(none)'}`);
      }
      if (sub === 'list') return ix.reply(`📋 Current: ${c.tickers?.length ? c.tickers.join(', ') : '(none)'}`);
      if (sub === 'channel') {
        const ch = ix.options.getChannel('channel', true);
        if (ch.type !== ChannelType.GuildText) return ix.reply('Pick a text channel.');
        c.channelId = ch.id; c.messageId = null; await saveStore();
        return ix.reply(`📨 Watchlist channel set to ${ch}`);
      }
      if (sub === 'start') {
        const s = ix.options.getInteger('interval') || 60;
        if (!c.channelId) return ix.reply('Set channel: `/watch channel`');
        if (!c.tickers?.length) return ix.reply('Add tickers: `/watch add`');
        if (!hasFeature(gid, 'watch-pro') && s < WATCH_MIN_INTERVAL_FREE) {
          return ix.reply(`Free plan minimum interval is ${WATCH_MIN_INTERVAL_FREE} seconds. Upgrade for faster refresh.`);
        }
        c.intervalMs = Math.max(15, s)*1000; await saveStore(); startWatch(gid, c.intervalMs); enforceWatchLimits(gid); await postOrUpdateWatchMessage(gid);
        return ix.reply(`▶️ Started every ${Math.round(c.intervalMs/1000)}s.`);
      }
      if (sub === 'stop') { stopWatch(gid); return ix.reply('⏸️ Stopped.'); }
      if (sub === 'interval') {
        const s = ix.options.getInteger('seconds', true);
        if (s < 15) return ix.reply('Provide >= 15 seconds.');
        if (!hasFeature(gid, 'watch-pro') && s < WATCH_MIN_INTERVAL_FREE) {
          return ix.reply(`Free plan minimum interval is ${WATCH_MIN_INTERVAL_FREE} seconds.`);
        }
        c.intervalMs = s*1000; await saveStore(); if (c.running) startWatch(gid, c.intervalMs);
        return ix.reply(`⏱️ Interval set to ${s}s.`);
      }
    }

    if (ix.commandName === 'earnings') {
      const sub = ix.options.getSubcommand();
      if (sub === 'channel') {
        if (!(await requireFeatureSlash(ix, 'earnings'))) return;
        const ch = ix.options.getChannel('channel', true);
        if (ch.type !== ChannelType.GuildText) return ix.reply('Pick a text channel.');
        c.earnings.channelId = ch.id; await saveStore();
        return ix.reply(`📨 Earnings digest channel set to ${ch}`);
      }
      if (sub === 'start') {
        if (!(await requireFeatureSlash(ix, 'earnings'))) return;
        const hour = ix.options.getInteger('utchour') ?? c.earnings.hourUTC ?? 15;
        c.earnings.running = true; c.earnings.hourUTC = Math.min(23, Math.max(0, Number(hour)));
        await saveStore(); scheduleDailyDigest();
        return ix.reply(`▶️ Earnings digest enabled at ${c.earnings.hourUTC}:00 UTC daily.`);
      }
      if (sub === 'stop') { c.earnings.running = false; await saveStore(); return ix.reply('⏸️ Earnings digest disabled.'); }
    }

    if (ix.commandName === 'license') {
      const sub = ix.options.getSubcommand();
      if (sub === 'status') {
        return ix.reply({ embeds: [licenseStatusEmbed(gid)], ephemeral: true });
      }
      if (sub === 'activate') {
        const key = ix.options.getString('key', true).trim();
        const result = verifyLicense(key, gid);
        if (!result.valid) {
          c.subscription.lastInvalidReason = result.reason;
          scheduleSave();
          return ix.reply({ content: `❌ ${result.reason}`, ephemeral: true });
        }
        c.subscription = {
          tier: result.tier,
          licenseKey: key,
          expiresAt: result.expiresAt || null,
          activatedAt: new Date().toISOString(),
          source: 'license',
          payload: result.payload
        };
        await saveStore();
        enforceWatchLimits(gid);
        return ix.reply({ content: `✅ Activated ${tierTag(gid)}.`, ephemeral: true });
      }
      if (sub === 'revoke') {
        c.subscription = { tier: 'free', activatedAt: new Date().toISOString(), source: 'revoke' };
        enforceWatchLimits(gid);
        await saveStore();
        return ix.reply({ content: '🔓 Reverted to free tier.', ephemeral: true });
      }
    }

  } catch (e) {
    console.error('interaction error:', e?.message || e);
    if (!ix.replied) ix.reply({ content: 'Error handling command.', ephemeral: true }).catch(()=>{});
  }
});

/* ---------------- Prefix (!) handler ---------------- */
client.on('messageCreate', async (msg) => {
  try {
    if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
    const gid = msg.guild?.id; if (!gid) return;
    const c = cfgFor(gid);
    const [raw, ...args] = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = (raw || '').toLowerCase();

    if (cmd === 'ping') return void msg.reply('pong');
    if (cmd === 'help') return void msg.reply({ embeds: [helpEmbed()] });
    if (cmd === 'plans') return void msg.reply({ embeds: [plansEmbed()] });

    if (cmd === 'quote') {
      const t = (args[0] || '').toUpperCase(); if (!t) return void msg.reply(`Usage: \`${PREFIX}quote TICKER\``);
      const r = await fetchQuoteSafe(t);
      if (r.error) return void msg.reply(`No live data for \`${t}\`.`);
      const fields = [
        { name: 'Price', value: `${r.price.toFixed(2)} ${r.currency}`, inline: true },
        { name: 'Change', value: r.changeTxt, inline: true },
      ];
      if (r.dayLow != null && r.dayHigh != null) fields.push({ name: 'Day Range', value: `${r.dayLow.toFixed(2)}–${r.dayHigh.toFixed(2)}`, inline: true });
      const embed = new EmbedBuilder().setTitle(`${t} Quote`).addFields(fields).setColor(0x2b7);
      return void msg.channel.send({ embeds: [embed] });
    }

    if (cmd === 'analysis') {
      if (!(await requireFeatureMessage(msg, 'analysis'))) return;
      const t = (args[0] || '').toUpperCase(); if (!t) return void msg.reply(`Usage: \`${PREFIX}analysis TICKER\``);
      const embed = await buildAnalysisEmbed(t);
      if (embed?.error) return void msg.reply(`No data for \`${t}\`.`);
      return void msg.channel.send({ embeds: [embed] });
    }

    if (cmd === 'pl') {
      // !pl TICKER CALL|PUT STRIKE PREMIUM EXPIRY TARGET
      const [ticker, ttype, sStr, premStr, expiry, targetStr] = args;
      const type = (ttype || '').toUpperCase();
      const strike = Number(sStr), premium = Number(premStr), target = Number(targetStr);
      if (!ticker || !['CALL','PUT'].includes(type) || !strike || !premium || !expiry || !target) {
        return void msg.reply(`Usage: \`${PREFIX}pl TICKER CALL|PUT STRIKE PREMIUM EXPIRY(YYYY-MM-DD) TARGET\`\nExample: \`${PREFIX}pl AAPL CALL 180 5 2025-09-19 190\``);
      }
      const out = computePL({ type, strike, premium, target });
      const embed = new EmbedBuilder()
        .setTitle(`P/L — ${type} ${strike} (prem ${premium}) @ target ${target}`)
        .setDescription(`Expiry: ${expiry}`)
        .addFields(
          { name: 'Breakeven', value: out.breakeven.toFixed(2), inline: true },
          { name: 'Max Loss', value: `$${out.maxLoss.toFixed(2)}`, inline: true },
          { name: 'P/L at Target', value: `$${out.pnl.toFixed(2)}`, inline: true },
          { name: 'Intrinsic @ Target', value: out.intrinsic.toFixed(2), inline: true }
        )
        .setColor(0x2b7);
      return void msg.channel.send({ embeds: [embed] });
    }

    // Watch commands
    if (cmd === 'watch') {
      const sub = (args.shift() || '').toLowerCase();
      if (sub === 'add') {
        const toAdd = args.map(x=>x.toUpperCase()).filter(Boolean);
        if (!toAdd.length) return void msg.reply(`Usage: \`${PREFIX}watch add AAPL TSLA SPY\``);
        c.tickers = Array.from(new Set([...(c.tickers||[]), ...toAdd])); await saveStore();
        enforceWatchLimits(gid);
        if (!hasFeature(gid, 'watch-pro') && c.tickers.length >= WATCH_LIMIT_FREE) {
          if (c.running) await postOrUpdateWatchMessage(gid);
          return void msg.reply(`✅ Added (Free plan limit ${WATCH_LIMIT_FREE}). Current: ${c.tickers.join(', ')}`);
        }
        if (c.running) await postOrUpdateWatchMessage(gid);
        return void msg.reply(`✅ Added: ${toAdd.join(', ')}\nCurrent: ${c.tickers.join(', ')}`);
      }
      if (sub === 'remove') {
        const sym = (args[0]||'').toUpperCase(); if (!sym) return void msg.reply(`Usage: \`${PREFIX}watch remove TICKER\``);
        c.tickers = (c.tickers||[]).filter(s=>s!==sym); await saveStore(); enforceWatchLimits(gid); if (c.running) await postOrUpdateWatchMessage(gid);
        return void msg.reply(`🗑️ Removed: ${sym}\nCurrent: ${c.tickers.join(', ')||'(none)'}`);
      }
      if (sub === 'list') return void msg.reply(`📋 Current: ${c.tickers?.length ? c.tickers.join(', ') : '(none)'}`);
      if (sub === 'channel') {
        const ch = msg.mentions.channels.first(); if (!ch) return void msg.reply(`Usage: \`${PREFIX}watch channel #channel\``);
        if (ch.type !== ChannelType.GuildText) return void msg.reply('Pick a text channel.');
        c.channelId = ch.id; c.messageId = null; await saveStore(); return void msg.reply(`📨 Watchlist channel set to ${ch}.`);
      }
      if (sub === 'start') {
        const s = Number(args[0]) || 60;
        if (!c.channelId) return void msg.reply('Set channel first.');
        if (!c.tickers?.length) return void msg.reply('Add tickers first.');
        if (!hasFeature(gid, 'watch-pro') && s < WATCH_MIN_INTERVAL_FREE) {
          return void msg.reply(`Free plan minimum interval is ${WATCH_MIN_INTERVAL_FREE} seconds. Upgrade for faster refresh.`);
        }
        c.intervalMs = Math.max(15, s)*1000; await saveStore(); startWatch(gid, c.intervalMs); enforceWatchLimits(gid); await postOrUpdateWatchMessage(gid);
        return void msg.reply(`▶️ Started every ${Math.round(c.intervalMs/1000)}s.`);
      }
      if (sub === 'stop') { stopWatch(gid); return void msg.reply('⏸️ Stopped.'); }
      if (sub === 'interval') {
        const s = Number(args[0]); if (!s || s < 15) return void msg.reply('Provide seconds >= 15.');
        if (!hasFeature(gid, 'watch-pro') && s < WATCH_MIN_INTERVAL_FREE) {
          return void msg.reply(`Free plan minimum interval is ${WATCH_MIN_INTERVAL_FREE} seconds.`);
        }
        c.intervalMs = s*1000; await saveStore(); if (c.running) startWatch(gid, c.intervalMs); return void msg.reply(`⏱️ Interval set to ${s}s.`);
      }
      return void msg.reply(`Use: add/remove/list/channel/start/stop/interval — or \`/watch\` for guided UI.`);
    }

    if (cmd === 'license') {
      const sub = (args.shift() || '').toLowerCase();
      if (sub === 'status') {
        return void msg.reply({ embeds: [licenseStatusEmbed(gid)] });
      }
      if (sub === 'activate') {
        const key = (args[0] || '').trim();
        if (!key) return void msg.reply(`Usage: \`${PREFIX}license activate YOUR_KEY\``);
        const result = verifyLicense(key, gid);
        if (!result.valid) {
          c.subscription.lastInvalidReason = result.reason;
          scheduleSave();
          return void msg.reply(`❌ ${result.reason}`);
        }
        c.subscription = {
          tier: result.tier,
          licenseKey: key,
          expiresAt: result.expiresAt || null,
          activatedAt: new Date().toISOString(),
          source: 'license',
          payload: result.payload
        };
        await saveStore();
        enforceWatchLimits(gid);
        return void msg.reply(`✅ Activated ${tierTag(gid)}.`);
      }
      if (sub === 'revoke') {
        c.subscription = { tier: 'free', activatedAt: new Date().toISOString(), source: 'revoke' };
        enforceWatchLimits(gid);
        await saveStore();
        return void msg.reply('🔓 Reverted to free tier.');
      }
      return void msg.reply(`Usage: \`${PREFIX}license status|activate|revoke\``);
    }

    return void msg.reply(`Unknown command. Try \`${PREFIX}help\`.`);
  } catch (e) { console.error('message handler error:', e?.message || e); }
});

function helpEmbed() {
  return new EmbedBuilder()
    .setTitle('🧭 Commands')
    .setColor(0x2b7)
    .setDescription([
      `Prefix: \`${PREFIX}\`  (slash commands too)`,
      '',
      '**General**',
      `• \`${PREFIX}ping\`  /  \`/ping\``,
      `• \`${PREFIX}help\`  /  \`/help\``,
      `• \`${PREFIX}plans\` / \`/plans\` — pricing & features`,
      '',
      '**Market Data**',
      `• \`${PREFIX}quote TICKER\`  /  \`/quote ticker:\``,
      `• \`${PREFIX}analysis TICKER\`  /  \`/analysis ticker:\``,
      '',
      '**Watchlist (live embed)**',
      `• \`${PREFIX}watch add TICKER [T2 ...]\`  /  \`/watch add\``,
      `• \`${PREFIX}watch remove T\`             /  \`/watch remove\``,
      `• \`${PREFIX}watch list\`                 /  \`/watch list\``,
      `• \`${PREFIX}watch channel #ch\`          /  \`/watch channel\``,
      `• \`${PREFIX}watch start [sec]\`          /  \`/watch start\``,
      `• \`${PREFIX}watch stop\`                 /  \`/watch stop\``,
      `• \`${PREFIX}watch interval sec\`         /  \`/watch interval\``,
      `  Free tier: ${WATCH_LIMIT_FREE} tickers / ${WATCH_MIN_INTERVAL_FREE}s minimum`,
      '',
      '**Options**',
      `• \`${PREFIX}pl TICKER CALL|PUT STRIKE PREMIUM EXPIRY TARGET\`  /  \`/pl …\``,
      '  Example: `!pl AAPL CALL 180 5 2025-09-19 190`',
      '',
      '**Earnings Digest (daily)**',
      '• `/earnings channel` — set post channel',
      '• `/earnings start [utchour]` — enable daily post (UTC)',
      '• `/earnings stop`',
      '',
      '**Billing**',
      `• \`${PREFIX}license status\` / \`/license status\``,
      `• \`${PREFIX}license activate KEY\` / \`/license activate\``,
      `• \`${PREFIX}license revoke\` / \`/license revoke\``
    ].join('\n'));
}

client.login(TOKEN);

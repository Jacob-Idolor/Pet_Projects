import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  REST, Routes, SlashCommandBuilder, ChannelType,
} from 'discord.js';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const {
  DISCORD_TOKEN: TOKEN,
  CLIENT_ID,
  GUILD_ID,
  PREFIX = '!',
  TWITTER_BEARER,
  OPENAI_API_KEY,
  EARNINGS_UTC_HOUR = '15',
} = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID or GUILD_ID in .env');
  process.exit(1);
}

/* ---------------- Persistence ---------------- */
const DATA_PATH = path.resolve('./server-config.json');
/**
 store per guild:
 {
   [guildId]: {
     // watchlist
     channelId, messageId, intervalMs, running, tickers: [],
     // earnings
     earnings: { channelId, hourUTC, running, lastPostISO },
     // twitter
     twitter: { channelId, running, users: [], lastIds: { handle: "tweetId" }, intervalMs }
   }
 }
*/
let store = {};
const timers = new Map();      // watchlist timers
const tweetTimers = new Map(); // twitter timers
let dailyTicker;               // earnings scheduler

async function loadStore() {
  try { store = JSON.parse(await fs.readFile(DATA_PATH, 'utf8') || '{}'); }
  catch { store = {}; }
}
async function saveStore() { await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2)); }

function cfgFor(gid) {
  if (!store[gid]) store[gid] = {};
  const c = store[gid];
  if (!c.tickers) c.tickers = [];
  if (!c.intervalMs) c.intervalMs = 60000;
  if (c.running === undefined) c.running = false;
  if (!c.earnings) c.earnings = { channelId: null, hourUTC: Number(EARNINGS_UTC_HOUR) || 15, running: false, lastPostISO: null };
  if (!c.twitter) c.twitter = { channelId: null, running: false, users: [], lastIds: {}, intervalMs: 60000 };
  return c;
}

/* ---------------- Utilities ---------------- */
function chunk(arr, n) { const out=[]; for(let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n)); return out; }

function highlightTickers(text, watchlist = []) {
  if (!text) return text;
  // First: highlight $CASHTAGS
  text = text.replace(/\$([A-Za-z]{1,5})\b/g, (m, t) => `**$${t.toUpperCase()}**`);
  // Then: highlight any watchlist tickers appearing as standalone words (AAPL, TSLA, etc.)
  const wl = Array.from(new Set((watchlist || []).map(s => s.toUpperCase()))).filter(Boolean);
  if (wl.length) {
    const re = new RegExp(`\\b(${wl.map(t => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'g');
    text = text.replace(re, (m) => `**${m.toUpperCase()}**`);
  }
  return text;
}

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
      if (!c.earnings.running) continue;
      const targetHour = Number(c.earnings.hourUTC ?? 15);
      const lastISO = c.earnings.lastPostISO;
      const lastDay = lastISO ? new Date(lastISO).toISOString().slice(0,10) : null;
      const today = now.toISOString().slice(0,10);
      if (now.getUTCHours() === targetHour && today !== lastDay) await runDailyEarningsDigest();
    }
  }, 60 * 1000);
}

/* ---------------- Twitter → AI Summaries ---------------- */
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

async function fetchLatestTweet(username, sinceId) {
  if (!TWITTER_BEARER) return null;

  // 1) resolve handle → user id
  const u = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
    headers: { Authorization: `Bearer ${TWITTER_BEARER}` }
  });
  if (!u.ok) return null;
  const ujson = await u.json();
  const userId = ujson?.data?.id;
  if (!userId) return null;

  // 2) fetch latest tweets
  const url = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
  url.searchParams.set('exclude', 'replies');
  url.searchParams.set('max_results', '5');
  url.searchParams.set('tweet.fields', 'created_at,public_metrics');
  if (sinceId) url.searchParams.set('since_id', sinceId);

  const t = await fetch(url, { headers: { Authorization: `Bearer ${TWITTER_BEARER}` } });
  if (!t.ok) return null;
  const tjson = await t.json();
  const tweets = tjson?.data || [];
  const newest = tweets[0]?.id || sinceId;
  return { last: newest, tweets };
}

async function summarizeText(text) {
  if (!openai) return `📝 ${text.slice(0, 240)}${text.length > 240 ? '…' : ''}`;
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [{ role: 'user', content: `Summarize this trading-related tweet in 1–2 bullets. Focus on tickers, catalysts, price levels, and actions if any.\n\n${text}` }]
  });
  return r.choices?.[0]?.message?.content?.trim() || text;
}

async function pollTweets(gid) {
  const c = cfgFor(gid);
  if (!c.twitter.running || !c.twitter.channelId || !(c.twitter.users?.length)) return;
  try {
    const channel = await client.channels.fetch(c.twitter.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    for (const user of c.twitter.users) {
      const last = c.twitter.lastIds?.[user];
      const data = await fetchLatestTweet(user, last);
      if (!data) continue;

      // store newest id for next pass
      if (!c.twitter.lastIds) c.twitter.lastIds = {};
      if (data.last) c.twitter.lastIds[user] = data.last;

      // post newest last so Discord flow is chronological
      const toPost = (data.tweets || []).reverse();
      for (const t of toPost) {
        const raw = t.text || '';
        const sum = await summarizeText(raw);
        const highlighted = highlightTickers(sum, c.tickers);
        const url = `https://x.com/${user}/status/${t.id}`;
        const embed = new EmbedBuilder()
          .setTitle(`@${user} — new tweet`)
          .setDescription(highlighted)
          .addFields({ name: 'Link', value: url })
          .setTimestamp(new Date(t.created_at))
          .setColor(0x5865F2);
        await channel.send({ embeds: [embed] });
      }
      await saveStore();
      await new Promise(r => setTimeout(r, 400)); // gentle throttle
    }
  } catch (e) { console.error('tweet poll error:', e?.message || e); }
}
function startTweetPoll(gid, ms) { stopTweetPoll(gid); tweetTimers.set(gid, setInterval(() => pollTweets(gid), ms)); const c = cfgFor(gid); c.twitter.running = true; c.twitter.intervalMs = ms; saveStore(); }
function stopTweetPoll(gid) { const t = tweetTimers.get(gid); if (t) clearInterval(t); tweetTimers.delete(gid); const c = cfgFor(gid); c.twitter.running = false; saveStore(); }

/* ---------------- Slash commands ---------------- */
const slashDefs = [
  new SlashCommandBuilder().setName('ping').setDescription('Bot health check'),
  new SlashCommandBuilder().setName('help').setDescription('Show available commands'),

  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a quick stock/ETF quote')
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
    .setName('follow')
    .setDescription('Mirror & summarize tweets (X)')
    .addSubcommand(sc => sc.setName('add').setDescription('Follow @handle (no @)')
      .addStringOption(o => o.setName('user').setDescription('e.g., unusual_whales').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Unfollow')
      .addStringOption(o => o.setName('user').setDescription('handle').setRequired(true)))
    .addSubcommand(sc => sc.setName('list').setDescription('List followed users'))
    .addSubcommand(sc => sc.setName('channel').setDescription('Set target channel')
      .addChannelOption(o => o.setName('channel').setDescription('Text channel').setRequired(true)))
    .addSubcommand(sc => sc.setName('start').setDescription('Start polling')
      .addIntegerOption(o => o.setName('interval').setDescription('Seconds (>=30)')))
    .addSubcommand(sc => sc.setName('stop').setDescription('Stop polling')),
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
  // restore watch & twitter
  for (const [gid] of Object.entries(store)) {
    const c = cfgFor(gid);
    if (c.running && c.channelId && c.tickers?.length) startWatch(gid, c.intervalMs || 60000);
    if (c.twitter.running && c.twitter.channelId && c.twitter.users?.length) startTweetPoll(gid, c.twitter.intervalMs || 60000);
  }
  scheduleDailyDigest();
});

/* ---------------- Slash handler ---------------- */
client.on('interactionCreate', async (ix) => {
  try {
    if (!ix.isChatInputCommand()) return;
    const gid = ix.guildId; const c = cfgFor(gid);

    if (ix.commandName === 'ping') return ix.reply({ content: 'pong', ephemeral: true });
    if (ix.commandName === 'help') return ix.reply({ embeds: [helpEmbed()], ephemeral: true });

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
        if (c.running) await postOrUpdateWatchMessage(gid);
        return ix.reply({ content: `✅ Added: ${toAdd.join(', ')}\nCurrent: ${c.tickers.join(', ')}`, ephemeral: true });
      }
      if (sub === 'remove') {
        const sym = ix.options.getString('ticker', true).toUpperCase();
        c.tickers = (c.tickers||[]).filter(s=>s!==sym); await saveStore();
        if (c.running) await postOrUpdateWatchMessage(gid);
        return ix.reply({ content: `🗑️ Removed: ${sym}\nCurrent: ${c.tickers.join(', ') || '(none)'}`, ephemeral: true });
      }
      if (sub === 'list') return ix.reply({ content: `📋 Current: ${c.tickers?.length ? c.tickers.join(', ') : '(none)'}`, ephemeral: true });
      if (sub === 'channel') {
        const ch = ix.options.getChannel('channel', true);
        if (ch.type !== ChannelType.GuildText) return ix.reply({ content: 'Pick a text channel.', ephemeral: true });
        c.channelId = ch.id; c.messageId = null; await saveStore();
        return ix.reply({ content: `📨 Watchlist channel set to ${ch}`, ephemeral: true });
      }
      if (sub === 'start') {
        const s = ix.options.getInteger('interval') || 60;
        if (!c.channelId) return ix.reply({ content: 'Set channel: `/watch channel`', ephemeral: true });
        if (!c.tickers?.length) return ix.reply({ content: 'Add tickers: `/watch add`', ephemeral: true });
        c.intervalMs = Math.max(15, s)*1000; await saveStore(); startWatch(gid, c.intervalMs); await postOrUpdateWatchMessage(gid);
        return ix.reply({ content: `▶️ Started every ${Math.round(c.intervalMs/1000)}s.`, ephemeral: true });
      }
      if (sub === 'stop') { stopWatch(gid); return ix.reply({ content: '⏸️ Stopped.', ephemeral: true }); }
      if (sub === 'interval') {
        const s = ix.options.getInteger('seconds', true);
        if (s < 15) return ix.reply({ content: 'Provide >= 15 seconds.', ephemeral: true });
        c.intervalMs = s*1000; await saveStore(); if (c.running) startWatch(gid, c.intervalMs);
        return ix.reply({ content: `⏱️ Interval set to ${s}s.`, ephemeral: true });
      }
    }

    if (ix.commandName === 'earnings') {
      const sub = ix.options.getSubcommand();
      if (sub === 'channel') {
        const ch = ix.options.getChannel('channel', true);
        if (ch.type !== ChannelType.GuildText) return ix.reply({ content: 'Pick a text channel.', ephemeral: true });
        c.earnings.channelId = ch.id; await saveStore();
        return ix.reply({ content: `📨 Earnings digest channel set to ${ch}`, ephemeral: true });
      }
      if (sub === 'start') {
        const hour = ix.options.getInteger('utchour') ?? c.earnings.hourUTC ?? 15;
        c.earnings.running = true; c.earnings.hourUTC = Math.min(23, Math.max(0, Number(hour)));
        await saveStore(); scheduleDailyDigest();
        return ix.reply({ content: `▶️ Earnings digest enabled at ${c.earnings.hourUTC}:00 UTC daily.`, ephemeral: true });
      }
      if (sub === 'stop') { c.earnings.running = false; await saveStore(); return ix.reply({ content: '⏸️ Earnings digest disabled.', ephemeral: true }); }
    }

    if (ix.commandName === 'follow') {
      if (!TWITTER_BEARER) return ix.reply({ content: 'Twitter not configured. Add TWITTER_BEARER in .env', ephemeral: true });
      const sub = ix.options.getSubcommand();

      if (sub === 'add') {
        const user = ix.options.getString('user', true).replace(/^@/, '');
        c.twitter.users = Array.from(new Set([...(c.twitter.users||[]), user])); await saveStore();
        return ix.reply({ content: `✅ Following @${user}`, ephemeral: true });
      }
      if (sub === 'remove') {
        const user = ix.options.getString('user', true).replace(/^@/, '');
        c.twitter.users = (c.twitter.users||[]).filter(u=>u!==user); await saveStore();
        return ix.reply({ content: `🗑️ Unfollowed @${user}`, ephemeral: true });
      }
      if (sub === 'list') {
        return ix.reply({ content: `📋 Following: ${c.twitter.users?.length ? c.twitter.users.map(u=>'@'+u).join(', ') : '(none)'}`, ephemeral: true });
      }
      if (sub === 'channel') {
        const ch = ix.options.getChannel('channel', true);
        if (ch.type !== ChannelType.GuildText) return ix.reply({ content: 'Pick a text channel.', ephemeral: true });
        c.twitter.channelId = ch.id; await saveStore();
        return ix.reply({ content: `📨 Twitter channel set to ${ch}`, ephemeral: true });
      }
      if (sub === 'start') {
        const s = ix.options.getInteger('interval') || 60;
        if (!c.twitter.channelId) return ix.reply({ content: 'Set channel first: `/follow channel`', ephemeral: true });
        if (!c.twitter.users?.length) return ix.reply({ content: 'Add users first: `/follow add`', ephemeral: true });
        startTweetPoll(gid, Math.max(30, s)*1000);
        return ix.reply({ content: `▶️ Tweet polling started every ${Math.max(30, s)}s.`, ephemeral: true });
      }
      if (sub === 'stop') { stopTweetPoll(gid); return ix.reply({ content: '⏸️ Tweet polling stopped.', ephemeral: true }); }
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

    // Prefix follow commands (mirror slash)
    if (cmd === 'follow') {
      if (!TWITTER_BEARER) return void msg.reply('Twitter not configured. Add TWITTER_BEARER in .env');
      const sub = (args.shift() || '').toLowerCase();

      if (sub === 'add') {
        const user = (args[0] || '').replace(/^@/, '');
        if (!user) return void msg.reply(`Usage: \`${PREFIX}follow add handle\``);
        c.twitter.users = Array.from(new Set([...(c.twitter.users||[]), user])); await saveStore();
        return void msg.reply(`✅ Following @${user}`);
      }
      if (sub === 'remove') {
        const user = (args[0] || '').replace(/^@/, '');
        if (!user) return void msg.reply(`Usage: \`${PREFIX}follow remove handle\``);
        c.twitter.users = (c.twitter.users||[]).filter(u=>u!==user); await saveStore();
        return void msg.reply(`🗑️ Unfollowed @${user}`);
      }
      if (sub === 'list') {
        return void msg.reply(`📋 Following: ${c.twitter.users?.length ? c.twitter.users.map(u=>'@'+u).join(', ') : '(none)'}`);
      }
      if (sub === 'channel') {
        const ch = msg.mentions.channels.first(); if (!ch) return void msg.reply(`Usage: \`${PREFIX}follow channel #channel\``);
        if (ch.type !== ChannelType.GuildText) return void msg.reply('Pick a text channel.');
        c.twitter.channelId = ch.id; await saveStore();
        return void msg.reply(`📨 Twitter channel set to ${ch}.`);
      }
      if (sub === 'start') {
        const s = Number(args[0]) || 60;
        if (!c.twitter.channelId) return void msg.reply('Set channel first: `!follow channel #channel`');
        if (!c.twitter.users?.length) return void msg.reply('Add users first: `!follow add handle`');
        startTweetPoll(gid, Math.max(30, s)*1000);
        return void msg.reply(`▶️ Tweet polling started every ${Math.max(30, s)}s.`);
      }
      if (sub === 'stop') { stopTweetPoll(gid); return void msg.reply('⏸️ Tweet polling stopped.'); }

      return void msg.reply(`Use: add/remove/list/channel/start/stop — or \`/follow\` for guided UI.`);
    }

    // Watch commands
    if (cmd === 'watch') {
      const sub = (args.shift() || '').toLowerCase();
      if (sub === 'add') {
        const toAdd = args.map(x=>x.toUpperCase()).filter(Boolean);
        if (!toAdd.length) return void msg.reply(`Usage: \`${PREFIX}watch add AAPL TSLA SPY\``);
        c.tickers = Array.from(new Set([...(c.tickers||[]), ...toAdd])); await saveStore(); if (c.running) await postOrUpdateWatchMessage(gid);
        return void msg.reply(`✅ Added: ${toAdd.join(', ')}\nCurrent: ${c.tickers.join(', ')}`);
      }
      if (sub === 'remove') {
        const sym = (args[0]||'').toUpperCase(); if (!sym) return void msg.reply(`Usage: \`${PREFIX}watch remove TICKER\``);
        c.tickers = (c.tickers||[]).filter(s=>s!==sym); await saveStore(); if (c.running) await postOrUpdateWatchMessage(gid);
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
        c.intervalMs = Math.max(15, s)*1000; await saveStore(); startWatch(gid, c.intervalMs); await postOrUpdateWatchMessage(gid);
        return void msg.reply(`▶️ Started every ${Math.round(c.intervalMs/1000)}s.`);
      }
      if (sub === 'stop') { stopWatch(gid); return void msg.reply('⏸️ Stopped.'); }
      if (sub === 'interval') {
        const s = Number(args[0]); if (!s || s < 15) return void msg.reply('Provide seconds >= 15.');
        c.intervalMs = s*1000; await saveStore(); if (c.running) startWatch(gid, c.intervalMs); return void msg.reply(`⏱️ Interval set to ${s}s.`);
      }
      return void msg.reply(`Use: add/remove/list/channel/start/stop/interval — or \`/watch\` for guided UI.`);
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
      '',
      '**Market Data**',
      `• \`${PREFIX}quote TICKER\`  /  \`/quote ticker:\``,
      '',
      '**Watchlist (live embed)**',
      `• \`${PREFIX}watch add TICKER [T2 ...]\`  /  \`/watch add\``,
      `• \`${PREFIX}watch remove T\`             /  \`/watch remove\``,
      `• \`${PREFIX}watch list\`                 /  \`/watch list\``,
      `• \`${PREFIX}watch channel #ch\`          /  \`/watch channel\``,
      `• \`${PREFIX}watch start [sec]\`          /  \`/watch start\``,
      `• \`${PREFIX}watch stop\`                 /  \`/watch stop\``,
      `• \`${PREFIX}watch interval sec\`         /  \`/watch interval\``,
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
      '**Twitter → Summaries (with ticker highlighting)**',
      `• \`${PREFIX}follow add handle\` / \`/follow add\``,
      `• \`${PREFIX}follow remove handle\` / \`/follow remove\``,
      `• \`${PREFIX}follow list\` / \`/follow list\``,
      `• \`${PREFIX}follow channel #ch\` / \`/follow channel\``,
      `• \`${PREFIX}follow start [sec]\` / \`/follow start\``,
      `• \`${PREFIX}follow stop\` / \`/follow stop\``,
      '_Requires TWITTER_BEARER and (optional) OPENAI_API_KEY._'
    ].join('\n'));
}

client.login(TOKEN);

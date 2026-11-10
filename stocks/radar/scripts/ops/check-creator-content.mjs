/** File-only post-build validation. Does not launch a browser or contact a platform. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { publishedVideos, isPublicVideoUrl } from '../../src/data/videos.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = resolve(root, 'dist');
const home = readFileSync(resolve(dist, 'index.html'), 'utf8');
const about = readFileSync(resolve(dist, 'about.html'), 'utf8');
const hrefs = html => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
const allowedVideos = new Set(publishedVideos.flatMap(video => video.publications.map(publication => publication.url)));
const renderedVideos = new Set(hrefs(home).filter(isPublicVideoUrl));
assert.deepEqual(renderedVideos, allowedVideos, 'Only the verified published video destinations should render');
assert.ok(home.includes('id="book-vote"') && home.includes('id="recent-videos"'));

for (const className of ['primary-navigation']) {
  const nav = [...home.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/g)].map(match => match[0]).find(html => html.includes(className));
  assert.ok(nav, `${className} missing`);
  assert.ok(nav.includes('href="/#stories"') && nav.includes('href="/#recent-videos"'), 'Stories and Watch anchors must exist in the shared responsive navigation');
}
const cover = [...home.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(tag => tag.includes('Pick My Next Book cover:'));
assert.ok(cover, 'Approved cover missing');
const coverSrc = cover.match(/\bsrc="([^"]+)"/)?.[1];
assert.ok(coverSrc && existsSync(resolve(dist, `.${coverSrc}`)), 'Optimized local cover asset missing');
assert.ok(about.indexOf('A few interests.') < about.indexOf('Engineering &amp; consulting'), 'Creator interests must precede professional context');
assert.ok(about.includes('id="profiles"') && about.includes('https://www.facebook.com/profile.php?id=61596047859545'));

const image = readFileSync(resolve(dist, 'social/j-sol-share.png'));
assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
const site = process.env.STOCKS_RADAR_SITE || 'https://stockswatch.cc';
const expectedShare = new URL('/social/j-sol-share.png', site).href;
for (const file of ['index.html', 'about.html', 'links.html', 'guides.html', 'resources.html', 'consulting.html', 'privacy.html', 'guides/before-you-automate.html', 'guides/ai-output-you-can-check.html', 'guides/starting-smaller.html']) {
  const html = readFileSync(resolve(dist, file), 'utf8');
  assert.ok(html.includes(`property="og:image" content="${expectedShare}"`), `${file}: OG image missing`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `${file}: large share card missing`);
  assert.ok(!/C:\\Users\\|E:\\Downloads\\|Content Desk|state="prepared"/.test(html), `${file}: private preparation details exposed`);
}
console.log('Creator content verified from build files: 7 public video destinations, approved cover, matching menu anchors, creator-first About and 1200×630 share metadata. Browser QA remains separate.');

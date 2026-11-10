import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { isPublicVideoUrl, selectPublishedVideos, publishedVideos, featuredBookVote } from '../src/data/videos.mjs';

const fixture = (state, verified, url = 'https://youtube.com/shorts/abcdefghijk') => ({
  id: 'test-fixture', title: 'Test only', topic: 'Test', description: '',
  publications: [{ platform: 'YouTube', url, state, verified }],
});

test('a scheduled URL or unverified publication cannot enter the video shelf', () => {
  assert.deepEqual(selectPublishedVideos([fixture('prepared', true), fixture('scheduled', true), fixture('published', false)]), []);
  assert.equal(selectPublishedVideos([fixture('published', true)]).length, 1);
});

test('public-video destinations reject profiles, credentials, tracking and unexpected hosts', () => {
  for (const url of [
    'http://youtube.com/shorts/abcdefghijk', 'https://youtube.com.evil.test/shorts/abcdefghijk',
    'https://user:pass@youtube.com/shorts/abcdefghijk', 'https://youtube.com/shorts/abcdefghijk?tracking=1',
    'https://www.facebook.com/profile.php?id=61596047859545', 'https://www.tiktok.com/@someoneelse/video/123',
  ]) assert.equal(isPublicVideoUrl(url), false, url);
});

test('a video retains only independently verified published platform destinations', () => {
  const video = fixture('published', true);
  video.publications.push({ platform: 'Facebook', url: 'https://www.facebook.com/reel/123456', state: 'prepared', verified: false });
  assert.equal(selectPublishedVideos([video])[0].publications.length, 1);
});

test('the approved book vote uses its confirmed public reel and all four public platforms', () => {
  assert.ok(featuredBookVote);
  assert.equal(featuredBookVote.publications[0].url, 'https://www.facebook.com/reel/1177645378281616');
  assert.deepEqual(featuredBookVote.publications.map(item => item.platform).sort(), ['Facebook', 'Instagram', 'TikTok', 'YouTube']);
  assert.equal(publishedVideos.length, 4);
});

test('the featured cover remains the approved local Pick My Next Book artwork', () => {
  const cover = readFileSync(new URL('../src/assets/pick-my-next-book-cover.png', import.meta.url));
  assert.equal(createHash('sha256').update(cover).digest('hex'), 'eb3c3fd35740ec4e611119266537794d90cad3628e9a0ac2bdb670075620cdd2');
  assert.equal(cover.readUInt32BE(16), 941);
  assert.equal(cover.readUInt32BE(20), 1672);
});

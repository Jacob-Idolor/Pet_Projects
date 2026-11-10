// Curated from verified public Content Desk receipts (revision 390, Nov 10, 2026).
// Scheduled/prepared entries are deliberately absent. No runtime feed or embeds.
const videoSources = [
  {
    id: 'pick-my-next-book',
    title: 'Pick My Next Book',
    topic: 'Books',
    description: 'The Name of the Wind, The Last Wish or The Way of Kings? Watch the video and leave your pick.',
    publications: [
      { platform: 'Facebook', url: 'https://www.facebook.com/reel/1177645378281616', state: 'published', verified: true },
      { platform: 'Instagram', url: 'https://www.instagram.com/jakejustjacob/reel/DfgLsR5JrQt/', state: 'published', verified: true },
      { platform: 'TikTok', url: 'https://www.tiktok.com/@mrjakecuzzi/video/7706073294197280013', state: 'published', verified: true },
      { platform: 'YouTube', url: 'https://youtube.com/shorts/5s5W5D6s1lI', state: 'published', verified: true },
    ],
  },
  {
    id: 'faith-and-flying',
    title: 'A personal faith reflection',
    topic: 'Reflections',
    description: 'A personal story about faith, flying and the words I carry with me.',
    publications: [{ platform: 'YouTube', url: 'https://www.youtube.com/shorts/IdIiLCtujck', state: 'published', verified: true }],
  },
  {
    id: 'sony-xm5-review',
    title: 'My Sony XM5 review',
    topic: 'Discoveries',
    description: 'What I like, what I don’t, and a few things to keep in mind after using the headphones.',
    publications: [{ platform: 'YouTube', url: 'https://youtube.com/shorts/X73jLcgs7V4', state: 'published', verified: true }],
  },
  {
    id: 'ashe-highlights',
    title: 'Ashe kill highlights',
    topic: 'Gaming',
    description: 'A short gameplay clip from a stream with some serious lag.',
    publications: [{ platform: 'YouTube', url: 'https://youtube.com/shorts/sHZOBFi6bws', state: 'published', verified: true }],
  },
];

/** @param {string} value */
export function isPublicVideoUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return false;
    if (['youtube.com', 'www.youtube.com'].includes(url.hostname)) return /^\/shorts\/[\w-]{11}\/?$/.test(url.pathname);
    if (url.hostname === 'www.facebook.com') return /^\/reel\/\d+\/?$/.test(url.pathname);
    if (url.hostname === 'www.instagram.com') return /^\/(?:[\w.]+\/)?reel\/[\w-]+\/?$/.test(url.pathname);
    if (url.hostname === 'www.tiktok.com') return /^\/@mrjakecuzzi\/video\/\d+\/?$/.test(url.pathname);
    return false;
  } catch { return false; }
}

/**
 * Fail closed: a URL or scheduled date alone never makes a video public.
 * @param {typeof videoSources} sources
 */
export function selectPublishedVideos(sources) {
  return sources.map(video => ({ ...video, publications: video.publications.filter(publication =>
    publication.state === 'published' && publication.verified === true && isPublicVideoUrl(publication.url),
  ) })).filter(video => video.publications.length > 0);
}

export const publishedVideos = selectPublishedVideos(videoSources);
export const featuredBookVote = publishedVideos.find(video => video.id === 'pick-my-next-book');
export const recentVideos = publishedVideos.filter(video => video.id !== 'pick-my-next-book');

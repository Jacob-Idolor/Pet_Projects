// Owner-confirmed public destinations. Keep personal and consulting identities distinct.
export const channels = [
  { id: 'twitch', name: 'Twitch', identity: 'jakecuzzi', url: 'https://www.twitch.tv/jakecuzzi', action: 'Visit Twitch' },
  { id: 'youtube', name: 'YouTube', identity: '@MrJakecuzzi', url: 'https://www.youtube.com/@MrJakecuzzi', action: 'Visit YouTube' },
  { id: 'instagram', name: 'Instagram', identity: '@jakejustjacob', url: 'https://www.instagram.com/jakejustjacob/', action: 'View Instagram' },
  { id: 'snapchat', name: 'Snapchat', identity: '@jakecuzzi', url: 'https://www.snapchat.com/@jakecuzzi', action: 'View Snapchat' },
  { id: 'tiktok', name: 'TikTok', identity: '@mrjakecuzzi', url: 'https://www.tiktok.com/@mrjakecuzzi', action: 'View TikTok' },
  { id: 'threads', name: 'Threads', identity: '@jakejustjacob', url: 'https://www.threads.com/@jakejustjacob', action: 'View Threads' },
] as const;
export const linkedIn = { name: 'LinkedIn', url: 'https://www.linkedin.com/in/jacob-idolor/' };
export const consultingProfiles = [
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/~01970b1d2f8e96b33f' },
  { name: 'Guru', url: 'https://www.guru.com/freelancers/jacob-idolor' },
] as const;

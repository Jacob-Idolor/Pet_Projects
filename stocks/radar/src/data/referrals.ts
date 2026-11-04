// Publish only owner-confirmed destinations with verified program eligibility.
// Keep the disclosure next to each link. Never add tracking parameters here.
export interface ReferralLink {
  id: string;
  name: string;
  category: 'Personal referral' | 'Affiliate link' | 'Paid partnership';
  url: string;
  description: string;
  disclosure: string;
  action: string;
}

export const referralLinks: ReferralLink[] = [
  {
    id: 'hsa-store',
    name: 'HSA Store',
    category: 'Personal referral',
    url: 'https://bit.ly/4fbaglj',
    description: 'Shop HSA Store through my personal referral link. Check the store for current product eligibility and program terms before purchasing.',
    disclosure: 'Referral disclosure: I may receive HSA Store loyalty points from qualifying purchases made through this link.',
    action: 'Visit HSA Store',
  },
];

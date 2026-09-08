// Manual-upgrade contact for the freemium plan. No payment processing —
// plan upgrades are applied by hand in Firestore (users/{uid}.plan = 'paid').
export const UPGRADE_EMAIL = 'georgettebadourra7788@gmail.com';
export const UPGRADE_MAILTO = `mailto:${UPGRADE_EMAIL}?subject=${encodeURIComponent('LetterFlow Pro upgrade')}`;

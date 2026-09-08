// Freemium limits for the 'free' plan. Paid-plan users are unlimited.
export const FREE_PLAN_LIMITS = {
  students: 3,
  letters: 3,
};

// Enforced against lifetime totals (users/{uid}.totalStudentsCreated /
// totalLettersGenerated), which only ever increment on creation — never
// decremented on delete. This is deliberate: deleting a letter or student
// tidies up the dashboard, but must not free up a new free-tier slot.
const COUNTER_FIELD = {
  students: 'totalStudentsCreated',
  letters: 'totalLettersGenerated',
};

export function isFreePlan(profile) {
  return (profile?.plan || 'free') !== 'paid';
}

export function isAtLifetimeLimit(profile, resource) {
  if (!isFreePlan(profile)) return false;
  const count = profile?.[COUNTER_FIELD[resource]] || 0;
  return count >= FREE_PLAN_LIMITS[resource];
}

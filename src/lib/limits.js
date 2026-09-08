// Freemium limits for the 'free' plan. Paid-plan users are unlimited.
export const FREE_PLAN_LIMITS = {
  students: 3,
  letters: 3,
};

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Counts documents whose createdAt falls within the current calendar month.
export function countThisMonth(docs) {
  const now = new Date();
  return docs.filter((doc) => {
    const created = toDate(doc.createdAt);
    if (!created) return false;
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
}

export function isFreePlan(profile) {
  return (profile?.plan || 'free') !== 'paid';
}

export function isAtMonthlyLimit(profile, docsThisResource, resource) {
  if (!isFreePlan(profile)) return false;
  return countThisMonth(docsThisResource) >= FREE_PLAN_LIMITS[resource];
}

const PURPOSE_STYLES = {
  gradSchool: 'bg-blue-50 text-blue-700 border border-blue-100',
  job: 'bg-teal-50 text-teal-700 border border-teal-100',
  scholarship: 'bg-yellow-50 text-yellow-800 border border-yellow-100',
  visa: 'bg-purple-50 text-purple-700 border border-purple-100',
};

const PURPOSE_LABELS = {
  gradSchool: 'Grad School',
  job: 'Job / Fellowship',
  scholarship: 'Scholarship',
  visa: 'Visa / Immigration',
};

const STATUS_STYLES = {
  draft: 'bg-surface-container text-on-surface-variant',
  sent: 'bg-amber-50 text-amber-700',
  submitted: 'bg-emerald-50 text-emerald-700',
};

const STATUS_DOT = {
  draft: 'bg-slate-400',
  sent: 'bg-amber-500',
  submitted: 'bg-emerald-500',
};

const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  submitted: 'Submitted',
};

export function PurposeBadge({ purpose }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${
        PURPOSE_STYLES[purpose] || 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {PURPOSE_LABELS[purpose] || purpose}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap ${
        STATUS_STYLES[status] || STATUS_STYLES.draft
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || STATUS_DOT.draft}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export { PURPOSE_LABELS, STATUS_LABELS };

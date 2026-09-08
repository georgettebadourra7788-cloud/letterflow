// Small input-formatting helpers applied to lecturer-entered free text.
// These only normalize presentation — they never change the underlying data model.

// "julian thorne" -> "Julian Thorne"; handles hyphens and apostrophes
// ("mary-jane o'connor" -> "Mary-Jane O'Connor").
export function titleCaseName(name) {
  if (!name) return name;
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) =>
          part
            .split("'")
            .map((piece) => (piece ? piece[0].toUpperCase() + piece.slice(1).toLowerCase() : piece))
            .join("'")
        )
        .join('-')
    )
    .join(' ');
}

function pluralizeWord(word) {
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

// Only these nouns get their plurality corrected. Matching *any* word after
// a number (the original approach) also corrupted unrelated text — e.g.
// "GPA of 3.7/4 across 2 semester" became "GPA of 3.7/4 acrosses 2
// semesters", mangling "across" into "acrosses". Restricting to a whitelist
// of countable nouns that actually show up in relationship/duration text
// keeps the fix targeted and leaves everything else (including grade
// fractions like "3.7/4", which this function never touches) untouched.
const COUNTABLE_NOUNS = [
  'semester',
  'year',
  'month',
  'week',
  'day',
  'hour',
  'course',
  'class',
  'credit',
  'unit',
  'term',
  'quarter',
  'paper',
  'project',
  'publication',
  'presentation',
  'award',
  'cohort',
  'session',
  'student',
];

const COUNTABLE_NOUN_PATTERN = new RegExp(`\\b(\\d+)(\\s+)(${COUNTABLE_NOUNS.join('|')})s?\\b`, 'gi');

// Finds "<number> <countable noun>" pairs (e.g. "3 semester", "1 semesters")
// and corrects the noun's plurality to agree with the number, so lecturer
// typos like "instructor for 3 semester" render as "3 semesters" and
// "1 semesters" renders as "1 semester".
export function fixNumberAgreement(text) {
  if (!text) return text;
  return text.replace(COUNTABLE_NOUN_PATTERN, (match, numStr, space, noun) => {
    const num = parseInt(numStr, 10);
    if (Number.isNaN(num)) return match;
    const correctedNoun = num === 1 ? noun : pluralizeWord(noun);
    return `${numStr}${space}${correctedNoun}`;
  });
}

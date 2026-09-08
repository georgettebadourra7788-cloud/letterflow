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

function singularizeWord(word) {
  if (/ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/(sses|shes|ches|xes|zes)$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word) && !/ss$/i.test(word)) return word.slice(0, -1);
  return word;
}

// Finds "<number> <noun>" pairs (e.g. "3 semester", "1 semesters") and
// corrects the noun's plurality to agree with the number, so lecturer
// typos like "instructor for 3 semester" render as "3 semesters" and
// "1 semesters" renders as "1 semester".
export function fixNumberAgreement(text) {
  if (!text) return text;
  return text.replace(/\b(\d+)(\s+)([A-Za-z]+)\b/g, (match, numStr, space, word) => {
    const num = parseInt(numStr, 10);
    if (Number.isNaN(num)) return match;

    const shouldBePlural = num !== 1;
    const isCurrentlyPlural = /s$/i.test(word) && !/ss$/i.test(word);

    if (shouldBePlural && !isCurrentlyPlural) {
      return `${numStr}${space}${pluralizeWord(word)}`;
    }
    if (!shouldBePlural && isCurrentlyPlural) {
      return `${numStr}${space}${singularizeWord(word)}`;
    }
    return match;
  });
}

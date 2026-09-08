// Pronoun sets for the student's gender field. Defaults to 'they' when the
// field is blank/unset, per the intake form default.
export const GENDERS = [
  { value: 'they', label: 'They / Them' },
  { value: 'she', label: 'She / Her' },
  { value: 'he', label: 'He / Him' },
];

const PRONOUN_SETS = {
  he: { subject: 'he', object: 'him', possessive: 'his', possessiveNoun: 'his', reflexive: 'himself' },
  she: { subject: 'she', object: 'her', possessive: 'her', possessiveNoun: 'hers', reflexive: 'herself' },
  they: { subject: 'they', object: 'them', possessive: 'their', possessiveNoun: 'theirs', reflexive: 'themselves' },
};

export function getPronouns(gender) {
  return PRONOUN_SETS[gender] || PRONOUN_SETS.they;
}

export function capitalize(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

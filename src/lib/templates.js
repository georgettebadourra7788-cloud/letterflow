// Template / mail-merge logic for recommendation letters.
// No AI involved — each purpose maps to an ordered list of paragraph
// blocks, and each block is a pure function of the student (and tone).

import { fixNumberAgreement, titleCaseName } from './textFormat';
import { capitalize, getPronouns } from './pronouns';

export const PURPOSES = [
  { value: 'gradSchool', label: 'Grad School' },
  { value: 'job', label: 'Job / Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'visa', label: 'Visa / Immigration' },
];

export const TONES = [
  { value: 'formal', label: 'Formal & Rigorous' },
  { value: 'warm', label: 'Warm & Mentoring' },
  { value: 'concise', label: 'Concise & Direct' },
];

export const toneVariants = {
  formal: {
    opening: (s) =>
      `I am writing to provide my strongest recommendation for ${s.name}, whom I have had the privilege of knowing as ${s.relationship}.`,
    closing: (s) =>
      `Should you require any further information regarding ${s.name}'s qualifications, please do not hesitate to contact me. I recommend ${s.name} without reservation.`,
  },
  warm: {
    opening: (s) =>
      `It is my genuine pleasure to write this letter on behalf of ${s.name}, who I've had the privilege of knowing as ${s.relationship}.`,
    closing: (s) =>
      `I have no doubt ${s.name} will bring the same dedication and enthusiasm to this next step. Please feel free to reach out if I can share more.`,
  },
  concise: {
    opening: (s) => `I am pleased to recommend ${s.name}, whom I have known as ${s.relationship}.`,
    closing: (s) => `I recommend ${s.name} highly. Please contact me with any questions.`,
  },
};

function achievementsList(s) {
  if (!s.achievements || s.achievements.length === 0) return '';
  return s.achievements.map((a) => `- ${a}`).join('\n');
}

const blocks = {
  opening: (s, tone) => toneVariants[tone].opening(s),

  // The opening already states the relationship/duration ONCE — this block
  // must not restate "as [relationship]" at all. It only adds observation
  // context: the course/program and (if on file) the grade record.
  relationship: (s) => {
    const courseClause = s.program ? ` in ${s.program}` : '';
    const gradeClause = s.grade ? `, where ${s.pronouns.subject} maintained a grade record of ${s.grade}` : '';
    return `I have had ample opportunity to observe ${s.name}'s work${courseClause}${gradeClause}.`;
  },

  academicPotential: (s) =>
    `${s.name} has consistently demonstrated the intellectual curiosity and academic discipline that graduate study demands. ${capitalize(s.pronouns.possessive)} performance in ${s.program || `${s.pronouns.possessive} coursework`} reflects a readiness to undertake independent research and to contribute meaningfully to a graduate program.`,

  skillsFit: (s) =>
    `${s.name} combines strong technical and analytical skills with a demonstrated ability to apply them in practical settings. I am confident these abilities, developed through ${s.program || `${s.pronouns.possessive} studies`}, translate directly to success in a professional environment.`,

  // Confirms standing for the reviewing agency without restating the
  // relationship phrase — that's already covered once, in the opening.
  durationVerification: (s) =>
    `I am glad to formally verify ${s.name}'s standing and achievements on request from the reviewing agency, and can provide any additional documentation required to support ${s.pronouns.possessive} application.`,

  strengths: (s) => {
    const list = achievementsList(s);
    return list ? `Among ${s.name}'s notable achievements:\n${list}` : '';
  },

  notes: (s) => (s.notes ? s.notes.trim() : ''),

  closing: (s, tone) => toneVariants[tone].closing(s),
};

export const purposeTemplates = {
  gradSchool: ['opening', 'relationship', 'academicPotential', 'strengths', 'notes', 'closing'],
  job: ['opening', 'relationship', 'skillsFit', 'strengths', 'notes', 'closing'],
  scholarship: ['opening', 'relationship', 'strengths', 'notes', 'closing'],
  visa: ['opening', 'relationship', 'durationVerification', 'strengths', 'notes', 'closing'],
};

// Safeguards the student's name and relationship text right before assembly,
// so every block (including the tone-specific opening/closing) sees the
// normalized values — this is a fallback in case a student record was
// created before the intake form started title-casing names. Also resolves
// the gender field (defaulting to 'they') into a pronoun set every block
// can use via s.pronouns instead of a hardcoded "their".
function normalizeForTemplate(student) {
  return {
    ...student,
    name: titleCaseName(student.name),
    relationship: fixNumberAgreement(student.relationship),
    pronouns: getPronouns(student.gender),
  };
}

export function assembleLetter(student, purpose, tone) {
  const normalizedStudent = normalizeForTemplate(student);
  const order = purposeTemplates[purpose] || purposeTemplates.gradSchool;
  return order
    .map((key) => blocks[key](normalizedStudent, tone))
    .filter((paragraph) => paragraph && paragraph.trim().length > 0)
    .join('\n\n');
}

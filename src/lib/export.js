import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

function slug(name) {
  return (name || 'letter').trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
}

export async function exportLetterToDocx({ profile, student, letter }) {
  const letterheadLines = (profile?.letterheadText || '').split('\n').filter(Boolean);
  const bodyParagraphs = (letter?.draftText || '').split(/\n{2,}/).filter(Boolean);
  const dateLine = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const children = [
    ...letterheadLines.map(
      (line, i) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: line, bold: i === 0, size: i === 0 ? 26 : 20 })],
        })
    ),
    new Paragraph({ text: '' }),
    new Paragraph({ text: dateLine }),
    new Paragraph({ text: '' }),
    ...bodyParagraphs.map(
      (para) =>
        new Paragraph({
          children: [new TextRun({ text: para })],
          spacing: { after: 200 },
        })
    ),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Sincerely,' }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: profile?.signatureName || profile?.name || '', bold: true })] }),
    ...(profile?.title ? [new Paragraph({ text: profile.title })] : []),
    ...(profile?.institution ? [new Paragraph({ text: profile.institution })] : []),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug(student?.name)}_recommendation.docx`);
}

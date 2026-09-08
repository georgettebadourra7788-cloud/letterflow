import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { getLetter, getStudent, watchProfile } from '../lib/firestore';
import { exportLetterToDocx } from '../lib/export';

export default function Export() {
  const { user } = useAuth();
  const { letterId } = useParams();
  const [letter, setLetter] = useState(null);
  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = watchProfile(user.uid, setProfile);
    getLetter(user.uid, letterId).then(async (data) => {
      if (data) {
        setLetter(data);
        const s = await getStudent(user.uid, data.studentId);
        setStudent(s);
      }
      setLoading(false);
    });
    return unsubProfile;
  }, [user, letterId]);

  async function handleDocxDownload() {
    setExporting(true);
    try {
      await exportLetterToDocx({ profile, student, letter });
    } finally {
      setExporting(false);
    }
  }

  function handlePdfDownload() {
    window.print();
  }

  if (loading || !letter) {
    return (
      <Layout title="Export" backTo={`/letters/${letterId}`} hideNav>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      </Layout>
    );
  }

  const letterheadLines = (profile?.letterheadText || '').split('\n').filter(Boolean);
  const bodyParagraphs = (letter.draftText || '').split(/\n{2,}/).filter(Boolean);
  const dateLine = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout title="Export" backTo={`/letters/${letterId}`} hideNav>
      <div className="flex items-center justify-between no-print">
        <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">
          Ready to Export
        </span>
      </div>

      <div id="printable-letter" className="w-full flex justify-center">
        <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-lg shadow-xl p-8 text-on-surface">
          <header className="pb-4 mb-4 border-b border-surface-container-high">
            {letterheadLines.length > 0 ? (
              <div className="text-center">
                {letterheadLines.map((line, i) => (
                  <p key={i} className={i === 0 ? 'font-headline-sm text-headline-sm' : 'font-body-sm text-body-sm text-on-surface-variant'}>
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic text-center">
                No letterhead set — add one in Settings.
              </p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant text-right mt-3">{dateLine}</p>
          </header>

          <article className="space-y-3 font-body-lg text-body-lg leading-relaxed text-justify">
            {bodyParagraphs.length > 0 ? (
              bodyParagraphs.map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p className="text-on-surface-variant italic">This letter has no content yet.</p>
            )}
          </article>

          <footer className="mt-8 pt-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Sincerely,</p>
            <p className="font-title-md text-title-md font-semibold text-on-surface">
              {profile?.signatureName || profile?.name}
            </p>
            {profile?.title && <p className="font-body-sm text-body-sm text-on-surface-variant">{profile.title}</p>}
            {profile?.institution && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">{profile.institution}</p>
            )}
          </footer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 no-print">
        <button
          type="button"
          onClick={handlePdfDownload}
          className="h-11 px-4 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
        >
          <Icon name="picture_as_pdf" className="text-[20px]" />
          <span>Print / PDF</span>
        </button>
        <button
          type="button"
          onClick={handleDocxDownload}
          disabled={exporting}
          className="h-11 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
        >
          <Icon name="description" className="text-[20px]" />
          <span>{exporting ? 'Preparing…' : 'Download Word'}</span>
        </button>
      </div>
    </Layout>
  );
}

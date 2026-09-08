import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { PurposeBadge, StatusBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { deleteLetter, getLetter, getStudent, updateLetter } from '../lib/firestore';

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'submitted', label: 'Submitted' },
];

export default function LetterEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { letterId } = useParams();

  const [letter, setLetter] = useState(null);
  const [student, setStudent] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getLetter(user.uid, letterId).then(async (data) => {
      if (data) {
        setLetter(data);
        setText(data.draftText || '');
        const s = await getStudent(user.uid, data.studentId);
        setStudent(s);
      }
      setLoading(false);
    });
  }, [user, letterId]);

  async function handleSave(overrides = {}) {
    setSaving(true);
    try {
      const payload = { draftText: text, ...overrides };
      await updateLetter(user.uid, letterId, payload);
      setLetter((prev) => ({ ...prev, ...payload }));
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status) {
    setStatusMenuOpen(false);
    await handleSave({ status });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this letter? This cannot be undone.')) return;
    await deleteLetter(user.uid, letterId);
    navigate('/dashboard');
  }

  if (loading) {
    return (
      <Layout title="Draft Letter" backTo="/dashboard" hideNav>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      </Layout>
    );
  }

  if (!letter) {
    return (
      <Layout title="Draft Letter" backTo="/dashboard" hideNav>
        <p className="font-body-md text-body-md text-on-surface-variant">Letter not found.</p>
      </Layout>
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Layout title="Draft Letter" backTo="/dashboard" hideNav>
      <div className="bg-surface-container-lowest rounded-xl p-card-pad shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between gap-gutter-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-secondary">
              <Icon name="person" className="text-[18px]" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                {student?.name || 'Unknown student'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{student?.program}</span>
            </div>
          </div>
          <Link
            to={`/letters/${letterId}/export`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors shrink-0"
          >
            <Icon name="ios_share" className="text-[18px]" />
            <span>Export</span>
          </Link>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-surface-container-high flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <PurposeBadge purpose={letter.purpose} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen((v) => !v)}
                className="flex items-center gap-1"
              >
                <StatusBadge status={letter.status} />
                <Icon name="expand_more" className="text-[16px] text-on-surface-variant" />
              </button>
              {statusMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-40 bg-surface-container-lowest rounded-xl shadow-xl py-1.5 z-30">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleStatusChange(s.value)}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {savedAt && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col min-w-0 gap-3">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Draft</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{wordCount} words</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={18}
          className="w-full bg-surface-container-low text-on-surface p-4 rounded-lg font-body-lg text-body-lg leading-relaxed outline-none resize-y focus:bg-surface-bright transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex-1 h-11 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          <span>{saving ? 'Saving…' : 'Save Draft'}</span>
        </button>
        <Link
          to={`/letters/${letterId}/export`}
          className="flex-[1.4] h-11 px-4 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
        >
          <Icon name="verified" className="text-[18px]" />
          <span>Preview &amp; Export</span>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="w-full h-10 rounded font-label-md text-label-md text-error hover:bg-error-container/40 transition-colors"
      >
        Delete letter
      </button>
    </Layout>
  );
}

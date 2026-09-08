import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { PurposeBadge, StatusBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { watchLetters, watchStudents } from '../lib/firestore';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'submitted', label: 'Submitted' },
];

function formatDeadline(deadline) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [letters, setLetters] = useState([]);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsubLetters = watchLetters(user.uid, setLetters);
    const unsubStudents = watchStudents(user.uid, setStudents);
    return () => {
      unsubLetters();
      unsubStudents();
    };
  }, [user]);

  const studentsById = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);

  const sorted = useMemo(() => {
    const list = filter === 'all' ? letters : letters.filter((l) => l.status === filter);
    return [...list].sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }, [letters, filter]);

  const counts = useMemo(() => {
    const draft = letters.filter((l) => l.status === 'draft').length;
    const submitted = letters.filter((l) => l.status === 'submitted').length;
    return { draft, submitted, total: letters.length };
  }, [letters]);

  return (
    <Layout title="LetterFlow" subtitle="Dashboard">
      <div className="flex items-center justify-between gap-gutter-sm">
        <div className="flex flex-col min-w-0">
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Letter Requests</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {counts.total} total &bull; {students.length} student{students.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          to="/letters/new"
          className="h-11 px-4 bg-primary text-on-primary rounded flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
        >
          <Icon name="add" className="text-[18px]" />
          <span className="font-label-lg text-label-lg">New Letter</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-gutter-sm">
        <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Draft</span>
          <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{counts.draft}</span>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Submitted</span>
          <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{counts.submitted}</span>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Total</span>
          <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{counts.total}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            type="button"
            className={`px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex flex-col items-center text-center gap-2">
          <Icon name="auto_stories" className="text-[28px] text-secondary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface">No letters yet</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            Add a student, then start a new letter request to generate a draft from your templates.
          </p>
          <Link
            to="/students/new"
            className="mt-2 h-10 px-4 bg-secondary text-on-secondary rounded font-label-md text-label-md flex items-center gap-1.5"
          >
            <Icon name="person_add" className="text-[16px]" />
            Add a student
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-row-gap">
          {sorted.map((letter) => {
            const student = studentsById[letter.studentId];
            const deadline = formatDeadline(letter.deadline);
            return (
              <Link
                key={letter.id}
                to={`/letters/${letter.id}`}
                className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                      <Icon name="person" className="text-[20px]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                        {student ? student.name : 'Unknown student'}
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {student?.program || '—'}
                      </span>
                    </div>
                  </div>
                  {deadline && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm shrink-0">
                      <Icon name="alarm" className="text-[13px]" />
                      {deadline}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <PurposeBadge purpose={letter.purpose} />
                  <StatusBadge status={letter.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

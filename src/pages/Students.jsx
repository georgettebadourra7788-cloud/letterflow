import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { watchStudents } from '../lib/firestore';

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!user) return;
    return watchStudents(user.uid, setStudents);
  }, [user]);

  return (
    <Layout title="LetterFlow" subtitle="Students">
      <div className="flex items-center justify-between gap-gutter-sm">
        <div className="flex flex-col min-w-0">
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Student Roster</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {students.length} student{students.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          to="/students/new"
          className="h-11 px-4 bg-primary text-on-primary rounded flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
        >
          <Icon name="person_add" className="text-[18px]" />
          <span className="font-label-lg text-label-lg">Add Student</span>
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex flex-col items-center text-center gap-2">
          <Icon name="school" className="text-[28px] text-secondary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface">No students yet</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            Add a student dossier to start generating recommendation letters for them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-row-gap">
          {students.map((student) => (
            <Link
              key={student.id}
              to={`/students/${student.id}/edit`}
              className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex items-center gap-3 active:scale-[0.99] transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                <Icon name="person" className="text-[20px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{student.name}</h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {student.program || '—'}
                  {student.grade ? ` • ${student.grade}` : ''}
                </span>
              </div>
              <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

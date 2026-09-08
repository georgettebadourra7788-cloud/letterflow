import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { createLetter, watchStudents } from '../lib/firestore';
import { assembleLetter, PURPOSES, TONES } from '../lib/templates';

const PURPOSE_ICONS = {
  gradSchool: 'school',
  job: 'work_outline',
  scholarship: 'military_tech',
  visa: 'travel_explore',
};

export default function NewLetterRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('gradSchool');
  const [tone, setTone] = useState('formal');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchStudents(user.uid, (list) => {
      setStudents(list);
      if (!studentId && list.length > 0) setStudentId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedStudent = students.find((s) => s.id === studentId);

  async function handleGenerate() {
    if (!selectedStudent) return;
    setCreating(true);
    try {
      const draftText = assembleLetter(selectedStudent, purpose, tone);
      const letterId = await createLetter(user.uid, {
        studentId,
        purpose,
        tone,
        deadline: deadline || null,
        status: 'draft',
        draftText,
      });
      navigate(`/letters/${letterId}`);
    } finally {
      setCreating(false);
    }
  }

  if (students.length === 0) {
    return (
      <Layout title="New Letter Request" backTo="/dashboard" hideNav>
        <div className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex flex-col items-center text-center gap-3">
          <Icon name="school" className="text-[28px] text-secondary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Add a student first</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            You need at least one student on your roster before you can request a letter.
          </p>
          <button
            onClick={() => navigate('/students/new')}
            type="button"
            className="h-10 px-4 bg-primary text-on-primary rounded font-label-md text-label-md flex items-center gap-1.5"
          >
            <Icon name="person_add" className="text-[16px]" />
            Add student
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Letter Request" backTo="/dashboard" hideNav>
      <div className="flex flex-col gap-1 mb-1">
        <h2 className="font-headline-md text-headline-md text-on-surface">Configure Recommendation</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Pick a student, purpose, and tone to assemble a draft.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-on-surface" htmlFor="student-select">
          Student
        </label>
        <div className="relative bg-surface-container-lowest rounded-xl shadow-sm flex items-center">
          <Icon name="person" className="text-[20px] text-on-surface-variant ml-3" />
          <select
            id="student-select"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full bg-transparent py-3 px-3 text-on-surface font-body-md text-body-md focus:outline-none appearance-none"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Icon name="arrow_drop_down" className="text-[20px] text-on-surface-variant mr-3 pointer-events-none" />
        </div>
        {selectedStudent && (
          <p className="font-label-sm text-label-sm text-on-surface-variant px-1">
            {selectedStudent.program || 'No program on file'}
            {selectedStudent.grade ? ` • ${selectedStudent.grade}` : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-on-surface">Application Purpose</label>
        <div className="grid grid-cols-2 gap-2.5">
          {PURPOSES.map((p) => {
            const selected = purpose === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPurpose(p.value)}
                className={`text-left bg-surface-container-lowest p-3 rounded-xl shadow-sm transition-all ${
                  selected ? 'bg-surface-container-low ring-2 ring-secondary/80' : 'hover:bg-surface-container-low/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center ${
                      selected ? 'text-secondary' : 'text-on-surface-variant'
                    }`}
                  >
                    <Icon name={PURPOSE_ICONS[p.value]} className="text-[18px]" />
                  </span>
                  {selected ? (
                    <Icon name="check_circle" filled className="text-secondary text-[20px]" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-surface-container-high" />
                  )}
                </div>
                <span className="font-title-md text-title-md text-on-surface block">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-on-surface">Tone</label>
        <div className="bg-surface-container-high/60 p-1 rounded-xl flex gap-1">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={`flex-1 py-2 px-2 rounded-lg font-label-md text-label-md text-center transition-all ${
                tone === t.value ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-on-surface" htmlFor="deadline">
          Deadline <span className="font-label-sm text-label-sm text-on-surface-variant">(optional)</span>
        </label>
        <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between">
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-transparent font-title-md text-title-md text-on-surface focus:outline-none"
          />
          <Icon name="calendar_today" className="text-secondary text-[20px]" />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={creating}
        className="w-full h-12 rounded-xl bg-primary text-on-primary font-title-md text-title-md flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform disabled:opacity-60"
      >
        <Icon name="edit_document" className="text-[20px]" />
        <span>{creating ? 'Assembling…' : 'Generate Draft'}</span>
      </button>
    </Layout>
  );
}

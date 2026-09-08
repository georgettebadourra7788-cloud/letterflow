import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import UpgradeNotice from '../components/UpgradeNotice';
import { useAuth } from '../context/AuthContext';
import { createStudent, deleteStudent, getStudent, updateStudent, watchProfile } from '../lib/firestore';
import { titleCaseName } from '../lib/textFormat';
import { isAtLifetimeLimit } from '../lib/limits';
import { GENDERS } from '../lib/pronouns';

const emptyStudent = {
  name: '',
  program: '',
  grade: '',
  relationship: '',
  gender: 'they',
  achievements: [],
  notes: '',
};

export default function NewStudent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const isEditing = Boolean(studentId);

  const [student, setStudent] = useState(emptyStudent);
  const [achievementInput, setAchievementInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Free-plan lifetime limit check — only relevant when creating a new student.
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isEditing || !user) return;
    getStudent(user.uid, studentId).then((data) => {
      if (data) setStudent({ ...emptyStudent, ...data });
      setLoading(false);
    });
  }, [isEditing, studentId, user]);

  useEffect(() => {
    if (isEditing || !user) return;
    return watchProfile(user.uid, setProfile);
  }, [isEditing, user]);

  const limitCheckLoading = !isEditing && profile === null;
  const limitReached = !isEditing && !limitCheckLoading && isAtLifetimeLimit(profile, 'students');

  function updateField(field, value) {
    setStudent((prev) => ({ ...prev, [field]: value }));
  }

  function addAchievement() {
    const text = achievementInput.trim();
    if (!text) return;
    setStudent((prev) => ({ ...prev, achievements: [...(prev.achievements || []), text] }));
    setAchievementInput('');
  }

  function removeAchievement(index) {
    setStudent((prev) => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!student.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...student, name: titleCaseName(student.name.trim()), gender: student.gender || 'they' };
      if (isEditing) {
        await updateStudent(user.uid, studentId, payload);
      } else {
        await createStudent(user.uid, payload);
      }
      navigate('/students');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove ${student.name} from your roster? This cannot be undone.`)) return;
    await deleteStudent(user.uid, studentId);
    navigate('/students');
  }

  if (loading || limitCheckLoading) {
    return (
      <Layout title="Student Dossier" backTo="/students" hideNav>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      </Layout>
    );
  }

  if (limitReached) {
    return (
      <Layout title="Student Dossier" backTo="/students" hideNav>
        <UpgradeNotice />
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? 'Edit Student' : 'Student Dossier'} backTo="/students" hideNav>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-surface-container-lowest p-card-pad rounded-xl shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center justify-between" htmlFor="studentName">
              <span>Full Name</span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Required</span>
            </label>
            <div className="relative flex items-center">
              <Icon name="person" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
              <input
                id="studentName"
                type="text"
                required
                value={student.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Julian Thorne"
                className="w-full h-[42px] bg-surface-container-low pl-10 pr-3 rounded font-body-md text-body-md outline-none focus:bg-surface-container transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface" htmlFor="studentProgram">
              Program / Course
            </label>
            <div className="relative flex items-center">
              <Icon name="auto_stories" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
              <input
                id="studentProgram"
                type="text"
                value={student.program}
                onChange={(e) => updateField('program', e.target.value)}
                placeholder="e.g., B.A. Philosophy, Class of 2025"
                className="w-full h-[42px] bg-surface-container-low pl-10 pr-3 rounded font-body-md text-body-md outline-none focus:bg-surface-container transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface" htmlFor="studentGrade">
              Grade / GPA <span className="font-label-sm text-label-sm text-on-surface-variant">(optional)</span>
            </label>
            <div className="relative flex items-center">
              <Icon name="grade" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
              <input
                id="studentGrade"
                type="text"
                value={student.grade}
                onChange={(e) => updateField('grade', e.target.value)}
                placeholder="e.g., 3.94 / 4.0"
                className="w-full h-[42px] bg-surface-container-low pl-10 pr-3 rounded font-body-md text-body-md outline-none focus:bg-surface-container transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface" htmlFor="relationship">
              Relationship
            </label>
            <div className="relative flex items-center">
              <Icon name="history_edu" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
              <input
                id="relationship"
                type="text"
                value={student.relationship}
                onChange={(e) => updateField('relationship', e.target.value)}
                placeholder="e.g., instructor for 2 semesters, thesis advisor"
                className="w-full h-[42px] bg-surface-container-low pl-10 pr-3 rounded font-body-md text-body-md outline-none focus:bg-surface-container transition-colors"
              />
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant ml-1">
              Used directly in the letter opening — describe how you know this student.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface" htmlFor="gender">
              Pronouns
            </label>
            <div className="relative flex items-center">
              <Icon name="badge" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
              <select
                id="gender"
                value={student.gender || 'they'}
                onChange={(e) => updateField('gender', e.target.value)}
                className="w-full h-[42px] bg-surface-container-low pl-10 pr-3 rounded font-body-md text-body-md outline-none focus:bg-surface-container transition-colors appearance-none"
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <Icon name="arrow_drop_down" className="absolute right-3 text-on-surface-variant text-[20px] pointer-events-none" />
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant ml-1">
              Used for pronouns in the generated letter. Defaults to They/Them.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5">
                <Icon name="verified" className="text-[18px] text-secondary" />
                <span>Achievements</span>
              </label>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                {(student.achievements || []).length} item{(student.achievements || []).length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-lg min-h-[52px]">
              {(student.achievements || []).map((achievement, index) => (
                <span
                  key={`${achievement}-${index}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest text-secondary font-label-md text-label-md shadow-sm"
                >
                  <span>{achievement}</span>
                  <button
                    type="button"
                    aria-label="Remove achievement"
                    onClick={() => removeAchievement(index)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Icon name="close" className="text-[13px]" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-sm">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAchievement();
                    }
                  }}
                  placeholder="Add achievement…"
                  className="font-body-sm text-body-sm text-on-surface bg-transparent outline-none w-36"
                />
                <button type="button" onClick={addAchievement} className="text-secondary hover:opacity-80">
                  <Icon name="add" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5" htmlFor="notes">
              <Icon name="edit_note" className="text-[18px] text-secondary" />
              <span>Notes</span>
            </label>
            <textarea
              id="notes"
              rows={5}
              value={student.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Specific projects, anecdotes, or qualities worth including in the letter…"
              className="w-full bg-surface-container-low text-on-surface p-3 rounded font-body-md text-body-md leading-relaxed outline-none resize-none focus:bg-surface-container transition-colors"
            />
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-12 bg-primary text-on-primary rounded font-title-md text-title-md flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60"
        >
          <Icon name="person_add" className="text-[20px]" />
          <span>{saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save to Student Roster'}</span>
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full h-11 rounded font-label-md text-label-md text-error hover:bg-error-container/40 transition-colors"
          >
            Remove student
          </button>
        )}
      </div>
    </Layout>
  );
}

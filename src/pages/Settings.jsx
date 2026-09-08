import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { saveProfile, watchProfile } from '../lib/firestore';
import { UPGRADE_EMAIL, UPGRADE_MAILTO } from '../lib/config';

const emptyProfile = {
  name: '',
  email: '',
  institution: '',
  title: '',
  letterheadText: '',
  signatureName: '',
  plan: 'free',
};

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    return watchProfile(user.uid, (data) => {
      if (data) setProfile({ ...emptyProfile, ...data });
      setLoading(false);
    });
  }, [user]);

  function updateField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');
    try {
      await saveProfile(user.uid, profile);
      setSavedMessage('Settings saved.');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout title="LetterFlow" subtitle="Settings">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout title="LetterFlow" subtitle="Settings">
      <div className="flex flex-col gap-1">
        <h1 className="font-headline-md text-headline-md text-on-surface">Faculty &amp; Letterhead Settings</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Configure your credentials, default stationery, and signature.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-gutter-lg">
        <div className="bg-surface-container-lowest rounded-xl p-card-pad shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="badge" className="text-[20px] text-secondary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Faculty Identity</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="name">
                Full Name &amp; Title
              </label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Dr. Eleanor Vance, Ph.D."
                className="w-full h-[42px] px-3 font-body-md text-body-md text-on-surface bg-surface-container-low rounded-lg focus:outline-none focus:bg-surface-container transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={profile.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Professor of Computer Science"
                className="w-full h-[42px] px-3 font-body-md text-body-md text-on-surface bg-surface-container-low rounded-lg focus:outline-none focus:bg-surface-container transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="institution">
                Institution / Department
              </label>
              <input
                id="institution"
                type="text"
                value={profile.institution}
                onChange={(e) => updateField('institution', e.target.value)}
                placeholder="Department of Computer Science, Stanford University"
                className="w-full h-[42px] px-3 font-body-md text-body-md text-on-surface bg-surface-container-low rounded-lg focus:outline-none focus:bg-surface-container transition-colors"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full h-[42px] px-3 font-body-md text-body-md text-on-surface bg-surface-container-low rounded-lg focus:outline-none focus:bg-surface-container transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-card-pad shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="description" className="text-[20px] text-secondary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Letterhead</h3>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="letterhead">
              Letterhead Text
            </label>
            <div className="p-3 bg-surface-container-low rounded-lg">
              <textarea
                id="letterhead"
                rows={3}
                value={profile.letterheadText}
                onChange={(e) => updateField('letterheadText', e.target.value)}
                placeholder={'UNIVERSITY NAME\nDepartment of Computer Science\n123 Campus Drive, City, State'}
                className="w-full bg-transparent font-body-md text-body-md leading-relaxed text-on-surface focus:outline-none resize-none"
              />
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Appears at the top of exported letters.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-card-pad shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="draw" className="text-[20px] text-secondary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Signature</h3>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="signatureName">
              Signature Name
            </label>
            <input
              id="signatureName"
              type="text"
              value={profile.signatureName}
              onChange={(e) => updateField('signatureName', e.target.value)}
              placeholder="Eleanor Vance"
              className="w-full h-[42px] px-3 font-body-md text-body-md text-on-surface bg-surface-container-low rounded-lg focus:outline-none focus:bg-surface-container transition-colors"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-card-pad shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="workspace_premium" className="text-[20px] text-secondary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Plan</h3>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex flex-col">
              <span className="font-title-md text-title-md text-on-surface">
                {profile.plan === 'paid' ? 'LetterFlow Pro' : 'Free plan'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {profile.plan === 'paid'
                  ? 'Unlimited students & letters, custom letterhead.'
                  : 'Up to 3 students and 3 letters per calendar month.'}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${
                profile.plan === 'paid' ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {profile.plan === 'paid' ? 'Pro' : 'Free'}
            </span>
          </div>
          {profile.plan !== 'paid' && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Upgrade to LetterFlow Pro — unlimited students &amp; letters, custom letterhead — $40/year. Email{' '}
              <a href={UPGRADE_MAILTO} className="text-secondary hover:underline">
                {UPGRADE_EMAIL}
              </a>{' '}
              to upgrade.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 px-6 rounded-xl bg-primary text-on-primary font-title-md text-title-md font-bold transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Icon name="save" className="text-[20px]" />
            <span>{saving ? 'Saving…' : 'Save Settings'}</span>
          </button>
          {savedMessage && (
            <p className="text-center font-label-sm text-label-sm text-secondary">{savedMessage}</p>
          )}
        </div>
      </form>
    </Layout>
  );
}

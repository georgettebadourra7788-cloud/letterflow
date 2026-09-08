import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login({ email, password });
      } else {
        await signup({ name, email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-screen-edge">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-3 shadow-md">
            <Icon name="history_edu" className="text-[30px]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-2">
            <Icon name="verified_user" className="text-[13px] text-secondary" />
            Academic Portal
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-1">LetterFlow</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px] leading-relaxed">
            Recommendation letter writing &amp; tracking for university faculty.
          </p>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-card-pad">
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg mb-6 text-center">
            <button
              className={`py-2 rounded font-title-md text-title-md transition-all ${
                mode === 'signin' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`py-2 rounded font-title-md text-title-md transition-all ${
                mode === 'signup' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Create Account
            </button>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant tracking-wide uppercase" htmlFor="name">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <Icon name="badge" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prof. Eleanor Vance, Ph.D."
                    className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low rounded font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant tracking-wide uppercase" htmlFor="email">
                Email
              </label>
              <div className="relative flex items-center">
                <Icon name="mail" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.vance@department.edu"
                  className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low rounded font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant tracking-wide uppercase" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <Icon name="lock" className="absolute left-3 text-on-surface-variant text-[20px] pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low rounded font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest transition-colors"
                />
              </div>
            </div>

            {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 h-[46px] rounded bg-primary text-on-primary font-label-lg text-label-lg tracking-wide flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60"
            >
              <span>{mode === 'signin' ? 'Enter Workspace' : 'Create Account'}</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

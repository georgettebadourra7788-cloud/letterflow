import Icon from './Icon';
import { UPGRADE_EMAIL, UPGRADE_MAILTO } from '../lib/config';

export default function UpgradeNotice() {
  return (
    <div className="bg-surface-container-lowest p-card-pad rounded-xl shadow-sm flex flex-col items-center text-center gap-3">
      <Icon name="workspace_premium" className="text-[28px] text-secondary" />
      <h2 className="font-headline-sm text-headline-sm text-on-surface">Free plan limit reached</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
        You&rsquo;ve reached the free plan limit (3 students / 3 letters per month). Upgrade to LetterFlow Pro —
        unlimited students &amp; letters, custom letterhead — $40/year. Email{' '}
        <a href={UPGRADE_MAILTO} className="text-secondary hover:underline">
          {UPGRADE_EMAIL}
        </a>{' '}
        to upgrade.
      </p>
    </div>
  );
}

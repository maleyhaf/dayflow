import React from 'react';
import Logo from '../ui/Logo';
import { LEGAL } from '../../config/legal';
import styles from './LegalPage.module.css';

type Kind = 'privacy' | 'terms';

function Privacy() {
  const { appName, contactEmail } = LEGAL;
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className={styles.meta}>Effective {LEGAL.effectiveDate}</p>

      <p>
        {appName} is a personal calendar and planner. This page explains what information the app collects, why, and
        the choices you have. We keep it short because we collect very little.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your Google account basics.</strong> When you sign in with Google we receive your name, email
          address and profile picture. We use them to create your account and show who is signed in.
        </li>
        <li>
          <strong>What you put in the app.</strong> Your events, notes, subtasks, daily notes, categories and
          appearance settings (theme and dark mode).
        </li>
        <li>
          <strong>Technical data.</strong> Our hosting provider may keep standard server logs, such as IP address and
          browser type, for security and reliability.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Only to run {appName}: to sign you in, save your calendar, and show it to you on any device you sign in
        from. We do not sell your information, use it for advertising, or read your notes for any other purpose.
      </p>

      <h2>Google user data</h2>
      <p>
        {appName}'s use of information received from Google follows the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>
        , including its Limited Use requirements. We only use the basic profile information described above to
        provide the sign-in and account features of the app. We don't transfer it to others except as needed to run
        the service, and we don't use it for advertising.
      </p>

      <h2>Where your data is stored</h2>
      <p>
        Your data is stored with our service providers: Supabase (database and sign-in) and Vercel (website
        hosting). Access to your rows in the database is restricted so that only your signed-in account can read or
        change them. Data is sent over encrypted connections.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        {appName} doesn't use advertising or tracking cookies. Your browser's local storage is used to keep you
        signed in and to remember your theme so the page doesn't flash on load.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit or delete any event, note or category in the app at any time.</li>
        <li>You can sign out whenever you like.</li>
        <li>
          To delete your account and all of its data, email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          We'll remove it within a reasonable time.
        </li>
        <li>
          You can also revoke {appName}'s access from your Google account's security settings.
        </li>
      </ul>

      <h2>Children</h2>
      <p>{appName} isn't directed at children under 13, and we don't knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy we'll update the date above. If the changes are significant we'll make that clear in
        the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </>
  );
}

function Terms() {
  const { appName, contactEmail } = LEGAL;
  return (
    <>
      <h1>Terms of Service</h1>
      <p className={styles.meta}>Effective {LEGAL.effectiveDate}</p>

      <p>
        By using {appName} you agree to these terms. If you don't agree, please don't use the app.
      </p>

      <h2>The service</h2>
      <p>
        {appName} is a personal calendar and planner that lets you keep events, notes and checklists and access them
        from different devices after signing in with Google.
      </p>

      <h2>Your account</h2>
      <p>
        You sign in with your Google account and are responsible for activity under it. Please keep your Google
        account secure.
      </p>

      <h2>Your content</h2>
      <p>
        What you add to {appName} stays yours. You give us permission to store and display it only so we can provide
        the service to you. See our <a href="/privacy">Privacy Policy</a> for how it's handled.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Please don't misuse the service: don't try to access other people's data, disrupt or overload the app, or use
        it to break the law.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We try to keep {appName} running smoothly, but it's provided "as is" and may change, have downtime, or be
        discontinued. Please keep your own copy of anything you can't afford to lose.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent allowed by law, we aren't liable for lost data, missed events, or other indirect damages
        arising from your use of the app.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can stop using {appName} at any time and ask us to delete your account. We may suspend accounts that
        break these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>If we update these terms, we'll change the date above. Continuing to use the app means you accept the update.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </>
  );
}

export default function LegalPage({ kind }: { kind: Kind }) {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <a href="/" className={styles.logoLink} aria-label="Back to DayFlow">
          <Logo size={30} />
        </a>
        <a href="/" className={styles.back}>← Back to app</a>
      </header>

      <main className={styles.content}>
        {kind === 'privacy' ? <Privacy /> : <Terms />}
      </main>

      <footer className={styles.footer}>
        <a href="/privacy">Privacy Policy</a>
        <span aria-hidden>·</span>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
}

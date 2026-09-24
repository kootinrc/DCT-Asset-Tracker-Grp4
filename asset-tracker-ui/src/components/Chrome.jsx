import { useState } from 'react';
import { Button, Spinner } from './ui.jsx';
import { ROLES, ROLE_SUMMARY } from '../lib/permissions.js';
import { isMockAuth } from '../services/auth.js';
import { isMockApi } from '../services/index.js';

export function LoginScreen({ onSignIn }) {
  const [role, setRole] = useState('Technician');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onSignIn({ role });
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark" />
          <span className="brand-name">Asset Register</span>
        </div>
        <h1>Sign in to continue</h1>
        <p>
          Equipment records, values and service history are only available to
          people with an account.
        </p>

        {isMockAuth ? (
          <>
            <label className="field">
              <span className="field-label">Sign in as</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="field-hint">{ROLE_SUMMARY[role]}</span>
            </label>
            <Button variant="primary" size="lg" onClick={submit} disabled={busy}>
              {busy ? <Spinner /> : null}
              {busy ? 'Signing in' : 'Sign in'}
            </Button>
            <p className="login-foot">
              This build runs on sample data with a stand-in sign-in so the role
              rules can be tried out. Amazon Cognito replaces this screen, and
              the backend checks every request against the signed-in identity.
            </p>
          </>
        ) : (
          <>
            <Button variant="primary" size="lg" onClick={submit}>Continue to sign-in</Button>
            <p className="login-foot">You will be taken to the secure sign-in page.</p>
          </>
        )}
      </div>
    </div>
  );
}

export function TopBar({ user, onSignOut, onRoleChange }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            <span className="brand-name">Asset Register</span>
          </div>
          <div className="topbar-user">
            <div className="topbar-who">
              <strong>{user.name}</strong>
              <span>{user.groups[0]} · {user.department}</span>
            </div>
            <Button variant="onink" onClick={onSignOut}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 2H3v12h3M10 11l3-3-3-3M13 8H6"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log out
            </Button>
          </div>
        </div>
      </header>

      {(isMockApi || isMockAuth) && (
        <div className="mockbar">
          <div className="mockbar-inner">
            <span>Prototype · sample data, no backend connected</span>
            <span className="spacer" />
            <label>
              Try another role{' '}
              <select value={user.groups[0]} onChange={(e) => onRoleChange(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}
    </>
  );
}

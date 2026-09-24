import { useState } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import { useAssets } from './hooks/useAssets.js';
import { LoginScreen, TopBar } from './components/Chrome.jsx';
import { AssetList } from './components/AssetList.jsx';
import { AssetDetail } from './components/AssetDetail.jsx';
import { AddAssetFlow } from './components/AddAssetFlow.jsx';
import { Button } from './components/ui.jsx';
import { can } from './lib/permissions.js';

export default function App() {
  const { user, checking, signIn, signOut, setRole } = useAuth();
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const assets = useAssets(user);

  if (checking) return null;
  if (!user) return <LoginScreen onSignIn={signIn} />;

  return (
    <>
      <TopBar user={user} onSignOut={signOut} onRoleChange={setRole} />

      <main className="page">
        <div className="register-head">
          <div>
            <h1 className="register-title">Equipment register</h1>
            <p className="register-sub">
              Signed in as <b>{user.name}</b>. You are seeing what a{' '}
              <b>{user.groups[0]}</b> is allowed to see.
            </p>
          </div>
        </div>

        <AssetList
          {...assets}
          onOpen={setOpenId}
        >
          {can(user, 'create') ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Add asset
            </Button>
          ) : null}
        </AssetList>
      </main>

      {openId && (
        <AssetDetail
          assetId={openId}
          user={user}
          onClose={() => setOpenId(null)}
          onChanged={assets.refresh}
        />
      )}

      {adding && (
        <AddAssetFlow
          user={user}
          onClose={() => setAdding(false)}
          onCreated={() => { setAdding(false); assets.refresh(); }}
        />
      )}
    </>
  );
}

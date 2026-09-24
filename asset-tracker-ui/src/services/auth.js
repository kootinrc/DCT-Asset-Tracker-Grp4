import { config } from '../config.js';
import { CURRENT_USER } from '../data/seed.js';

/**
 * Auth behind one interface so Cognito drops in later without touching the UI.
 * Shape: { getUser, signIn, signOut, getIdToken }
 */

const STORAGE_KEY = 'assetRegister.mockSession';

const mockAuth = {
  async getUser() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async signIn({ role = 'Technician' } = {}) {
    const user = { ...CURRENT_USER, groups: [role] };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  async setRole(role) {
    const user = { ...CURRENT_USER, groups: [role] };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  async signOut() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
  async getIdToken() {
    return null;
  },
};

/**
 * Cognito implementation. Install aws-amplify, uncomment, and set
 * VITE_USE_MOCK_AUTH=false.
 *
 * Amplify.configure({
 *   Auth: { Cognito: {
 *     userPoolId: config.cognito.userPoolId,
 *     userPoolClientId: config.cognito.clientId,
 *     loginWith: { oauth: {
 *       domain: config.cognito.domain,
 *       scopes: ['openid', 'email', 'profile'],
 *       redirectSignIn: [window.location.origin],
 *       redirectSignOut: [window.location.origin],
 *       responseType: 'code',
 *     }},
 *   }},
 * });
 *
 * const cognitoAuth = {
 *   async getUser() {
 *     const { tokens } = await fetchAuthSession();
 *     if (!tokens?.idToken) return null;
 *     const c = tokens.idToken.payload;
 *     return {
 *       sub: c.sub,
 *       email: c.email,
 *       name: c.name ?? c.email,
 *       department: c['custom:department'] ?? '',
 *       // Roles come from the verified token, never from the browser.
 *       groups: c['cognito:groups'] ?? [],
 *     };
 *   },
 *   signIn: () => signInWithRedirect(),
 *   signOut: () => signOut(),
 *   async getIdToken() {
 *     const { tokens } = await fetchAuthSession();
 *     return tokens?.idToken?.toString() ?? null;
 *   },
 * };
 */

export const auth = config.useMockAuth ? mockAuth : mockAuth; // swap right-hand side for cognitoAuth
export const isMockAuth = config.useMockAuth;

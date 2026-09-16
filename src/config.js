// Single place where environment decisions are read. Components never touch
// import.meta.env directly.
const flag = (v, fallback) => (v === undefined ? fallback : String(v) === 'true');

export const config = {
  useMockApi: flag(import.meta.env.VITE_USE_MOCK, true),
  useMockAuth: flag(import.meta.env.VITE_USE_MOCK_AUTH, true),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  cognito: {
    region: import.meta.env.VITE_AWS_REGION || '',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
  },
  currency: 'GBP',
  locale: 'en-GB',
};

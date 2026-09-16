/**
 * UI-side permission hints.
 *
 * ⚠ THIS IS CONVENIENCE ONLY. It decides what to render, nothing more.
 * Every one of these rules MUST be enforced again in the Lambda handlers using
 * the `cognito:groups` claim from the verified JWT. Hiding a button is not
 * security — the backend is the only place authorisation actually happens.
 * This file exists so the UI doesn't offer actions that would 403.
 */

export const ROLES = ['Employee', 'Technician', 'Manager', 'Administrator', 'Auditor'];

export const ROLE_SUMMARY = {
  Employee: 'See equipment assigned to you and report a problem.',
  Technician: 'Register assets, upload photos, update condition and log maintenance.',
  Manager: 'See all equipment and reports for your department.',
  Administrator: 'Full control of assets, people, values and reports.',
  Auditor: 'Read-only access to every record and its history.',
};

const CAPABILITIES = {
  Employee: ['viewOwn', 'reportProblem'],
  Technician: ['viewOwn', 'viewAll', 'create', 'uploadImage', 'updateCondition', 'logMaintenance', 'approveRecommendation'],
  Manager: ['viewOwn', 'viewDepartment', 'reportProblem'],
  Administrator: ['viewOwn', 'viewAll', 'create', 'uploadImage', 'updateCondition', 'logMaintenance', 'approveRecommendation', 'manageValues', 'manageUsers'],
  Auditor: ['viewOwn', 'viewAll'],
};

export const can = (user, capability) => {
  if (!user) return false;
  return (user.groups || []).some((g) => (CAPABILITIES[g] || []).includes(capability));
};

/**
 * Which assets this user may see, beyond their own.
 * The backend does the real filtering; this mirrors it so the mock behaves
 * the same way the API will.
 */
export const visibilityScope = (user) => {
  if (!user) return 'none';
  if (can(user, 'viewAll')) return 'all';
  if (can(user, 'viewDepartment')) return 'department';
  return 'own';
};

import { config } from '../config.js';
import { mockApi, resolveImage as resolveMockImage } from './mockApi.js';
import { httpApi, resolveImage as resolveHttpImage } from './httpApi.js';

/**
 * The only import any component or hook should use.
 * Flip VITE_USE_MOCK in .env.local to change the entire data source.
 */
export const api = config.useMockApi ? mockApi : httpApi;
export const resolveImage = config.useMockApi ? resolveMockImage : resolveHttpImage;
export const isMockApi = config.useMockApi;
export { ApiError } from './contract.js';

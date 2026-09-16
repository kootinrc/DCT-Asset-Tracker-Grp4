import { config } from '../config.js';
import { ApiError, stripForbidden } from './contract.js';
import { auth } from './auth.js';
import { toDisplayableImage } from '../lib/image.js';

/**
 * Real backend client. Already written against the contract — when the API
 * exists, set VITE_USE_MOCK=false and VITE_API_BASE_URL and this takes over.
 *
 * Nothing here decides permissions. The API Gateway authorizer validates the
 * JWT and the Lambda checks the caller's group AND their relationship to the
 * record. This file just carries the token.
 */
async function request(path, { method = 'GET', body, query } = {}) {
  const token = await auth.getIdToken();
  const url = new URL(config.apiBaseUrl.replace(/\/$/, '') + path);
  if (query) Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', {
      status: 0, code: 'NetworkError',
    });
  }

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Matches the error contract in the brief: 400 ValidationError with fields,
    // 401 Unauthorized, 403 Forbidden.
    throw new ApiError(payload.message || 'Something went wrong.', {
      status: res.status,
      code: payload.error || 'ServerError',
      fields: payload.fields || [],
    });
  }
  return payload;
}

/** Downscale before upload: Bedrock rejects images over 3.75 MB or 8000 px. */
async function prepareImage(file, maxEdge = 1600, quality = 0.82) {
  const source = await toDisplayableImage(file);
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export const httpApi = {
  async listAssets() {
    const data = await request('/assets');
    return { assignedToMe: data.assignedToMe, otherVisible: data.otherVisible, scope: data.scope };
  },

  getAsset(assetId) {
    return request(`/assets/${encodeURIComponent(assetId)}`);
  },

  async analyseImage({ file, onProgress }) {
    onProgress?.('Preparing the photograph');
    const blob = await prepareImage(file);

    // 1. Ask the backend for a presigned PUT scoped to one object key.
    onProgress?.('Uploading to secure storage');
    const { uploadUrl, imageKey } = await request('/uploads', {
      method: 'POST',
      body: { contentType: 'image/jpeg', contentLength: blob.size },
    });

    // 2. Upload straight to S3, bypassing API Gateway's payload limit.
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });
    if (!put.ok) {
      throw new ApiError('The photo did not upload. Your details have been kept — try again.', {
        status: put.status, code: 'UploadFailed',
      });
    }

    // 3. Analyse by key. The Lambda passes the S3 URI to Bedrock and validates
    //    the JSON before it ever reaches this client.
    onProgress?.('Analysing the photograph');
    const suggestion = await request('/assets/analyze', { method: 'POST', body: { imageKey } });
    return { ...stripForbidden(suggestion), imageKey };
  },

  createAsset(draft) {
    return request('/assets', { method: 'POST', body: draft });
  },

  logMaintenance(assetId, record) {
    // performedBy is deliberately omitted: the backend reads it from the token.
    return request(`/assets/${encodeURIComponent(assetId)}/maintenance`, {
      method: 'POST', body: record,
    });
  },

  approveRecommendation(recommendationId, { intervalDays } = {}) {
    return request(`/recommendations/${encodeURIComponent(recommendationId)}/approve`, {
      method: 'POST', body: { intervalDays },
    });
  },
};

/** Real photos come back as short-lived presigned GET URLs, minted only after
 *  the backend has checked this user may see the asset. */
export const resolveImage = (imageKey, presignedUrl) => presignedUrl || null;

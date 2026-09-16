import {
  SEED_ASSETS, SEED_MAINTENANCE, SEED_RECOMMENDATIONS, AI_FIXTURES, CURRENT_USER,
} from '../data/seed.js';
import { calculateDepreciation } from '../lib/depreciation.js';
import { today } from '../lib/format.js';
import { addDays } from '../lib/depreciation.js';
import { visibilityScope } from '../lib/permissions.js';
import { toDisplayableImage } from '../lib/image.js';
import { ApiError, stripForbidden } from './contract.js';

/* In-memory store. Resets on reload — that's fine, it's a prototype. */
let assets = SEED_ASSETS.map((a) => ({ ...a }));
let maintenance = SEED_MAINTENANCE.map((m) => ({ ...m }));
let recommendations = SEED_RECOMMENDATIONS.map((r) => ({ ...r }));
let nextId = 71;

/* Object URLs for images uploaded in this session, keyed by fake S3 key.
   The real app stores only the S3 key and asks the API for a short-lived
   presigned GET when it needs to display the photo. */
const localImages = new Map();
export const resolveImage = (imageKey) => (imageKey ? localImages.get(imageKey) || null : null);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const withDepreciation = (a) => {
  try {
    return { ...a, depreciation: calculateDepreciation({ ...a, asOfDate: today() }) };
  } catch {
    return { ...a, depreciation: null };
  }
};

export const mockApi = {
  async listAssets(user = CURRENT_USER) {
    await wait(420);
    const scope = visibilityScope(user);
    const mine = assets.filter((a) => a.assignedUserId === user.sub);

    let others = [];
    if (scope === 'all') {
      others = assets.filter((a) => a.assignedUserId !== user.sub);
    } else if (scope === 'department') {
      others = assets.filter(
        (a) => a.assignedUserId !== user.sub && a.department === user.department,
      );
    }

    return {
      assignedToMe: mine.map(withDepreciation),
      otherVisible: others.map(withDepreciation),
      scope,
    };
  },

  async getAsset(assetId) {
    await wait(220);
    const found = assets.find((a) => a.assetId === assetId);
    if (!found) throw new ApiError('That asset no longer exists.', { status: 404, code: 'NotFound' });
    return {
      ...withDepreciation(found),
      maintenance: maintenance
        .filter((m) => m.assetId === assetId)
        .sort((a, b) => b.performedDate.localeCompare(a.performedDate)),
      recommendations: recommendations.filter((r) => r.assetId === assetId),
    };
  },

  /**
   * Stands in for: presigned upload -> S3 -> POST /assets/analyze -> Bedrock.
   * `hint` only exists in the mock, to let you demo each branch on demand.
   */
  async analyseImage({ file, hint = 'vehicle', onProgress }) {
    if (!file) throw new ApiError('Choose a photograph first.', { status: 400, code: 'ValidationError' });
    if (!file.type?.startsWith('image/')) {
      throw new ApiError('That file is not an image. Upload a JPEG or PNG.', {
        status: 400, code: 'ValidationError',
      });
    }

    onProgress?.('Preparing the photograph');
    const displayable = await toDisplayableImage(file);

    const imageKey = `assets/PENDING-${Date.now()}/photo.jpg`;
    localImages.set(imageKey, URL.createObjectURL(displayable));

    onProgress?.('Uploading to secure storage');
    await wait(900);
    onProgress?.('Analysing the photograph');
    await wait(1500);
    onProgress?.('Checking the response');
    await wait(600);

    if (hint === 'error') {
      throw new ApiError(
        'The analysis service did not respond in time. You can enter the details yourself or try the photo again.',
        { status: 504, code: 'AiUnavailable' },
      );
    }

    const fixture = hint === 'unclear' ? AI_FIXTURES.unclear : AI_FIXTURES.vehicle;
    return { ...stripForbidden(fixture), imageKey };
  },

  async createAsset(draft) {
    await wait(650);

    const required = ['category', 'description', 'purchaseValue', 'salvageValue', 'inServiceDate'];
    const missing = required.filter((f) => draft[f] === '' || draft[f] == null);
    if (missing.length) {
      throw new ApiError('Some required details are still missing.', {
        status: 400, code: 'ValidationError', fields: missing,
      });
    }

    const assetId = `AST-${String(nextId++).padStart(4, '0')}`;
    const record = {
      ...draft,
      assetId,
      assetTag: draft.assetTag || `NG-NEW-${assetId.slice(-4)}`,
      depreciationMethod: 'straight-line',
      // The server sets this. It is never taken from the browser.
      reviewStatus: 'UserConfirmed',
      createdAt: new Date().toISOString(),
      nextMaintenanceDue: draft.nextMaintenanceDue || addDays(today(), 90),
    };
    assets = [record, ...assets];
    return { assetId, message: 'Asset created successfully.' };
  },

  async logMaintenance(assetId, record, user = CURRENT_USER) {
    await wait(400);
    const event = {
      ...record,
      maintenanceId: `MNT-${String(maintenance.length + 1).padStart(4, '0')}`,
      assetId,
      // Taken from the signed-in identity, never from the request body.
      performedBy: user.sub,
    };
    maintenance = [event, ...maintenance];
    assets = assets.map((a) =>
      a.assetId === assetId
        ? { ...a, lastMaintenanceDate: event.performedDate, condition: event.conditionAfterService }
        : a,
    );
    return event;
  },

  async approveRecommendation(recommendationId, user = CURRENT_USER) {
    await wait(350);
    let updated = null;
    recommendations = recommendations.map((r) => {
      if (r.recommendationId !== recommendationId) return r;
      updated = {
        ...r,
        approvalStatus: 'Approved',
        approvedBy: user.sub,
        approvedAt: today(),
      };
      return updated;
    });
    if (!updated) throw new ApiError('Recommendation not found.', { status: 404, code: 'NotFound' });

    // Due dates are calculated by application code from the approved interval,
    // never taken from the model's own text.
    assets = assets.map((a) =>
      a.assetId === updated.assetId
        ? { ...a, nextMaintenanceDue: addDays(today(), updated.suggestedIntervalDays) }
        : a,
    );
    return updated;
  },
};

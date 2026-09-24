/**
 * THE CONTRACT
 * ============
 * Both `mockApi` and `httpApi` implement exactly this interface. Components and
 * hooks only ever talk to the object exported from `services/index.js`, so
 * flipping VITE_USE_MOCK swaps the entire data source with no other edits.
 *
 * When you build the backend, make your Lambda responses match these shapes and
 * the UI will work unchanged.
 *
 *   listAssets()                  -> { assignedToMe: Asset[], otherVisible: Asset[] }
 *                                    GET  /assets
 *   getAsset(assetId)             -> AssetDetail
 *                                    GET  /assets/{id}
 *   analyseImage({ file, hint })  -> AiSuggestion
 *                                    POST /uploads  then  POST /assets/analyze
 *   createAsset(draft)            -> { assetId, message }
 *                                    POST /assets
 *   logMaintenance(id, record)    -> MaintenanceEvent
 *                                    POST /assets/{id}/maintenance
 *   approveRecommendation(recId)  -> Recommendation
 *                                    POST /recommendations/{id}/approve
 *
 * Every method rejects with an ApiError carrying { status, code, message,
 * fields } so error handling is identical in both modes.
 *
 * @typedef {Object} Asset
 * @property {string} assetId
 * @property {string} assetTag
 * @property {string} category
 * @property {string} description
 * @property {string|null} manufacturer
 * @property {string|null} model
 * @property {string|null} serialNumber
 * @property {string} purchaseDate       ISO date
 * @property {string} inServiceDate      ISO date, may differ from purchaseDate
 * @property {string} purchaseValue      decimal string, never a float
 * @property {string} salvageValue       decimal string
 * @property {number} usefulLifeMonths   positive integer
 * @property {string} depreciationMethod
 * @property {string|null} assignedUserId  Cognito sub
 * @property {string} department
 * @property {{building: string, room: string}} location
 * @property {string} condition
 * @property {string} status
 * @property {string} usageLevel
 * @property {string} environment
 * @property {string|null} lastCleaningDate
 * @property {string|null} lastMaintenanceDate
 * @property {string|null} nextMaintenanceDue
 * @property {string|null} imageKey      S3 object key, NEVER a presigned URL
 * @property {string} reviewStatus       'UserConfirmed' | 'PendingReview'
 * @property {Depreciation} depreciation server-calculated, display only
 *
 * @typedef {Object} Depreciation
 * @property {number} elapsedMonths
 * @property {string} monthlyDepreciation
 * @property {string} annualDepreciation
 * @property {string} accumulatedDepreciation
 * @property {string} currentBookValue
 * @property {number} percentOfLifeUsed
 * @property {string} estimatedReplacementDate
 *
 * @typedef {Object} AiSuggestion
 * @property {'suggestion_available'|'manual_entry_required'} identificationStatus
 * @property {string|null} category
 * @property {string|null} manufacturer
 * @property {string|null} model
 * @property {string|null} description
 * @property {string|null} visibleConditionNotes
 * @property {number|null} suggestedUsefulLifeMonths
 * @property {string|null} suggestedMaintenanceCategory
 * @property {string[]} reviewNotes
 * @property {string} imageKey
 */

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'ServerError', fields = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Fields the AI is never permitted to supply. Kept here so both the mock and
 *  the real client can assert it before anything reaches the form. */
export const AI_FORBIDDEN_FIELDS = [
  'serialNumber', 'purchaseValue', 'salvageValue',
  'purchaseDate', 'inServiceDate', 'assignedUserId',
];

/** Discards any field the model should not have returned. Defence in depth:
 *  the Lambda strips these too, but the client never trusts that. */
export function stripForbidden(suggestion) {
  const clean = { ...suggestion };
  for (const key of AI_FORBIDDEN_FIELDS) delete clean[key];
  return clean;
}

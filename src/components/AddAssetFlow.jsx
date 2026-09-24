import { useMemo, useRef, useState } from 'react';
import { Overlay, CloseButton, Button, Field, Badge, Spinner } from './ui.jsx';
import { api, resolveImage, isMockApi } from '../services/index.js';
import { toDisplayableImage } from '../lib/image.js';
import { tryCalculateDepreciation } from '../lib/depreciation.js';
import { moneyExact, shortDate, today } from '../lib/format.js';
import {
  CATEGORIES, CONDITIONS, STATUSES, USAGE_LEVELS, ENVIRONMENTS, CURRENT_USER,
} from '../data/seed.js';

const STEPS = ['photo', 'review', 'details'];

const blankDraft = () => ({
  assetTag: '',
  category: '',
  description: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  inServiceDate: '',
  purchaseValue: '',
  salvageValue: '',
  usefulLifeMonths: 48,
  department: CURRENT_USER.department,
  building: '',
  room: '',
  condition: 'Good',
  status: 'Available',
  usageLevel: 'Daily',
  environment: 'Indoor office',
  assignedUserId: null,
  imageKey: null,
});

export function AddAssetFlow({ user, onClose, onCreated }) {
  const [stage, setStage] = useState('photo');       // photo | analysing | review | details | saving
  const [file, setFile] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const [progress, setProgress] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [draft, setDraft] = useState(blankDraft);
  /** Which fields still hold unedited machine output. Drives the brass state. */
  const [suggested, setSuggested] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [simulate, setSimulate] = useState('vehicle');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const set = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSuggested((s) => {
      if (!s.has(key)) return s;
      const next = new Set(s);
      next.delete(key);          // a human touched it, so it is no longer a suggestion
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const startAnalysis = async (chosen) => {
    setStage('analysing');
    setAiError(null);
    setPreviewKey(null);
    setProgress('Preparing the photograph');

    // iPhones and Macs save photos as HEIC by default, which Chrome, Firefox
    // and Edge cannot decode in <img> or <canvas> at all. Converting up front
    // means the picked file is always something every later step can render.
    let displayable;
    try {
      displayable = await toDisplayableImage(chosen);
    } catch {
      setFile(chosen);
      setAiError('This photo could not be opened. Try a JPEG or PNG.');
      setStage('review');
      return;
    }
    setFile(displayable);

    try {
      const result = await api.analyseImage({
        file: displayable,
        hint: simulate,
        onProgress: setProgress,
      });
      setPreviewKey(result.imageKey);

      if (result.identificationStatus === 'manual_entry_required') {
        setSuggestion(result);
        setDraft((d) => ({ ...d, imageKey: result.imageKey }));
        setStage('review');
        return;
      }

      const filled = {
        category: result.category || '',
        description: result.description || '',
        manufacturer: result.manufacturer || '',
        condition: mapCondition(result.visibleConditionNotes),
        usefulLifeMonths: result.suggestedUsefulLifeMonths || 48,
      };
      setDraft((d) => ({ ...d, ...filled, imageKey: result.imageKey }));
      setSuggested(new Set(Object.keys(filled)));
      setSuggestion(result);
      setStage('review');
    } catch (err) {
      // Every AI failure path lands on manual entry with the form intact.
      setAiError(err.message);
      setStage('review');
    }
  };

  const onPick = (e) => {
    const chosen = e.target.files?.[0];
    if (chosen) startAnalysis(chosen);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) startAnalysis(chosen);
  };

  const skipToManual = () => {
    setSuggestion(null);
    setSuggested(new Set());
    setStage('details');
  };

  const validate = () => {
    const next = {};
    if (!draft.category) next.category = 'Choose a category.';
    if (!draft.description.trim()) next.description = 'Describe the asset.';
    if (draft.purchaseValue === '') next.purchaseValue = 'Enter what was paid.';
    if (draft.salvageValue === '') next.salvageValue = 'Enter the expected end-of-life value.';
    if (!draft.inServiceDate) next.inServiceDate = 'Depreciation starts from this date.';
    if (Number(draft.salvageValue) > Number(draft.purchaseValue)) {
      next.salvageValue = 'Salvage value cannot be more than the purchase value.';
    }
    if (!Number.isInteger(Number(draft.usefulLifeMonths)) || Number(draft.usefulLifeMonths) <= 0) {
      next.usefulLifeMonths = 'Useful life must be a whole number of months above zero.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setStage('saving');
    try {
      const { building, room, ...rest } = draft;
      await api.createAsset({
        ...rest,
        usefulLifeMonths: Number(draft.usefulLifeMonths),
        location: { building: building || 'Unassigned', room: room || '—' },
        purchaseDate: draft.purchaseDate || draft.inServiceDate,
      });
      onCreated();
    } catch (err) {
      setErrors((e) => ({ ...e, _form: err.message }));
      setStage('details');
    }
  };

  const depreciation = useMemo(
    () => tryCalculateDepreciation({
      purchaseValue: draft.purchaseValue,
      salvageValue: draft.salvageValue,
      usefulLifeMonths: Number(draft.usefulLifeMonths),
      inServiceDate: draft.inServiceDate,
      asOfDate: today(),
    }),
    [draft.purchaseValue, draft.salvageValue, draft.usefulLifeMonths, draft.inServiceDate],
  );

  const stepIndex = stage === 'photo' || stage === 'analysing' ? 0 : stage === 'review' ? 1 : 2;
  const preview = previewKey ? resolveImage(previewKey) : (file ? URL.createObjectURL(file) : null);

  return (
    <Overlay onClose={onClose} labelledBy="add-title">
      <div className="panel-head">
        <div style={{ marginRight: 'auto' }}>
          <h2 id="add-title">Add an asset</h2>
          <p>{
            stage === 'details'
              ? 'Accounting and location details'
              : stage === 'review'
                ? 'Check what was read from the photo'
                : 'Start with a photograph, or skip it'
          }</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s} className="step-pip" data-state={i < stepIndex ? 'done' : i === stepIndex ? 'current' : undefined} />
        ))}
      </div>

      {/* ---------------------------------------------------------- 1. photo */}
      {stage === 'photo' && (
        <>
          <div className="panel-body">
            <label
              className="dropzone"
              data-over={dragging}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onPick}
              />
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ margin: '0 auto', color: 'var(--accent)' }}>
                <path d="M4 16l4-5 3 3.5L14.5 10 20 16M4 5h16v14H4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="dropzone-title">Drop a photo here, or choose a file</div>
              <div className="dropzone-hint">
                JPEG or PNG. Photos are resized before upload and stored privately.
              </div>
            </label>

            {isMockApi && (
              <div style={{ marginTop: 16 }}>
                <Field label="Prototype: what should the analysis return?" hint="Lets you show each branch during the demo. This selector disappears once the real service is connected.">
                  <select className="select" value={simulate} onChange={(e) => setSimulate(e.target.value)}>
                    <option value="vehicle">A recognisable asset (company van)</option>
                    <option value="unclear">An image too unclear to identify</option>
                    <option value="error">The analysis service failing</option>
                  </select>
                </Field>
              </div>
            )}

            <div className="divider-or">or</div>

            <Button size="lg" onClick={skipToManual} style={{ width: '100%' }}>
              Enter the details myself
            </Button>
          </div>
          <div className="panel-foot">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </>
      )}

      {/* ------------------------------------------------------ 2. analysing */}
      {stage === 'analysing' && (
        <div className="panel-body">
          <div className="analysing">
            <div className="analysing-preview">
              {preview && <img src={preview} alt="" />}
            </div>
            <div className="analysing-status">{progress || 'Uploading'}…</div>
            <div className="analysing-sub">This usually takes a few seconds.</div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- 3. review */}
      {stage === 'review' && (
        <>
          <div className="panel-body">
            {aiError && (
              <>
                {preview && (
                  <div className="review-photo">
                    <img src={preview} alt="The photo you uploaded" />
                  </div>
                )}
                <div className="notice" data-tone="bad" style={{ marginBottom: 20 }}>
                  <h3>The photo could not be analysed</h3>
                  <p>{aiError}</p>
                  <p style={{ marginTop: 6 }}>Enter the details yourself, or go back and try another photo.</p>
                </div>
              </>
            )}

            {suggestion?.identificationStatus === 'manual_entry_required' && (
              <>
                {preview && (
                  <div className="review-photo">
                    <img src={preview} alt="The photo you uploaded" />
                  </div>
                )}
                <div className="notice" style={{ marginBottom: 20 }}>
                  <h3>We could not identify this asset from the photograph</h3>
                  <p>Please enter the required details manually, or upload a clearer image.</p>
                  {suggestion.reviewNotes?.length > 0 && (
                    <ul>{suggestion.reviewNotes.map((n) => <li key={n}>{n}</li>)}</ul>
                  )}
                </div>
              </>
            )}

            {suggestion?.identificationStatus === 'suggestion_available' && (
              <>
                <div className="review-photo">
                  {preview && <img src={preview} alt="The asset you photographed" />}
                  <div>
                    <Badge tone="unconfirmed">Not saved yet</Badge>
                    <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-soft)', marginTop: 8 }}>
                      Everything below was read from the photo. Change anything that
                      is wrong — nothing is stored until you confirm it.
                    </p>
                  </div>
                </div>

                <Field label="Category" required unconfirmed={suggested.has('category')} error={errors.category}>
                  <select className="select" value={draft.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Choose a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="Manufacturer" unconfirmed={suggested.has('manufacturer')}>
                  <input className="input" value={draft.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
                </Field>

                <Field
                  label="Model"
                  hint="The photo did not show this clearly. Copy it from the label on the asset."
                >
                  <input className="input" value={draft.model} onChange={(e) => set('model', e.target.value)} placeholder="Not visible in the photo" />
                </Field>

                <Field
                  label="Serial number"
                  hint="Never read from a photo. Type it from the plate or barcode."
                >
                  <input className="input ident" value={draft.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} placeholder="Not visible in the photo" />
                </Field>

                <Field label="Description" required unconfirmed={suggested.has('description')} error={errors.description}>
                  <textarea className="textarea" value={draft.description} onChange={(e) => set('description', e.target.value)} />
                </Field>

                <Field label="Condition" unconfirmed={suggested.has('condition')} hint={suggestion.visibleConditionNotes || undefined}>
                  <select className="select" value={draft.condition} onChange={(e) => set('condition', e.target.value)}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                {suggestion.reviewNotes?.length > 0 && (
                  <div className="notice" data-tone="unconfirmed" style={{ marginTop: 20 }}>
                    <h3>What the photo could not tell us</h3>
                    <ul>{suggestion.reviewNotes.map((n) => <li key={n}>{n}</li>)}</ul>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="panel-foot">
            <Button variant="ghost" onClick={() => { setStage('photo'); setSuggestion(null); setAiError(null); setSuggested(new Set()); }}>
              Try another photo
            </Button>
            <span className="spacer" />
            <Button variant="primary" onClick={() => setStage('details')}>
              Continue
            </Button>
          </div>
        </>
      )}

      {/* -------------------------------------------------- 4. details/save */}
      {(stage === 'details' || stage === 'saving') && (
        <>
          <div className="panel-body">
            {errors._form && <div className="notice" data-tone="bad" style={{ marginBottom: 16 }}>{errors._form}</div>}

            {!suggestion && (
              <>
                <Field label="Category" required error={errors.category}>
                  <select className="select" value={draft.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Choose a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Description" required error={errors.description}>
                  <textarea className="textarea" value={draft.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
                <div className="grid-2">
                  <Field label="Manufacturer">
                    <input className="input" value={draft.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
                  </Field>
                  <Field label="Model">
                    <input className="input" value={draft.model} onChange={(e) => set('model', e.target.value)} />
                  </Field>
                </div>
              </>
            )}

            <div className="grid-2">
              <Field label="Asset tag" hint="Leave blank to generate one.">
                <input className="input ident" value={draft.assetTag} onChange={(e) => set('assetTag', e.target.value)} placeholder="NG-VEH-0001" />
              </Field>
              <Field label="Serial number">
                <input className="input ident" value={draft.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Purchase date">
                <input className="input" type="date" value={draft.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
              </Field>
              <Field label="In service from" required error={errors.inServiceDate} hint="Depreciation is counted from this date.">
                <input className="input" type="date" value={draft.inServiceDate} onChange={(e) => set('inServiceDate', e.target.value)} />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Purchase value" required error={errors.purchaseValue}>
                <input className="input num" type="number" min="0" step="0.01" value={draft.purchaseValue} onChange={(e) => set('purchaseValue', e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Salvage value" required error={errors.salvageValue} hint="What it should still be worth at end of life.">
                <input className="input num" type="number" min="0" step="0.01" value={draft.salvageValue} onChange={(e) => set('salvageValue', e.target.value)} placeholder="0.00" />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Useful life in months" required error={errors.usefulLifeMonths} unconfirmed={suggested.has('usefulLifeMonths')}>
                <input className="input num" type="number" min="1" step="1" value={draft.usefulLifeMonths} onChange={(e) => set('usefulLifeMonths', e.target.value)} />
              </Field>
              <Field label="Depreciation method">
                <select className="select" disabled value="straight-line">
                  <option value="straight-line">Straight line</option>
                </select>
              </Field>
            </div>

            <div className="calc">
              <div className="calc-head">
                What this will be worth today
                {depreciation.result && <span>{depreciation.result.percentOfLifeUsed}% of life used</span>}
              </div>
              {depreciation.result ? (
                <>
                  <div className="calc-bar"><i style={{ width: `${Math.min(100, depreciation.result.percentOfLifeUsed)}%` }} /></div>
                  <dl className="calc-rows">
                    <dt>Monthly depreciation</dt><dd>{moneyExact(depreciation.result.monthlyDepreciation)}</dd>
                    <dt>Accumulated so far</dt><dd>{moneyExact(depreciation.result.accumulatedDepreciation)}</dd>
                    <dt>Current book value</dt><dd>{moneyExact(depreciation.result.currentBookValue)}</dd>
                    <dt>Estimated replacement</dt><dd>{shortDate(depreciation.result.estimatedReplacementDate)}</dd>
                  </dl>
                </>
              ) : (
                <p className="calc-invalid">
                  {depreciation.error || 'Fill in the values, life and in-service date to see the calculation.'}
                </p>
              )}
            </div>

            <div className="grid-2">
              <Field label="Building">
                <input className="input" value={draft.building} onChange={(e) => set('building', e.target.value)} placeholder="Mesquite Hall" />
              </Field>
              <Field label="Room or bay">
                <input className="input" value={draft.room} onChange={(e) => set('room', e.target.value)} placeholder="319" />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Status">
                <select className="select" value={draft.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Condition">
                <select className="select" value={draft.condition} onChange={(e) => set('condition', e.target.value)}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid-2">
              <Field label="How often it is used">
                <select className="select" value={draft.usageLevel} onChange={(e) => set('usageLevel', e.target.value)}>
                  {USAGE_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Where it operates">
                <select className="select" value={draft.environment} onChange={(e) => set('environment', e.target.value)}>
                  {ENVIRONMENTS.map((en) => <option key={en} value={en}>{en}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="panel-foot">
            <Button variant="ghost" onClick={() => setStage(suggestion ? 'review' : 'photo')}>Back</Button>
            <span className="spacer" />
            <Button variant="primary" onClick={save} disabled={stage === 'saving'}>
              {stage === 'saving' && <Spinner />}
              {stage === 'saving' ? 'Saving' : 'Save asset'}
            </Button>
          </div>
        </>
      )}
    </Overlay>
  );
}

/** Very small heuristic so the condition dropdown starts somewhere sensible.
 *  A person still confirms it — a photo cannot establish working order. */
function mapCondition(notes) {
  if (!notes) return 'Good';
  const n = notes.toLowerCase();
  if (/(crack|broken|severe|heavy damage)/.test(n)) return 'Poor';
  if (/(dent|scuff|scratch|wear)/.test(n)) return 'Fair';
  return 'Good';
}

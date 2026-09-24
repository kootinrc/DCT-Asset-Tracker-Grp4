import { useEffect, useState } from 'react';
import { Overlay, CloseButton, Badge, Button, Spinner, CategoryGlyph, statusTone, conditionTone, priorityTone } from './ui.jsx';
import { api, resolveImage } from '../services/index.js';
import { money, moneyExact, shortDate, dueLabel } from '../lib/format.js';
import { DIRECTORY } from '../data/seed.js';
import { can } from '../lib/permissions.js';

const Fact = ({ label, value }) => (
  <div>
    <dt>{label}</dt>
    <dd className={value ? undefined : 'unknown'}>{value || 'Not recorded'}</dd>
  </div>
);

export function AssetDetail({ assetId, user, onClose, onChanged }) {
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getAsset(assetId)
      .then((a) => alive && setAsset(a))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [assetId]);

  const approve = async (rec) => {
    setApproving(rec.recommendationId);
    try {
      await api.approveRecommendation(rec.recommendationId, user);
      setAsset(await api.getAsset(assetId));
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(null);
    }
  };

  const photo = asset ? resolveImage(asset.imageKey) : null;
  const dep = asset?.depreciation;
  const due = asset ? dueLabel(asset.nextMaintenanceDue) : null;

  return (
    <Overlay align="right" onClose={onClose} labelledBy="detail-title">
      <div className="panel-head">
        <div style={{ marginRight: 'auto', minWidth: 0 }}>
          <h2 id="detail-title">
            {asset
              ? asset.manufacturer
                ? `${asset.manufacturer} ${asset.model || asset.category}`
                : asset.category
              : 'Loading'}
          </h2>
          {asset && <p className="ident">{asset.assetTag} · {asset.assetId}</p>}
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {!asset && !error && (
        <div className="panel-body"><Spinner /> Loading the record…</div>
      )}
      {error && <div className="panel-body"><div className="notice" data-tone="bad">{error}</div></div>}

      {asset && (
        <div className="panel-body">
          <div className="detail-hero">
            {photo ? <img src={photo} alt={asset.description} /> : <CategoryGlyph category={asset.category} size={54} />}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
            <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
            <Badge tone={conditionTone(asset.condition)}>{asset.condition} condition</Badge>
            <Badge tone={due.overdue ? 'bad' : 'idle'}>{due.text}</Badge>
          </div>

          <p style={{ color: 'var(--text-soft)', fontSize: 'var(--size-small)' }}>{asset.description}</p>

          <section className="detail-section">
            <h3>Where it is and who has it</h3>
            <dl className="facts">
              <Fact label="Building" value={asset.location.building} />
              <Fact label="Room" value={asset.location.room} />
              <Fact label="Assigned to" value={DIRECTORY[asset.assignedUserId] || null} />
              <Fact label="Department" value={asset.department} />
              <Fact label="Usage" value={asset.usageLevel} />
              <Fact label="Environment" value={asset.environment} />
            </dl>
          </section>

          <section className="detail-section">
            <h3>Identification</h3>
            <dl className="facts">
              <Fact label="Category" value={asset.category} />
              <Fact label="Manufacturer" value={asset.manufacturer} />
              <Fact label="Model" value={asset.model} />
              <Fact label="Serial number" value={asset.serialNumber} />
            </dl>
          </section>

          {dep && (
            <section className="detail-section">
              <h3>Value</h3>
              <div className="calc">
                <div className="calc-head">
                  Straight line over {asset.usefulLifeMonths} months
                  <span>{dep.percentOfLifeUsed}% of life used</span>
                </div>
                <div className="calc-bar"><i style={{ width: `${Math.min(100, dep.percentOfLifeUsed)}%` }} /></div>
                <dl className="calc-rows">
                  <dt>Original purchase value</dt><dd>{moneyExact(asset.purchaseValue)}</dd>
                  <dt>Annual depreciation</dt><dd>{moneyExact(dep.annualDepreciation)}</dd>
                  <dt>Accumulated depreciation</dt><dd>{moneyExact(dep.accumulatedDepreciation)}</dd>
                  <dt>Current book value</dt><dd>{moneyExact(dep.currentBookValue)}</dd>
                  <dt>Salvage value</dt><dd>{moneyExact(asset.salvageValue)}</dd>
                  <dt>Estimated replacement</dt><dd>{shortDate(dep.estimatedReplacementDate)}</dd>
                </dl>
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>
                Book value is a planning figure, not a resale price. Calculated in
                application code from the in-service date of {shortDate(asset.inServiceDate)}.
              </p>
            </section>
          )}

          {asset.recommendations?.length > 0 && (
            <section className="detail-section">
              <h3>Suggested maintenance</h3>
              {asset.recommendations.map((rec) => (
                <div key={rec.recommendationId} className="notice" data-tone={rec.approvalStatus === 'Approved' ? undefined : 'unconfirmed'} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <Badge tone={priorityTone(rec.priority)}>{rec.priority} priority</Badge>
                    {rec.approvalStatus === 'Approved'
                      ? <Badge tone="ok">Approved {shortDate(rec.approvedAt)}</Badge>
                      : <Badge tone="unconfirmed">Awaiting approval</Badge>}
                  </div>
                  <h3>{rec.recommendedAction}</h3>
                  <p>{rec.reason}</p>
                  <ul>
                    {rec.limitations.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                  {rec.approvalStatus !== 'Approved' && can(user, 'approveRecommendation') && (
                    <div style={{ marginTop: 12 }}>
                      <Button
                        variant="primary"
                        onClick={() => approve(rec)}
                        disabled={approving === rec.recommendationId}
                      >
                        {approving === rec.recommendationId && <Spinner />}
                        Approve a {rec.suggestedIntervalDays}-day interval
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          <section className="detail-section">
            <h3>Service history</h3>
            {asset.maintenance.length ? (
              <ul className="log">
                {asset.maintenance.map((m) => (
                  <li key={m.maintenanceId}>
                    <span className="log-date">{shortDate(m.performedDate)}</span>
                    <span className="log-body">
                      <strong>{m.maintenanceType} · {money(m.cost)}</strong>
                      <p>{m.notes}</p>
                      <p>Carried out by {DIRECTORY[m.performedBy] || 'a technician'}</p>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">No work has been recorded against this asset yet.</p>
            )}
          </section>
        </div>
      )}

      <div className="panel-foot">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <span className="spacer" />
        {can(user, 'logMaintenance') && <Button disabled>Record maintenance</Button>}
        {can(user, 'manageValues') && <Button disabled>Edit asset</Button>}
      </div>
    </Overlay>
  );
}

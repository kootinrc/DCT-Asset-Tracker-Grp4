import { useMemo, useState } from 'react';
import { Badge, CategoryGlyph, statusTone } from './ui.jsx';
import { money, dueLabel } from '../lib/format.js';
import { resolveImage } from '../services/index.js';

function AssetRow({ asset, onOpen }) {
  const due = dueLabel(asset.nextMaintenanceDue);
  const photo = resolveImage(asset.imageKey);
  const book = asset.depreciation?.currentBookValue;

  return (
    <button className="row" onClick={() => onOpen(asset.assetId)}>
      <span className="row-edge" data-tone={statusTone(asset.status)} />
      <span className="row-thumb">
        {photo ? <img src={photo} alt="" /> : <CategoryGlyph category={asset.category} />}
      </span>
      <span className="row-main">
        <span className="row-name">
          {asset.manufacturer ? `${asset.manufacturer} ${asset.model || asset.category}` : asset.category}
          <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
          {asset.reviewStatus === 'PendingReview' && (
            <Badge tone="unconfirmed">Needs review</Badge>
          )}
        </span>
        <span className="row-meta">
          <span className="ident row-tag">{asset.assetTag}</span>
          {' · '}{asset.location.building}, {asset.location.room}
          {' · '}{asset.condition} condition
        </span>
      </span>
      <span className="row-figures">
        <span className="row-value">
          <s>{money(asset.purchaseValue)}</s>
          {book != null ? money(book) : '—'}
        </span>
        <span className="row-due" data-overdue={due.overdue}>{due.text}</span>
      </span>
    </button>
  );
}

function Group({ title, note, assets, onOpen, emptyTitle, emptyBody }) {
  return (
    <section className="group">
      <div className="group-head">
        <h2 className="group-title">{title}</h2>
        <span className="group-note">{note}</span>
      </div>
      {assets.length ? (
        <div className="rows">
          {assets.map((a) => <AssetRow key={a.assetId} asset={a} onOpen={onOpen} />)}
        </div>
      ) : (
        <div className="empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyBody}</p>
        </div>
      )}
    </section>
  );
}

export function AssetList({ assignedToMe, otherVisible, scope, loading, onOpen, children }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const match = (a) => {
    const hay = [
      a.assetTag, a.assetId, a.category, a.description,
      a.manufacturer, a.model, a.serialNumber,
      a.location.building, a.location.room,
    ].filter(Boolean).join(' ').toLowerCase();
    const okQuery = !query.trim() || hay.includes(query.trim().toLowerCase());
    const okStatus = status === 'All' || a.status === status;
    return okQuery && okStatus;
  };

  const mine = useMemo(() => assignedToMe.filter(match), [assignedToMe, query, status]);
  const others = useMemo(() => otherVisible.filter(match), [otherVisible, query, status]);

  const all = [...assignedToMe, ...otherVisible];
  const totals = useMemo(() => {
    const book = all.reduce((sum, a) => sum + Number(a.depreciation?.currentBookValue || 0), 0);
    const attention = all.filter((a) => {
      const d = dueLabel(a.nextMaintenanceDue);
      return d.overdue || ['Damaged', 'In Maintenance'].includes(a.status);
    }).length;
    return { count: all.length, book, attention };
  }, [assignedToMe, otherVisible]);

  const scopeNote = {
    all: 'Everything in the register',
    department: `Shared across ${'your department'}`,
    own: 'Limited to your own equipment',
  }[scope];

  if (loading) {
    return (
      <>
        <div className="skeleton" style={{ height: 88 }} />
        <div className="skeleton" style={{ height: 240, marginTop: 24 }} />
      </>
    );
  }

  return (
    <>
      <dl className="summary">
        <div className="summary-cell">
          <dt>Assets you can see</dt>
          <dd className="num">{totals.count}</dd>
        </div>
        <div className="summary-cell">
          <dt>Assigned to you</dt>
          <dd className="num">{assignedToMe.length}</dd>
        </div>
        <div className="summary-cell">
          <dt>Current book value</dt>
          <dd className="num">{money(totals.book)}</dd>
        </div>
        <div className="summary-cell">
          <dt>Needing attention</dt>
          <dd className={totals.attention ? 'num flag' : 'num'}>{totals.attention}</dd>
        </div>
      </dl>

      <div className="toolbar">
        {children}
        <div className="toolbar-search">
          <label htmlFor="asset-search" className="sr-only">Search equipment</label>
          <input
            id="asset-search"
            className="input"
            type="search"
            placeholder="Search by tag, make, model or room"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
          id="status-filter"
          className="select"
          style={{ width: 'auto' }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {['All', 'Available', 'Assigned', 'Checked Out', 'In Maintenance', 'Damaged', 'Retired'].map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'Any status' : s}</option>
          ))}
        </select>
      </div>

      <Group
        title="Assigned to you"
        note={`${mine.length} of ${assignedToMe.length}`}
        assets={mine}
        onOpen={onOpen}
        emptyTitle={assignedToMe.length ? 'Nothing matches that search' : 'No equipment is assigned to you'}
        emptyBody={
          assignedToMe.length
            ? 'Clear the search or change the status filter to see your equipment.'
            : 'When a technician assigns you a device it will appear here.'
        }
      />

      {scope !== 'own' && (
        <Group
          title="Other equipment you can view"
          note={scopeNote}
          assets={others}
          onOpen={onOpen}
          emptyTitle="Nothing matches that search"
          emptyBody="Try a different tag, make or room."
        />
      )}
    </>
  );
}

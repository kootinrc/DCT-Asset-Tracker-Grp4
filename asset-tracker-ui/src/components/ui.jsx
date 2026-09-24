import { useEffect, useRef } from 'react';

export function Button({ variant = 'default', size, children, ...rest }) {
  return (
    <button className="btn" data-variant={variant} data-size={size} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ tone, children }) {
  return (
    <span className="badge" data-tone={tone}>
      {tone && tone !== 'unconfirmed' && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Field({ label, required, hint, error, unconfirmed, children, htmlFor }) {
  return (
    <label className="field" data-unconfirmed={unconfirmed ? 'true' : undefined} htmlFor={htmlFor}>
      <span className="field-label">
        {label}
        {required && <span className="field-req" aria-hidden="true">*</span>}
        {unconfirmed && <Badge tone="unconfirmed">Suggested</Badge>}
      </span>
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

/** Shared overlay. `align="right"` renders a drawer, `center` a modal. */
export function Overlay({ align = 'center', onClose, labelledBy, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="scrim"
      data-align={align}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={align === 'right' ? 'drawer' : 'modal'}
      >
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick }) {
  return (
    <button className="iconbtn" onClick={onClick} aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* --- Category glyphs. Drawn inline so nothing depends on a network image. --- */
const PATHS = {
  Laptop: 'M5 7h14v9H5zM3 18h18',
  Desktop: 'M7 4h10v14H7zM9 20h6',
  Monitor: 'M3 5h18v11H3zM9 20h6M12 16v4',
  Server: 'M4 5h16v5H4zM4 14h16v5H4zM7 7.5h.01M7 16.5h.01',
  Networking: 'M3 9h18v6H3zM7 15v3M12 15v3M17 15v3',
  Printer: 'M7 4h10v5H7zM5 9h14v7H5zM8 16h8v4H8z',
  Projector: 'M4 8h13v8H4zM17 10l3-2v8l-3-2M7 19v2M14 19v2',
  Vehicle: 'M3 14l2-6h11l4 6v4H3zM7 18a1.6 1.6 0 103.2 0M14 18a1.6 1.6 0 103.2 0',
  'Mobile device': 'M8 3h8v18H8zM11 18.5h2',
  Tablet: 'M6 3h12v18H6zM11 18.5h2',
  'Power tool': 'M6 8h8l5 3-5 3H6zM6 6v12',
  'Lab equipment': 'M9 3v6l-5 9h16l-5-9V3M8 3h8',
  Other: 'M5 5h14v14H5z',
};

export function CategoryGlyph({ category, size = 22 }) {
  const d = PATHS[category] || PATHS.Other;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* --- Status → colour tone. One place, used everywhere. --- */
export const statusTone = (status) =>
  ({
    Available: 'ok',
    Assigned: 'ok',
    'Checked Out': 'accent',
    'In Maintenance': 'warn',
    Damaged: 'bad',
    Lost: 'bad',
    Stolen: 'bad',
    Retired: 'idle',
  }[status] || 'idle');

export const conditionTone = (condition) =>
  ({
    Excellent: 'ok',
    Good: 'ok',
    Fair: 'warn',
    Poor: 'bad',
    Unserviceable: 'bad',
  }[condition] || 'idle');

export const priorityTone = (priority) =>
  ({ High: 'bad', Medium: 'warn', Low: 'idle' }[priority] || 'idle');

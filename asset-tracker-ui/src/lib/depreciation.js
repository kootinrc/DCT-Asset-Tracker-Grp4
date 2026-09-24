/**
 * Straight-line depreciation.
 *
 * This is a faithful JS port of the reference Python in the assignment brief.
 * Conventions, documented here and applied consistently:
 *   - Depreciation starts on inServiceDate (which may differ from purchaseDate).
 *   - Elapsed time is counted in COMPLETED monthly anniversaries.
 *   - Elapsed months are clamped to [0, usefulLifeMonths].
 *   - Book value never falls below salvage value.
 *   - Full precision is kept internally; rounding happens only on output.
 *     Never multiply a rounded monthly figure to get accumulated depreciation.
 *
 * Arithmetic is done in integer cents to avoid binary floating-point drift,
 * which is the JS equivalent of the brief's use of Decimal.
 *
 * NOTE ON OWNERSHIP: once the backend exists, the API returns these figures and
 * the UI simply displays them. This module stays for the live preview in the
 * add-asset form and as a cross-check. The server is always the authority.
 */

const toCents = (value) => {
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
};

export class DepreciationInputError extends Error {}

export function completedMonthsBetween(startISO, asOfISO) {
  const start = new Date(`${startISO}T00:00:00Z`);
  const asOf = new Date(`${asOfISO}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(asOf.getTime())) {
    throw new DepreciationInputError('Dates must be valid ISO dates (YYYY-MM-DD).');
  }
  let months =
    (asOf.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - start.getUTCMonth());
  if (asOf.getUTCDate() < start.getUTCDate()) months -= 1;
  return months;
}

export function calculateDepreciation({
  purchaseValue,
  salvageValue,
  usefulLifeMonths,
  inServiceDate,
  asOfDate = new Date().toISOString().slice(0, 10),
}) {
  const cost = toCents(purchaseValue);
  const salvage = toCents(salvageValue);

  if (cost === null || salvage === null) {
    throw new DepreciationInputError('Financial values must be finite numbers.');
  }
  if (cost < 0 || salvage < 0) {
    throw new DepreciationInputError('Values cannot be negative.');
  }
  if (salvage > cost) {
    throw new DepreciationInputError('Salvage value cannot exceed purchase value.');
  }
  if (!Number.isInteger(usefulLifeMonths) || usefulLifeMonths <= 0) {
    throw new DepreciationInputError('Useful life must be a whole number of months above zero.');
  }

  const rawElapsed = completedMonthsBetween(inServiceDate, asOfDate);
  const elapsedMonths = Math.max(0, Math.min(rawElapsed, usefulLifeMonths));

  const depreciableCents = cost - salvage;
  const monthlyCents = depreciableCents / usefulLifeMonths; // kept fractional
  const accumulatedCents = monthlyCents * elapsedMonths;
  const bookValueCents = Math.max(salvage, cost - accumulatedCents);

  const money = (cents) => (Math.round(cents) / 100).toFixed(2);

  return {
    elapsedMonths,
    monthlyDepreciation: money(monthlyCents),
    annualDepreciation: money(monthlyCents * 12),
    accumulatedDepreciation: money(accumulatedCents),
    currentBookValue: money(bookValueCents),
    percentOfLifeUsed: Math.round((elapsedMonths / usefulLifeMonths) * 100),
    estimatedReplacementDate: addMonths(inServiceDate, usefulLifeMonths),
  };
}

export function addMonths(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const targetDay = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(targetDay, lastDay));
  return d.toISOString().slice(0, 10);
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Returns null when inputs are incomplete, so the form can stay quiet. */
export function tryCalculateDepreciation(input) {
  try {
    if (
      input.purchaseValue === '' ||
      input.salvageValue === '' ||
      !input.inServiceDate ||
      !input.usefulLifeMonths
    ) {
      return { result: null, error: null };
    }
    return { result: calculateDepreciation(input), error: null };
  } catch (err) {
    if (err instanceof DepreciationInputError) return { result: null, error: err.message };
    throw err;
  }
}

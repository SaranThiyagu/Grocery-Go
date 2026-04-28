/**
 * Pure helpers for rule-based business insights (Phase A1).
 * No external dependencies — all functions are deterministic and SSR-safe.
 */

export type InsightSeverity = 'critical' | 'warning' | 'info';

export interface Insight {
    id: string;
    type:
        | 'stuck_order'
        | 'overdue_delivery'
        | 'reorder_due'
        | 'dormant_wholesale';
    severity: InsightSeverity;
    title: string;
    detail: string;
    why: string;
    actionLabel: string;
    actionHref: string;
    contactPhone?: string | null;
    createdAt: string; // ISO
}

/** Local YYYY-MM-DD (avoid UTC drift). */
export function localDateString(d: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Days between two dates (b - a), in calendar days, ignoring time. */
export function daysBetween(a: Date, b: Date): number {
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / 86_400_000);
}

/** Hours since a given timestamp. */
export function hoursSince(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}

/** Median of a numeric array. Returns null for empty arrays. */
export function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * Given a sorted-ascending list of order timestamps for a single customer,
 * returns the median gap in days between consecutive orders.
 * Requires at least 3 orders to be statistically meaningful.
 */
export function medianOrderGapDays(orderDatesAsc: Date[]): number | null {
    if (orderDatesAsc.length < 3) return null;
    const gaps: number[] = [];
    for (let i = 1; i < orderDatesAsc.length; i++) {
        gaps.push(daysBetween(orderDatesAsc[i - 1], orderDatesAsc[i]));
    }
    return median(gaps);
}

/**
 * Reorder rule:
 *   - Need ≥3 historical orders to compute a meaningful cycle.
 *   - currentGap ≥ 1.0 × median  → "due"
 *   - currentGap ≥ 1.3 × median  → "overdue"
 */
export function classifyReorder(
    currentGapDays: number,
    medianGap: number,
): 'due' | 'overdue' | null {
    if (medianGap <= 0) return null;
    const ratio = currentGapDays / medianGap;
    if (ratio >= 1.3) return 'overdue';
    if (ratio >= 1.0) return 'due';
    return null;
}

/**
 * Dormant rule by segment:
 *   - wholesale: 30+ days since last order
 *   - retail:    60+ days since last order
 * Returns null if customer has never ordered (handled separately as "no first order").
 */
export function classifyDormant(
    daysSinceLastOrder: number,
    customerType: string | null | undefined,
): 'dormant' | null {
    const threshold = customerType === 'wholesale' ? 30 : 60;
    return daysSinceLastOrder >= threshold ? 'dormant' : null;
}

/** WhatsApp deep link from an Indian mobile number. Falls back gracefully. */
export function whatsappLink(mobile: string | null | undefined, message?: string): string | null {
    if (!mobile) return null;
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10) return null;
    const intl = digits.length === 10 ? `91${digits}` : digits;
    const text = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${intl}${text}`;
}

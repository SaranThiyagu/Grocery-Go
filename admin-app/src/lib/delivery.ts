// Delivery scheduling helpers shared across admin UI and notifications.

export type DeliverySlot = 'Morning' | 'Afternoon' | 'Evening';

export const DELIVERY_SLOTS: { value: DeliverySlot; label: string; range: string }[] = [
    { value: 'Morning', label: 'Morning', range: '8:00 AM – 12:00 PM' },
    { value: 'Afternoon', label: 'Afternoon', range: '12:00 PM – 4:00 PM' },
    { value: 'Evening', label: 'Evening', range: '4:00 PM – 8:00 PM' },
];

export function isDeliverySlot(value: unknown): value is DeliverySlot {
    return value === 'Morning' || value === 'Afternoon' || value === 'Evening';
}

export function formatDeliverySlot(slot?: string | null): string {
    if (!slot) return '';
    const found = DELIVERY_SLOTS.find((s) => s.value === slot);
    return found ? `${found.label} (${found.range})` : slot;
}

/** Returns YYYY-MM-DD for the given Date in local time. */
export function toDateInputValue(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function todayDateInputValue(): string {
    return toDateInputValue(new Date());
}

function startOfLocalDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

/**
 * True when a delivery date has already passed and the order is not yet
 * marked as Delivered.
 */
export function isDeliveryOverdue(
    deliveryDate?: string | null,
    status?: string | null,
): boolean {
    if (!deliveryDate || !status) return false;
    if (status === 'Delivered') return false;
    const target = startOfLocalDay(new Date(deliveryDate));
    const today = startOfLocalDay(new Date());
    return target.getTime() < today.getTime();
}

/**
 * Returns a friendly relative label like "Today", "Tomorrow", "Overdue", or
 * a formatted date (e.g. "12 May 2026").
 */
export function relativeDeliveryLabel(
    deliveryDate?: string | null,
    status?: string | null,
): string {
    if (!deliveryDate) return 'Unassigned';
    const target = startOfLocalDay(new Date(deliveryDate));
    const today = startOfLocalDay(new Date());
    const diffDays = Math.round(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (status !== 'Delivered' && diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
    return target.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDeliveryDate(deliveryDate?: string | null): string {
    if (!deliveryDate) return '';
    const d = new Date(deliveryDate);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

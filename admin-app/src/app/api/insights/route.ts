import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import {
    type Insight,
    classifyDormant,
    classifyReorder,
    daysBetween,
    hoursSince,
    medianOrderGapDays,
    whatsappLink,
} from '@/lib/insights';

export const dynamic = 'force-dynamic';

const STUCK_ORDER_HOURS = 4;

// ── GET /api/insights ────────────────────────────────────────────
// Returns the full Tier-1 rule-based alert feed.
// Pure SQL/JS over existing data — no schema changes, no LLM.
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        // Fetch all orders + customer summary in one round trip.
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                id,
                status,
                created_at,
                delivery_date,
                customer_id,
                customers ( id, full_name, store_name, mobile_no, customer_type, status )
            `)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[insights] supabase error:', error);
            return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
        }

        const insights: Insight[] = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Bucket orders per customer for reorder/dormant analysis.
        type CustomerSummary = {
            id: string;
            fullName: string;
            storeName: string | null;
            mobileNo: string | null;
            customerType: string | null;
            status: string | null;
            orderDates: Date[];
        };
        const customerMap = new Map<string, CustomerSummary>();

        for (const order of orders ?? []) {
            const status = (order.status || '').toLowerCase();
            const createdAt = order.created_at as string;
            const cust = (order as any).customers as CustomerSummary | null;

            // ── Rule 1: Stuck Order (Ordered > 4h) ─────────────────
            if (status === 'ordered' && hoursSince(createdAt) >= STUCK_ORDER_HOURS) {
                const age = hoursSince(createdAt);
                insights.push({
                    id: `stuck-${order.id}`,
                    type: 'stuck_order',
                    severity: age >= 24 ? 'critical' : 'warning',
                    title: `Order #${order.id} unconfirmed for ${age}h`,
                    detail: cust?.full_name
                        ? `${cust.full_name}${cust.store_name ? ` · ${cust.store_name}` : ''}`
                        : 'Customer record missing',
                    why: `Ordered ${age} hours ago and still pending confirmation. SLA target is ${STUCK_ORDER_HOURS}h.`,
                    actionLabel: 'Confirm order',
                    actionHref: `/admin/orders/${order.id}`,
                    contactPhone: cust?.mobile_no ?? null,
                    createdAt,
                });
            }

            // ── Rule 2: Overdue Delivery ─────────────────────────
            if (status === 'confirmed' && order.delivery_date) {
                const due = new Date(order.delivery_date as string);
                due.setHours(0, 0, 0, 0);
                if (due.getTime() < today.getTime()) {
                    const overdueDays = daysBetween(due, today);
                    insights.push({
                        id: `overdue-${order.id}`,
                        type: 'overdue_delivery',
                        severity: overdueDays >= 2 ? 'critical' : 'warning',
                        title: `Delivery overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
                        detail: cust?.full_name
                            ? `Order #${order.id} · ${cust.full_name}${cust.store_name ? ` · ${cust.store_name}` : ''}`
                            : `Order #${order.id}`,
                        why: `Scheduled for ${order.delivery_date} but not yet delivered.`,
                        actionLabel: 'Reschedule or deliver',
                        actionHref: `/admin/orders/${order.id}`,
                        contactPhone: cust?.mobile_no ?? null,
                        createdAt,
                    });
                }
            }

            // Build per-customer history (skip cancelled orders)
            if (cust && cust.id && status !== 'cancelled') {
                const existing = customerMap.get(cust.id);
                if (existing) {
                    existing.orderDates.push(new Date(createdAt));
                } else {
                    customerMap.set(cust.id, {
                        id: cust.id,
                        fullName: cust.full_name || 'Customer',
                        storeName: cust.store_name ?? null,
                        mobileNo: cust.mobile_no ?? null,
                        customerType: cust.customer_type ?? null,
                        status: cust.status ?? null,
                        orderDates: [new Date(createdAt)],
                    });
                }
            }
        }

        // ── Rule 3: Reorder Due (≥3 orders, currentGap ≥ median) ─
        // ── Rule 4: Dormant Wholesale (≥30d) / Retail (≥60d) ─────
        for (const c of customerMap.values()) {
            if (c.status !== 'active') continue;
            const sorted = c.orderDates.sort((a, b) => a.getTime() - b.getTime());
            const lastOrder = sorted[sorted.length - 1];
            const gap = daysBetween(lastOrder, today);

            const dormant = classifyDormant(gap, c.customerType);
            if (dormant && c.customerType === 'wholesale') {
                insights.push({
                    id: `dormant-${c.id}`,
                    type: 'dormant_wholesale',
                    severity: gap >= 60 ? 'critical' : 'warning',
                    title: `${c.fullName} hasn't ordered in ${gap} days`,
                    detail: c.storeName ? `${c.storeName} · Wholesale` : 'Wholesale account',
                    why: `Wholesale accounts typically reorder within 30 days. Last order was ${gap} days ago.`,
                    actionLabel: 'Reach out',
                    actionHref: `/admin/customers/${c.id}/edit`,
                    contactPhone: c.mobileNo,
                    createdAt: lastOrder.toISOString(),
                });
                continue; // don't double-flag as reorder_due
            }

            const medianGap = medianOrderGapDays(sorted);
            if (medianGap !== null) {
                const klass = classifyReorder(gap, medianGap);
                if (klass) {
                    insights.push({
                        id: `reorder-${c.id}`,
                        type: 'reorder_due',
                        severity: klass === 'overdue' ? 'warning' : 'info',
                        title: `${c.fullName} ${klass === 'overdue' ? 'is overdue' : 'is due'} for a reorder`,
                        detail: c.storeName
                            ? `${c.storeName} · ${c.customerType ?? 'retail'}`
                            : (c.customerType ?? 'retail'),
                        why: `Usually orders every ~${Math.round(medianGap)} days. Last order was ${gap} days ago.`,
                        actionLabel: 'Send WhatsApp',
                        actionHref:
                            whatsappLink(
                                c.mobileNo,
                                `Hi ${c.fullName.split(' ')[0]}, hope you're doing well! Would you like to place your usual order?`,
                            ) || `/admin/customers/${c.id}/edit`,
                        contactPhone: c.mobileNo,
                        createdAt: lastOrder.toISOString(),
                    });
                }
            }
        }

        // Sort by severity then recency.
        const severityRank: Record<Insight['severity'], number> = {
            critical: 0, warning: 1, info: 2,
        };
        insights.sort((a, b) => {
            const s = severityRank[a.severity] - severityRank[b.severity];
            if (s !== 0) return s;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json({
            generatedAt: new Date().toISOString(),
            counts: {
                total: insights.length,
                stuckOrder: insights.filter(i => i.type === 'stuck_order').length,
                overdueDelivery: insights.filter(i => i.type === 'overdue_delivery').length,
                reorderDue: insights.filter(i => i.type === 'reorder_due').length,
                dormantWholesale: insights.filter(i => i.type === 'dormant_wholesale').length,
            },
            insights,
        });
    } catch (e) {
        console.error('[insights] unexpected error:', e);
        return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
    }
}

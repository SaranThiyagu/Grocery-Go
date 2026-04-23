import { ChevronRight, ChevronLeft, Inbox, FileCheck, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type Order, StatusBadge } from './OrderDrawer';

interface OrdersTableProps {
  orders: Order[];
  allOrdersCount: number;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOrderClick: (order: Order) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function OrdersTable({ orders, allOrdersCount, filteredCount, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, onOrderClick }: OrdersTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Order</th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Customer</th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Items</th>
              <th className="text-right text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Qty</th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Status</th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Date</th>
              <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-2 py-3">Bill</th>
              <th className="px-5 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <tr
                    key={order.id}
                    onClick={() => onOrderClick(order)}
                    className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70 cursor-pointer transition-all duration-150"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-mono font-semibold text-slate-900">#{order.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">
                            {order.userName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-900 truncate max-w-[140px]">{order.userName}</p>
                          {order.customerStoreName ? (
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{order.customerStoreName}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{order.customerMobile || order.userEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[13px] text-slate-700 truncate max-w-[200px]">{order.items[0]?.productName || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400">
                          {order.items.length > 1 ? `+${order.items.length - 1} more · ` : ''}{totalQty} qty
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-slate-900">{totalQty}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-slate-400">{formatRelativeDate(order.createdAt)}</span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      {order.invoiceUrl ? (
                        <span title="Invoice uploaded" className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60">
                          <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-150" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden">
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <div
                  key={order.id}
                  onClick={() => onOrderClick(order)}
                  className="px-5 py-4 hover:bg-slate-50/70 cursor-pointer active:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-indigo-600">
                          {order.userName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900">{order.userName}</p>
                        <p className="text-[11px] text-slate-400">#{order.id} · {formatRelativeDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="flex items-center justify-between ml-[42px]">
                    <div className="text-[12px] text-slate-500">
                      {order.items[0]?.productName}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''} · {totalQty} qty
                    </div>
                    <div className="flex items-center gap-2.5">
                      {order.invoiceUrl && (
                        <span title="Invoice uploaded" className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200/60">
                          <FileCheck className="h-3 w-3 text-emerald-600" />
                        </span>
                      )}
                      <span className="text-[13px] font-semibold tabular-nums text-slate-900">{totalQty} qty</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with Pagination */}
      {filteredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <p className="text-[12px] text-slate-400">
              Showing{' '}
              <span className="font-medium text-slate-600">
                {Math.min((currentPage - 1) * pageSize + 1, filteredCount)}–{Math.min(currentPage * pageSize, filteredCount)}
              </span>{' '}
              of <span className="font-medium text-slate-600">{filteredCount}</span>
              {filteredCount !== allOrdersCount && (
                <span className="text-slate-300"> (filtered from {allOrdersCount})</span>
              )}
            </p>
            <div className="hidden sm:flex items-center gap-1.5">
              <label className="text-[11px] text-slate-400">Rows:</label>
              <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className="h-7 text-[11px] px-1.5 pr-6 rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {generatePageNumbers(currentPage, totalPages).map((page, i) =>
                page === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-slate-300">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Generate smart page number array with ellipsis
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Inbox className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-[14px] font-medium text-slate-600 mb-1">No orders found</p>
      <p className="text-[12px] text-slate-400 text-center max-w-[240px]">
        Try adjusting your search or filter to find what you&apos;re looking for.
      </p>
    </div>
  );
}

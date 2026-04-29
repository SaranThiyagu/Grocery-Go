import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  deliveryFilter?: string;
  onDeliveryFilterChange?: (value: string) => void;
}

const statusPills = [
  { value: 'ordered', label: 'Ordered', activeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'confirmed', label: 'Confirmed', activeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'delivered', label: 'Delivered', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', activeClass: 'bg-red-100 text-red-700 border-red-200' },
];

export default function FilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  deliveryFilter = 'all',
  onDeliveryFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
      {/* Left: Search + Status Pills */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
          <Input
            placeholder="Search orders, customers, or products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-14 h-9 text-[13px] bg-slate-50/80 border-slate-200/60 shadow-none rounded-lg focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ⌘ K
          </kbd>
        </div>

        {/* Status dropdown (mobile) */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="sm:hidden w-full h-9 text-[13px] border-slate-200/60 shadow-none bg-slate-50/80 rounded-lg text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Status pills (desktop) */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Select value={statusFilter === 'all' ? 'all' : statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-8 text-[12px] border-slate-200/60 shadow-none bg-white rounded-lg text-slate-600 gap-1 px-2.5 w-auto">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {statusPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => onStatusFilterChange(statusFilter === pill.value ? 'all' : pill.value)}
              className={`
                h-8 px-3 text-[12px] font-medium rounded-lg border transition-all cursor-pointer
                ${statusFilter === pill.value
                  ? pill.activeClass
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }
              `}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Sort + Filters */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {onDeliveryFilterChange && (
          <Select value={deliveryFilter} onValueChange={onDeliveryFilterChange}>
            <SelectTrigger className="w-full sm:w-auto h-9 text-[13px] border-slate-200/60 shadow-none bg-white rounded-lg text-slate-600 gap-1.5 px-3">
              <span className="text-slate-400 text-[12px]">Delivery:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-auto h-9 text-[13px] border-slate-200/60 shadow-none bg-white rounded-lg text-slate-600 gap-1.5 px-3">
            <span className="text-slate-400 text-[12px]">Sort:</span>
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="delivery_soonest">Delivery: Soonest</SelectItem>
            <SelectItem value="delivery_latest">Delivery: Latest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

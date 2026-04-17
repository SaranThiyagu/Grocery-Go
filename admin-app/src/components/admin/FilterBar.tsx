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
}

export default function FilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
      {/* Left: Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
        <Input
          placeholder="Search by order, customer, or product..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-[13px] bg-slate-50/80 border-slate-200/60 shadow-none rounded-lg focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
        />
      </div>

      {/* Right: Filters + Sort */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-[13px] border-slate-200/60 shadow-none bg-slate-50/80 rounded-lg text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[130px] h-9 text-[13px] border-slate-200/60 shadow-none bg-slate-50/80 rounded-lg text-slate-600">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="amount-high">Amount ↑</SelectItem>
            <SelectItem value="amount-low">Amount ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

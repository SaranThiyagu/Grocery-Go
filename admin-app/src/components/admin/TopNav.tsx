'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShoppingBag,
  Package,
  Users,
  Bell,
  LogOut,
  ChevronDown,
  Ruler,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TopNavProps {
  currentUser: { email: string; displayName: string } | null;
}

const navItems = [
  { label: 'Orders', href: '/admin', icon: ShoppingBag },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Sizes', href: '/admin/category-sizes', icon: Ruler },
];

export default function TopNav({ currentUser }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/orders');
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-white/[0.06]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex justify-between items-center h-[52px]">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/admin')}>
              <div className="w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/25">
                <span className="text-white font-bold text-[10px] tracking-tight leading-none">OF</span>
              </div>
              <span className="text-[15px] font-semibold text-white tracking-[-0.01em]">OrderFlow</span>
            </div>

            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer
                      ${active
                        ? 'text-white bg-white/[0.1]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: User */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-slate-950" />
            </button>

            <div className="w-px h-5 bg-white/[0.08] mx-1" />

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
                    <Avatar className="h-6 w-6 ring-1 ring-white/10">
                      <AvatarFallback className="text-[10px] font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                        {currentUser.displayName?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-[13px] font-medium text-slate-300 max-w-[180px] truncate">
                      {currentUser.email}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-[13px] font-medium text-slate-900">{currentUser.displayName}</p>
                    <p className="text-[12px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

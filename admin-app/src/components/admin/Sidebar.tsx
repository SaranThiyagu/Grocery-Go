'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Ruler,
  Settings, LogOut, Bell, Menu, Search,
  PanelLeftClose, ChevronRight, Moon,
} from 'lucide-react';

// ── Navigation Config ──────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  countKey?: string;
};

type NavSection =
  | { type: 'section'; title?: string; items: NavItem[] }
  | { type: 'divider' };

const navigation: NavSection[] = [
  {
    type: 'section',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Orders', href: '/admin', icon: ShoppingBag, countKey: 'orders' },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Sizes', href: '/admin/category-sizes', icon: Ruler },
    ],
  },
];

// ── Component ──────────────────────────────────────────────
export default function Sidebar({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') setCollapsed(true);
    } catch {}

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          email: user.email || '',
          displayName: user.email?.split('@')[0] || 'Admin',
        });
      }
    });

    // Fetch order count for badge
    fetch('/api/orders').then(r => r.json()).then((orders: unknown[]) => {
      if (Array.isArray(orders)) setOrderCount(orders.length);
    }).catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/orders');
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard';
    if (href.startsWith('#')) return false;
    return pathname.startsWith(href);
  };

  const handleNav = (href: string) => {
    if (href.startsWith('#')) return;
    router.push(href);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getBadgeCount = (key?: string) => {
    if (key === 'orders') return orderCount > 0 ? orderCount : null;
    return null;
  };

  // ── Shared sidebar content ────────────────────────────────
  const sidebarContent = (mobile: boolean) => {
    const isCollapsed = collapsed && !mobile;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Logo */}
        <div className={`flex items-center h-16 flex-shrink-0 ${isCollapsed ? 'justify-center px-3' : 'px-5'}`}>
          <button
            className={`flex items-center cursor-pointer ${isCollapsed ? 'gap-0' : 'gap-2.5'}`}
            onClick={() => handleNav('/admin')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <span className="text-white font-bold text-[11px] tracking-tight">GG</span>
            </div>
            {!isCollapsed && (
              <span className="text-[16px] font-semibold text-slate-900 tracking-[-0.02em]">Grocery-Go</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto sidebar-scroll-light">
          {navigation.map((section, sIdx) => {
            if (section.type === 'divider') {
              return <div key={`div-${sIdx}`} className={`border-t border-slate-100 ${isCollapsed ? 'mx-1' : 'mx-2'}`} />;
            }
            return (
              <div key={section.title || `section-${sIdx}`}>
                {!isCollapsed && section.title && (
                  <p className="px-3 mb-2 text-[11px] font-medium text-slate-400">
                    {section.title}
                  </p>
                )}
                {isCollapsed && section.title && (
                  <div className="w-5 h-px bg-slate-100 mx-auto mb-3" />
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const disabled = item.href.startsWith('#');
                    const Icon = item.icon;
                    const count = getBadgeCount(item.countKey);
                    return (
                      <button
                        key={item.label}
                        onClick={() => !disabled && handleNav(item.href)}
                        title={isCollapsed ? item.label : undefined}
                        className={`
                          relative flex items-center w-full rounded-xl transition-all duration-150
                          ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}
                          ${active
                            ? 'bg-indigo-50 text-indigo-600'
                            : disabled
                              ? 'text-slate-400 cursor-default'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer'
                          }
                        `}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500" />
                        )}
                        <div className="relative flex-shrink-0">
                          <Icon className={`h-[18px] w-[18px] ${active ? 'text-indigo-600' : ''}`} />
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
                            {count !== null && (
                              <span className="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-indigo-500 text-white px-1.5">
                                {count}
                              </span>
                            )}
                            {item.badge && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.badgeColor === 'green'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0 px-3 pb-4">
          {/* Settings */}
          <div className="border-t border-slate-100 pt-3 mb-2">
            <button
              title={isCollapsed ? 'Settings' : undefined}
              className={`
                flex items-center w-full rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer
                ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}
              `}
            >
              <Settings className="h-[18px] w-[18px] flex-shrink-0" />
              {!isCollapsed && <span className="text-[13px] font-medium">Settings</span>}
            </button>
          </div>

          {/* User Profile */}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`
                    flex items-center w-full rounded-xl p-2 hover:bg-slate-50 transition-colors outline-none cursor-pointer
                    ${isCollapsed ? 'justify-center' : 'gap-2.5'}
                  `}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                      {currentUser.displayName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[12px] font-medium text-slate-900 truncate">{currentUser.displayName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={isCollapsed ? 'right' : 'top'} align={isCollapsed ? 'start' : 'end'} className="w-56">
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

          {/* Collapse/Expand button */}
          {!isCollapsed && !mobile && (
            <button
              onClick={toggleCollapsed}
              className="flex items-center gap-2 w-full mt-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-[13px] font-medium">Collapse</span>
            </button>
          )}
          {isCollapsed && !mobile && (
            <button
              onClick={toggleCollapsed}
              className="w-full mt-2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex justify-center"
              title="Expand sidebar"
            >
              <PanelLeftClose className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-slate-200/80 h-screen
          transition-[width] duration-300 ease-in-out
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        {sidebarContent(false)}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-slate-200/80">
          {/* Left */}
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] p-0 bg-white border-r border-slate-200 [&>button]:text-slate-400"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebarContent(true)}
              </SheetContent>
            </Sheet>
            <button
              className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={toggleCollapsed}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button className="lg:hidden flex items-center gap-2 cursor-pointer" onClick={() => handleNav('/admin')}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-[9px]">GG</span>
              </div>
              <span className="text-[14px] font-semibold text-slate-900">Grocery-Go</span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-red-500 text-white px-1">
                2
              </span>
            </button>
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Moon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC] pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
          <div className="flex items-center justify-around h-14">
            {[
              { label: 'Orders', href: '/admin', icon: ShoppingBag },
              { label: 'Customers', href: '/admin/customers', icon: Users },
              { label: 'Products', href: '/admin/products', icon: Package },
              { label: 'Sizes', href: '/admin/category-sizes', icon: Ruler },
            ].map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.href)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer
                    ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}
                  `}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

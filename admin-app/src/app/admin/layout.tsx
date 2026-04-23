import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Sidebar>{children}</Sidebar>;
}

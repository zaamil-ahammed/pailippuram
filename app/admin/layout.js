import AdminGate from '../../components/AdminGate';
import AdminErrorBoundary from '../../components/AdminErrorBoundary';

export const metadata = { title: 'Admin | Nammude Pailippuram', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <AdminErrorBoundary>
      <AdminGate>{children}</AdminGate>
    </AdminErrorBoundary>
  );
}

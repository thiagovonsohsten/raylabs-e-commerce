import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ProductsPage from '@/pages/Products';
import CheckoutPage from '@/pages/Checkout';
import MyOrdersPage from '@/pages/MyOrders';
import { useAuthStore } from '@/store/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </Layout>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import CustomerRoute from './components/CustomerRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerHello from './pages/CustomerHello'
import AdminLayout from './pages/AdminLayout'
import AdminProducts from './pages/AdminProducts'
import AdminInventory from './pages/AdminInventory'
import AdminOrders from './pages/AdminOrders'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/hello"
          element={
            <CustomerRoute>
              <CustomerHello />
            </CustomerRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

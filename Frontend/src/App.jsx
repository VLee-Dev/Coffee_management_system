import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import CustomerRoute from './components/CustomerRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import UserHome from './pages/UserHome'
import Developing from './pages/Developing'
import UserProfile from './pages/UserProfile'
import ShopPage from './pages/ShopPage'
import AdminLayout from './pages/AdminLayout'
import AdminProducts from './pages/AdminProducts'
import AdminInventory from './pages/AdminInventory'
import AdminOrders from './pages/AdminOrders'
import AdminProfile from './pages/AdminProfile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/hello" element={<Navigate to="/home" replace />} />
        <Route path="/hello/developing" element={<Navigate to="/home/developing" replace />} />
        <Route path="/hello/profile" element={<Navigate to="/home/profile" replace />} />
        <Route
          path="/home"
          element={
            <CustomerRoute>
              <UserHome />
            </CustomerRoute>
          }
        />
        <Route
          path="/home/developing"
          element={
            <CustomerRoute>
              <Developing />
            </CustomerRoute>
          }
        />
        <Route
          path="/home/profile"
          element={
            <CustomerRoute>
              <UserProfile />
            </CustomerRoute>
          }
        />
        <Route
          path="/home/coffee"
          element={
            <CustomerRoute>
              <ShopPage productType="coffee" />
            </CustomerRoute>
          }
        />
        <Route
          path="/home/equipment"
          element={
            <CustomerRoute>
              <ShopPage productType="equipment" />
            </CustomerRoute>
          }
        />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

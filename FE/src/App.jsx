import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/Home";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// MỚI NHẤT
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
// User Profile Layer
import ProfileLayout from "./components/layout/ProfileLayout";
import Overview from "./pages/profile/Overview";
import Orders from "./pages/profile/Orders";
import OrderDetail from "./pages/profile/OrderDetail";
import Addresses from "./pages/profile/Addresses";
import Reviews from "./pages/profile/Reviews";
import Notifications from "./pages/profile/Notifications";
import EditProfile from "./pages/profile/EditProfile";
import ChangePassword from "./pages/profile/ChangePassword";

// Info Pages
import FAQ from "./pages/FAQ";
import Policy from "./pages/Policy";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import Wishlist from "./pages/Wishlist";

// Auth Modules
import AuthLayout from "./components/layout/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ResetPassword from "./pages/auth/ResetPassword";
import SocialCallback from "./pages/auth/SocialCallback";

// Admin Modules
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/products/Products";
import ProductForm from "./pages/admin/products/ProductForm";
import AdminCategories from "./pages/admin/categories/Categories";
import CategoryForm from "./pages/admin/categories/CategoryForm";
import AdminOrders from "./pages/admin/order/Orders";
import AdminUsers from "./pages/admin/users/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminChats from "./pages/admin/chats/Chats";
import AdminBanners from "./pages/admin/banner/Banners";
import BannerForm from "./pages/admin/banner/BannerForm";
import AdminBrands from "./pages/admin/brands/Brands";
import BrandForm from "./pages/admin/brands/BrandForm";
import AdminVouchers from "./pages/admin/vouchers/Vouchers";
import VoucherForm from "./pages/admin/vouchers/VoucherForm";

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        {/* Other pages can be added gradually */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/sale" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/checkout/success" element={<OrderSuccess />} />
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Info Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/policy" element={<Policy />} />

        {/* User Pages via ProfileLayout */}
        <Route path="/profile" element={<ProfileLayout />}>
          <Route index element={<Overview />} />
          <Route path="edit" element={<EditProfile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderCode" element={<OrderDetail />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* Auth Routes - Dùng AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/verify-otp" element={<VerifyOtp />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/social/callback" element={<SocialCallback />} />
      </Route>

      {/* Admin Route - Giao diện Độc lập */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="categories/create" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="chats" element={<AdminChats />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="banners/create" element={<BannerForm />} />
        <Route path="banners/:id/edit" element={<BannerForm />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="brands/create" element={<BrandForm />} />
        <Route path="brands/:id/edit" element={<BrandForm />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="vouchers/create" element={<VoucherForm />} />
        <Route path="vouchers/:id/edit" element={<VoucherForm />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
    <ChatWidget />
    </>
  );
}

export default App;

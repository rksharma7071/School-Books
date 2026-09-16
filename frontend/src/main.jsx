import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { BookProvider } from './context/School.jsx'

import Product from './pages/admin/product/Product.jsx'
import AddProduct from './pages/admin/product/AddProduct.jsx'
import EditProduct from './pages/admin/product/EditProduct.jsx'
import Category from './pages/admin/category/Category.jsx'
import AddCategory from './pages/admin/category/AddCategory.jsx';
import EditCategory from './pages/admin/category/EditCategory.jsx'
import User from './pages/admin/user/User.jsx'
import AddUser from './pages/admin/user/AddUser.jsx'
import EditUser from './pages/admin/user/EditUser.jsx'
import General from './pages/admin/settings/General.jsx'
import Role from './pages/admin/settings/Role.jsx'
import Dashboard from './pages/admin/dashboard/Dashboard.jsx'
import Login from './pages/admin/auth/Login.jsx'
import Register from './pages/admin/auth/Register.jsx'
import Review from './pages/admin/review/Review.jsx'
import Cart from './pages/admin/cart/Cart.jsx'
import CartById from './pages/admin/cart/CartById.jsx'
import AddDiscount from './pages/admin/discount/AddDiscount.jsx'
import Discount from './pages/admin/discount/Discount.jsx'
import DiscountById from './pages/admin/discount/DiscountById.jsx'
import Payment from './pages/admin/payment/Payment.jsx'
import PaymentById from './pages/admin/payment/PaymentById.jsx'
import Order from './pages/admin/order/Order.jsx'
import OrderById from './pages/admin/order/OrderById.jsx'

import Base from './pages/frontend/Base.jsx'
import FReview from './pages/frontend/FReview.jsx'
import FCart from './pages/frontend/Cart.jsx'
import Home from './pages/frontend/Home.jsx'
import Contact from './pages/frontend/Contact.jsx'
import ProductById from './pages/frontend/ProductById.jsx'
import Checkout from './pages/frontend/Checkout.jsx'
import Profile from './pages/frontend/Profile.jsx'
import PersonalDetails from './pages/frontend/PersonalDetails.jsx'
import Addresses from './pages/frontend/Addresses.jsx'
import MyOrders from './pages/frontend/MyOrders.jsx'
import OrderDetails from './pages/frontend/OrderDetails.jsx'
import AddressList from './pages/frontend/AddressList.jsx'
import EditAddress from './pages/frontend/EditAddress.jsx'
import ChangePassword from './pages/frontend/ChangePassword.jsx'
import AddAddress from './pages/frontend/AddAddress.jsx'
import ResetPassword from './pages/frontend/ResetPassword.jsx'
import Categories from "./pages/frontend/Category.jsx";
import CategoryProducts from './pages/frontend/CategoryProducts.jsx'
import { editUser, getUsersData } from './data/user.js'
import { getProductsData, getProductById, getProductByHandle, editProductLoader } from './data/product.js'
import { getCart, getCartById, getCartData } from './data/cart.js'
import { getReview1, getReviewData } from './data/review.js'
import { getDiscount, getDiscountById } from './data/discount.js'
import { getPayment, getPaymentById } from './data/payment.js'
import { getOrder, getOrderById } from './data/order.js'
import { StrictMode } from 'react'
import NotFound from './components/frontend/NotFound.jsx'
// import { SpeedInsights } from "@vercel/speed-insights/react"
// import { Analytics } from "@vercel/analytics/react";
import { getProfile } from './data/profile.js'
import { getAddress, getAddressById } from './data/address.js'
import axiosInstance from './utils/axiosConfig.js'
import VerifyEmail from './components/frontend/VerifyEmail.jsx'
import ProtectedLogin from './routes/ProtectedLogin.jsx'
import { editCategoryLoader, getCategories, getCategoriesData, getCategoryById, getCategoryProducts } from './data/category.js'
import { searchProductsLoader } from './data/product.js'
import SearchResults from './pages/frontend/SearchResults.jsx'

window.axios = axiosInstance;


const router = createBrowserRouter([
  {
    path: "/",
    element: <Base />,
    children: [
      { path: "", element: <Home /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "categories/all", element: <Categories />, loader: getCategories },
      { path: "categories/:handle", element: <CategoryProducts />, loader: getCategoryProducts },
      { path: "cart", element: <FCart />, loader: getCartData },
      { path: "products/:handle", element: <ProductById />, loader: getProductByHandle },
      { path: "contact", element: <Contact /> },
      { path: "reviews", element: <FReview /> },
      { path: "checkout", element: <Checkout /> },
      { path: "search", element: <SearchResults />, loader: searchProductsLoader },
      { path: "reset-password", element: <ResetPassword /> },
      {
        path: "profile",
        element: <Profile />,
        children: [
          {
            index: true,
            element: <PersonalDetails />,
            loader: getProfile,
          },
          {
            path: "orders",
            element: <MyOrders />,
            loader: getProfile,
          },
          {
            path: "orders/:id",
            element: <OrderDetails />,
            loader: getOrderById,
          },
          {
            path: "address",
            element: <AddressList />,
            loader: getProfile,
          },
          {
            path: "address/new",
            element: <AddAddress />,
          },
          {
            path: "address/:id/edit",
            element: <EditAddress />,
            loader: getAddressById,
          },
          {
            path: "change-password",
            element: <ChangePassword />,
          },
        ],
      },
      // {
      //   path: "profile/address", element: <Profile />, loader: getProfile,
      // },
    ]
  },
  {
    element: <ProtectedLogin />,
    // errorElement: <NotFound />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    // errorElement: <NotFound />,
    children: [
      {
        path: `/${import.meta.env.VITE_ADMIN}`,
        element: <App />,
        // errorElement: <NotFound />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "products", element: <Product />, loader: getProductsData },
          { path: "products/add", element: <AddProduct /> },
          { path: "products/edit/:id", element: <EditProduct />, loader: editProductLoader },
          { path: "categories", element: <Category />, loader: getCategoriesData },
          { path: "categories/add", element: <AddCategory /> },
          { path: "categories/edit/:id", element: <EditCategory />, loader: editCategoryLoader },
          { path: "users", element: <User />, loader: getUsersData },
          { path: "users/add", element: <AddUser /> },
          { path: "users/edit/:id", element: <EditUser />, loader: editUser },
          { path: "general", element: <General /> },
          { path: "roles", element: <Role />, },
          { path: "review", element: <Review />, loader: getReviewData },
          { path: "cart", element: <Cart />, loader: getCart },
          { path: "cart/:id", element: <CartById />, loader: getCartById },
          { path: "discounts", element: <Discount />, loader: getDiscount },
          { path: "discounts/add", element: <AddDiscount /> },
          { path: "discounts/:id", element: <DiscountById />, loader: getDiscountById },
          { path: "payment", element: <Payment />, loader: getPayment },
          { path: "payment/:id", element: <PaymentById />, loader: getPaymentById },
          { path: "order", element: <Order />, loader: getOrder },
          { path: "order/:id", element: <OrderById />, loader: getOrderById },
        ]
      }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <BookProvider>
    {/* <StrictMode> */}
    <RouterProvider router={router} />
    {/* <SpeedInsights /> */}
    {/* <Analytics /> */}
    {/* </StrictMode> */}
  </BookProvider>
)

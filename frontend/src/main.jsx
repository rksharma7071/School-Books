import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Book from './pages/admin/Book.jsx'
import AddBook from './pages/admin/AddBook.jsx'
import Category from './pages/admin/Category.jsx'
import General from './pages/admin/General.jsx'
import User from './pages/admin/User.jsx'
import AddUser from './pages/admin/AddUser.jsx'
import Role from './pages/admin/Role.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import { BookProvider } from './context/School.jsx'
import Login from './pages/admin/Login.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Register from './pages/admin/Register.jsx'
import EditUser from './pages/admin/EditUser.jsx'
import EditBook from './pages/admin/EditBook.jsx'
import Review from './pages/admin/Review.jsx'
import Cart from './pages/admin/Cart.jsx'
import FCart from './pages/frontend/Cart.jsx'
import CartById from './pages/admin/CartById.jsx'
import Discount from './pages/admin/Discount.jsx'
import DiscountById from './pages/admin/DiscountById.jsx'
import { editUser } from './data/user.js'
import { getBookById } from './data/book.js'
import { getCart, getCartById } from './data/cart.js'
import { getReview1 } from './data/review.js'
import { getDiscount, getDiscountById } from './data/discount.js'
import AddDiscount from './pages/admin/AddDiscount.jsx'
import Payment from './pages/admin/Payment.jsx'
import PaymentById from './pages/admin/PaymentById.jsx'
import { getPayment, getPaymentById } from './data/payment.js'
import Base from './pages/frontend/Base.jsx'
import Home from './pages/frontend/Home.jsx'
import Contact from './pages/frontend/Contact.jsx'
import Order from './pages/admin/Order.jsx'
import { getOrder, getOrderById } from './data/order.js'
import OrderById from './pages/admin/OrderById.jsx'
import BookById from './pages/frontend/BookById.jsx'
import Checkout from './pages/frontend/Checkout.jsx'
import { StrictMode } from 'react'
import NotFound from './components/frontend/NotFound.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react";
import Profile from './pages/frontend/Profile.jsx'
import getProfile from './data/profile.js'
import PersonalDetails from './pages/frontend/PersonalDetails.jsx'
import Addresses from './pages/frontend/Addresses.jsx'
import MyOrders from './pages/frontend/MyOrders.jsx'
import OrderDetails from './pages/frontend/OrderDetails.jsx'
import AddressList from './pages/frontend/AddressList.jsx'
import EditAddress from './pages/frontend/EditAddress.jsx'
import ChangePassword from './pages/frontend/ChangePassword.jsx'
import AddAddress from './pages/frontend/AddAddress.jsx'
import ResetPassword from './pages/frontend/ResetPassword.jsx'
import { getAddress, getAddressById } from './data/address.js'


const router = createBrowserRouter([
  {
    path: "/",
    element: <Base />,
    // errorElement: <NotFound />,
    children: [
      { path: "", element: <Home /> },
      { path: "cart", element: <FCart /> },
      { path: "products/:id", element: <BookById />, loader: getBookById },
      { path: "contact", element: <Contact /> },
      { path: "checkout", element: <Checkout /> },
      { path: "reset-password", element: <ResetPassword /> },
      {
        path: "profile", element: <Profile />, loader: getProfile,
        children: [
          { index: true, element: <PersonalDetails />, loader: getProfile },
          { path: "orders", element: <MyOrders />, loader: getProfile },
          { path: "orders/:id", element: <OrderDetails />, loader: getOrderById },
          { path: "address", element: <AddressList />, loader: getProfile },
          { path: "address/new", element: <AddAddress />, loader: getProfile },
          { path: "address/:id/edit", element: <EditAddress />, loader: getAddressById },
          { path: "change-password", element: <ChangePassword />, loader: getProfile },
        ]
      },
      {
        path: "profile/address", element: <Profile />, loader: getProfile,
      },

    ]
  },
  { path: "/login", element: <Login />, errorElement: <NotFound />, },
  {
    path: "/register",
    element: <Register />,
    errorElement: <NotFound />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <NotFound />,
    children: [
      {
        path: `/${import.meta.env.VITE_ADMIN}`,
        element: <App />,
        errorElement: <NotFound />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "books", element: <Book /> },
          { path: "add-book", element: <AddBook /> },
          { path: "edit-book/:id", element: <EditBook />, loader: getBookById },
          { path: "categories", element: <Category /> },
          { path: "users", element: <User /> },
          { path: "add-user", element: <AddUser /> },
          { path: "edit-user/:id", element: <EditUser />, loader: editUser },
          { path: "general", element: <General /> },
          { path: "roles", element: <Role /> },
          { path: "review", element: <Review />, loader: getReview1 },
          { path: "cart", element: <Cart />, loader: getCart },
          { path: "cart/:id", element: <CartById />, loader: getCartById },
          { path: "discount", element: <Discount />, loader: getDiscount },
          { path: "add-discount", element: <AddDiscount /> },
          { path: "discount/:id", element: <DiscountById />, loader: getDiscountById },
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
    <StrictMode>
      <RouterProvider router={router} />
      <SpeedInsights />
      <Analytics />
    </StrictMode>
  </BookProvider>
)

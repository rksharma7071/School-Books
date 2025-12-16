import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Book from './pages/Book.jsx'
import AddBook from './pages/AddBook.jsx'
import Category from './pages/Category.jsx'
import General from './pages/General.jsx'
import User from './pages/User.jsx'
import Role from './pages/Role.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AddUser from './pages/AddUser.jsx'
import Test from './pages/Test.jsx'
import { BookProvider } from './context/School.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Register from './pages/Register.jsx'
import EditUser from './pages/EditUser.jsx'
import { editUser } from './data/user.js'
import EditBook from './pages/EditBook.jsx'
import { getBookById } from './data/book.js'
import Review from './pages/Review.jsx'
import { getReview, getReview1 } from './data/review.js'

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          {
            index: true,
            element: <Dashboard />
          },
          {
            path: "books",
            element: <Book />
          },
          {
            path: "add-book",
            element: <AddBook />
          },
          {
            path: "edit-book/:id",
            element: <EditBook />,
            loader: getBookById
          },
          {
            path: "categories",
            element: <Category />
          },
          {
            path: "users",
            element: <User />
          },
          {
            path: "add-user",
            element: <AddUser />
          },
          {
            path: "edit-user/:id",
            element: <EditUser />,
            loader: editUser
          },
          {
            path: "general",
            element: <General />
          },
          {
            path: "roles",
            element: <Role />
          },
          {
            path: "review",
            element: <Review />,
            loader: getReview1
          },
          {
            path: "review-status",
            element: <Review />
          },
        ]
      }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BookProvider>
      <RouterProvider router={router}></RouterProvider>
    </BookProvider>
  </StrictMode>,
)

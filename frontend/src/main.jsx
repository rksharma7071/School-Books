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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/books",
        element: <Book />
      },
      {
        path: "/add-book",
        element: <AddBook />
      },
      {
        path: "/categories",
        element: <Category />
      },
      {
        path: "/users",
        element: <User />
      },
      {
        path: "/add-user",
        element: <AddUser />
      },
      {
        path: "/general",
        element: <General />
      },
      {
        path: "/roles",
        element: <Role />
      },
    ]
  },
  {
    path:"/test",
    element:<Test/>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
    {/* <App /> */}
  </StrictMode>,
)

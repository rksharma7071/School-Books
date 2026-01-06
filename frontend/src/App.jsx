import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/admin/Header.jsx'
import SideMenu from './components/admin/SideMenu.jsx'
import Main from './components/admin/Main.jsx'

function App() {

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideMenu />
        <Main />
      </div>
    </div>
  )
}

export default App

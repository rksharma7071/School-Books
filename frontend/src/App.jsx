import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import SideMenu from './components/SideMenu'
import Main from './components/Main'

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

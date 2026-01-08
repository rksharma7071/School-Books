import { useContext, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/admin/Header.jsx'
import SideMenu from './components/admin/SideMenu.jsx'
import Main from './components/admin/Main.jsx'
import { BookContext } from './context/School.jsx'
import StatusMessage from './components/frontend/StatusMessage.jsx'
import Loading from './components/UI/Loading.jsx'
import { useNavigation } from 'react-router-dom'

function App() {
  const { toastConfig, showToast, setShowToast, loading } = useContext(BookContext);
  const navigation = useNavigation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideMenu />
        <Main />
      </div>
      {showToast && (
        <StatusMessage
          type={toastConfig.type}
          title={toastConfig.title}
          message={toastConfig.message}
          onClose={() => setShowToast(false)}
        />
      )}
      {(navigation.state === "loading" || loading) && <Loading />}

    </div>
  )
}

export default App

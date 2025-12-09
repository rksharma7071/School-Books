import React from 'react'
import { Outlet } from 'react-router-dom'

function Main() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* <div>Main</div> */}
      <Outlet />
    </main>
  )
}

export default Main
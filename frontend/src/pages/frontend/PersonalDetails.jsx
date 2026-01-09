import React from 'react'
import { useLoaderData } from 'react-router-dom'
import Info from '../../components/frontend/Info'
import { FiEdit } from 'react-icons/fi'

function PersonalDetails() {
  const { user } = useLoaderData() || {}
  // console.log("user: ",user);
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">
          Personal Information
        </h3>

        {/* Edit Profile (Future use) */}
        <button
          disabled
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Edit profile coming soon"
        >
          <FiEdit />
          Edit Profile
        </button>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
        <Info label="First Name" value={user?.first_name} />
        <Info label="Last Name" value={user?.last_name} />
        <Info label="Email" value={user?.email} />
        <Info label="Username" value={user?.username} />
        <Info label="Role" value={user?.role} />
        {/* <Info label="Account Status" value={user?.isActive ? 'Active' : 'Inactive'} /> */}
      </div>

      {/* Future edit note */}
      <p className="mt-4 text-sm text-gray-500">
        To update your personal details, click <b>Edit Profile</b> (coming soon).
      </p>
    </div>
  )
}

export default PersonalDetails
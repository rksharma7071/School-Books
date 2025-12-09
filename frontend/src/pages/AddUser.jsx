import React from 'react'

function AddUser() {
    return (
        <div className="w-full h-full p-4 sm:p-6 bg-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add User</h2>
                    {/* <p className="text-sm text-gray-500">Manage all school books and inventory.</p> */}
                </div>


            </div>

            <div className="bg-white border border-gray-200">
                <div className="overflow-x-auto">

                </div>
            </div>
        </div>
    )
}

export default AddUser
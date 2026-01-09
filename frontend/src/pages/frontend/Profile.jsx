import React, { useState } from 'react'
import { Link, Outlet, useLoaderData } from 'react-router-dom'
import ProfileSidebar from '../../components/frontend/ProfileSidebar';

function Profile() {
    return (
        <div className="bg-slate-100 py-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <ProfileSidebar />

                    <section className="md:col-span-3 bg-white rounded-lg shadow p-6">
                        <Outlet />
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Profile

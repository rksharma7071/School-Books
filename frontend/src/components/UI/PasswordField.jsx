import React from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

function PasswordField({ label, name, value, onChange, show, toggle }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>

            <div className="relative">
                <input
                    type={show ? 'text' : 'password'} 
                    name={name}
                    value={value}
                    onChange={onChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                    {show ? <FiEyeOff /> : <FiEye />}
                </button>
            </div>
        </div>
    )
}

export default PasswordField
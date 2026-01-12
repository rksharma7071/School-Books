import axios from 'axios';
import React, { useContext } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { BookContext } from '../../context/School';
import { FiPhone } from "react-icons/fi";

function AddressList() {
    const { address } = useLoaderData() || {}
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const deleteAddress = async (id) => {
        if (window.confirm("Do you want to delete this Address?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_API}/api/address/${id}`);
                setRender(true);
                setToastConfig({
                    type: "success",
                    message: "Address has been deleted successfully!",
                });
                setShowToast(true);
            } catch (error) {
                setToastConfig({
                    type: "error",
                    message: error.response?.data?.message || "Failed to update the Address. Please try again.",
                });
                setShowToast(true);
            }
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900">My Addresses</h3>
                <Link
                    to="new"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md
                   bg-blue-600 text-white text-sm font-medium
                   hover:bg-blue-700 transition"
                >
                    + Add New
                </Link>
            </div>

            {address?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {address.map((item) => (
                        <div
                            key={item._id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.fullName}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-2"><FiPhone className="text-gray-400" /> {item.phone}</p>
                                </div>

                                {item.isDefault && (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Default</span>
                                )}
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{item.address}</p>
                                <p>{item.city}, {item.state}</p>
                                <p>{item.country} - {item.pincode}</p>
                            </div>

                            <div className="flex justify-between items-center mt-5">
                                <Link to={`${item._id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
                                <button onClick={() => deleteAddress(item._id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No addresses found</p>
            )}
        </div>
    )
}

export default AddressList
import React, { useContext, useEffect, useState } from 'react'
import { BookContext } from '../context/School';
import { MdDelete } from 'react-icons/md';
import axios from "axios";

function ReviewTable({ render, setRender, isAllSelected, toggleSelectAll, toggleSelect, paginatedReviews, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;


    const publishReview = async (id) => {
        if (window.confirm("Do you want to update this Review?")) {
            await axios.patch(`/api/review/${id}`, { approved: true });
            setRender(true);
            alert("Review has been updated successfully!");
        }
    };

    const unpublishReview = async (id) => {
        if (window.confirm("Do you want to update this Review?")) {
            await axios.patch(`/api/review/${id}`, { approved: false });
            setRender(true);
            alert("Review has been updated successfully!");
        }
    };

    const deleteReview = async (id) => {
        if (window.confirm("Do you want to delete this Review?")) {
            await axios.delete(`/api/review/${id}`);
            setRender(true);
            alert("Review has been deleted successfully!");
        }
    };


    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">User Id</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Book Id</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Body</th>
                    {role != "student" && <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>}
                </tr>
            </thead>
            <tbody>
                {paginatedReviews.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No reviews found.</td>
                    </tr>
                ) : (
                    paginatedReviews.filter((user) => user.role != "admin").map((user) => {
                        const isSelected = selectedIds.includes(user._id);
                        return (
                            <tr key={user._id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{() => getUser(user.userId)}
                                    {user?.user?.username || "Loading..."}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {user?.book?.name || "Loading..."}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{user.title}</td>
                                <td className="px-4 py-3 text-gray-700">{user.body}</td>
                                <td className="px-4 py-3 w-30 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {user.approved == false &&
                                            <button
                                                onClick={() => publishReview(user._id)}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >Publish</button>
                                        }
                                        {user.approved == true &&
                                            <button
                                                onClick={() => unpublishReview(user._id)}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >Unpublish</button>
                                        }
                                        <button
                                            onClick={() => deleteReview(user._id)}
                                            className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            aria-label="Delete review"
                                        >
                                            <MdDelete className="text-base" />
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    )
}

export default ReviewTable
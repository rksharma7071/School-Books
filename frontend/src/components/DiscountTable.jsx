import React, { useContext, useEffect, useState } from 'react'
import { BookContext } from '../context/School';
import { MdDelete } from 'react-icons/md';
import axios from "axios";
import { Link } from 'react-router-dom';

function DiscountTable({ render, setRender, isAllSelected, toggleSelectAll, toggleSelect, paginatedDiscount, selectedIds }) {
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

  const deleteDiscount = async (id) => {  
    if (window.confirm("Do you want to delete this Review?")) {
      await axios.delete(`/api/discount/${id}`);
      setRender(true);
      alert("Discount has been deleted successfully!");
    }
  };


  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className="px-4 py-3 text-left"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></th>
          <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount Code</th>
          <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount Type</th>
          <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
          <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paginatedDiscount.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No reviews found.</td>
          </tr>
        ) : (
          paginatedDiscount.map((discount) => {
            const isSelected = selectedIds.includes(discount._id);
            return (
              <tr key={discount._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(discount._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></td>
                <td className="px-4 py-3 text-gray-900 font-medium">
                  <Link to={discount._id}>{discount?.discount_code || "Loading..."}</Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {discount?.discount_type[0].toUpperCase() + discount?.discount_type.slice(1) || "Loading..."}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {discount?.discount_type == "percentage" ? discount.amount + "%" : discount.amount + "₹"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      ${discount.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {discount.active ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 w-30 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {/* {discount.active == true &&
                      <button
                        onClick={() => publishReview(user._id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >Publish</button>
                    }
                    {discount.active == false &&
                      <button
                        onClick={() => unpublishReview(user._id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >Unpublish</button>
                    } */}
                    <button
                      onClick={() => deleteDiscount(discount._id)}
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

export default DiscountTable
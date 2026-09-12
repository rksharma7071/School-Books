import React, { useContext, useEffect, useState } from 'react'
import { BookContext } from '../../context/School.jsx';
import { MdDelete } from 'react-icons/md';
import axios from "axios";
import { Link } from 'react-router-dom';

function DiscountTable({ render, setRender, isAllSelected, toggleSelectAll, toggleSelect, paginatedDiscount, selectedIds }) {
  const { user, setToastConfig, setShowToast } = useContext(BookContext);
  const role = user?.role;


  const publishReview = async (id) => {
    if (!window.confirm("Do you want to update this review?")) return;

    try {
      await axios.patch(
        `${import.meta.env.VITE_API}/api/review/${id}`,
        { approved: true }
      );

      setRender(true);

      setToastConfig({
        type: "success",
        message: "Review has been approved successfully.",
      });
      setShowToast(true);
    } catch (error) {
      console.error("Review update failed:", error);

      setToastConfig({
        type: "error",
        message: error.response?.data?.message || "Failed to update the review. Please try again.",
      });
      setShowToast(true);
    }
  };


  const unpublishReview = async (id) => {
    if (window.confirm("Do you want to update this Review?")) {
      try {
        await axios.patch(`${import.meta.env.VITE_API}/api/review/${id}`, { approved: false });
        setRender(true);
        // alert("Review has been updated successfully!");
        setToastConfig({
          type: "success",
          message: "Review has been updated successfully!",
        });
        setShowToast(true);
      } catch (error) {
        setToastConfig({
          type: "error",
          message: error.response?.data?.message || "Failed to update the review. Please try again.",
        });
        setShowToast(true);
      }

    }
  };

  const deleteDiscount = async (id) => {
    if (window.confirm("Do you want to delete this Review?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API}/api/discount/${id}`);
        setRender(true);
        // alert("Discount has been deleted successfully!");
        setToastConfig({
          type: "success",
          message: "Discount has been deleted successfully!",
        });
      } catch (error) {
        setToastConfig({
          type: "error",
          message: error.response?.data?.message || "Failed to update the review. Please try again.",
        });
        setShowToast(true);
      }
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

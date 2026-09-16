import React, { useContext } from "react";
import { BookContext } from "../../context/School.jsx";
import { MdDelete } from "react-icons/md";
import axios from "axios";
import Review from "../frontend/Review.jsx";

function ReviewTable({
    render,
    setRender,
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedReviews,
    selectedIds,
}) {
    const { setToastConfig, setShowToast } = useContext(BookContext);
    
    const updateApproved = async (id, approved) => {
        const action = approved ? "publish" : "unpublish";
        if (!window.confirm(`Do you want to ${action} this review?`)) return;

        try {
            await axios.patch(
                `${import.meta.env.VITE_API}/api/review/${id}`,
                { approved },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setRender(true);
            setToastConfig({
                type: "success",
                message: `Review has been ${approved ? "published" : "unpublished"} successfully!`,
            });
            setShowToast(true);
        } catch (error) {
            console.error("updateApproved error:", error.response?.data || error);

            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    `Failed to ${action} the review. Please try again.`,
            });
            setShowToast(true);
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm("Do you want to delete this review?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API}/api/review/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setRender(true);
            setToastConfig({
                type: "success",
                message: "Review has been deleted successfully!",
            });
            setShowToast(true);
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to delete the review. Please try again.",
            });
            setShowToast(true);
        }
    };

    const truncateWords = (text, count = 10) => {
        if (!text) return "";
        const words = text.split(" ");
        return words.length > count ? words.slice(0, count).join(" ") + "..." : text;
    };

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 text-left">
                        <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" />
                    </th>
                    <th className="p-2 text-left font-semibold text-gray-700">User</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Book</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Title</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Body</th>
                    <th className="p-2 text-right font-semibold text-gray-700">Actions</th>
                </tr>
            </thead>
            <tbody>
                {paginatedReviews.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No reviews found.</td>
                    </tr>
                ) : (
                    paginatedReviews.map((review) => {
                        const isSelected = selectedIds.includes(review.id);
                        return (
                            <tr key={review.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4">
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(review.id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" />
                                </td>

                                <td className="p-2 text-gray-900 font-medium">
                                    {review.user?.name || "Unknown user"}
                                    <Review rating={review.rating} />
                                </td>

                                <td className="p-2 text-gray-700">
                                    {review.product?.title || review.productId?.title || review.product?.name || review.book?.title || review.book?.name || "Unknown book"}
                                </td>
                                <td className="p-2 text-gray-700">{review.title}</td>
                                <td className="p-2 text-gray-700">
                                    <span className="block md:hidden">{truncateWords(review.body, 10)}</span>
                                    <span className="hidden md:block">{review.body}</span>
                                </td>

                                <td className="p-2 w-30 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {review.approved === false && (
                                            <button
                                                onClick={() => updateApproved(review.id, true)}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                Publish
                                            </button>
                                        )}
                                        {review.approved === true && (
                                            <button
                                                onClick={() => updateApproved(review.id, false)}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                Unpublish
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteReview(review.id)}
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
    );
}

export default ReviewTable;
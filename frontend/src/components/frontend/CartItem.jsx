import { FaPlus, FaTrash } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";

function CartItem({ item, removeItemFromCart, updateQuantityByInput, updateQuantity }) {
    return (
        <div key={item._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img
                    src={item?.book?.coverImage}
                    alt={item?.book?.name}
                    className="h-full object-contain p-2"
                />
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item?.book?.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">by {item?.book?.author}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">₹{item?.book?.price}</span>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-500 rounded-lg px-2 py-1">
                        <button
                            onClick={() => updateQuantity(item?.bookId, -1)}
                            disabled={item.quantity === 1}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold
                                                        ${item.quantity === 1
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-200"
                                }`}
                        >
                            <FaMinus />
                        </button>

                        <input
                            type="number"
                            min={1}
                            max={item?.book?.stockQty}
                            value={item?.quantity}
                            onChange={(e) =>
                                updateQuantityByInput(item?.bookId, e.target.value)
                            }
                            className="w-12 text-center bg-white rounded-md text-sm py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <button
                            onClick={() => updateQuantity(item.bookId, 1)}
                            disabled={item?.quantity >= item?.book?.stockQty}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold
                                                        ${item?.quantity >= item?.book?.stockQty
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-200"
                                }`}
                        >
                            <FaPlus />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:w-28">
                <p className="text-sm font-semibold text-gray-900">₹{item?.book?.price * item.quantity}</p>

                <button
                    onClick={() => removeItemFromCart(item.bookId)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                    Remove
                </button>
            </div>
        </div>
    )
}

export default CartItem
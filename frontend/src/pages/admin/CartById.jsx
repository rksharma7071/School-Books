import axios from 'axios';
import { useContext } from 'react';
import { MdDelete } from 'react-icons/md';
import { useLoaderData, useNavigate } from 'react-router-dom'
import { BookContext } from '../../context/School';

function CartById() {
    const cart = useLoaderData();
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);
    
    
    const totalAmount = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.book.price, 0
    );

    const onDelete = async () => {
        try {
            if (window.confirm("Do you want to delete this Review?")) {
                const res = await axios.delete(`${import.meta.env.VITE_API}/api/cart/${cart._id}`);
                setToastConfig({
                    type: "success",
                    message: "Cart has been deleted successfully!",
                });
                setShowToast(true);
                navigate(`/${import.meta.env.VITE_ADMIN}/cart`)

            }
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error?.message || "Cart Delete Error",
            });
            setShowToast(true);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {cart.user.first_name} {cart.user.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{cart.user.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        {cart.user.role}
                    </span>
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-500">Cart Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ₹{totalAmount}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Cart Items ({cart.items.length})
                    </h3>
                </div>

                <div className="divide-y">
                    {cart.items.map((item) => (
                        <div
                            key={item._id}
                            className="flex gap-5 p-5 items-center"
                        >
                            <img
                                src={item.book.coverImage}
                                alt={item.book.name}
                                className="w-20 h-28 object-cover rounded-md border border-gray-200"
                            />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">
                                    {item.book.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.book.subject} • Class{" "}
                                    {item.book.classLevel}
                                </p>

                                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                                    <span>Qty: {item.quantity}</span>
                                    <span>₹{item.book.price} each</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                    ₹{item.quantity * item.book.price}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Created at{" "}
                    {new Date(cart.createdAt).toLocaleString()}
                </p>

                <button
                    onClick={() => onDelete(cart?.user?._id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                    <MdDelete />
                    Delete Cart
                </button>
            </div>
        </div>
    )
}

export default CartById
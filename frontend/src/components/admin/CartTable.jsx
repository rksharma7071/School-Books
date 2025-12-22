import React, { useContext, useEffect, useState } from 'react'
import { BookContext } from '../../context/School';
import { MdDelete } from 'react-icons/md';
import axios from "axios";
import { Link } from 'react-router-dom';

function CartTable({ paginatedCarts }) {
    const { user } = useContext(BookContext);
    const role = user?.role;


    return (
        <div className="space-y-6 p-3">
            {paginatedCarts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No carts found
                </div>
            )}

            {paginatedCarts.map((cart) => {
                const totalAmount = cart.items.reduce(
                    (sum, item) => sum + item.quantity * item.book.price,
                    0
                );

                return (
                    <Link 
                        to={cart._id}
                        className="rounded-xl border border-gray-200 bg-white overflow-hidden block"
                    >
                        <div className="flex items-center justify-between px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {cart.user?.username}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {cart.user?.email}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ₹{totalAmount}
                                </p>
                            </div>
                        </div>

                        {/* <div className="divide-y">
                            {cart.items.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex gap-4 px-5 py-4"
                                >
                                    <img
                                        src={item.book.coverImage}
                                        alt={item.book.name}
                                        className="w-16 h-20 object-cover rounded-md border border-gray-200"
                                    />

                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {item.book.name}
                                        </h4>

                                        <p className="text-xs text-gray-500">
                                            {item.book.subject} • Class{" "}
                                            {item.book.classLevel}
                                        </p>

                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            <span>
                                                ₹{item.book.price} each
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            ₹
                                            {item.quantity *
                                                item.book.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div> */}

                        {/* <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
                            <p className="text-xs text-gray-500">
                                Created at{" "}
                                {new Date(
                                    cart.createdAt
                                ).toLocaleString()}
                            </p>

                            <button
                                onClick={() => onDelete(cart._id)}
                                className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                            >
                                <MdDelete />
                                Delete Cart
                            </button>
                        </div> */}
                    </Link>
                );
            })}
        </div>
    )
}

export default CartTable
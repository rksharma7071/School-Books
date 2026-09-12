import React, { useContext, useEffect, useState } from 'react'
import { BookContext } from '../../context/School.jsx';
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
                const totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.book.price, 0 );

                return (
                    <Link 
                        key={cart._id}
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
                    </Link>
                );
            })}
        </div>
    )
}

export default CartTable

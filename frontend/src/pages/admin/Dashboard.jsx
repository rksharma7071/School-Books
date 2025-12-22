import React from "react";
import { Link } from "react-router-dom";

function Dashboard() {
    const stats = [
        { title: "Books", value: 128, url: "admin/books", color: "bg-blue-500" },
        { title: "Users", value: 542, url: "admin/users", color: "bg-indigo-500" },
        { title: "Orders", value: 76, url: "admin/order", color: "bg-emerald-500" },
        { title: "Cart Items", value: 34, url: "admin/cart", color: "bg-cyan-500" },
        { title: "Discounts", value: 12, url: "admin/discount", color: "bg-violet-500" },
        { title: "Payments", value: "₹1,24,500", url: "admin/payment", color: "bg-fuchsia-500" },
        { title: "Reviews", value: 98, url: "admin/review", color: "bg-green-500" },
    ];

    return (
        <div className="p-6 bg-white">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Dashboard Overview
            </h1>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item, index) => (
                    <Link
                    to={`/${item.url}`}
                        key={index}
                        className="bg-gray-100 rounded-xl shadow p-5 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-gray-500 text-sm">
                                {item.title}
                            </p>
                            <p className="text-2xl font-semibold text-gray-800">
                                {item.value}
                            </p>
                        </div>

                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${item.color}`}
                        >
                            {/* Icon placeholder */}
                            <span className="text-lg font-bold">
                                {item.title[0]}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity (Optional Section) */}
            <div className="mt-10 bg-gray-100 rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Recent Activity
                </h2>

                <ul className="space-y-3 text-sm text-gray-600">
                    <li>📘 New book added</li>
                    <li>🛒 Order #1023 placed</li>
                    <li>💳 Payment received</li>
                    <li>⭐ New review submitted</li>
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;

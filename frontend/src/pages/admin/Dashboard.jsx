import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
    const [counts, setCounts] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        axios
            .get(`${import.meta.env.VITE_API}/api/stats`, {
                signal: controller.signal,
            })
            .then(({ data }) => setCounts(data))
            .catch((e) => {
                if (!axios.isCancel(e)) {
                    console.error("Stats fetch failed:", e.message);
                    setError(true);
                }
            });

        return () => controller.abort();
    }, []);

    const ADMIN = import.meta.env.VITE_ADMIN;

    const stats = [
        { title: "Books",      key: "books",     url: `${ADMIN}/books`,    color: "bg-blue-500" },
        { title: "Users",      key: "users",     url: `${ADMIN}/users`,    color: "bg-indigo-500" },
        { title: "Orders",     key: "orders",    url: `${ADMIN}/order`,    color: "bg-emerald-500" },
        { title: "Cart Items", key: "carts",     url: `${ADMIN}/cart`,     color: "bg-cyan-500" },
        { title: "Discounts",  key: "discounts", url: `${ADMIN}/discount`, color: "bg-violet-500" },
        { title: "Payments",   key: "payments",  url: `${ADMIN}/payment`,  color: "bg-fuchsia-500" },
        { title: "Reviews",    key: "reviews",   url: `${ADMIN}/review`,   color: "bg-green-500" },
    ];

    const loading = !counts && !error;

    return (
        <div className="p-6 bg-white">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Dashboard Overview
            </h1>

            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Could not load dashboard stats. Please refresh the page.
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item) => (
                    <Link
                        to={`/${item.url}`}
                        key={item.key}
                        className="bg-gray-100 rounded-xl shadow p-5 flex items-center justify-between transition hover:shadow-md"
                    >
                        <div>
                            <p className="text-gray-500 text-sm">{item.title}</p>

                            {loading ? (
                                <div className="mt-1 h-7 w-12 bg-gray-200 rounded animate-pulse" />
                            ) : (
                                <p className="text-2xl font-semibold text-gray-800">
                                    {counts?.[item.key] ?? "—"}
                                </p>
                            )}
                        </div>

                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${item.color}`}
                        >
                            <span className="text-lg font-bold">{item.title[0]}</span>
                        </div>
                    </Link>
                ))}
            </div>

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

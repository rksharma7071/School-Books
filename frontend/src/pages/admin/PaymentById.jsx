import React from "react";
import { useLoaderData, useNavigate } from "react-router-dom";

function PaymentById() {
    const payment = useLoaderData();
    const navigate = useNavigate();

    const statusStyles = {
        paid: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-blue-100 text-blue-700",
    };

    const providerLabel = {
        stripe: "Stripe",
        paypal: "PayPal",
        razorpay: "Razorpay",
        shopify_payments: "Shopify Payments",
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Payment Details</h2>
                    <p className="text-sm text-gray-500">Payment ID: {payment._id}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >Back</button>
            </div>

            <div>
                <span
                    className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${statusStyles[payment.status]}`}
                >
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-xl p-4 bg-white space-y-2">
                    <h3 className="font-semibold">Payment Info</h3>
                    <p className="text-sm"><span className="text-gray-500">Provider:</span>{" "}{providerLabel[payment.provider]}</p>
                    <p className="text-sm"><span className="text-gray-500">Transaction ID:</span>{" "}<span className="font-medium">{payment.transactionId}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Currency:</span>{" "}{payment.currency}</p>
                    <p className="text-sm"><span className="text-gray-500">Created At:</span>{" "}{new Date(payment.createdAt).toLocaleString()}</p>
                </div>

                <div className="border border-gray-300 rounded-xl p-4 bg-white space-y-2">
                    <h3 className="font-semibold">Order Info</h3>
                    <p className="text-sm">
                        <span className="text-gray-500">Order ID:</span>{" "}{payment.orderId}</p>
                    <p className="text-sm">
                        <span className="text-gray-500">Amount:</span>{" "}
                        <span className="font-semibold">{payment.currency} {payment.amount}</span>
                    </p>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-6 text-center">
                <p className="text-gray-500 text-sm">Total Paid</p>
                <p className="text-3xl font-bold text-gray-900">{payment.currency} {payment.amount}</p>
            </div>
        </div>
    );
}

export default PaymentById;

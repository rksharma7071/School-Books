import React from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";

function PaymentById() {
  const payment = useLoaderData();
  const navigate = useNavigate();

  const statusStyles = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const providerLabel = {
    stripe: "Stripe",
    paypal: "PayPal",
    razorpay: "Razorpay",
    shopify_payments: "Shopify Payments",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
          <p className="text-sm text-gray-500">
            Transaction ID: <span className="font-medium">{payment.transactionId}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
        >
          ← Back
        </button>
      </div>

      {/* Status + Amount */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-semibold w-fit ${statusStyles[payment.status]}`}
        >
          {payment.status.toUpperCase()}
        </span>

        <div className="text-right">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{payment.amount}
          </p>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Payment Information</h3>
          <InfoRow label="Provider" value={providerLabel[payment.provider]} />
          <InfoRow label="Currency" value={payment.currency} />
          <InfoRow label="Created At" value={new Date(payment.createdAt).toLocaleString()} />
        </div>

        {/* Order Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Order Information</h3>
          <InfoRow label="Order Number" value={`#${payment.order.orderNumber}`} />
          <InfoRow label="Order Status" value={payment.order.status} />
          <InfoRow label="Subtotal" value={`₹${payment.order.subtotal}`} />
          <InfoRow label="Shipping" value={`₹${payment.order.shipping}`} />
          <InfoRow label="Total" value={`₹${payment.order.total}`} />
        </div>

        {/* User Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Customer Information</h3>
          <InfoRow label="Email" value={payment.user.email} />
          <InfoRow label="Role" value={payment.user.role} />
          <InfoRow label="User ID" value={payment.user._id} />
        </div>
      </div>

      {/* Ordered Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>

        <div className="divide-y">
          {payment.order.items.map((item) => (
            <div
              key={item.bookId._id}
              className="flex justify-between py-3 text-sm"
            >
              <div>
                <p className="font-medium text-gray-900">
                  <Link to={`/products/${item.bookId._id}`}>{item.bookId.name}</Link>
                </p>
                <p className="text-gray-500">
                  Qty: {item.quantity} × ₹{item.unit_price}
                </p>
              </div>
              <div className="font-semibold text-gray-800">
                ₹{item.total_price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug (optional – remove later) */}
      {/* <pre className="bg-gray-100 text-xs p-4 rounded-lg overflow-auto">
        {JSON.stringify(payment, null, 2)}
      </pre> */}
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <p className="text-sm flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </p>
);

export default PaymentById;

import React from "react";

function CartItem({
    item,
    busy,
    updateQuantity,
    updateQuantityByInput,
    removeItemFromCart,
}) {
    const name = item.product?.name ?? "Product";
    const image = item.product?.image ?? "/no-image.png";
    const unitPrice =
        item.product?.variant?.price ?? item.product?.price ?? 0;
    const options = item.product?.variant?.options
        ? Object.values(item.product.variant.options).join(" / ")
        : "";
    const maxQty = item.product?.variant?.inventory_quantity ?? 0;
    const unavailable = !item.available;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-[72px_1fr_auto_auto_auto] gap-4 items-center">
            <img
                src={image}
                alt={name}
                className="w-15 h-15 object-contain bg-gray-50 rounded-lg"
            />

            <div className="">
                <h3 className="font-medium text-gray-900 line-clamp-2">{name}</h3>
                {options && (<p className="text-xs text-gray-500 mt-0.5">{options}</p>)}
                <p className="text-sm text-gray-700 mt-1">₹{unitPrice} {item.quantity > 1 && <>× {item.quantity}</>}</p>

                {unavailable && (
                    <p className="text-xs text-red-600 mt-1">No longer available</p>
                )}


            </div>

            <div className="flex items-center gap-2 mt-3">
                <button
                    disabled={busy || unavailable || item.quantity <= 1}
                    onClick={() => updateQuantity(item.itemId, -1)}
                    className="w-8 h-8 rounded border border-gray-300 disabled:opacity-50"
                >
                    −
                </button>

                <input
                    type="number"
                    min={1}
                    max={maxQty || undefined}
                    value={item.quantity}
                    disabled={busy || unavailable}
                    onChange={(e) => updateQuantityByInput(item.itemId, e.target.value)}
                    className="w-14 text-center border border-gray-300 rounded"
                />

                <button
                    disabled={
                        busy ||
                        unavailable ||
                        (maxQty && item.quantity >= maxQty)
                    }
                    onClick={() => updateQuantity(item.itemId, 1)}
                    className="w-8 h-8 rounded border border-gray-300 disabled:opacity-50"
                >
                    +
                </button>
            </div>
            <div className="text-right font-semibold text-gray-900">₹{item.lineTotal ?? unitPrice * item.quantity}</div>
            <button
                disabled={busy}
                onClick={() => removeItemFromCart(item.itemId)}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
                Remove
            </button>
        </div>
    );
}

export default CartItem;
import React from "react";
import { IoClose } from "react-icons/io5";

function CartItem({ item, busy, updateQuantity, updateQuantityByInput, removeItemFromCart }) {
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-[64px_minmax(0,1fr)] gap-3 items-start sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-4 sm:items-center">
            <img
                src={image}
                alt={name}
                className="w-16 h-16 object-contain bg-gray-50 rounded-lg sm:w-[72px] sm:h-[72px]"
            />

            <div className="min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2">{name}</h3>
                {options && (
                    <p className="text-xs text-gray-500 mt-0.5">{options}</p>
                )}
                <p className="text-sm text-gray-700 mt-1">
                    ₹{unitPrice} {item.quantity > 1 && <>× {item.quantity}</>}
                </p>

                {unavailable && (
                    <p className="text-xs text-red-600 mt-1">No longer available</p>
                )}
            </div>

            <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:flex-nowrap sm:justify-end">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                        disabled={busy || unavailable || item.quantity <= 1}
                        onClick={() => updateQuantity(item.itemId, -1)}
                        className="px-4 py-1 text-lg"
                    >
                        −
                    </button>

                    {/* <input
                        type="number"
                        min={1}
                        max={maxQty || undefined}
                        value={item.quantity}
                        disabled={busy || unavailable}
                        onChange={(e) => updateQuantityByInput(item.itemId, e.target.value)}
                        className="w-12 sm:w-14 text-center border border-gray-300 rounded"
                    /> */}
                    <input
                        type="number"
                        min={1}
                        max={maxQty || undefined}
                        value={item.quantity}
                        disabled={busy || unavailable}
                        onChange={(e) => updateQuantityByInput(item.itemId, e.target.value)}
                        className="h-[-webkit-fill-available] w-12 sm:w-14 text-center border-0 rounded
                        focus:outline-none focus:ring-0 focus:ring-offset-0
                        [appearance:textfield]
                        [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                        disabled={
                            busy ||
                            unavailable ||
                            (maxQty && item.quantity >= maxQty)
                        }
                        onClick={() => updateQuantity(item.itemId, 1)}
                        className="px-4 py-1 text-lg"
                    >
                        +
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-3 sm:ml-0">
                    <div className="text-right font-semibold text-gray-900 whitespace-nowrap">
                        ₹{item.lineTotal ?? unitPrice * item.quantity}
                    </div>

                    <button
                        disabled={busy}
                        onClick={() => removeItemFromCart(item.itemId)}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap"
                    >
                        <IoClose />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CartItem;
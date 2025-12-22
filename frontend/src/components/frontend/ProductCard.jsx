import React from 'react'

function ProductCard({ book, addToCart, cartItems, setCartItems }) {

    const updateCartItem = (bookId, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(
                (item) => item.bookId === bookId
            );

            if (existingItem) {
                return prevItems.map((item) =>
                    item.bookId === bookId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prevItems, { bookId, quantity }];
        });
    };

    // const handleAddToCart = async (bookId) => {
    //     updateCartItem(bookId, 1);

    //     setTimeout(() => {
    //         addToCart(cartItems);
    //     }, 0);
    // };



    return (
        <div

            className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
        >
            <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                    src={book.coverImage}
                    alt={book.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{book.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-gray-900">₹{book.price}</span>
                    <button onClick={() => updateCartItem(book._id, 1)} className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">Add to Cart</button>
                </div>
            </div>
        </div >
    )
}

export default ProductCard
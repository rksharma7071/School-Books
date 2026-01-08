import React, { useEffect, useMemo, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { getCart } from '../../data/cart.js';
import CartTable from '../../components/admin/CartTable.jsx';

function Cart() {
    const loader = useLoaderData();
    const [carts, setCarts] = useState(loader || []);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [render, setRender] = useState(false);
    
    useEffect(() => {
        async function fetchCart() {
            const data = await getCart();
            setCarts(data);
            setRender(false);
        }

        if (render) {
            fetchCart();
        }
    }, [render]);

    const filteredReviews = useMemo(() => {
        const term = search?.toLowerCase();
        return carts.filter(
            (b) =>
                b.user.first_name?.toLowerCase().includes(term) ||
                b.book.title?.toLowerCase().includes(term)
        );
    }, [carts, search]);

    const totalPages = Math.max(1, Math.ceil(filteredReviews.length / rowsPerPage));

    const paginatedCarts = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredReviews.slice(start, start + rowsPerPage);
    }, [filteredReviews, currentPage, rowsPerPage, totalPages]);

    const allVisibleIds = paginatedCarts.map((b) => b._id || b._id);
    const isAllSelected =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
        }
    };

    const handlePaginationChange = (e) => {
        const value = Number(e.target.value);
        setRowsPerPage(value);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    const startIndex = filteredReviews.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredReviews.length);
    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Cart</h2>
                    {/* <p className="text-sm text-gray-500">Manage all school books and inventory.</p> */}
                </div>

                <div className="flex gap-2 w-full sm:w-auto bg-white">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by title, author, category..."
                        className="flex-1 sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* <Link to={'/add-book'} className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">+ Add Book</Link> */}
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} Cart(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <CartTable paginatedCarts={paginatedCarts} />
                </div>
            </div>
        </div>
    )
}

export default Cart
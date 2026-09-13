import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import UserTable from "../../components/admin/UserTable";
import { Link } from "react-router-dom";

function User() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [render, setRender] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchUsers = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API}/api/user`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        signal: controller.signal,
                    }
                );

                const apiUsers = res.data?.users || res.data?.data || [];
                setUsers(apiUsers);
            } catch (error) {
                if (axios.isCancel(error)) return;
                console.error("Error fetching users:", error.message);
            }
        };

        fetchUsers();
        return () => controller.abort();
    }, [render]);

    const filteredUsers = useMemo(() => {
        const term = (search || "").trim().toLowerCase();
        if (!term) return users;
        return users.filter(
            (user) =>
                user.email?.toLowerCase().includes(term) ||
                user.name?.toLowerCase().includes(term)
        );
    }, [users, search]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

    const paginatedUsers = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredUsers.slice(start, start + rowsPerPage);
    }, [filteredUsers, currentPage, rowsPerPage, totalPages]);

    const allVisibleIds = paginatedUsers.map((u) => u._id);
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
            setSelectedIds((prev) =>
                prev.filter((id) => !allVisibleIds.includes(id))
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...allVisibleIds]))
            );
        }
    };

    const handlePaginationChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNextPage = () =>
        setCurrentPage((p) => Math.min(totalPages, p + 1));

    const startIndex =
        filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredUsers.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        User
                    </h2>
                    <p className="text-sm text-gray-500">
                        Manage all school customers.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by email, name..."
                        className="flex-1 sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Link
                        to={`/${import.meta.env.VITE_ADMIN}/add-user`}
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                        Add User
                    </Link>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} user(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <UserTable
                        render={render}
                        setRender={setRender}
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedUsers={paginatedUsers}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                    />
                </div>

                <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={handlePaginationChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5 rows</option>
                            <option value={10}>10 rows</option>
                            <option value={20}>20 rows</option>
                            <option value={30}>30 rows</option>
                        </select>
                        <span className="hidden sm:inline">
                            {filteredUsers.length > 0
                                ? `Showing ${startIndex}–${endIndex} of ${filteredUsers.length} users`
                                : "Showing 0 of 0 users"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 
                                ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            Prev
                        </button>
                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">{Math.min(currentPage, totalPages)}</span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-700">{totalPages}</span>
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage >= totalPages
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default User;
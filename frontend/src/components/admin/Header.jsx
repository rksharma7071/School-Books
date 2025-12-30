import React, { useState, useRef, useEffect, useContext } from "react";
import { LuUserRound } from "react-icons/lu";
import { BookContext } from "../../context/School";
import { Link, useNavigate } from "react-router-dom";

function Header() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const { user, adminLogout } = useContext(BookContext);
    const navigate = useNavigate();

    const logout = () => {
        adminLogout();
        navigate('/login');
    }

    useEffect(() => {
        const handleClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);


    return (
        <header className="w-full bg-blue-950 border-b border-blue-900/60 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-semibold">SB</div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white">SchoolBook Admin</h1>
                        <p className="text-xs text-blue-200">Manage books, users, and inventory</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link to={"/"} className="hidden sm:inline-flex items-center rounded-full border border-blue-700 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-800/60 transition">View Storefront</Link>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setOpen((prev) => !prev)}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <span className="hidden md:inline text-sm text-blue-100 font-medium">{user && user.first_name}</span>
                            <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center border border-blue-400 text-white text-sm font-semibold">
                                {user && user.first_name[0].toUpperCase()}
                            </div>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-3 w-56 bg-white shadow-lg border border-gray-200 rounded-xl z-50 animate-fadeIn overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">{user && user.username.toUpperCase()}</p>
                                    <p className="text-xs text-gray-500 truncate">{user && user.email}</p>
                                </div>

                                <div className="py-1">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <LuUserRound className="h-4 w-4 text-gray-500" />My Profile</Link>

                                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Account Settings
                                    </Link>
                                </div>

                                <div className="border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                        onClick={() => logout()}
                                    >Logout</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

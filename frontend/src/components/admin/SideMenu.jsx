import React, { useContext, useState } from 'react'
import { Link, NavLink } from 'react-router-dom';
import { BookContext } from '../../context/School.jsx';
import {
    LuLayoutDashboard,
    LuBookOpen,
    LuUsers,
    LuReceipt,
    LuCreditCard,
} from "react-icons/lu";

function NavItem({ to, children, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-colors ${isActive ? "text-blue-600" : "text-gray-500"
                }`
            }
        >
            {children}
            <span className="sr-only">{label}</span>
        </NavLink>
    );
}

function SideMenu() {

    const [openMenu, setOpenMenu] = useState(null);
    const { user } = useContext(BookContext);
    const role = user?.role;

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };
    return (
        <>
            <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 bg-white/90 backdrop-blur-sm p-4 overflow-y-auto">
                <nav className="space-y-1 text-sm">
                    <Link className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs">D</span>
                        Dashboard
                    </Link>
                    <p className="px-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Management</p>
                    <div>
                        <button onClick={() => toggleMenu("books")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg hover:cursor-pointer">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">B</span>
                                Books
                            </span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">24</span>
                        </button>

                        {openMenu === "books" && (
                            <div className="mt-2 space-y-1 text-sm">
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/books`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-10 py-2 transition-all duration-200 ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-700"}`}
                                >
                                    {({ isActive }) => (
                                        <span className="flex items-center gap-2">
                                            <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-indigo-500" : "bg-gray-300 group-hover:bg-indigo-500"}`} />
                                            All Book
                                        </span>
                                    )}
                                </NavLink>
                                {role != "student" &&
                                    <NavLink
                                        to={`/${import.meta.env.VITE_ADMIN}/add-book`}
                                        className={({ isActive }) => `group flex items-center justify-between rounded-lg px-10 py-2 transition-all duration-200 ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-700"}`}
                                    >
                                        {({ isActive }) => (
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-indigo-500" : "bg-gray-300 group-hover:bg-indigo-500"}`} />
                                                Add Book
                                            </span>
                                        )}
                                    </NavLink>
                                }
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/categories`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-10 py-2 transition-all duration-200 ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-indigo-500" : "bg-gray-300 group-hover:bg-indigo-500"}`} />
                                                Categories
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700  group-hover:bg-indigo-200">
                                                New
                                            </span>
                                        </>
                                    )}
                                </NavLink>
                            </div>
                        )}

                    </div>


                    <div>
                        <button onClick={() => toggleMenu("users")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">U</span>
                                Users
                            </span>
                        </button>

                        {openMenu === "users" && (
                            <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/users`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-emerald-700" : "text-gray-600 hover:bg-indigo-100 hover:text-emerald-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-gray-300 group-hover:bg-emerald-500"}`} />
                                                All Users
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-emerald-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                                {role != "student" &&
                                    <NavLink
                                        to={`/${import.meta.env.VITE_ADMIN}/add-user`}
                                        className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-emerald-700" : "text-gray-600 hover:bg-indigo-100 hover:text-emerald-700"}`}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-gray-300 group-hover:bg-emerald-500"}`} />
                                                    Add User
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-emerald-700  group-hover:bg-indigo-200">New</span>
                                            </>
                                        )}
                                    </NavLink>
                                }
                            </div>
                        )}
                    </div>

                    <div>
                        <button onClick={() => toggleMenu("review")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs">R</span>
                                Reviews
                            </span>
                        </button>

                        {openMenu === "review" && (
                            <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/review`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-cyan-700" : "text-gray-600 hover:bg-indigo-100 hover:text-cyan-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-cyan-500" : "bg-gray-300 group-hover:bg-cyan-500"}`} />
                                                All Review
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-cyan-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    <div>
                        <NavLink to={`/${import.meta.env.VITE_ADMIN}/order`} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-violet-50 text-red-600 flex items-center justify-center text-xs">C</span>
                                Order
                            </span>
                        </NavLink>
                    </div>
                    <div>
                        <NavLink to={`/${import.meta.env.VITE_ADMIN}/cart`} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-violet-50 text-violet-600 flex items-center justify-center text-xs">C</span>
                                Cart
                            </span>
                        </NavLink>
                    </div>
                    <div>
                        <NavLink to={`/${import.meta.env.VITE_ADMIN}/payment`} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-violet-50 text-violet-600 flex items-center justify-center text-xs">C</span>
                                Payment
                            </span>
                        </NavLink>
                    </div>
                    <div>
                        <button onClick={() => toggleMenu("discount")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs">D</span>
                                Discount
                            </span>
                        </button>

                        {openMenu === "discount" && (
                            <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/discount`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-cyan-700" : "text-gray-600 hover:bg-indigo-100 hover:text-cyan-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-cyan-500" : "bg-gray-300 group-hover:bg-cyan-500"}`} />
                                                All Discount
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-cyan-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/add-discount`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-cyan-700" : "text-gray-600 hover:bg-indigo-100 hover:text-cyan-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-cyan-500" : "bg-gray-300 group-hover:bg-cyan-500"}`} />
                                                Add Discount
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-cyan-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                            </div>
                        )}
                    </div>
                    <div>
                        <button onClick={() => toggleMenu("settings")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">S</span>
                                Settings
                            </span>
                        </button>

                        {openMenu === "settings" && (
                            <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/general`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-amber-700" : "text-gray-600 hover:bg-indigo-100 hover:text-amber-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-amber-500" : "bg-gray-300 group-hover:bg-amber-500"}`} />
                                                General
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-amber-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                                <NavLink
                                    to={`/${import.meta.env.VITE_ADMIN}/roles`}
                                    className={({ isActive }) => `group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? "bg-indigo-50 text-amber-700" : "text-gray-600 hover:bg-indigo-100 hover:text-amber-700"}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? "bg-amber-500" : "bg-gray-300 group-hover:bg-amber-500"}`} />
                                                Role
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-amber-700  group-hover:bg-indigo-200">New</span>
                                        </>
                                    )}
                                </NavLink>
                            </div>
                        )}
                    </div>
                </nav>
            </aside>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
                <div className="flex justify-around items-center h-14">

                    <NavItem to={`/${import.meta.env.VITE_ADMIN}`} label="Dashboard">
                        <LuLayoutDashboard className="text-xl" />
                    </NavItem>

                    <NavItem to={`/${import.meta.env.VITE_ADMIN}/books`} label="Books">
                        <LuBookOpen className="text-xl" />
                    </NavItem>

                    <NavItem to={`/${import.meta.env.VITE_ADMIN}/users`} label="Users">
                        <LuUsers className="text-xl" />
                    </NavItem>

                    <NavItem to={`/${import.meta.env.VITE_ADMIN}/order`} label="Orders">
                        <LuReceipt className="text-xl" />
                    </NavItem>

                    <NavItem to={`/${import.meta.env.VITE_ADMIN}/payment`} label="Payment">
                        <LuCreditCard className="text-xl" />
                    </NavItem>

                </div>
            </nav>
        </>
    )
}



export default SideMenu
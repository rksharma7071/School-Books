import React, { useContext, useState } from 'react'
import { Link, NavLink } from 'react-router-dom';
import { BookContext } from '../context/School';

function SideMenu() {

    const [openMenu, setOpenMenu] = useState(null);
    const { user } = useContext(BookContext);
    // console.log("user Sidemenu:", user?.role);
    const role = user?.role;

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };
    return (
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
                                to="/books"
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
                                    to="/add-book"
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
                                to="/categories"
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
                    {/* <button
                        onClick={() => toggleMenu("users")}
                        className="w-full flex items-center justify-between px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg hover:cursor-pointer"
                    >
                        <span className="flex items-center gap-3"><FaUser size={18} />User</span>

                        {openMenu === "users" ? (<FaChevronDown size={16} />) : (<FaChevronRight size={16} />)}
                    </button> */}
                    <button onClick={() => toggleMenu("users")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                        <span className="flex items-center gap-3">
                            <span className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">U</span>
                            Users
                        </span>
                    </button>

                    {openMenu === "users" && (
                        <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">
                            {/* All User */}
                            <NavLink
                                to="/users"
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
                            {/* Add User */}
                            {
                                role != "student" &&
                                <NavLink
                                    to="/add-user"
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
                    <button onClick={() => toggleMenu("settings")} className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
                        <span className="flex items-center gap-3">
                            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">S</span>
                            Settings
                        </span>
                    </button>

                    {openMenu === "settings" && (
                        <div className="mt-2 space-y-1 text-sm border-l border-gray-200 ml-5 pl-3 animate-slideDown">

                            {/* All Users */}
                            <Link
                                to="/general"
                                className="group flex items-center justify-between rounded-lg px-3 py-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-emerald-500" />
                                    General
                                </span>

                                {/* <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                                    312
                                </span> */}
                            </Link>

                            {/* Add User */}
                            <Link
                                to="/roles"
                                className="group flex items-center justify-between rounded-lg px-3 py-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-emerald-500" />
                                    Role
                                </span>

                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100">
                                    New
                                </span>
                            </Link>

                        </div>
                        // <div className="pl-10 mt-1 space-y-1 animate-slideDown">
                        //     <Link to={"/general"} className="block py-1 text-gray-600 hover:text-gray-900">General</Link>
                        //     {/* <Link to={"/users"} className="block py-1 text-gray-600 hover:text-gray-900">Users</Link> */}
                        //     <Link to={"/roles"} className="block py-1 text-gray-600 hover:text-gray-900">Roles</Link>
                        // </div>
                    )}
                </div>
            </nav>
        </aside>
    )
}

export default SideMenu
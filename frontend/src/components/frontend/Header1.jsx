import { useState, useRef, useEffect, useContext, useMemo } from "react";
import { LuShoppingCart, LuUserRound } from "react-icons/lu";
import { BookContext } from "../../context/School.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AiOutlineUser } from "react-icons/ai";
import { MdSearch } from "react-icons/md";

function Header() {
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, adminLogout, search, setSearch, books } = useContext(BookContext);

    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const cartCount = 3;

    const logout = () => {
        adminLogout();
        navigate("/login");
    };

    const filteredBooks = useMemo(() => {
        if (!search) return [];

        const term = search.toLowerCase();

        return books.filter(
            (b) =>
                b.name?.toLowerCase().includes(term) ||
                b.author?.toLowerCase().includes(term) ||
                b.subject?.toLowerCase().includes(term) ||
                b.isbn?.includes(term)
        );
    }, [books, search]);

    useEffect(() => {
        setSearch("");
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e) =>
            menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        const esc = (e) => e.key === "Escape" && setSearchOpen(false);
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, []);

    useEffect(() => {
        const handleSlash = (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea") return;

            if (e.key === "/") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        document.addEventListener("keydown", handleSlash);
        return () => document.removeEventListener("keydown", handleSlash);
    }, []);

    return (
        <header className="w-full bg-blue-950 border-b border-blue-900/60 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-6">

                <Link to="/" className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-semibold">
                        SB
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">SchoolBook</h1>
                        <p className="text-xs text-blue-200">Learn • Read • Grow</p>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-blue-100">
                    <Link to="/" className="hover:text-white">Home</Link>
                    <Link to="/books" className="hover:text-white">Shop</Link>
                    <Link to="/categories" className="hover:text-white">Categories</Link>
                    <Link to="/offers" className="hover:text-white">Offers</Link>
                    <Link to="/reviews" className="hover:text-white">Reviews</Link>
                </nav>

                <div className="flex items-center gap-4">

                    {/* CART */}
                    <Link to="/cart" className="relative text-blue-100 hover:text-white">
                        <LuShoppingCart className="text-xl" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] rounded-full px-1.5">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* SEARCH */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="text-blue-100 hover:text-white"
                    >
                        <MdSearch className="text-xl" />
                    </button>

                    {/* AUTH */}
                    {!user ? (
                        <Link to="/login" className="text-blue-100 hover:text-white">
                            <AiOutlineUser className="text-xl" />
                        </Link>
                    ) : (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setOpen(!open)}
                                className="flex items-center gap-2"
                            >
                                <span className="hidden md:inline text-sm text-blue-100">
                                    {user.first_name}
                                </span>
                                <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                                    {user.first_name?.[0]}
                                </div>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border z-50">
                                    <div className="px-5 py-4 bg-slate-100 border-b">
                                        <p className="font-semibold text-sm">{user.username}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>

                                    <div className="py-2">
                                        <Link to="/profile" className="menu-item">My Profile</Link>
                                        <Link to="/profile/orders" className="menu-item">My Orders</Link>
                                        <Link to="/settings" className="menu-item">Settings</Link>
                                    </div>

                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MOBILE HAMBURGER */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden text-blue-100 text-xl"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {searchOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-center pt-24 px-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-4 relative">
                        <button
                            onClick={() => setSearchOpen(false)}
                            className="absolute top-3 right-3"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3">
                            <MdSearch className="text-xl text-gray-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search books, author, ISBN..."
                                className="w-full outline-none"
                            />
                        </div>

                        {filteredBooks.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {filteredBooks.slice(0, 8).map((b) => (
                                    <div key={b._id} className="border p-2 rounded">
                                        <p className="font-medium text-sm">{b.name}</p>
                                        <p className="text-xs text-gray-500">{b.author}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;

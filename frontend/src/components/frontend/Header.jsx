import { useState, useRef, useEffect, useContext } from "react";
import { LuShoppingCart, LuUserRound } from "react-icons/lu";
import { BookContext } from "../../context/School.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineUser } from "react-icons/ai";
import { MdSearch } from "react-icons/md";
import axios from "axios";

const cdn = (url, w = 300) =>
    url?.includes("/upload/")
        ? url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${w}/`)
        : url;

function Header() {
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const { user, adminLogout, cartItems } = useContext(BookContext);
    // console.log("results: ", results);

    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const cartCount = cartItems?.length || 0;

    const logout = () => {
        adminLogout();
        navigate("/");
    };

    useEffect(() => {
        const term = search.trim();

        if (term.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        const controller = new AbortController();

        const timer = setTimeout(() => {
            axios
                .get(`${import.meta.env.VITE_API}/api/product`, {
                    params: { q: term, limit: 6 },
                    signal: controller.signal,
                })
                .then(({ data }) => setResults(data.data || []))
                .catch((e) => {
                    if (!axios.isCancel(e)) setResults([]);
                })
                .finally(() => setSearching(false));
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search]);

    useEffect(() => {
        setSearch("");
        setResults([]);
        setSearchOpen(false);
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e) =>
            menuRef.current &&
            !menuRef.current.contains(e.target) &&
            setOpen(false);

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") {
                setSearchOpen(false);
                setMobileOpen(false);
                return;
            }

            const tag = e.target.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea") return;

            if (e.key === "/") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, []);

    const closeSearch = () => {
        setSearchOpen(false);
        setSearch("");
        setResults([]);
    };

    return (
        <header className="w-full bg-blue-950 border-b border-blue-900/60 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-6">

                <Link to="/" className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-blue-950 font-semibold">
                        SB
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">SchoolBook</h1>
                        <p className="text-xs text-blue-200">Learn • Read • Grow</p>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-blue-100">
                    <Link to="/" className="hover:text-white">Home</Link>
                    <Link to="/categories/all" className="hover:text-white">Categories</Link>
                    <Link to="/reviews" className="hover:text-white">Reviews</Link>
                    <Link to="/contact" className="hover:text-white">Contact Us</Link>
                </nav>

                <div className="flex items-center gap-4">

                    <Link to="/cart" className="relative text-blue-100 hover:text-white">
                        <LuShoppingCart className="text-xl" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-semibold rounded-full px-1.5">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    <button
                        onClick={() => setSearchOpen(true)}
                        className="text-blue-100 hover:text-white"
                        aria-label="Search"
                    >
                        <MdSearch className="text-xl" />
                    </button>

                    {!user && (
                        <Link to="/login" className="text-blue-100 hover:text-white">
                            <AiOutlineUser className="text-xl" />
                        </Link>
                    )}

                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setOpen((prev) => !prev)}
                                className="flex items-center gap-2"
                            >
                                <span className="hidden md:inline text-sm text-blue-100 font-medium">
                                    {user?.name}
                                </span>
                                <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center border border-blue-400 text-white text-sm font-semibold">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 z-50 overflow-hidden">
                                    <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-300">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name?.toUpperCase()}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                    </div>

                                    <div className="py-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition"
                                        >
                                            <LuUserRound className="h-4 w-4" />
                                            My Profile
                                        </Link>

                                        <Link
                                            to="/profile/orders"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition"
                                        >
                                            📦 My Orders
                                        </Link>

                                        <Link
                                            to="/profile/change-password"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition"
                                        >
                                            ⚙️ Account Settings
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-300" />

                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden text-blue-100 hover:text-white"
                        aria-label="Open menu"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 h-full w-72 bg-blue-950 shadow-xl p-6 animate-slideIn overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-lg font-semibold text-white">SchoolBook</h1>
                                <p className="text-xs text-blue-200">Learn • Read • Grow</p>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="text-blue-200 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4 text-blue-100 text-sm font-medium">
                            <Link onClick={() => setMobileOpen(false)} to="/" className="hover:text-white">Home</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/categories/all" className="hover:text-white">Categories</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/best-sellers" className="hover:text-white">Best Sellers</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/new-arrivals" className="hover:text-white">New Arrivals</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/offers" className="hover:text-white">Offers</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/reviews" className="hover:text-white">Reviews</Link>
                            <Link onClick={() => setMobileOpen(false)} to="/contact" className="hover:text-white">Contact Us</Link>
                        </nav>

                        <div className="border-t border-blue-800 my-6" />

                        <div className="flex flex-col gap-3">
                            <Link
                                to="/cart"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 text-blue-100 hover:text-white"
                            >
                                <LuShoppingCart /> Cart ({cartItems.length})
                            </Link>

                            {!user ? (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 text-blue-100 hover:text-white"
                                >
                                    <AiOutlineUser /> Login
                                </Link>
                            ) : (
                                <>
                                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-blue-100 hover:text-white">My Profile</Link>
                                    <Link to="/profile/orders" onClick={() => setMobileOpen(false)} className="text-blue-100 hover:text-white">My Orders</Link>
                                    <button
                                        onClick={() => { logout(); setMobileOpen(false); }}
                                        className="text-left text-red-400 hover:text-red-300"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {searchOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
                    onClick={closeSearch}
                >
                    <div
                        className="w-full max-w-2xl bg-white rounded-2xl shadow p-4 relative animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeSearch}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3">
                            <MdSearch className="text-xl text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search books, authors, subjects..."
                                className="w-full text-sm outline-none border-none placeholder-gray-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                            {search.trim().length > 0 && search.trim().length < 2
                                ? "Type at least 2 characters"
                                : "Search by book name, author or subject"}
                        </p>

                        {searching && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-xl border border-gray-200 p-3">
                                        <div className="aspect-square w-full rounded-lg bg-gray-200 animate-pulse" />
                                        <div className="mt-3 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="mt-2 h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!searching && search.trim().length >= 2 && results.length === 0 && (
                            <p className="mt-6 text-center text-sm text-gray-500 py-4">
                                No books found for “{search.trim()}”
                            </p>
                        )}

                        {!searching && results.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {results.map((b) => (
                                    <Link
                                        to={`/products/${b._id}`}
                                        key={b._id}
                                        onClick={closeSearch}
                                        className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 transition hover:shadow-md hover:border-blue-400"
                                    >
                                        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                                            <img
                                                src={cdn(b.coverImage, 300)}
                                                alt={b.name}
                                                width={300}
                                                height={300}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                                                {b.title}
                                            </p>
                                            <p className="text-xs text-gray-500">{b.author}</p>
                                        </div>
                                    </Link>
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

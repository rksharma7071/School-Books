import { Link } from "react-router-dom";
import { LuShoppingCart, LuPhone, LuMail, LuMapPin } from "react-icons/lu";
import { MdOutlinePolicy } from "react-icons/md";

function Footer() {
    return (
        <footer className="bg-blue-950 border-t border-blue-900/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-blue-950 font-semibold">SB</div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    SchoolBook
                                </h2>
                                <p className="text-xs text-blue-200">
                                    Learn • Read • Grow
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-blue-200 leading-relaxed">
                            Your trusted online bookstore for school-level education.
                            Discover textbooks, guides, and learning materials at the best prices.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li><Link to="/" className="hover:text-white">Home</Link></li>
                            <li><Link to="/books" className="hover:text-white">Shop</Link></li>
                            <li><Link to="/categories" className="hover:text-white">Categories</Link></li>
                            <li><Link to="/best-sellers" className="hover:text-white">Best Sellers</Link></li>
                            <li><Link to="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
                            <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                            <li><Link to="/faq" className="hover:text-white">FAQs</Link></li>
                            <li className="flex items-center gap-2">
                                <Link to="/privacy-policy" className="hover:text-white">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                            <li><Link to="/returns" className="hover:text-white">Returns & Refunds</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Contact</h3>

                        <ul className="space-y-3 text-sm text-blue-200">
                            <li className="flex items-center gap-2">
                                <LuPhone />
                                +91 98765 43210
                            </li>
                            <li className="flex items-center gap-2">
                                <LuMail />
                                support@schoolbook.in
                            </li>
                            <li className="flex items-start gap-2">
                                <LuMapPin className="mt-0.5" />
                                <span>Lucknow, Uttar Pradesh<br />India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-blue-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">

                    <p className="text-xs text-blue-300">
                        © {new Date().getFullYear()} SchoolBook. All rights reserved.
                    </p>

                    <div className="flex items-center gap-4 text-blue-200 text-sm">
                        {/* <Link to="/cart" className="flex items-center gap-1 hover:text-white">
                            <LuShoppingCart /> Cart
                        </Link>
                        <Link to="/reviews" className="hover:text-white">
                            Reviews
                        </Link> */}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;

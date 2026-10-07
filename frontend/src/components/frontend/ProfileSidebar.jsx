import { NavLink, useNavigate } from "react-router-dom";
import {
    FiUser,
    FiShoppingBag,
    FiMapPin,
    FiLock,
    FiLogOut,
} from "react-icons/fi";
import { BookContext } from "../../context/School";
import { useContext } from "react";

function ProfileSidebar() {
    const { adminLogout } = useContext(BookContext);
    const navigate = useNavigate();

    const logout = () => {
        adminLogout();
        navigate("/");
    };
    const linkClass = ({ isActive }) => `flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${isActive ? "bg-gray-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`;

    return (
        <aside className="md:bg-white md:rounded-lg md:shadow md:p-4">
            <h2 className="hidden md:block text-lg font-semibold mb-4">My Account</h2>

            <ul
                className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0pb-2 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <li className="shrink-0 md:shrink">
                    <NavLink to="/profile" end className={linkClass}>
                        <FiUser className="text-lg" />
                        <span>Personal Details</span>
                    </NavLink>
                </li>

                <li className="shrink-0 md:shrink">
                    <NavLink to="/profile/orders" className={linkClass}>
                        <FiShoppingBag className="text-lg" />
                        <span>My Orders</span>
                    </NavLink>
                </li>

                <li className="shrink-0 md:shrink">
                    <NavLink to="/profile/address" className={linkClass}>
                        <FiMapPin className="text-lg" />
                        <span>Address</span>
                    </NavLink>
                </li>

                <li className="shrink-0 md:shrink">
                    <NavLink to="/profile/change-password" className={linkClass}>
                        <FiLock className="text-lg" />
                        <span>Change Password</span>
                    </NavLink>
                </li>

                <li className="shrink-0 md:shrink flex justify-center md:block">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 md:gap-3px-4 md:px-3 py-2 md:py-3rounded-full md:rounded-lgtext-sm font-medium transition whitespace-nowrapbg-white text-red-600 shadow-smmd:bg-transparent md:shadow-nonehover:bg-red-50"
                    >
                        <FiLogOut className="text-lg" />
                        <span>Logout</span>
                    </button>
                </li>
            </ul>
        </aside>
    );
}

export default ProfileSidebar;

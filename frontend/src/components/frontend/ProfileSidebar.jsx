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
    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition
        ${isActive
            ? "bg-gray-100 text-blue-600"
            : "text-gray-700 hover:bg-gray-100"}`;

    return (
        <aside className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">My Account</h2>

            <ul className="space-y-1">
                <li>
                    <NavLink to="/profile" end className={linkClass}>
                        <FiUser className="text-lg" />
                        <span>Personal Details</span>
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/profile/orders" className={linkClass}>
                        <FiShoppingBag className="text-lg" />
                        <span>My Orders</span>
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/profile/address" className={linkClass}>
                        <FiMapPin className="text-lg" />
                        <span>Address</span>
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/profile/change-password" className={linkClass}>
                        <FiLock className="text-lg" />
                        <span>Change Password</span>
                    </NavLink>
                </li>

                <li>
                    <button
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                        onClick={logout}
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

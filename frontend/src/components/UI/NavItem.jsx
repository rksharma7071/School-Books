import { NavLink } from "react-router-dom";

function NavItem({ to, children, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs ${isActive ? "text-blue-600" : "text-gray-500"
                }`
            }
        >
            <span className="text-xl">{children}</span>
            <span className="sr-only">{label}</span>
        </NavLink>
    );
}
export default NavItem;
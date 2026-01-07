const Button = ({ children, variant = "primary", disabled = false, className = "", onClick, type = "button" }) => {
    const baseStyles = "w-full rounded-md py-3 font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

    const variants = {
        primary: "bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-md hover:from-blue-950 hover:to-blue-900 hover:shadow-md",
        secondary: "border border-blue-900 bg-white text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md",
        success: "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md " + "hover:from-green-700 hover:to-green-600 hover:shadow-lg focus:ring-green-500/30",
        error: "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md " + "hover:from-red-700 hover:to-red-600 hover:shadow-lg focus:ring-red-500/30",
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;

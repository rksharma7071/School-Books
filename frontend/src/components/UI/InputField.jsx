const InputField = ({
    name,
    placeholder,
    value,
    onChange,
    type = "text",
    className = "",
}) => {
    return (
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/20 transition-all ${className}`}
        />
    );
};

export default InputField;
const InputField = ({
  name,
  placeholder,
  value,
  onChange,
  type = "text",
  textarea = false,
  rows = 4,
  className = "",
}) => {
  const baseStyles = "w-full rounded-md border border-gray-300 bg-gray-50 text-sm px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/20 transition-all";

  if (textarea) {
    return (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`${baseStyles} resize-none ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={baseStyles}
    />
  );
};

export default InputField;

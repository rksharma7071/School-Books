const InputField = ({
  name,
  placeholder,
  value,
  onChange,
  type = "text",
  textarea = false,
  rows = 4,
  className = "",
  disabled = false,
}) => {
  const baseStyles = `
    w-full rounded-md border text-sm px-4 py-2 transition-all placeholder-gray-400 focus:outline-none
    ${disabled
      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/20"}
  `;
  if (textarea) {
    return (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
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
      disabled={disabled}
      className={baseStyles}
    />
  );
};

export default InputField;

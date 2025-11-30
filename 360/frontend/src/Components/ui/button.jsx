export function Button({ children, className = "", ...props }) {
  return (
    <button //text-white
      className={`rounded-lg inline-flex items-center justify-center gap-2 py-3 px-5  font-medium text-base transition duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

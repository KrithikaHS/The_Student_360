// components/ui/badge.jsx
export function Badge({ children, className = "", ...props }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

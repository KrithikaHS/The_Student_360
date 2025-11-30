// components/ui/table.jsx
export function Table({ children, className = "", ...props }) {
  return (
    <table className={`min-w-full border-collapse border border-gray-200 ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = "", ...props }) {
  return <thead className={className} {...props}>{children}</thead>;
}

export function TableBody({ children, className = "", ...props }) {
  return <tbody className={className} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = "", ...props }) {
  return <tr className={`border-b border-gray-200 ${className}`} {...props}>{children}</tr>;
}

export function TableCell({ children, className = "", ...props }) {
  return <td className={`px-4 py-2 ${className}`} {...props}>{children}</td>;
}

export function TableHead({ children, className = "", ...props }) {
  return <th className={`px-4 py-2 text-left font-medium ${className}`} {...props}>{children}</th>;
}

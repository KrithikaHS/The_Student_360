export function Label({ children, htmlFor }) {
  return (
    <label //text-slate-300
      className="block mb-2 text-sm font-medium "
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

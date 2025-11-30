export function Textarea({ className = "", ...props }) {
  return (
    <textarea //text-white
      className={`w-full px-4 py-2 bg-slate-800  border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 transition ${className}`}
      {...props}
    />
  );
}

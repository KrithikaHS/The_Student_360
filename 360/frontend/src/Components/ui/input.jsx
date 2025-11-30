export function Input({ label, id, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 transition ${className}`}
        {...props}
      />
    </div>
  );
}

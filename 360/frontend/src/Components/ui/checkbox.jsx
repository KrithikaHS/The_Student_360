
export function Checkbox({ id, checked, onCheckedChange, className = "" }) {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className={`w-4 h-4 rounded-md border border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 transition ${className}`}
    />
  );
}

import { Children, cloneElement, useEffect, useRef, useState } from "react";

export function Select({ value, onValueChange, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {Children.map(children, (child) => {
        // Pass necessary props to the right components
        if (child.type.displayName === "SelectTrigger") {
          return cloneElement(child, { open, setOpen, value });
        }
        if (child.type.displayName === "SelectContent") {
          return cloneElement(child, { open, setOpen, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({ children, open, setOpen, className = "", value }) {
  const triggerChild = Children.map(children, (child) => {
    if (child.type.displayName === "SelectValue") {
      return cloneElement(child, { value });
    }
    return child;
  });

  return (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)} // ✅ safely toggle
      className={`w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-left text-white focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {triggerChild}
    </button>
  );
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ value, placeholder = "Select..." }) {
  return (
    <span className="text-slate-300">
      {value ? value : <span className="text-slate-500">{placeholder}</span>}
    </span>
  );
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children, open, onValueChange, setOpen }) {
  if (!open) return null;

  return (
    <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-md shadow-lg">
      {Children.map(children, (child) =>
        cloneElement(child, {
          onSelect: (val) => {
            onValueChange?.(val);
            setOpen(false);
          },
        })
      )}
    </div>
  );
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ value, onSelect, children }) {
  return (
    <div
      onClick={() => onSelect(value)}
      className="px-4 py-2 text-slate-300 hover:bg-slate-700 cursor-pointer transition"
    >
      {children}
    </div>
  );
}
SelectItem.displayName = "SelectItem";

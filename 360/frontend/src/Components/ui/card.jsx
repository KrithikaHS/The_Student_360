// Card.js

export function Card({ children }) {
  return ( //bg-slate-800 text-white border border-slate-700
    <div className="rounded-xl shadow-lg  p-6">
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return (// border-b border-slate-600
    <div className=" pb-4 mb-4">
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}


export function CardContent({ children }) {
  return (
    <div className=" text-base leading-relaxed">
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils"; // Dummy util — we'll make one below
import * as React from "react";

const TabsContext = React.createContext();

export function Tabs({ defaultValue, children, className }) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className }) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-all",
        isActive
          ? "bg-white text-blue-600 shadow-sm"
          : "hover:text-gray-800 text-gray-500",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      className={cn(
        "mt-4 rounded-lg border border-gray-100 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

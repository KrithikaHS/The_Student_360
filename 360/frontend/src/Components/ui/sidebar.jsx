import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { createContext, useContext, useState } from "react";

// ✅ Sidebar Context to toggle open/close
const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <div className="flex min-h-screen">{children}</div>
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);

// ✅ Wrapper
export function Sidebar({ children, className = "" }) {
  const { isOpen } = useSidebar();
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -250, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`w-64 flex flex-col bg-white shadow-lg ${className}`}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ✅ Header
export function SidebarHeader({ children, className = "" }) {
  return <div className={`px-4 py-3 border-b ${className}`}>{children}</div>;
}

// ✅ Content section
export function SidebarContent({ children, className = "" }) {
  return <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>;
}

// ✅ Footer
export function SidebarFooter({ children, className = "" }) {
  return <div className={`border-t px-4 py-3 ${className}`}>{children}</div>;
}

// ✅ Group & Label
export function SidebarGroup({ children, className = "" }) {
  return <div className={`mt-3 ${className}`}>{children}</div>;
}

export function SidebarGroupLabel({ children, className = "" }) {
  return (
    <p className={`text-xs uppercase font-semibold text-gray-500 px-3 mb-2 ${className}`}>
      {children}
    </p>
  );
}

export function SidebarGroupContent({ children, className = "" }) {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
}

// ✅ Menu Items
export function SidebarMenu({ children, className = "" }) {
  return <ul className={`flex flex-col ${className}`}>{children}</ul>;
}

export function SidebarMenuItem({ children, className = "" }) {
  return <li className={`w-full ${className}`}>{children}</li>;
}

export function SidebarMenuButton({ children, asChild, className = "" }) {
  return (
    <button
      className={`w-full text-left text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );
}

// ✅ Sidebar Trigger
export function SidebarTrigger({ children }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      className="p-2 rounded-md hover:bg-gray-200 transition"
    >
      {children || <ChevronLeft className="w-5 h-5" />}
    </button>
  );
}

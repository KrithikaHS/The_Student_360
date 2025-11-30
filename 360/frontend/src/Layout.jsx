// import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GraduationCap, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    url: createPageUrl("Students"),
    icon: GraduationCap,
  },
  {
    title: "Mentors",
    url: createPageUrl("Mentors"),
    icon: Users,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log("Not authenticated");
    }
  };

  const handleLogout = async () => {
    // await base44.auth.logout();
    window.location.href = createPageUrl("Landing");
  };

  // Don't show layout on Landing and Auth pages
  if (currentPageName === "Landing" || currentPageName === "Auth") {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="hidden lg:block fixed left-0 top-0 h-screen bg-white/40 backdrop-blur-xl border-r border-white/20 shadow-2xl z-40"
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-6 flex items-center justify-between border-b border-white/20">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">EduAdmin</h2>
                  <p className="text-xs text-slate-500">Management System</p>
                </div>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-white/50 ml-auto"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link key={item.title} to={item.url}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "hover:bg-white/50 text-slate-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/20">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">
                    {user?.full_name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-2xl z-50"
            >
              <div className="flex flex-col h-full">
                <div className="p-6 flex items-center gap-3 border-b border-white/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">EduAdmin</h2>
                    <p className="text-xs text-slate-500">Management System</p>
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                              : "hover:bg-white/50 text-slate-700"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {user?.full_name || "Admin User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-9 px-3 
                  ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>        <Outlet/>
      </main>
    </div>
  );
}
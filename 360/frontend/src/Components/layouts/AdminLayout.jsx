// import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { createPageUrl } from "@/utils";
import {
    GitBranch,
    GraduationCap,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    UserPlus,
    Users
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Add Students",
    url: createPageUrl("AddStudents"),
    icon: UserPlus,
  },
  
  {
    title: "Add Mentors",
    url: createPageUrl("AddMentors"),
    icon: Users,
  },
  {
    title: "Auto-Assign Mentors",
    url: createPageUrl("AutoAssignMentors"),
    icon: GitBranch,
  },
  {
    title: "Manage Credentials",
    url: createPageUrl("ManageCredentials"),
    icon: KeyRound,
  },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // base44.auth.logout("/");
    navigate(createPageUrl("Landing"));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin Portal</h2>
                <p className="text-xs text-gray-500">Student 360°</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-red-50 text-red-700 font-semibold' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Menu className="w-6 h-6" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold">Admin Portal</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
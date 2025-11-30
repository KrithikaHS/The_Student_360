import { loginUser } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "mentor", label: "Mentor" },
  { value: "placement_cell", label: "Placement Cell" }
];

export default function LoginForm({ onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: ""
  });

  useEffect(() => {
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRole = localStorage.getItem('rememberedRole');
    
    if (savedEmail && savedRole) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        role: savedRole
      }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.role) {
      alert("Please select your role");
      return;
    }
    
    setIsLoading(true);
    
    try {
    const res = await loginUser(formData);
const { access, refresh, user } = res.data;

// Save user data & token
localStorage.setItem("access_token", access);
localStorage.setItem("refresh_token", refresh);
localStorage.setItem("role", user.role);
localStorage.setItem("userId", user.id);

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
      localStorage.setItem("rememberedRole", formData.role);
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedRole");
    }
    onSuccess(user.role); // Navigate to dashboard
  } catch (err) {
    alert(err.response?.data?.detail || "Login failed. Try again.");
  } finally {
    setIsLoading(false);
  }
};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6 text-white"
    >
      <div className="space-y-2 ">
        <Label htmlFor="role" className="text-slate-300">Login As</Label>
        <div className="relative">
          <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
          <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white pl-11">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-300">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11 pr-11"
            required
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember" 
          checked={rememberMe}
          onCheckedChange={setRememberMe}
          className="border-white/20 data-[state=checked]:bg-blue-600"
        />
        <Label htmlFor="remember" className="text-slate-300 text-sm cursor-pointer">
          Remember my email and role
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing In...
          </div>
        ) : (
          "Sign In"
        )}
      </Button>

      
    </motion.form>
  );
}
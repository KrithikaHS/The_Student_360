import { signupStudent } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Eye, EyeOff, GraduationCap, Lock, Mail, Phone, User } from "lucide-react";
import { useState } from "react";

export default function SignupForm({ onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    branch: "",
    semester: "",
    cgpa: "",
    password: "",
    confirmPassword: "",
    dob: "",
  });

  const change = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    if (!formData.email.toLowerCase().endsWith("@students.git.edu")) {
      alert("Use your college email (students.git.edu)");
      return;
    }
     if (!formData.dob) {
      alert("Please enter your Date of Birth");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      alert("Enter a valid 10-digit phone number");
      return;
    }
    if (formData.cgpa < 0 || formData.cgpa > 10) {
      alert("CGPA must be between 0 and 10");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        branch: formData.branch,
        semester: formData.semester ? Number(formData.semester) : null,
        cgpa: formData.cgpa ? Number(formData.cgpa) : null,
        password: formData.password,
        dob: formData.dob,
      };
      const res = await signupStudent(payload);
      alert(res.data.message || "Account created");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Signup error:", err?.response?.data || err);
      const msg = err?.response?.data;
      if (msg && typeof msg === "object") {
        alert(JSON.stringify(msg));
      } else {
        alert("Signup failed. Check console.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6 text-white"
    >
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-slate-300">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11"
            required
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dob" className="text-slate-300">Date of Birth</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => handleInputChange("dob", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11"
            required
          />
        </div>
      </div>


      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">
          College Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="example@students.git.edu"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-300">
          Phone Number
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="phone"
            type="tel"
            placeholder="10-digit number"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            maxLength={10}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11"
            required
          />
        </div>
      </div>

      {/* Branch */}
      <div className="space-y-2">
        <Label htmlFor="branch" className="text-slate-300">Branch</Label>
<div className="relative">
  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
  <Select
    value={formData.branch}
    onValueChange={(value) => handleInputChange("branch", value)}
  >
    <SelectTrigger className="bg-white/10 border-white/20 text-white pl-11">
      <SelectValue placeholder="Select your branch" />
    </SelectTrigger>
    <SelectContent>
      {[
        { value: "CSE", label: "CSE" },
        { value: "ISE", label: "ISE" },
        { value: "ECE", label: "ECE" },
        { value: "EEE", label: "EEE" },
        { value: "ME", label: "Mechanical" },
        { value: "CIVIL", label: "Civil" },
      ].map((b) => (
        <SelectItem key={b.value} value={b.value}>
          {b.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

      </div>

      {/* Semester */}
      <div className="space-y-2">
        <Label htmlFor="semester" className="text-slate-300">Semester</Label>
<div className="relative">
  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
  <Select
    value={formData.semester}
    onValueChange={(value) => handleInputChange("semester", value)}
  >
    <SelectTrigger className="bg-white/10 border-white/20 text-white pl-11">
      <SelectValue placeholder="Select your semester" />
    </SelectTrigger>
    <SelectContent>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
        <SelectItem key={sem} value={sem.toString()}>
          Semester {sem}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

      </div>

      {/* CGPA */}
      <div className="space-y-2">
        <Label htmlFor="cgpa" className="text-slate-300">
          CGPA
        </Label>
        <Input
          id="cgpa"
          type="number"
          step="0.01"
          min="0"
          max="10"
          placeholder="Enter your CGPA (1-10)"
          value={formData.cgpa}
          onChange={(e) => handleInputChange("cgpa", e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-300">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
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

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-300">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-11 pr-11"
            required
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4 text-slate-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating Account...
          </div>
        ) : (
          "Create Account"
        )}
      </Button>
    </motion.form>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsLogin(true);
    }, 2000);
  };

  const handleLoginSuccess = (role) => {
    // Route based on role
    switch(role) {
      case 'admin':
        navigate(createPageUrl("AdminDashboard"));
        break;
      case 'student':
        navigate(createPageUrl("StudentDashboard"));
        break;
      case 'mentor':
        navigate(createPageUrl("MentorDashboard"));
        break;
      case 'placement_cell':
        navigate(createPageUrl("PlacementDashboard"));
        break;
      default:
        navigate(createPageUrl("AdminDashboard"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Landing")}>
            <Button variant="ghost" className="text-slate-300 hover:text-white p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Account created successfully! Please log in.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className=" bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl ">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-lg font-bold mb-2 text-white">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <p className="text-slate-300">
                {isLogin ? "Sign in to your account" : "Join us today"}
              </p>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <LoginForm key="login" onSuccess={handleLoginSuccess} />
                ) : (
                  <SignupForm key="signup" onSuccess={handleSignupSuccess} />
                )}
              </AnimatePresence>

              {/* Toggle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mt-6"
              >
                <p className="text-slate-300">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:text-blue-300 p-1 ml-1"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </Button>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
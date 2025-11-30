import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AboutSection from "../components/landing/AboutSection";
import ContactSection from "../components/landing/ContactSection";
import HeroSection from "../components/landing/HeroSection";

export default function Landing() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.querySelector(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Student 360°</span>
          </motion.div>

          {/* Nav Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex space-x-8 text-slate-300"
          >
            <button
              onClick={() => scrollToSection("#about")}
              className="hover:text-white transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("#contact")}
              className="hover:text-white transition-colors"
            >
              Contact
            </button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              onClick={() => navigate(createPageUrl("Auth"))}
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Page Sections */}
      <div className="relative z-10 pt-24">
        {/* Hero section with Get Started */}
        <HeroSection
          onGetStarted={() => navigate(createPageUrl("Auth"))}
        />

        {/* About section */}
        <section id="about">
          <AboutSection />
        </section>

        {/* Contact section */}
        <section id="contact">
          <ContactSection />
        </section>
      </div>
    </div>
  );
}

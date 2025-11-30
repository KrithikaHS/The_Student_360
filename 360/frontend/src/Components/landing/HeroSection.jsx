import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HeroSection({  }) {
  const navigate = useNavigate();
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-32 px-6">
      {/* Animated headline */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6"
      >
        Empowering Placement Team and Mentors with <br />
        <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          360° View of Students
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-slate-300 max-w-2xl text-lg md:text-xl mb-10"
      >
        Manage academics, mentorship, placements, and student analytics — all in one smart dashboard powered by AI & blockchain.
      </motion.p>

      {/* Get Started Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Button
          onClick={() => navigate(createPageUrl("Auth"))}
          className="text-lg px-8 py-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300"
        >
          Get Started <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>

     
    </section>
  );
}

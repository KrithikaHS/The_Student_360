import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Users } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "For Students",
    points: [
      "Upload academic documents and certificates",
      "View document status — Accepted or Rejected",
      "Keep profile updated with latest details",
    ],
  },
  {
    icon: Users,
    title: "For Mentors",
    points: [
      "View assigned mentees and their academic progress",
      "Verify uploaded student documents",
      "Track student performance and statistics digitally",
    ],
  },
  {
    icon: Briefcase,
    title: "For Placement Cell",
    points: [
      "View analytics and student insights",
      "Download placement-related reports",
      "Filter students based on placement or eligibility status",
    ],
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Student 360° connects Students, Mentors, and the Placement Team on a single digital platform — 
            making document verification, mentorship tracking, and placement management effortless.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <ul className="text-slate-300 space-y-2 text-sm md:text-base">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.6 }}
  viewport={{ once: true }}
  className="mt-16 text-center max-w-3xl mx-auto"
>
  <p className="text-slate-300 text-lg leading-relaxed">
    🛡️ <span className="text-white font-semibold">Admin</span> is always available to help —  
    adding students, assigning mentors, and creating login credentials.  
    For any issues or requests, reach out through the{" "}
    <a
      href="#contact"
      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors duration-300"
    >
      Contact
    </a>{" "}
    section.
  </p>
</motion.div>

      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    setStatus(null);
    if (!formData.first_name || !formData.email || !formData.message) {
      setStatus({ type: "error", message: "Please fill all required fields" });
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/student360/contact/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});


      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: data.message });
        setFormData({ first_name: "", last_name: "", email: "", message: "" });
      } else {
        setStatus({ type: "error", message: data.error || "Failed to send email" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Network error, try again later" });
    }
  };

  return (
    <section id="contact" className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Get In Touch</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Ready to transform your business? Contact us today and let's discuss how we can help you succeed.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Send us a message</h3>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="First Name" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
                    <Input placeholder="Last Name" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
                  </div>
                  <Input placeholder="Email Address" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
                  <Textarea placeholder="Your Message" value={formData.message} onChange={(e) => handleChange("message", e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-32" />

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3" onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" /> Send Message
                  </Button>

                  {status && (
                    <p className={status.type === "error" ? "text-red-500 mt-2" : "text-green-500 mt-2"}>
                      {status.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6">Contact Information</h3>
              <p className="text-slate-300 leading-relaxed mb-8">We're here to help you succeed. Reach out through any of these channels and we'll get back to you promptly.</p>
            </div>

            <div className="space-y-6">
              

              
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

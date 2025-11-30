import { bulkUploadMentors, createMentor } from "@/api/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, Users } from "lucide-react";
import { useRef, useState } from "react";
import AdminLayout from "../components/layouts/AdminLayout";

export default function AddMentors() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    max_students: "15",
  });

  const [status, setStatus] = useState(null);

  // ---------- BULK ----------
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  // =============================
  //  SINGLE MENTOR CREATION
  // =============================
  const createMentorMutation = useMutation({
    mutationFn: async (data) => await createMentor(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["mentors"]);
      setFormData({ name: "", email: "", phone: "", department: "" });

      setStatus({
        type: "success",
        message: "Mentor added! Password setup link sent to email.",
      });
    },
    onError: (err) => {
      setStatus({
        type: "error",
        message: err.response?.data?.error || "Failed to add mentor",
      });
    },
  });

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    createMentorMutation.mutate({
        ...formData,
        max_students: parseInt(formData.max_students, 10),
    });
};


  // =============================
  //        BULK UPLOAD
  // =============================
  const handleBulkUpload = async () => {
    if (!file)
      return setStatus({ type: "error", message: "Please select a file." });

    setProcessing(true);
    setStatus(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await bulkUploadMentors(fd);

      setStatus({
        type: "success",
        message: `Bulk upload done! Password setup emails sent.`,
      });

      setFile(null);
      queryClient.invalidateQueries(["mentors"]);
    } catch (err) {
      setStatus({
        type: "error",
        message: "Bulk upload failed. Check file format.",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Add Mentors</h1>

        {status && (
          <motion.div
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div
              className={`p-3 rounded ${
                status.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {status.message}
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">Single Mentor</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          {/* =============================
              SINGLE MENTOR FORM
          ============================= */}
          <TabsContent value="single">
            <Card className="shadow-lg mt-4">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mentor Information
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSingleSubmit} className="space-y-6">

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) =>
                          setFormData({ ...formData, department: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Information Science">Information Science</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Mechanical">Mechanical</SelectItem>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Mentor will receive an email with a
                      secure password-setup link.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={createMentorMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    {createMentorMutation.isPending
                      ? "Adding..."
                      : "Add Mentor"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Bulk Upload Tab ----- */}
          <TabsContent value="bulk">
            <Card className="shadow-lg mt-4">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Bulk Upload via Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
                  <p className="text-sm text-gray-500 mb-4">Supported format: .xlsx, .xls, .csv</p>

                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>
                    Choose File
                  </Button>

                  {file && <p className="mt-3 text-sm text-gray-700">Selected: <span className="font-medium">{file.name}</span></p>}
                </div>
              {/* Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Excel Format Required:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Name</li>
            <li>• Email</li>
            <li>• Phone</li>
            <li>• Department</li>
            <li>• Specialization</li>
            <li className="mt-2 font-semibold">Backend will handle validation.</li>
          </ul>
        </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={!file || processing}
                  onClick={handleBulkUpload}
                >
                  {processing ? "Uploading..." : "Upload Excel"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

import { uploadStudentDocument } from "@/api/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import StudentLayout from "../components/layouts/StudentLayout";
export default function StudentUpload() {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [inputValues, setInputValues] = useState({});
const [fileError, setFileError] = useState(null);


  const requiredFields = {
  "10th_marksheet": ["percentage10"],
  "12th_marksheet": ["percentage12"],
  "Semester_results": ["sgpa"],
  "internship_certificate": ["domain", "start_date", "end_date"],
  "nptel_certificate": ["course_title", "weeks"],
  "course_certificate": ["course_name"],
  "skill_certificate": ["skill_name"],
  "other": ["title"]
};

  const isReadyToUpload = () => {
  if (!file || !documentType) return false;

  const fields = requiredFields[documentType] || [];
  return fields.every((field) => inputValues[field] && inputValues[field].toString().trim() !== "");
};

  const handleInputChange = (field, value) => {
    setInputValues((prev) => ({ ...prev, [field]: value }));
  };
  const handleUpload = async () => {
  if (!file || !documentType) {
    setStatus({ type: "error", message: "Please select a file and document type" });
    return;
  }

  const studentId = localStorage.getItem("userId"); // Use actual logged-in student ID
  const token = localStorage.getItem("access_token");

  if (!studentId || !token) {
    setStatus({ type: "error", message: "Login required before uploading" });
    return;
  }

  setUploading(true);
  setStatus(null);

  try {
    const formData = new FormData();
    formData.append("student", studentId);
    formData.append("document_type", documentType);
    formData.append("document", file);

    Object.keys(inputValues).forEach((key) => {
        formData.append(key, inputValues[key]);
      });

    const response = await uploadStudentDocument(formData); // JWT sent in API call
    console.log("✅ Upload success:", response.data);
    
    
    setStatus({
      type: "success",
      message: "Document uploaded successfully!",
    });

    setFile(null);
    setDocumentType("");
  } catch (error) {
    console.error("❌ Upload failed:", error.response?.data || error.message);
    setStatus({
      type: "error",
      message: error.response?.data
        ? JSON.stringify(error.response.data)
        : "Upload failed. Please try again.",
    });
  }

  setUploading(false);
};


  return (
    <StudentLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Upload Documents</h1>

        {/* Status alert */}
        {status && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <Alert
              variant={status.type === "error" ? "destructive" : "default"}
              className={status.type === "success" ? "border-green-500 bg-green-50" : ""}
            >
              {status.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription
                className={status.type === "success" ? "text-green-800" : ""}
              >
                {status.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Document Upload
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
  <SelectItem value="10th_marksheet">10th Marksheet</SelectItem>
  <SelectItem value="12th_marksheet">12th Marksheet</SelectItem>
  <SelectItem value="Semester_results">Semester Results</SelectItem>
  <SelectItem value="internship_certificate">Internship Certificate</SelectItem>
  <SelectItem value="nptel_certificate">NPTEL Certificate</SelectItem>
  <SelectItem value="course_certificate">Course Certificate</SelectItem>
  <SelectItem value="skill_certificate">Skill Certificate</SelectItem>
  <SelectItem value="other">Other</SelectItem>
</SelectContent>

              </Select>
            </div>

{documentType === "10th_marksheet" && (
              <div>
                <Label>10th Percentage *</Label>
                <input
                  type="number"
                  value={inputValues.percentage10 || ""}
                  onChange={(e) => handleInputChange("percentage10", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}
             {documentType === "12th_marksheet" && (
              <div>
                <Label>12th Percentage *</Label>
                <input
                  type="number"
                  value={inputValues.percentage12 || ""}
                  onChange={(e) => handleInputChange("percentage12", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

            {documentType === "Semester_results" && (
              <div>
                <Label>SGPA *</Label>
                <input
                  type="number"
                  value={inputValues.sgpa || ""}
                  onChange={(e) => handleInputChange("sgpa", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

             {documentType === "internship_certificate" && (
              <div className="space-y-2">
                <Label>Domain *</Label>
                <input
                  type="text"
                  value={inputValues.domain || ""}
                  onChange={(e) => handleInputChange("domain", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
                <Label>Start Date *</Label>
                <input
                  type="date"
                  value={inputValues.start_date || ""}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
                <Label>End Date *</Label>
                <input
                  type="date"
                  value={inputValues.end_date || ""}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

            {documentType === "nptel_certificate" && (
              <div className="space-y-2">
                <Label>Course Title *</Label>
                <input
                  type="text"
                  value={inputValues.course_title || ""}
                  onChange={(e) => handleInputChange("course_title", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
                <Label>Weeks *</Label>
                <input
                  type="number"
                  value={inputValues.weeks || ""}
                  onChange={(e) => handleInputChange("weeks", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

            {documentType === "course_certificate" && (
              <div>
                <Label>Course Name *</Label>
                <input
                  type="text"
                  value={inputValues.course_name || ""}
                  onChange={(e) => handleInputChange("course_name", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

            {documentType === "skill_certificate" && (
              <div>
                <Label>Skill Name *</Label>
                <input
                  type="text"
                  value={inputValues.skill_name || ""}
                  onChange={(e) => handleInputChange("skill_name", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}

            {documentType === "other" && (
              <div>
                <Label>Title *</Label>
                <input
                  type="text"
                  value={inputValues.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="input input-bordered w-full mt-2"
                />
              </div>
            )}


            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Choose Document</h3>

              <div>
                {/* Hidden file input */}
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
onChange={(e) => {
  const selectedFile = e.target.files[0];

  if (!selectedFile) return;

  const fileSizeMB = selectedFile.size / (1024 * 1024);

  if (fileSizeMB < 2) {
    setFileError("File must be at least 2 MB.");
    setFile(null);
    return;
  }

  if (fileSizeMB > 5) {
    setFileError("File size cannot exceed 5 MB.");
    setFile(null);
    return;
  }

  // Valid file → store it
  setFileError(null);
  setFile(selectedFile);
}}
                  className="hidden"
                  id="file-upload"
                />

                {/* Browse button (always enabled) */}
                <Button
                  type="button"
                  disabled={false}
                  className="cursor-pointer border border-gray-300 hover:bg-blue-50 text-gray-700"
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  Browse Files
                </Button>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Selected: {file.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload button */}
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-lg text-white"
              onClick={handleUpload}
              disabled={uploading || !file || !documentType || !isReadyToUpload()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Document
                </>
              )}
              

            </Button>
            {fileError && (
  <p className="text-red-600 text-sm mt-2">{fileError}</p>
)}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}

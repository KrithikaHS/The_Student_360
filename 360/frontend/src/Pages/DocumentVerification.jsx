import api from "@/api/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, FileText, Shield, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MentorLayout from "../components/layouts/MentorLayout";

export default function DocumentVerification() {
  const queryClient = useQueryClient();
  const [mentorData, setMentorData] = useState(null);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [status, setStatus] = useState(null);

  // Load mentor + students + documents
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await api.get("/mentor/me/students-documents/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMentorData(res.data.mentor);
        setStudents(res.data.students);
        setDocuments(res.data.students.flatMap(s => 
          (s.documents || []).map(d => ({ ...d, student_name: s.name, batch_year: s.batch_year }))
        ));
      } catch (err) {
        console.error("Error fetching mentor/students/documents:", err);
      }
    };
    loadData();
  }, []);

  // Filter pending documents
  const pendingDocs = documents.filter(d => d.status === "pending");

  const docsByYear = pendingDocs.reduce((acc, doc) => {
    const year = doc.batch_year || "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(doc);
    return acc;
  }, {});

  // Approve a document
// Approve a document
const handleApprove = async (doc) => {
  try {
    const token = localStorage.getItem("access_token");
    const res = await api.patch(
      `/documents/${doc.id}/approve/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update local documents state immediately
    setDocuments(prevDocs =>
      prevDocs.map(d => (d.id === doc.id ? { ...d, status: "approved" } : d))
    );

    setStatus({ type: "success", message: "Document approved successfully!" });
    setSelectedDoc(null);

  } catch (error) {
    // Show backend error if available
    const msg =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "Verification failed";
    setStatus({ type: "error", message: msg });
    console.error("Approve error:", error);
  }
};

// Reject a document
const handleReject = async (doc) => {
  if (!rejectionReason.trim()) {
    setStatus({ type: "error", message: "Please provide a rejection reason" });
    return;
  }

  try {
    const token = localStorage.getItem("access_token");
    const res = await api.patch(
      `/documents/${doc.id}/reject/`,
      { rejection_reason: rejectionReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update local documents state immediately
    setDocuments(prevDocs =>
      prevDocs.map(d => (d.id === doc.id ? { ...d, status: "rejected" } : d))
    );

    setStatus({ type: "success", message: "Document rejected successfully!" });
    setSelectedDoc(null);
    setRejectionReason("");

  } catch (error) {
    const msg =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "Rejection failed";
    setStatus({ type: "error", message: msg });
    console.error("Reject error:", error);
  }
};

  console.log(students);
  return (
    <MentorLayout mentorData={mentorData}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h1>
          <p className="text-gray-600">Review and verify student documents</p>
        </div>

        {status && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Documents List */}
           <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Pending Documents ({pendingDocs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingDocs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No pending documents</p>
                </div>
              ) : (
                Object.entries(docsByYear).map(([year, docs]) => (
                  <div key={year} className="mb-6">
                    <h3 className="font-semibold text-gray-700 text-lg px-4 py-2 bg-gray-100">{year}</h3>
                    <div className="divide-y divide-gray-100">
                      {docs.map(doc => (
                        <div
                          key={doc.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDoc?.id === doc.id ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <div className="font-medium text-gray-900">{doc.student_name}</div>
                          <div className="flex items-start justify-between mt-1">
                            <Badge variant="outline" className="capitalize">{doc.document_type.replace("_", " ")}</Badge>
                            <span className="text-xs text-gray-400">{format(new Date(doc.uploaded_at), "MMM d")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedDoc ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a document to review</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedDoc.student_name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">USN:</span>
                        <p className="font-medium">{selectedDoc.student_usn}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{selectedDoc.document_type.replace("_", " ")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Uploaded:</span>
                        <p className="font-medium">{format(new Date(selectedDoc.uploaded_at), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">File:</span>
                        <p className="font-medium">{selectedDoc.document_name || "N/A"}</p>
                      </div>
                    </div>

                    {/* Metadata display */}
                    {selectedDoc.metadata && Object.keys(selectedDoc.metadata).length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Metadata
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(selectedDoc.metadata).map(([key, value]) => (
                            value && (
                              <div key={key}>
                                <span className="text-blue-700 capitalize">{key}: </span>
                                <span className="text-blue-900 font-medium">{value.toString()}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View Document */}
                    {selectedDoc.document && (
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <a href={selectedDoc.document} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Document
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Approve / Reject */}
                  <div className="space-y-3 mt-4">
                    <Textarea
                      placeholder="Rejection reason (required if rejecting)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-24 bg-white"
                    />
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleReject(selectedDoc)}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" onClick={() => handleApprove(selectedDoc)}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve & Upload
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}

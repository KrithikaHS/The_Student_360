import api from "@/api/api";
import { useEffect, useState } from "react";
import MentorLayout from "../components/layouts/MentorLayout";
import MentorStatsCards from "../components/mentor/MentorStatsCards";
import StudentListCard from "../components/mentor/StudentListCard";

export default function MentorDashboard() {
  const [mentorData, setMentorData] = useState(null);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");

  // Load mentor + students + documents from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await api.get("/mentor/me/students-documents/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMentorData(res.data.mentor);
        setStudents(res.data.students);
        // Flatten all documents for stats calculation
        setDocuments(
          res.data.students.flatMap((s) =>
            (s.documents || []).map((d) => ({
              ...d,
              student_name: s.name,
              batch_year: s.batch_year,
              // student_usn: s.usn,
            }))
          )
        );
      } catch (err) {
        console.error("Error fetching mentor/students/documents:", err);
      }
    };
    loadData();
  }, []);

  // Compute years for dropdown filter
  const years = [...new Set(students.map((s) => s.batch_year))];

  // Filter students by year
  const filteredStudents =
    selectedYear === "all"
      ? students
      : students.filter((s) => s.batch_year === selectedYear);

  // Compute stats from backend documents
  const pendingDocs = documents.filter((d) => d.status === "pending").length;
  const verifiedDocs = documents.filter((d) => d.status === "approved").length;
console.log("Documents fetched:", documents);

  // Average CGPA
  const avgCGPA =
    students.length > 0
      ? (
          students.reduce((sum, s) => sum + (s.cgpa || 0), 0) /
          students.length
        ).toFixed(2)
      : 0;

  return (
    <MentorLayout mentorData={mentorData}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {mentorData?.name || "Mentor"}
          </h1>
          <p className="text-gray-600">
            Manage your assigned students and verify documents
          </p>
        </div>

        {/* Stats */}
        <MentorStatsCards
          totalStudents={students.length}
          pendingDocs={pendingDocs}
          verifiedDocs={verifiedDocs}
          avgCGPA={avgCGPA}
        />

        {/* Students */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
            <p className="text-gray-600">View and manage your assigned students</p>
          </div>

          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white shadow"
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Student cards */}
          <div className="mt-8">
            <StudentListCard students={filteredStudents} />
          </div>
        </div>
      </div>
    </MentorLayout>
  );
}

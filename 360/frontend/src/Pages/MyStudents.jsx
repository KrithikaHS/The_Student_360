import api from "@/api/api";
import { useEffect, useState } from "react";
import MentorLayout from "../components/layouts/MentorLayout";
import StudentListCard from "../components/mentor/StudentListCard";

export default function MyStudents() {
  const [mentorData, setMentorData] = useState(null);
  const [students, setStudents] = useState([]);
    const [selectedYear, setSelectedYear] = useState("all");

  // Fetch current mentor + their students
  useEffect(() => {
    const loadData = async () => {
      try {
  const token = localStorage.getItem("access_token");

  const res = await api.get("/mentor/me/students/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setMentorData(res.data.mentor);
  setStudents(res.data.students);

} catch (err) {
        console.error("Error fetching mentor data:", err);
      }
    };
    loadData();
  }, []);

  const years = [...new Set(students.map((s) => s.batch_year))];

  // 🟩 Filter students based on selected year
  const filteredStudents =
    selectedYear === "all"
      ? students
      : students.filter((s) => s.batch_year === selectedYear);

  return (
    <MentorLayout mentorData={mentorData}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-600">View and manage your assigned students</p>
        </div>

        {/* 🔽 Year Filter Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white shadow"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        

        <StudentListCard students={filteredStudents} />
      </div>
    </MentorLayout>
  );
}

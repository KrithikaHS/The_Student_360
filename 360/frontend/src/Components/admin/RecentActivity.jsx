import { getMentors, getStudents } from "@/api/api";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function RecentActivity() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState("students");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  // ----------------- FETCH DATA -----------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const sData = await getStudents();
        const mData = await getMentors();
        setStudents(sData || []);
        setMentors(mData || []);
      } catch (error) {
        console.error("Error loading:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ----------------- DEPARTMENTS -----------------
  const departmentOptions = useMemo(() => {
    const setDept = new Set();
    students?.forEach((s) => s.branch && setDept.add(s.branch));
    mentors?.forEach((m) => m.department && setDept.add(m.department));
    return [...setDept];
  }, [students, mentors]);

  // ----------------- YEAR OPTIONS (DYNAMIC) -----------------
  const yearOptions = useMemo(() => {
    const years = [];
    const start = 2015;
    const end = new Date().getFullYear();

    for (let y = start; y <= end; y++) {
      years.push(`${y}-${y + 1}`);
    }
    return years;
  }, []);

  // ----------------- FILTERED DATA -----------------
  const filteredData = useMemo(() => {
    if (type === "students") {
      return students
        .filter((s) => (department ? s.branch === department : true))
        .filter((s) => (year ? String(s.batch_year) === String(year) : true));
    }

    if (type === "mentors") {
      return mentors.filter((m) =>
        department ? m.department === department : true
      );
    }

    return [];
  }, [type, department, year, students, mentors]);

  // ----------------- EXPORT EXCEL -----------------
  const handleDownloadExcel = () => {
    if (!filteredData.length) {
      alert("No data available for selected filters");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(
      wb,
      `${type}_${department || "All"}_${year || "All"}.xlsx`
    );
  };

  // ----------------- RENDER -----------------
  if (loading) {
    return <p className="text-center p-6">Loading data...</p>;
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Recent Activity</h1>

      {/* Filters Section */}
<div className="flex flex-wrap gap-4 mb-5">
  {/* Student/Mentor Switch */}
  <div className="relative">
    <select
      value={type}
      onChange={(e) => {
        setType(e.target.value);
        setYear(""); // Reset year when switching
      }}
      className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
    >
      <option value="students">Students</option>
      <option value="mentors">Mentors</option>
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
      ▼
    </div>
  </div>

  {/* Department Filter */}
  <div className="relative">
    <select
      value={department}
      onChange={(e) => setDepartment(e.target.value)}
      className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
    >
      <option value="">All Departments</option>
      {departmentOptions.map((dept, i) => (
        <option key={i} value={dept}>
          {dept}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
      ▼
    </div>
  </div>

  {/* Dynamic Year Filter — Only for Students */}
  {type === "students" && (
    <div className="relative">
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
      >
        <option value="">All Years</option>
        {yearOptions.map((yr, i) => (
          <option key={i} value={yr}>
            {yr}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        ▼
      </div>
    </div>
  )}

  {/* Download Button */}
  <button
    onClick={handleDownloadExcel}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
  >
    Export Excel
  </button>
</div>


      {/* ------- Table ------- */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {type === "students" ? (
              <>
                <th className="border p-2">Name</th>
                <th className="border p-2">Branch</th>
                <th className="border p-2">Year</th>
              </>
            ) : (
              <>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Department</th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={idx} className="border">
              {type === "students" ? (
                <>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.branch}</td>
                  <td className="border p-2">{item.batch_year}</td>
                </>
              ) : (
                <>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.email}</td>
                  <td className="border p-2">{item.department}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

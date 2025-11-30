// src/pages/admin/AutoAssignMentors.jsx
import { autoAssignMentors, getMentors, getStudents } from "@/api/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Download, GitBranch, Loader2, UserCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import AdminLayout from "../components/layouts/AdminLayout";
export default function AutoAssignMentors() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
    retry: 1,
    staleTime: 1000 * 30,
  });

  const { data: mentors = [], isLoading: loadingMentors } = useQuery({
    queryKey: ["mentors"],
    queryFn: getMentors,
    retry: 1,
    staleTime: 1000 * 30,
  });

  // compute assigned mentor id accessor (flexible to either backend naming)
  const getAssignedMentorId = (student) => {
    if (!student) return null;
    if (student.assigned_mentor_id) return student.assigned_mentor_id;
    if (student.assigned_mentor && typeof student.assigned_mentor === "number") return student.assigned_mentor;
    if (student.assigned_mentor && student.assigned_mentor.id) return student.assigned_mentor.id;
    return null;
  };

  // Map mentorId => number of assigned students (computed from students array)
  const mentorAssignedCounts = useMemo(() => {
    const counts = {};
    for (const s of students) {
      const mid = getAssignedMentorId(s);
      if (mid) counts[mid] = (counts[mid] || 0) + 1;
    }
    return counts;
  }, [students]);


  // derive unassigned students (flexible check)
  const unassignedStudents = students.filter((s) => !getAssignedMentorId(s));
console.log(mentors)
  // If mentor objects include current_student_count & max_students, prefer them; otherwise compute
  const enrichedMentors = mentors.map((m) => {
    const id = m.id || m.pk || m.mentorId;
    const computedCount = mentorAssignedCounts[m.id || m.pk] || 0;
    const current_count = (typeof m.current_student_count === "number") ? m.current_student_count : computedCount;
    const max_students = (typeof m.max_students === "number") ? m.max_students : null;
    return { ...m, current_count, max_students };
  });

  // available mentors are those with capacity (either using max_students if present, else always available)
  const availableMentors = enrichedMentors.filter((m) => {
  const max = Number(m.max_students);

  // Missing / invalid max_students → treat as infinite capacity
  if (!max || max <= 0) {
    return true;
  }

  const current = Number(m.current_count) || 0;

  // Show mentors who can accommodate more
  return current < max;
});


  // helper to compute "max assigned" used in your description (shows computed per-mentor target if backend doesn't set max)
  const computedMaxPerMentor = (() => {
    if (mentors.length === 0) return 0;
    return Math.ceil(students.length / mentors.length);
  })();
// ⭐ Dynamic year selection (10 years auto)
const [selectedYear, setSelectedYear] = useState("");

const years = useMemo(() => {
  const list = [];
  const current = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const start = current - i - 1;
    const end = current - i;
    list.push(`${start}-${end}`);
  }
  return list;
}, []);
const filteredStudents = useMemo(() => {
  if (!selectedYear) return students;
  return students.filter((s) => s.batch_year === selectedYear);
}, [selectedYear, students]);

  // ------------------------------------------------------
  // ⭐ EXCEL EXPORT FUNCTION
  // ------------------------------------------------------
  const downloadExcel = () => {
  // use selectedYear if available; if you haven't added it, set selectedYear = null/'' earlier
  const yearLabel = selectedYear || "All Years";

  // filter students by year (if selectedYear exists)
  const filteredStudents = selectedYear
    ? students.filter((s) => s.batch_year === selectedYear)
    : students.slice();

  if (filteredStudents.length === 0) {
    alert("No student data to export for selected year");
    return;
  }
  if (!mentors || mentors.length === 0) {
    alert("No mentor data to export");
    return;
  }

  // group students by mentor id
  const byMentor = {};
  for (const s of filteredStudents) {
    const mid = getAssignedMentorId(s);
    if (!mid) continue; // skip unassigned
    if (!byMentor[mid]) byMentor[mid] = [];
    byMentor[mid].push(s);
  }

  // prepare rows: first two rows are Year and blank, then header
  const rows = [];
  rows.push([`Year : ${yearLabel}`]);
  rows.push([]); // blank
  rows.push(["Mentor Name", "Phone", "Student Name"]);

  // iterate mentors in a stable order (by mentor name)
  const mentorList = mentors.filter((m) => byMentor[m.id] && byMentor[m.id].length > 0)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  console.log(mentorList)
  for (const m of mentorList) {
    const stuList = byMentor[m.id] || [];
    // sort students by name
    stuList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    // first student row includes mentor name
    if (stuList.length > 0) {
      rows.push([m.name || "—", m.phone || "—", stuList[0].name || "—"]);
      // remaining students: empty mentor name, repeat phone, student name
      for (let i = 1; i < stuList.length; i++) {
        rows.push(["", m.phone || "—", stuList[i].name || "—"]);
      }
    }
    // blank row after each mentor group
    rows.push([]);
  }

  // Create worksheet from rows
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // set column widths for nicer view (approx chars)
  ws['!cols'] = [
    { wch: 30 }, // Mentor Name
    { wch: 18 }, // Phone
    { wch: 40 }  // Student Name
  ];

  // Optionally make header row bold (simple approach: set cell.s if supported by reader)
  // Many spreadsheet viewers ignore styles in JS-generated files. We'll skip complex styling to keep compatibility.

  // Create workbook & append
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mentor Allocation");

  const filename = `Mentor_Student_${selectedYear || "All"}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);
};



  const handleAutoAssign = async () => {
  setProcessing(true);
  setStatus(null);

  try {
    // Step 1: Sort mentors & unassigned students alphabetically
    const sortedMentors = [...mentors].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const sortedStudents = [...students].filter(s => !getAssignedMentorId(s))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    if (sortedMentors.length === 0 || sortedStudents.length === 0) {
      setStatus({ type: "error", message: "No mentors or unassigned students to process." });
      setProcessing(false);
      return;
    }

    let maxPerMentor = 5;
    let assignedStudents = [];
    const alreadyAssignedMap = {};

    // Include already assigned students in map
    for (const s of students) {
      const mid = getAssignedMentorId(s);
      if (mid) {
        if (!alreadyAssignedMap[mid]) alreadyAssignedMap[mid] = [];
        alreadyAssignedMap[mid].push(s);
      }
    }

    // Step 2: Distribute students to mentors
    let remainingStudents = [...sortedStudents];
    while (remainingStudents.length > 0) {
      let assignedThisRound = 0;

      for (const mentor of sortedMentors) {
        const mid = mentor.id;
        if (!alreadyAssignedMap[mid]) alreadyAssignedMap[mid] = [];

        const availableSlots = maxPerMentor - alreadyAssignedMap[mid].length;
        if (availableSlots <= 0) continue;

        const toAssign = remainingStudents.splice(0, availableSlots);
        alreadyAssignedMap[mid].push(...toAssign);
        assignedThisRound += toAssign.length;
      }

      // If no students were assigned this round, increase maxPerMentor
      if (assignedThisRound === 0) {
        maxPerMentor += 3; // increment by 3 each round
      }
    }

    // Step 3: Prepare payload for backend (mentor_id -> student_ids)
    const payload = [];
    for (const [mentorId, stuList] of Object.entries(alreadyAssignedMap)) {
      for (const stu of stuList) {
        if (!getAssignedMentorId(stu)) { // only add newly assigned
          payload.push({ student_id: stu.id, mentor_id: Number(mentorId) });
        }
      }
    }

    // Step 4: Send to backend
    // Example: await api.post("/students/auto-assign/", payload);
    const result = await autoAssignMentors(payload); // adapt your API

    setStatus({
      type: "success",
      message: `Auto-assignment completed. Assigned ${payload.length} new students.`,
    });

    queryClient.invalidateQueries(["students"]);
    queryClient.invalidateQueries(["mentors"]);
  } catch (error) {
    console.error(error);
    setStatus({ type: "error", message: "Failed to auto-assign mentors." });
  } finally {
    setProcessing(false);
  }
};


  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Assign Mentors</h1>
          <p className="text-gray-600">
            Automatically assign students to mentors — backend-driven equal distribution per department.
          </p>
        </div>

        {status && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <Alert
              variant={status.type === "error" ? "destructive" : "default"}
              className={
                status.type === "success"
                  ? "border-green-500 bg-green-50"
                  : status.type === "info"
                  ? "border-blue-500 bg-blue-50"
                  : ""
              }
            >
              {status.type === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription
                className={status.type === "success" ? "text-green-800" : status.type === "info" ? "text-blue-800" : ""}
              >
                {status.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* --- Stats Section --- */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Unassigned Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {loadingStudents ? <Loader2 className="w-12 h-12 animate-spin mx-auto" /> : unassignedStudents.length}
              </div>
              <p className="text-gray-600">Students waiting for mentor</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
                Available Mentors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {loadingMentors ? <Loader2 className="w-12 h-12 animate-spin mx-auto" /> : availableMentors.length}
              </div>
              <p className="text-gray-600">Mentors with capacity</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Overview --- */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Assignment Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Total Students</span>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {loadingStudents ? "—" : students.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Total Mentors</span>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {loadingMentors ? "—" : mentors.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Already Assigned</span>
              <Badge className="text-lg px-4 py-1 bg-green-100 text-green-800">
                {loadingStudents ? "—" : students.length - unassignedStudents.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Pending Assignment</span>
              <Badge className="text-lg px-4 py-1 bg-yellow-100 text-yellow-800">
                {loadingStudents ? "—" : unassignedStudents.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Max students per mentor (computed)</span>
              <Badge className="text-lg px-4 py-1 bg-indigo-50 text-indigo-800">
                {loadingStudents || loadingMentors ? "—" : (mentors.length ? computedMaxPerMentor : "—")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* --- How it Works --- */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                How Auto-Assignment Works:
              </h3>
              <ul className="text-sm text-indigo-800 space-y-2 list-disc list-inside">
                <li>Students are assigned by backend (equal distribution across mentors in same dept).</li>
                <li>Already assigned students remain untouched by backend assignment.</li>
                <li>If backend provides `max_students` it will be respected; otherwise we compute a per-mentor target.</li>
                <li>New students added later will be assigned when you run this again.</li>
              </ul>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-6 text-lg"
              onClick={handleAutoAssign}
              disabled={processing || loadingStudents || loadingMentors || unassignedStudents.length === 0}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Assigning Mentors...
                </>
              ) : (
                <>
                  <GitBranch className="w-5 h-5 mr-2" />
                  Start Auto-Assignment
                </>
              )}
            </Button>

           
          </CardContent>
        </Card>
      </div>
      <Card>
        <div className="mb-4">
  <label className="font-semibold">Select Academic Year:</label>
  <select
    className="w-full border rounded p-2 mt-2"
    value={selectedYear}
    onChange={(e) => setSelectedYear(e.target.value)}
  >
    <option value="">All Years</option>
    {years.map((y) => (
      <option key={y} value={y}>{y}</option>
    ))}
  </select>
</div>

        <CardContent>
           {/* ⭐ NEW EXCEL DOWNLOAD BUTTON */}
          <Button
            className="w-full bg-green-600 text-white py-6 text-lg"
            onClick={downloadExcel}
          >
            <Download className="mr-2" /> Download Mentor–Student Excel
          </Button>

        </CardContent>
      </Card>
    </AdminLayout>
  );
}

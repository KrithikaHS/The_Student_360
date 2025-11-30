import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PlacementLayout from "../Components/layouts/PlacementLayout";

export default function PlacementDashboard() {
  // -------------------------------------------------------
  // STATES
  // -------------------------------------------------------

  const [activeTab, setActiveTab] = useState("bulk");

  // Academic year
  const [year, setYear] = useState("");



  const [search, setSearch] = useState("");

  const [bulkCompany, setBulkCompany] = useState("");
  const [bulkCtc, setBulkCtc] = useState("");
  const [bulkType, setBulkType] = useState("service");
  const [bulkFile, setBulkFile] = useState(null);

  const [manual, setManual] = useState({
    company: "",
    ctc: "",
    type: "service",
  });

  // removed selectedBranches (we use filters.branches instead)
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentCtc, setStudentCtc] = useState({});

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleCtcChange = (id, value) => {
    setStudentCtc((prev) => ({ ...prev, [id]: value }));
  };

  // KPI data (placeholder — replace with real data later)
  const stats = {
    total_students: 120,
    placed_students: 78,
    unplaced_students: 42,
  };

  // -------------------------------------------------------
  // STUDENT QUERY (all students used for main list + dynamic branches)
  // -------------------------------------------------------
  const { data: students = [] } = useQuery({
    queryKey: ["all_students"],
    queryFn: () =>
      fetch("http://127.0.0.1:8000/api/student360/placement/get_students", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch students");
        return r.json();
      }),
  });

  const yearOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.batch_year) set.add(s.batch_year);
    });
    return [...set].sort(); // sorted dropdown
  }, [students]);
  // Dynamic branch list (derived from students)
  const branches = useMemo(() => {
    const setB = new Set();
    students.forEach((s) => s.branch && setB.add(s.branch));
    return [...setB];
  }, [students]);
  // -------------------------------------------------------
  // FILTERS + FILTERED LISTS
  // -------------------------------------------------------
  const [filters, setFilters] = useState({
    branches: ["all"], // default all branches
  });

  // Main filtered students (applies branch + search)
  const filteredStudents = useMemo(() => {
    const q = search?.toLowerCase?.() || "";
    return students.filter((s) => {
      const matchBranch =
        filters.branches.includes("all") || filters.branches.includes(s.branch);

      const matchSearch =
        s.name?.toLowerCase().includes(q) ||
        s.usn?.toLowerCase().includes(q);

      return matchBranch && matchSearch;
    });
  }, [students, filters, search]);

  // Filtered search results (apply same branch filter to search API results)
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter((s) => {
      const matchBranch =
        filters.branches.includes("all") ||
        filters.branches.includes(s.branch);

      const matchYear =
        !year || year === "" || year === "all"
          ? true
          : String(s.batch_year) === String(year);

      return matchBranch && matchYear;
    });
  }, [searchResults, filters, year]);


  const resetFilters = () =>
    setFilters({
      branches: ["all"],

    });

  const toggleBranch = (branch) => {
    setFilters((prev) => {
      let newBranches = [...prev.branches];

      if (branch === "all") {
        newBranches = ["all"];
      } else {
        // remove 'all' if selecting a specific branch
        newBranches = newBranches.filter((b) => b !== "all");
        if (newBranches.includes(branch)) {
          newBranches = newBranches.filter((b) => b !== branch);
        } else {
          newBranches.push(branch);
        }
        if (newBranches.length === 0) newBranches = ["all"];
      }

      return { ...prev, branches: newBranches };
    });
  };

  const toggleSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------
  // SEARCH API
  // -------------------------------------------------------
  const searchStudents = async (value) => {
    setQuery(value);
    // only search when 2+ chars (same logic as before)
    if (!value || value.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/student360/placement/searchstudent/?q=${encodeURIComponent(
          value
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!res.ok) {
        // handle non-JSON error responses gracefully
        console.warn("Search returned non-OK:", res.status);
        setSearchResults([]);
        return;
      }

      const data = await res.json();
      // ensure data is array
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Search error:", err);
      setSearchResults([]);
    }
  };

  // -------------------------------------------------------
  // BULK UPLOAD
  // -------------------------------------------------------
  const handleBulkUpload = async () => {
    if (!bulkFile) return alert("Please select an Excel file!");
    if (!bulkCompany) return alert("Enter company name!");

    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("company_name", bulkCompany);
    formData.append("company_type", bulkType);
    formData.append("year", year);
    if (bulkCtc) formData.append("default_ctc", bulkCtc);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/student360/placement/bulk-upload/",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Bulk upload failed");
      }
      alert("Bulk Upload Successful!");
    } catch (err) {
      alert("Bulk upload failed: " + err.message);
    }
  };

  // -------------------------------------------------------
  // MANUAL ASSIGN
  // -------------------------------------------------------
  const handleManualAssign = async () => {
    if (selectedStudents.length === 0) return alert("No students selected!");

    const payload = {
      company: manual.company,
      type: manual.type,
      ctc: manual.ctc || null,
      year,
      students: selectedStudents.map((id) => ({
        id,
        ctc: studentCtc[id] || manual.ctc || null,
      })),
    };

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/student360/placement/manual-assign-offer/",
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Manual assign failed");
      }
      alert("Manual placement saved!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // -------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------
  const exportPlacedBranch = async () => {
    window.open(`/api/student360/placement/export/placed/?year=${year}`);
  };

  const exportUnplaced = async () => {
    window.open(`/api/student360/placement/export/unplaced/?year=${year}`);
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <PlacementLayout>
      <div className="w-full p-6 space-y-10">
        {/* KPI CARDS */}


        {/* YEAR INPUT */}
        <div className="bg-white/70 rounded-2xl p-6 shadow border">
          <label className="block font-medium mb-1">Academic Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-52 bg-pink-50 p-2 rounded-md border"
          >
            <option value="">Select Year</option>

            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>


          <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY</p>
        </div>

        {/* TABS */}
        <div className="flex gap-3">
          <Button
            variant={activeTab === "bulk" ? "default" : "outline"}
            onClick={() => setActiveTab("bulk")}
            className="rounded-xl"
          >
            Bulk Upload
          </Button>

          <Button
            variant={activeTab === "manual" ? "default" : "outline"}
            onClick={() => setActiveTab("manual")}
            className="rounded-xl"
          >
            Manual Placement
          </Button>
        </div>

        {/* BULK UPLOAD TAB */}
        {activeTab === "bulk" && (
          <div className="bg-white/70 border rounded-2xl p-6 space-y-5 shadow">
            <h2 className="text-xl font-semibold text-gray-700">
              Bulk Upload Placement Data
            </h2>

            <div>
              <label className="font-medium">Company Name</label>
              <Input
                placeholder="Google"
                className="mt-1 bg-purple-50"
                value={bulkCompany}
                onChange={(e) => setBulkCompany(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium">Company Type</label>
              <select
                className="mt-1 p-2 w-full bg-purple-50 border rounded-lg"
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="dream">Dream</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Default CTC (optional)</label>
              <Input
                placeholder="e.g. 8"
                className="mt-1 w-40 bg-purple-50"
                value={bulkCtc}
                onChange={(e) => setBulkCtc(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium">Upload Excel File</label>
              <Input
                type="file"
                accept=".xlsx"
                className="mt-1 bg-purple-50"
                onChange={(e) => setBulkFile(e.target.files[0])}
              />
              <p className="text-xs text-gray-500 mt-1">
                Excel must contain: <b>name</b>, <b>usn</b>, <b>ctc</b> (optional)
              </p>
            </div>

            <Button
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
              onClick={handleBulkUpload}
            >
              Upload
            </Button>
          </div>
        )}

        {/* MANUAL ASSIGN */}
        {activeTab === "manual" && (
          <div className="bg-white/70 border rounded-2xl p-6 space-y-8 shadow">
            <h2 className="text-xl font-semibold text-gray-700">
              Manual Placement Entry
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="font-medium">Company Name</label>
                <Input
                  placeholder="Company Name"
                  value={manual.company}
                  onChange={(e) => setManual({ ...manual, company: e.target.value })}
                />
              </div>

              <div>
                <label className="font-medium">Common CTC</label>
                <Input
                  className="mt-1 bg-pink-50"
                  placeholder="(optional)"
                  value={manual.ctc}
                  onChange={(e) => setManual({ ...manual, ctc: e.target.value })}
                />
              </div>

              <div>
                <label className="font-medium">Company Type</label>
                <select
                  className="mt-1 p-2 w-full bg-pink-50 border rounded-lg"
                  value={manual.type}
                  onChange={(e) => setManual({ ...manual, type: e.target.value })}
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="dream">Dream</option>
                </select>
              </div>
            </div>

            {/* Search Student */}
            <div className="flex flex-col gap-4">
              <Input
                className="bg-purple-50"
                placeholder="Search students..."
                value={query}
                onChange={(e) => searchStudents(e.target.value)}
              />

              {filteredSearchResults.length > 0 && (
                <div className="mt-3 border rounded-xl p-3 bg-white shadow-sm">
                  {filteredSearchResults.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center p-3 border-b last:border-none"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.usn}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                        />

                        <Input
                          className="w-28 bg-pink-50"
                          placeholder="CTC"
                          value={studentCtc[s.id] || ""}
                          onChange={(e) => handleCtcChange(s.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Filter by Branch</h4>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.branches.includes("all")}
                      onChange={() => toggleBranch("all")}
                    />
                    <span>All</span>
                  </label>

                  {branches.map((branch) => (
                    <label key={branch} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.branches.includes(branch)}
                        onChange={() => toggleBranch(branch)}
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Student List */}
            {/* <div className="space-y-4">
              {filteredStudents?.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-4 rounded-xl border bg-white/50"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.usn}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />

                    <Input
                      className="w-28 bg-pink-50"
                      placeholder="CTC"
                      value={studentCtc[s.id] || ""}
                      onChange={(e) =>
                        setStudentCtc({
                          ...studentCtc,
                          [s.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div> */}

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              onClick={handleManualAssign}
            >
              Assign to Selected Students
            </Button>
          </div>
        )}

        {/* EXPORT
        <div className="bg-white/70 border rounded-2xl p-6 shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Export Options</h2>

          <div className="flex gap-4">
            <Button variant="outline" className="rounded-xl" onClick={exportPlacedBranch}>
              Export Placed by Branch
            </Button>

            <Button variant="outline" className="rounded-xl" onClick={exportUnplaced}>
              Export Unplaced Students
            </Button>
          </div>
        </div> */}

        {/* NOTES */}
        {/* <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border shadow text-gray-600">
          <h3 className="font-semibold text-gray-700 mb-2">Notes & Tips</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>Year is required for all uploads/placements.</li>
            <li>
              Bulk Excel must contain: <b>name</b>, <b>usn</b> (optional),{" "}
              <b>ctc</b> (optional).
            </li>
            <li>Manual mode supports individual CTC entry.</li>
            <li>Use branch filter + search to find students faster.</li>
          </ul>
        </div> */}
      </div>
    </PlacementLayout>
  );
}

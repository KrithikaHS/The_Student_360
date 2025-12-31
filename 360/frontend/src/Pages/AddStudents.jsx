import { bulkUploadStudents } from "@/api/api"; // uses your api helper (reads token from localStorage)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import AdminLayout from "../components/layouts/AdminLayout";
export default function AddStudents() {
  const queryClient = useQueryClient();
const [selectedYear, setSelectedYear] = useState("");
const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    marks10: "",
    maxMarks10: "",
    percentage10: "",
    marks12: "",
    maxMarks12: "",
    percentage12: "",
  });

  const [marks10File, setMarks10File] = useState(null);
  const [marks12File, setMarks12File] = useState(null);

  const [ocrProcessing10, setOcrProcessing10] = useState(false);
  const [ocrProcessing12, setOcrProcessing12] = useState(false);

  const [statusMsg, setStatusMsg] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [file, setFile] = useState(null);

  // -------------------
  // React Query mutation using your createStudent API
  // -------------------
  const createStudentMutation = useMutation({
    mutationFn: (payload) => createStudent(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["students"]);
      setFormData({
        name: "",
        dob: "",
        marks10: "",
        maxMarks10: "",
        percentage10: "",
        marks12: "",
        maxMarks12: "",
        percentage12: "",
        branch:"",
      });
      setMarks10File(null);
      setMarks12File(null);
      setUploadStatus({ type: "success", message: "Student added successfully!" });
    },
    onError: (err) => {
      console.error("Create student failed:", err);
      setUploadStatus({ type: "error", message: "Failed to add student" });
    },
  });

  // ----------------------------------------------------------
  // Robust parser (server-like) — prefer slash, keyword lines, heuristics
  // Returns { obtained, max, percentage } or null
  // ----------------------------------------------------------
  const parseMarksFromText = (rawText) => {
    if (!rawText || typeof rawText !== "string") return null;

    const text = rawText.replace(/\u00A0/g, " ").toLowerCase();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const currentYear = new Date().getFullYear();

    const isYear = (n) => n >= 1900 && n <= currentYear + 1;
    const plausibleMarks = (n) => n >= 0 && n <= 5000;
    const percentOf = (obt, max) => (max > 0 ? (obt / max) * 100 : -1);

    // 1) explicit slash pattern (e.g., 457/625)
    for (const ln of lines) {
      const slashMatch = ln.match(/(\d{1,4})\s*[\/|\\]\s*(\d{1,4})/);
      if (slashMatch) {
        const a = Number(slashMatch[1]);
        const b = Number(slashMatch[2]);
        if (!isYear(a) && !isYear(b) && plausibleMarks(a) && plausibleMarks(b)) {
          if (a <= b) {
            const pct = percentOf(a, b);
            if (pct >= 0 && pct <= 150) return { obtained: a, max: b, percentage: pct.toFixed(2) };
          } else {
            const pct = percentOf(b, a);
            if (pct >= 0 && pct <= 150) return { obtained: b, max: a, percentage: pct.toFixed(2) };
          }
        }
      }
    }

    // 2) keyword-based lines (total, obtained, max, out of)
    const keywordRegex = /\b(total|grand total|aggregate|marks obtained|marks|obtained|out of|maximum|max|secured)\b/i;
    for (const ln of lines) {
      if (keywordRegex.test(ln)) {
        const nums = ln.match(/\d{1,4}/g)?.map(Number) || [];
        const filtered = nums.filter((n) => !isYear(n) && plausibleMarks(n));
        if (filtered.length >= 2) {
          let obtained = filtered[filtered.length - 2];
          let max = filtered[filtered.length - 1];
          if (obtained > max) {
            const pctSwap = percentOf(max, obtained);
            if (pctSwap >= 0 && pctSwap <= 150) [obtained, max] = [max, obtained];
          }
          const pct = percentOf(obtained, max);
          if (pct >= 0 && pct <= 150) return { obtained, max, percentage: pct.toFixed(2) };
        } else if (filtered.length === 1) {
          const single = filtered[0];
          if (/out of|maximum|max/i.test(ln)) {
            const allNums = text.match(/\d{1,4}/g)?.map(Number) || [];
            const candidates = allNums.filter((n) => !isYear(n) && n !== single && plausibleMarks(n));
            let obtained = candidates.filter((n) => n <= single).sort((a,b) => Math.abs(single - a) - Math.abs(single - b))[0];
            if (obtained) {
              const pct = percentOf(obtained, single);
              if (pct >= 0 && pct <= 150) return { obtained, max: single, percentage: pct.toFixed(2) };
            }
          }
        }
      }
    }

    // 3) heuristic across all numbers
    const allNums = text.match(/\d{1,4}/g)?.map(Number) || [];
    const filteredAll = allNums.filter((n) => !isYear(n) && plausibleMarks(n));
    if (filteredAll.length >= 2) {
      let best = null;
      for (let i = 0; i < filteredAll.length; i++) {
        for (let j = i + 1; j < filteredAll.length; j++) {
          const a = filteredAll[i];
          const b = filteredAll[j];
          const pct1 = percentOf(a, b);
          const pct2 = percentOf(b, a);
          if (pct1 >= 0 && pct1 <= 100) {
            const score = 100 - Math.abs(50 - pct1);
            if (!best || score > best.score) best = { obtained: a, max: b, percentage: pct1, score };
          }
          if (pct2 >= 0 && pct2 <= 100) {
            const score = 100 - Math.abs(50 - pct2);
            if (!best || score > best.score) best = { obtained: b, max: a, percentage: pct2, score };
          }
        }
      }
      if (best) {
        return { obtained: best.obtained, max: best.max, percentage: best.percentage.toFixed(2) };
      }
    }

    // nothing found
    return null;
  };

  // Extract DOB (dd/mm/yyyy or dd-mm-yyyy) and return yyyy-mm-dd for input[type=date]
  const extractDOB = (text) => {
    const match = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
    if (!match) return "";
    const [d, m, y] = match[0].split(/\/|-/);
    return `${y}-${m}-${d}`;
  };

  // Run Tesseract fallback (returns text)
  const runTesseractFallback = async (file) => {
    setStatusMsg("🟡 API failed → Switching to backup OCR…");
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    setStatusMsg("🟡 Extracting marks…");
    return text;
  };

  // Call backend OCR first, then fallback to Tesseract
  const runOCREngine = async (file, type) => {
    setStatusMsg("🟦 OCR Running… Sending to OCR API");

    try {
      const formData = new FormData();
formData.append("file", file);

const res = await axios.post(
  "http://127.0.0.1:8000/api/student360/ocr/",
  formData,
  { headers: { "Content-Type": "multipart/form-data" } }
);


      if (!res.data || typeof res.data !== "object") throw new Error("Invalid OCR API response");

      // If backend parsed marks, use them directly
      if (res.data.obtained !== null && res.data.max !== null) {
        setStatusMsg("🟢 OCR API succeeded — extracting values");
        // Use backend's text + values
        setFormData((prev) => ({
          ...prev,
          ...(type === "10th"
            ? {
                marks10: res.data.obtained,
                maxMarks10: res.data.max,
                percentage10: res.data.percentage ?? prev.percentage10,
                dob: extractDOB(res.data.text) || prev.dob,
              }
            : {
                marks12: res.data.obtained,
                maxMarks12: res.data.max,
                percentage12: res.data.percentage ?? prev.percentage12,
              }),
        }));
        setStatusMsg("🟢 OCR Completed ✔️");
        return res.data.text;
      }

      // If backend returned text but no parsed marks, try to parse client-side
      if (res.data.text) {
        setStatusMsg("🟢 OCR API returned text — extracting marks locally");
        const parsed = parseMarksFromText(res.data.text);
        if (parsed) {
          setFormData((prev) => ({
            ...prev,
            ...(type === "10th"
              ? {
                  marks10: parsed.obtained,
                  maxMarks10: parsed.max,
                  percentage10: parsed.percentage,
                  dob: extractDOB(res.data.text) || prev.dob,
                }
              : {
                  marks12: parsed.obtained,
                  maxMarks12: parsed.max,
                  percentage12: parsed.percentage,
                }),
          }));
          setStatusMsg("🟢 OCR Completed ✔️");
          return res.data.text;
        }
      }

      // If backend didn't help, throw to go fallback
      throw new Error("Backend OCR gave insufficient data");
    } catch (err) {
      console.warn("API OCR Failed → Using Tesseract", err);
      // fallback to local
      try {
        const text = await runTesseractFallback(file);
        // First try robust parser
        const parsed = parseMarksFromText(text);
        if (parsed) {
          setFormData((prev) => ({
            ...prev,
            ...(type === "10th"
              ? {
                  marks10: parsed.obtained,
                  maxMarks10: parsed.max,
                  percentage10: parsed.percentage,
                  dob: extractDOB(text) || prev.dob,
                }
              : {
                  marks12: parsed.obtained,
                  maxMarks12: parsed.max,
                  percentage12: parsed.percentage,
                }),
          }));
          setStatusMsg("🟢 OCR Completed ✔️ (fallback)");
          return text;
        }

        // fallback: simple slash parse
        const fallback = parseMarksFallback(text);
        if (fallback) {
          setFormData((prev) => ({
            ...prev,
            ...(type === "10th"
              ? {
                  marks10: fallback.obtained,
                  maxMarks10: fallback.max,
                  percentage10: fallback.percentage,
                  dob: extractDOB(text) || prev.dob,
                }
              : {
                  marks12: fallback.obtained,
                  maxMarks12: fallback.max,
                  percentage12: fallback.percentage,
                }),
          }));
          setStatusMsg("🟢 OCR Completed ✔️ (simple fallback)");
          return text;
        }

        setStatusMsg("⚠️ Could not detect marks. Enter manually.");
        return text;
      } catch (err2) {
        console.error("Local OCR also failed:", err2);
        setStatusMsg("❌ OCR failed completely.");
        return null;
      }
    }
  };

  // Handle file selection (keeps UI unchanged)
  const handleMarksCardUpload = async (file, type) => {
    if (!file) return;

    if (type === "10th") setOcrProcessing10(true);
    else setOcrProcessing12(true);

    await runOCREngine(file, type);

    if (type === "10th") setOcrProcessing10(false);
    else setOcrProcessing12(false);
  };

  // Submit — uploads files to your storage (base44) then calls createStudent API
  // ----------------------
// Single Student Section (Clean Version)
// No OCR, only document upload
// ----------------------

const handleSingleSubmit = async (e) => {
  e.preventDefault();
  setProcessing(true);
  setUploadStatus(null);

  try {
    if (!selectedYear) {
      alert("Please select batch year.");
      setProcessing(false);
      return;
    }

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("dob", formData.dob);
    fd.append("batch_year", selectedYear);

    if (marks10File) fd.append("marks10_file", marks10File);
    if (marks12File) fd.append("marks12_file", marks12File);

    const token = localStorage.getItem("access_token");

    const res = await axios.post(
      "http://127.0.0.1:8000/api/student360/students/addstudent/",
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setUploadStatus({
      type: "success",
      message: "Student added successfully!",
    });

    setFormData({ name: "", dob: "" });
    setMarks10File(null);
    setMarks12File(null);

  } catch (err) {
    console.error(err);
    setUploadStatus({
      type: "error",
      message: "Failed to add student.",
    });
  }

  setProcessing(false);
};



  // Bulk upload unchanged
  const handleBulkExcelUpload = async () => {
  if (!file) return;
if (!selectedYear) {
    alert("Select the batch year before bulk upload.");
    return;
  }

  setProcessing(true);
  setUploadStatus(null);
  // setStatusMsg("Uploading Excel to backend...");

  try {
    const formData = new FormData();
    formData.append("file", file);
 formData.append("batch_year", selectedYear);
    const token = localStorage.getItem("access_token");

    const res = await bulkUploadStudents(selectedYear, formData);

    setUploadStatus({
      type: "success",
      message: `Uploaded successfully. Added ${res.records_saved} students.`,
    });

    setFile(null);
    queryClient.invalidateQueries(["students"]);
  } catch (err) {
    console.error(err);
    setUploadStatus({
      type: "error",
      message: "Failed to upload Excel. Check file format and column constraints.",
    });
  }

  setProcessing(false);
};
// Generate "YYYY-YYYY" academic year list dynamically
const generateYears = () => {
  const current = new Date().getFullYear();
  const start = 2010; // you can change start year
  const years = [];

  for (let y = start; y <= current + 1; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
};

const academicYears = generateYears();


  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Add Students</h1>

        {/* OCR STATUS LOGS */}
        {statusMsg && (
          <div className="mb-4 text-sm font-semibold text-blue-700">
            {statusMsg}
          </div>
        )}

        {uploadStatus && (
          <div className={`mb-6 p-3 rounded ${uploadStatus.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {uploadStatus.message}
          </div>
        )}
{/* Year Selection */}
<div className="mb-6">
  <label className="block text-sm font-medium mb-2">Select Academic Year / Batch</label>
  
  <select
  value={selectedYear}
  onChange={(e) => setSelectedYear(e.target.value)}
  className="w-full border border-gray-300 rounded-lg p-2"
>
  <option value="">-- Select Year --</option>

  {academicYears.map((year) => (
    <option key={year} value={year}>
      {year}
    </option>
  ))}
</select>


  {!selectedYear && (
    <p className="text-red-500 text-sm mt-1">Year is required for uploading student data.</p>
  )}
</div>

        <Tabs defaultValue="bulk">
          <TabsList>
            {/* <TabsTrigger value="single">Single Entry</TabsTrigger> */}
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          {/* <TabsContent value="single">
  <Card className="shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <UserPlus /> Add Student
      </CardTitle>
    </CardHeader>

    <CardContent>
      <form onSubmit={handleSingleSubmit} className="space-y-6">

        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        

        <div className="space-y-2">
          <Label>10th Marks Card (PDF/JPG/PNG)</Label>
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setMarks10File(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <Label>12th/Diploma Marks Card</Label>
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setMarks12File(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <Label>Date of Birth *</Label>
          <Input
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            required
          />
        </div>

        <Button className="w-full" type="submit" disabled={processing}>
          {processing ? "Saving..." : "Add Student"}
        </Button>
      </form>
    </CardContent>
  </Card>
</TabsContent> */}

          

          {/* Bulk */}
          <TabsContent value="bulk">
  <Card className="border-0 shadow-lg">
    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
      <CardTitle className="flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Bulk Upload via Excel
      </CardTitle>
    </CardHeader>

    <CardContent className="p-6">
      <div className="space-y-6">

       {/* File Picker */}
<div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors">
  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
  <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
  <p className="text-sm text-gray-500 mb-4">Supported format: .xlsx, .xls, .csv</p>

  {/* WORKING CHOOSE FILE BUTTON (no label hack) */}
  <input
    type="file"
    accept=".xlsx,.xls,.csv"
    ref={fileInputRef}
    onChange={(e) => setFile(e.target.files[0])}
    className="hidden"
  />

  <Button
    type="button"
    variant="outline"
    onClick={() => fileInputRef.current.click()}
  >
    Choose File
  </Button>

  {file && (
    <p className="mt-3 text-sm text-gray-700">
      Selected: <span className="font-medium">{file.name}</span>
    </p>
  )}
</div>



        {/* Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Excel Format Required:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• name</li>
            <li>• branch</li>
            <li>• dob (yyyy-mm-dd)</li>
            <li>• percentage10</li>
            <li>• percentage12</li>
            <li className="mt-2 font-semibold">Backend will handle validation.</li>
          </ul>
        </div>

        {/* Upload button */}
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          disabled={!file || processing}
          onClick={handleBulkExcelUpload}
        >
          {processing ? "Uploading..." : "Upload Excel"}
        </Button>

        {uploadStatus && (
          <div
            className={`mt-4 p-3 rounded ${
              uploadStatus.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {uploadStatus.message}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}

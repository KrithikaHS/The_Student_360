import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useState } from "react";
import PlacementLayout from "../Components/layouts/PlacementLayout";
import axios from "axios"; // Ensure axios is installed or use fetch

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// added by google (React)
export default function Registrations() {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState(""); // service/product
  const [graduatingYears, setGraduatingYears] = useState([]);
  const [availableYears, setAvailableYears] = useState([]); // Fetched from backend

  const [branches, setBranches] = useState([]);
  const [backendBranches, setBackendBranches] = useState([]);

  const [minBE, setMinBE] = useState("");
  const [perc10, setPerc10] = useState("");
  const [perc12, setPerc12] = useState("");

  const [jdFile, setJdFile] = useState(null);
  const [jdUrl, setJdUrl] = useState("");
  const [jdText, setJdText] = useState("");

  const [additionalInfo, setAdditionalInfo] = useState(""); // New field

  const [deadline, setDeadline] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [processed, setProcessed] = useState(false);

  const [ctc, setCtc] = useState("");

  // fetch branches and batches from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchRes = await fetch("http://127.0.0.1:8000/api/student360/placement/branches/");
        const branchData = await branchRes.json();
        setBackendBranches(branchData);

        const batchRes = await fetch("http://127.0.0.1:8000/api/student360/placement/batches/");
        const batchData = await batchRes.json();
        setAvailableYears(batchData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const toggleGraduatingYear = (year) => {
    if (graduatingYears.includes(year)) {
      setGraduatingYears(graduatingYears.filter((y) => y !== year));
    } else {
      setGraduatingYears([...graduatingYears, year]);
    }
  };

  const toggleBranch = (branch) => {
    if (branches.includes(branch)) {
      setBranches(branches.filter((b) => b !== branch));
    } else {
      setBranches([...branches, branch]);
    }
  };

  // auto-fill 10th & 12th as CGPA * 10
  const fillPercAsBE = () => {
    const val = parseFloat(minBE);
    if (!val) return;
    setPerc10((val * 10).toFixed(2));
    setPerc12((val * 10).toFixed(2));
  };

  // read PDF or TXT and extract CTC
  const extractCtc = (text) => {
    if (!text) return "";
    const regex = /(\d+(\.\d+)?)(\s*-\s*(\d+(\.\d+)?))?\s*LPA/i;
    const match = text.match(regex);
    if (!match) return "";
    return match[4] ? `${match[1]}-${match[4]} LPA` : `${match[1]} LPA`;
  };

  const handleFileUpload = (e) => {
    setJdFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    let textFromFile = "";
    if (jdFile) {
      if (jdFile.type === "application/pdf") {
        try {
          // Set worker source if needed, or rely on CDN/local
          // pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

          const arrayBuffer = await jdFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((i) => i.str).join(" ") + " ";
          }
          textFromFile = fullText;
        } catch (e) {
          console.error("PDF Error", e);
          alert("Could not read PDF. Please copy paste text.");
        }
      } else {
        textFromFile = await jdFile.text();
      }
    }

    // merge JD + manual text
    const combined = `${textFromFile} ${jdText}`;

    if (!ctc) setCtc(extractCtc(combined));
    setProcessed(true);
  };

  const handleAddCompany = async () => {
    if (!companyName || graduatingYears.length === 0 || branches.length === 0 || !minBE) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("company_name", companyName);
    // formData.append("company_type", companyType); // Not in model yet, but keeping in state
    formData.append("eligible_batches", JSON.stringify(graduatingYears));
    formData.append("eligible_branches", JSON.stringify(branches));
    formData.append("min_cgpa", minBE);
    formData.append("min_10th", perc10);
    formData.append("min_12th", perc12);
    formData.append("jd_text", jdText);
    formData.append("additional_info", additionalInfo);
    formData.append("registration_deadline", deadline);

    if (jdFile) {
      formData.append("jd_file", jdFile);
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/student360/placement/register-company/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert("Company registered successfully!");

        const newEntry = {
          companyName,
          companyType,
          graduatingYears,
          branches,
          minBE,
          perc10,
          perc12,
          deadline,
          jdUrl,
          jdText,
          ctc,
        };
        setRegistrations([newEntry, ...registrations]);

        // reset
        setCompanyName("");
        setCompanyType("");
        setGraduatingYears([]);
        setBranches([]);
        setMinBE("");
        setPerc10("");
        setPerc12("");
        setDeadline("");
        setJdUrl("");
        setJdFile(null);
        setJdText("");
        setAdditionalInfo("");
        setCtc("");
        setProcessed(false);
      } else {
        const err = await response.json();
        alert("Error: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit");
    }
  };

  return (
    <PlacementLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Company Registration</h1>

        {/* Company Name + Type */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Company Name"
            className="border px-4 py-2 rounded-lg"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />

          <select
            className="border px-4 py-2 rounded-lg"
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value)}
          >
            <option value="">Select Company Type</option>
            <option value="service">Service Based</option>
            <option value="product">Product Based</option>
          </select>
        </div>

        {/* Graduating Years */}
        <div className="mb-4">
          <p className="font-semibold mb-2">Eligible Batches:</p>
          <div className="flex flex-wrap gap-4">
            {availableYears.length > 0 ? availableYears.map((year) => (
              <label className="flex gap-2" key={year}>
                <input
                  type="checkbox"
                  checked={graduatingYears.includes(year)}
                  onChange={() => toggleGraduatingYear(year)}
                />
                {year}
              </label>
            )) : <p>Loading batches...</p>}
          </div>
        </div>

        {/* Branches */}
        <div className="mb-4">
          <p className="font-semibold mb-2">Eligible Branches:</p>
          <div className="flex flex-wrap gap-4">
            {backendBranches.length > 0 ? backendBranches.map((b) => (
              <label className="flex gap-2" key={b}>
                <input
                  type="checkbox"
                  checked={branches.includes(b)}
                  onChange={() => toggleBranch(b)}
                />
                {b}
              </label>
            )) : <p>Loading branches...</p>}
          </div>
        </div>

        {/* Academic Criteria */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Min BE CGPA *</label>
            <input
              type="number"
              placeholder="e.g. 7.5"
              className="border px-4 py-2 rounded-lg w-full"
              value={minBE}
              onChange={(e) => setMinBE(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">10th %</label>
            <input
              type="number"
              placeholder="e.g. 80"
              className="border px-4 py-2 rounded-lg w-full"
              value={perc10}
              onChange={(e) => setPerc10(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">12th %</label>
            <input
              type="number"
              placeholder="e.g. 80"
              className="border px-4 py-2 rounded-lg w-full"
              value={perc12}
              onChange={(e) => setPerc12(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              className="bg-gray-200 px-4 py-2 rounded-lg w-full"
              onClick={fillPercAsBE}
            >
              Same as BE CGPA
            </button>
          </div>
        </div>

        {/* JD Upload or Link */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload JD (PDF/DOCX)</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="border px-4 py-2 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">JD Link (Optional)</label>
            <input
              type="text"
              placeholder="https://..."
              className="border px-4 py-2 rounded-lg w-full"
              value={jdUrl}
              onChange={(e) => setJdUrl(e.target.value)}
            />
          </div>
        </div>

        <textarea
          placeholder="Paste JD Text here..."
          className="border px-4 py-2 rounded-lg w-full mb-4"
          rows={4}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />

        <textarea
          placeholder="Additional Information (e.g. Bond details, Location, etc.)"
          className="border px-4 py-2 rounded-lg w-full mb-4"
          rows={2}
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />

        {/* Deadline */}
        <div className="mb-4">
          <label className="font-semibold mr-3">Registration Deadline:</label>
          <input
            type="datetime-local"
            className="border px-4 py-2 rounded-lg"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* CTC */}
        <div className="flex gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="CTC (auto-detect from JD)"
            className="border px-4 py-2 rounded-lg w-64"
            value={ctc}
            onChange={(e) => setCtc(e.target.value)}
          />
          <button
            onClick={handleProcess}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Process JD
          </button>
          <span className="font-semibold">
            Current CTC: {ctc || "Not detected"}
          </span>
        </div>

        <button
          className={`px-4 py-2 rounded-lg ${processed || ctc
            ? "bg-green-600 text-white"
            : "bg-gray-300 text-gray-500"
            }`}
          // disabled={!processed && !ctc} // Allow submit even if JD not processed, if user manually entered details
          onClick={handleAddCompany}
        >
          Submit Registration
        </button>

        {/* Display Cards */}
        <div className="mt-6 space-y-4">
          {registrations.map((c, idx) => (
            <Card key={idx} className="shadow-lg">
              <CardHeader>
                <CardTitle>{c.companyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><b>Type:</b> {c.companyType || "N/A"}</p>
                <p><b>Graduating Years:</b> {c.graduatingYears.join(", ")}</p>
                <p><b>Eligible Branches:</b> {c.branches.join(", ")}</p>
                <p><b>Min CGPA:</b> {c.minBE}</p>
                <p><b>10th %:</b> {c.perc10}</p>
                <p><b>12th %:</b> {c.perc12}</p>
                <p><b>Deadline:</b> {c.deadline || "Not set"}</p>
                <p><b>CTC:</b> {c.ctc}</p>
                <p><b>JD Link:</b> {c.jdUrl || "No link"}</p>
                <p><b>Description:</b> {c.jdText || "N/A"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PlacementLayout>
  );
}

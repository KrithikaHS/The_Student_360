import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import PlacementLayout from "../Components/layouts/PlacementLayout";

export default function PlacementDashboard() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [openCompany, setOpenCompany] = useState(null);

  const token = localStorage.getItem("access_token");

  // ---------------------------
  // HELPERS
  // ---------------------------
  const getAllOffers = (student) => {
    return [...(student.product || []), ...(student.service || []), ...(student.dream || [])];
  };

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await api.get("/placement/students/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // ---------------------------
  // FILTER STUDENTS BY YEAR
  // ---------------------------
  const years = [...new Set(students.map((s) => s.batch_year).filter(Boolean))];
  const filteredStudents =
    selectedYear === "all"
      ? students
      : students.filter((s) => String(s.batch_year) === selectedYear);

  // ---------------------------
  // STATS
  // ---------------------------
  const totalStudents = filteredStudents.length;
  const placed = filteredStudents.filter((s) => s.offer_count > 0);
  const placedCount = placed.length;
  const offer1 = filteredStudents.filter((s) => s.offer_count === 1).length;
  const offer2 = filteredStudents.filter((s) => s.offer_count === 2).length;
  const offer3 = filteredStudents.filter((s) => s.offer_count === 3).length;
  const notPlaced = filteredStudents.filter((s) => s.offer_count === 0).length;

  // ---------------------------
  // TOP 5 HIGHEST PACKAGE
  // ---------------------------
  const highestPackageData = filteredStudents
    .map((s) => {
      const offers = getAllOffers(s);
      return {
        name: s.name,
        ctc: offers.length ? Math.max(...offers.map((o) => o.ctc)) : 0,
      };
    })
    .filter((s) => s.ctc > 0)
    .sort((a, b) => b.ctc - a.ctc)
    .slice(0, 5);

  // ---------------------------
  // BRANCH-WISE TOTAL PLACEMENTS
  // ---------------------------
  const branches = [...new Set(filteredStudents.map((s) => s.branch?.trim()))];
  const branchPlacementChart = branches.map((branch) => {
    const st = filteredStudents.filter((s) => s.branch === branch);
    return {
      branch,
      placed: st.filter((s) => getAllOffers(s).length > 0).length,
    };
  });

  // ---------------------------
  // COMPANY LIST – AGGREGATED FROM STUDENTS
  // ---------------------------
  const allCompaniesMap = {};
  filteredStudents.forEach((s) => {
    const allOffers = getAllOffers(s);
    allOffers.forEach((o, idx) => {
      const key = `${o.company}-${idx}-${s.id}`; // unique key per student per company
      allCompaniesMap[key] = {
        company_name: o.company,
        ctc: o.ctc
      };
    });
  });
  const sortedCompanies = Object.values(allCompaniesMap)
    .sort((a, b) => b.ctc - a.ctc)
    .slice(0, 3); // Top 3 only

  const downloadCompanyRegistrations = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/student360/placement/export-companies/", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "company_registrations.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download");
    }
  };

  const downloadPlacedStudents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/student360/placement/export-placed-students/", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "placed_students.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download");
    }
  };



  return (
    <PlacementLayout>
      <div className="p-8">
        {/* Title + Year */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Placement Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={downloadPlacedStudents}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Download Placed Students
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-6 gap-4 mb-10">
          <StatCard label="Total Students" value={totalStudents} />
          <StatCard label="Placed" value={placedCount} />
          <StatCard label="3 Offers" value={offer3} />
          <StatCard label="2 Offers" value={offer2} />
          <StatCard label="1 Offer" value={offer1} />
          <StatCard label="Not Placed" value={notPlaced} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Highest Package */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Top 5 Highest Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={highestPackageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ctc" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Branch-wise Placement */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Branch-wise Total Placements</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchPlacementChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="placed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Companies */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Top 3 Company Packages</h2>
            <button
              onClick={downloadCompanyRegistrations}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Download Company Registrations
            </button>
          </div>
          <div className="space-y-4">
            {sortedCompanies.map((c, idx) => (
              <Card
                key={idx} // unique key
                className="border-0 shadow cursor-pointer"
                onClick={() => setOpenCompany(openCompany === idx ? null : idx)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{c.company_name}</p>
                    </div>
                    <p className="font-bold text-lg">{c.ctc} LPA</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PlacementLayout>
  );
}

// Small reusable stat box
function StatCard({ label, value }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="text-xl font-bold">{value}</div>
        <p className="text-sm text-gray-600">{label}</p>
      </CardContent>
    </Card>
  );
}

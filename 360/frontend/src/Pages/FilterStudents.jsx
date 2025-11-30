import api from "@/api/api"; // axios instance
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import PlacementLayout from "../components/layouts/PlacementLayout";

export default function FilterStudents() {
  const [filters, setFilters] = useState({
    branches: ["all"], // default all branches
    minCGPA: 0,
    maxCGPA: 10,
    keyword: ""
  });

  const token = localStorage.getItem("access_token");

  const { data: students = [] } = useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const res = await api.get("/placement/filtered-students/", {
        params: {
          branch: filters.branches.includes("all") ? "" : filters.branches.join(','),
          min_cgpa: filters.minCGPA,
          max_cgpa: filters.maxCGPA,
          keyword: filters.keyword || undefined
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return res.data;
    }
  });

  const resetFilters = () => setFilters({
    branches: ["all"],
    minCGPA: 0,
    maxCGPA: 10,
    keyword: ""
  });

  const toggleBranch = (branch) => {
    setFilters(prev => {
      let newBranches = [...prev.branches];

      if (branch === "all") {
        newBranches = ["all"];
      } else {
        // remove 'all' if any specific branch is selected
        newBranches = newBranches.filter(b => b !== "all");
        if (newBranches.includes(branch)) {
          newBranches = newBranches.filter(b => b !== branch);
        } else {
          newBranches.push(branch);
        }
        // if no branch selected, revert to "all"
        if (newBranches.length === 0) newBranches = ["all"];
      }

      return { ...prev, branches: newBranches };
    });
  };

  const downloadExcel = () => {
    const dataToExport = students.map(s => ({
      id: s.id,
      name: s.name,
      percentage10: s.percentage10,
      percentage12: s.percentage12,
      phone: s.phone,
      branch: s.branch,
      cgpa: s.cgpa
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "filtered_students.xlsx");
  };

  const branchesList = ["Computer Science", "Information Science", "Electronics", "Mechanical", "Civil", "Electrical"];

  return (
    <PlacementLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Filter Students</h1>
          <p className="text-gray-600">Search and filter students by various criteria</p>
        </div>

        {/* Filter Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Branch checkboxes */}
              <div className="space-y-2">
                <Label>Branches</Label>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.branches.includes("all")}
                      onChange={() => toggleBranch("all")}
                    />
                    <span>All Branches</span>
                  </label>
                  {branchesList.map(branch => (
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

              {/* Min CGPA */}
              <div className="space-y-2">
                <Label>Min CGPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={filters.minCGPA}
                  onChange={e => setFilters({...filters, minCGPA: e.target.value})}
                />
              </div>

              {/* Max CGPA */}
              <div className="space-y-2">
                <Label>Max CGPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={filters.maxCGPA}
                  onChange={e => setFilters({...filters, maxCGPA: e.target.value})}
                />
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label>Keyword (metadata)</Label>
                <Input
                  type="text"
                  value={filters.keyword}
                  placeholder="e.g. Java"
                  onChange={e => setFilters({...filters, keyword: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              <Button variant="default" onClick={downloadExcel} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle>Filtered Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No students match the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>10th</TableHead>
                      <TableHead>12th</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>CGPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.percentage10}</TableCell>
                        <TableCell>{student.percentage12}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.branch}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.cgpa ? student.cgpa.toFixed(2) : 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlacementLayout>
  );
}

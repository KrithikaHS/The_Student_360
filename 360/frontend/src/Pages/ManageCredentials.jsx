import { getMentors } from "@/api/api"; // <-- use your existing api helper
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import axios from "axios";
import { useEffect, useState } from "react";
import AdminLayout from "../components/layouts/AdminLayout";

export default function ManageCredentials() {
  const [mentors, setMentors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [department, setDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchMentors();
  }, []);

  async function fetchMentors() {
  try {

    const extra = {
      id: 7,        // some unique id
      name: "Placement",
      email: "pallavipatil909506@gmail.com",
      department: "Placement_cell",
    };
    const data = await getMentors();   // API wrapper automatically handles token + URL
    const finalData = [...data, extra];
    setMentors(finalData);
    setFiltered(finalData);
  } catch (err) {
    console.error("Failed to fetch mentors", err);
  }
}

  // ---------------- Filtering ----------------
  useEffect(() => {
    let data = mentors;

    if (department !== "ALL") {
      data = data.filter((m) => m.department === department);
    }

    if (search.trim() !== "") {
      data = data.filter((m) =>
        m.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(data);
  }, [department, search, mentors]);

  // -------- Checkbox (select mentor) ----------
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const sendEmail = async (mentor_ids) => {
  try {
    const token = localStorage.getItem("access_token");
    const finalIDs = [...mentor_ids, 99999];
    await axios.post(
      "http://127.0.0.1:8000/api/student360/mentors/resend-activation/",
      
      { mentor_ids:finalIDs  },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Activation email(s) sent!");
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};


  return (
  <AdminLayout>
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Manage Mentor Credentials</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 items-center">
        
        <Input
          placeholder="Search by mentor email..."
          className="w-60"
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select onValueChange={setDepartment}>
          <SelectTrigger className="w-40">
            <span>{department}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            <SelectItem value="CSE">CSE</SelectItem>
            <SelectItem value="ISE">ISE</SelectItem>
            <SelectItem value="ECE">ECE</SelectItem>
            <SelectItem value="MECH">MECH</SelectItem>
          </SelectContent>
        </Select>

        {/* Professional Buttons */}
        <Button
          className="
            px-5 py-2 rounded-lg 
            bg-indigo-600 text-white 
            hover:bg-indigo-700 
            transition-all shadow-sm
          "
          onClick={() => sendEmail(selected)}
          disabled={selected.length === 0}
        >
          Send to Selected
        </Button>

        <Button
          className="
            px-5 py-2 rounded-lg 
            bg-slate-500 text-white 
            hover:bg-slate-600 
            transition-all shadow-sm
          "
          onClick={() => sendEmail(mentors.map((m) => m.id))}
        >
          Send to All
        </Button>
      </div>

      {/* Mentor List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mentors</CardTitle>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-gray-500">No mentors found</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left bg-gray-50">
                  <th className="p-3">Select</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Checkbox
                        checked={selected.includes(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                      />
                    </td>

                    <td className="p-3">{m.name}</td>
                    <td className="p-3">{m.email}</td>
                    <td className="p-3">{m.department}</td>

                    <td className="p-3">
                      <Button
                        size="sm"
                        className="
                          px-4 py-1.5 rounded-lg 
                          border border-gray-300 
                          text-gray-700 
                          hover:bg-gray-100 
                          transition-all
                        "
                        onClick={() => sendEmail([m.id])}
                      >
                        Resend Email
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
);
}

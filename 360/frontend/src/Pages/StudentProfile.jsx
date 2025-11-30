import { getCurrentUser, getStudentByEmail, getStudentById, updateStudent } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, GraduationCap, Mail, Phone, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import StudentLayout from "../components/layouts/StudentLayout";

const iconMap = {
  email: <Mail className="w-5 h-5 text-blue-600" />,
  phone: <Phone className="w-5 h-5 text-green-600" />,
  branch: <GraduationCap className="w-5 h-5 text-purple-600" />,
  semester: <Award className="w-5 h-5 text-orange-600" />,
  cgpa: <Award className="w-5 h-5 text-yellow-600" />,
  assigned_mentor_name: <UserCheck className="w-5 h-5 text-indigo-600" />,
};

const bgMap = {
  email: "bg-blue-100",
  phone: "bg-green-100",
  branch: "bg-purple-100",
  semester: "bg-orange-100",
  cgpa: "bg-yellow-100",
  assigned_mentor_name: "bg-indigo-100",
};

// Fields that can be edited
const editableFields = ["phone", "branch", "semester", "cgpa","id"];

export default function StudentProfile() {
  const [studentData, setStudentData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        let student = null;

        if (user.student_id) {
          student = await getStudentById(user.student_id);
        } else {
          student = await getStudentByEmail(user.email);
        }

        if (student) {
          console.log("Fetched student data:", student);
          setStudentData(student);
          setFormData(student);
        } else {
          console.warn("Student profile not found");
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
        toast.error("Could not load profile. Please login again.");
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    try {
      // Send only editable fields to backend
      const payload = {};
      editableFields.forEach((field) => {
        payload[field] = formData[field];
      });

      const updated = await updateStudent(studentData.id, payload);
      // Backend returns { message, student } structure, extract student
      setStudentData({ ...studentData, ...updated.student });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    }
  };

  // Generate dynamic fields
  // Generate dynamic fields, exclude first_name and last_name
// Generate dynamic , exclude first_name and last_name
const dynamicFields = studentData
  ? Object.keys(studentData)
      .filter((key) => key !== "first_name" && key !== "last_name")
      .map((key) => {
        let value = studentData[key];
        if (key === "id") value = "Update your USN";
        if (key === "cgpa" && value != null) value = parseFloat(value).toFixed(2);
        if (key === "semester" && value != null) value = `Semester ${value}`;
        if (value === null || value === "") value = "Not provided";

        let displayValue = value;

        if (typeof value === "object" && value !== null) {
          if (key === "assigned_mentor") {
            displayValue = value.name || "Not assigned";
          } else if (value.first_name) {
            displayValue = `${value.first_name} ${value.last_name || ""}`.trim();
          } else {
            displayValue = "Not provided";
          }
        }

        return {
          key,
          label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value,
          displayValue,
          icon: iconMap[key] || <Award className="w-5 h-5 text-gray-600" />,
          bg: bgMap[key] || "bg-gray-100",
        };
      })
  : [];



  return (
    <StudentLayout studentData={studentData}>
      <div className="px-6 md:px-10 lg:px-16 py-10 min-h-screen bg-gray-50 flex justify-center items-start">
        <div className="w-full max-w-5xl">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-1">
    {studentData
      ? `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim()
      : "Student Profile"}
  </h1>
            <p className="text-gray-600 text-lg">
              View and edit your academic and personal details
            </p>
          </div>

          <Card className="border-0 shadow-xl w-full rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b px-8 py-4 flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Academic Information
              </CardTitle>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-x-10 gap-y-8">
                {dynamicFields.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{item.label}</p>

                      {isEditing && editableFields.includes(item.key) ? (
                        <input
                          type="text"
                          value={formData[item.key] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [item.key]: e.target.value })
                          }
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900 mt-1">
                          {item.displayValue}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="text-right mt-8">
                  <button
                    onClick={handleSave}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}

/*import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MentorLayout from "../components/layouts/MentorLayout";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MentorAnalytics() {
  const [mentorData, setMentorData] = useState(null);

  useEffect(() => {
    const loadMentor = async () => {
      const user = await base44.auth.me();
      if (user.mentor_id) {
        const mentors = await base44.entities.Mentor.filter({ id: user.mentor_id });
        if (mentors.length > 0) setMentorData(mentors[0]);
      } else {
        const mentors = await base44.entities.Mentor.filter({ email: user.email });
        if (mentors.length > 0) {
          setMentorData(mentors[0]);
          await base44.auth.updateMe({ mentor_id: mentors[0].id });
        }
      }
    };
    loadMentor();
  }, []);

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list()
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const myStudents = allStudents.filter(s => s.assigned_mentor_id === mentorData?.id);
  const myStudentIds = myStudents.map(s => s.id);
  const myDocuments = allDocuments.filter(d => myStudentIds.includes(d.student_id));

  // CGPA Distribution
  const cgpaRanges = [
    { range: '9.0-10', count: myStudents.filter(s => s.cgpa >= 9).length },
    { range: '8.0-8.9', count: myStudents.filter(s => s.cgpa >= 8 && s.cgpa < 9).length },
    { range: '7.0-7.9', count: myStudents.filter(s => s.cgpa >= 7 && s.cgpa < 8).length },
    { range: '6.0-6.9', count: myStudents.filter(s => s.cgpa >= 6 && s.cgpa < 7).length },
    { range: '<6.0', count: myStudents.filter(s => s.cgpa > 0 && s.cgpa < 6).length },
  ];

  // Verification Status
  const verificationData = [
    { name: 'Verified', value: myDocuments.filter(d => d.verification_status === 'verified').length },
    { name: 'Pending', value: myDocuments.filter(d => d.verification_status === 'pending').length },
    { name: 'Rejected', value: myDocuments.filter(d => d.verification_status === 'rejected').length }
  ];

  return (
    <MentorLayout mentorData={mentorData}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Student performance and verification insights</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                CGPA Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cgpaRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}
*/
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import MentorLayout from "../components/layouts/MentorLayout";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MentorAnalytics() {
  const [mentorData, setMentorData] = useState(null);

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/student360/",
    withCredentials: true,
  });

  useEffect(() => {
    const loadMentor = async () => {
      const res = await api.get("mentordashboard/");
      setMentorData(res.data.mentor);
    };
    loadMentor();
  }, []);

  const { data: myStudents = [] } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => {
      const res = await api.get("mentor/my-students/");
      return res.data;
    }
  });

  const { data: myDocuments = [] } = useQuery({
    queryKey: ['mentor-documents'],
    queryFn: async () => {
      const res = await api.get("mentor/documents/");
      return res.data;
    }
  });

  // CGPA ranges
  const cgpaRanges = [
    { range: '9.0-10', count: myStudents.filter(s => s.cgpa >= 9).length },
    { range: '8.0-8.9', count: myStudents.filter(s => s.cgpa >= 8 && s.cgpa < 9).length },
    { range: '7.0-7.9', count: myStudents.filter(s => s.cgpa >= 7 && s.cgpa < 8).length },
    { range: '6.0-6.9', count: myStudents.filter(s => s.cgpa >= 6 && s.cgpa < 7).length },
    { range: '<6.0', count: myStudents.filter(s => s.cgpa > 0 && s.cgpa < 6).length },
  ];

  const verificationData = [
    { name: 'Verified', value: myDocuments.filter(d => d.verification_status === 'verified').length },
    { name: 'Pending', value: myDocuments.filter(d => d.verification_status === 'pending').length },
    { name: 'Rejected', value: myDocuments.filter(d => d.verification_status === 'rejected').length }
  ];

  return (
    <MentorLayout mentorData={mentorData}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Student performance and verification insights</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                CGPA Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cgpaRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </MentorLayout>
  );
}

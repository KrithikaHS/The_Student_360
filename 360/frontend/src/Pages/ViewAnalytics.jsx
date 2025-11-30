import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PlacementLayout from "../components/layouts/PlacementLayout";

export default function ViewAnalytics() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const verifiedStudentIds = [...new Set(
    documents
      .filter(d => d.verification_status === 'verified')
      .map(d => d.student_id)
  )];
  
  const verifiedStudents = students.filter(s => verifiedStudentIds.includes(s.id));

  // CGPA Distribution
  const cgpaRanges = [
    { range: '9.0-10', count: verifiedStudents.filter(s => s.cgpa >= 9).length },
    { range: '8.0-8.9', count: verifiedStudents.filter(s => s.cgpa >= 8 && s.cgpa < 9).length },
    { range: '7.0-7.9', count: verifiedStudents.filter(s => s.cgpa >= 7 && s.cgpa < 8).length },
    { range: '6.0-6.9', count: verifiedStudents.filter(s => s.cgpa >= 6 && s.cgpa < 7).length },
    { range: '<6.0', count: verifiedStudents.filter(s => s.cgpa > 0 && s.cgpa < 6).length },
  ];

  // Semester-wise distribution
  const semesterData = [1,2,3,4,5,6,7,8].map(sem => ({
    semester: `Sem ${sem}`,
    count: verifiedStudents.filter(s => s.semester === sem).length,
    avgCgpa: verifiedStudents.filter(s => s.semester === sem).length > 0
      ? (verifiedStudents.filter(s => s.semester === sem).reduce((sum, s) => sum + (s.cgpa || 0), 0) / 
         verifiedStudents.filter(s => s.semester === sem).length).toFixed(2)
      : 0
  }));

  const avgCGPA = verifiedStudents.length > 0 
    ? (verifiedStudents.reduce((sum, s) => sum + (s.cgpa || 0), 0) / verifiedStudents.length).toFixed(2)
    : 0;

  return (
    <PlacementLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">View Analytics</h1>
          <p className="text-gray-600">Comprehensive insights on verified student data</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{verifiedStudents.length}</div>
              <p className="text-sm text-gray-600">Verified Students</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-800">Average</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{avgCGPA}</div>
              <p className="text-sm text-gray-600">Average CGPA</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-800">Total</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {documents.filter(d => d.verification_status === 'verified').length}
              </div>
              <p className="text-sm text-gray-600">Verified Documents</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                CGPA Distribution (Verified Students)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cgpaRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Semester-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="semester" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Students" />
                  <Line yAxisId="right" type="monotone" dataKey="avgCgpa" stroke="#ec4899" strokeWidth={2} name="Avg CGPA" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlacementLayout>
  );
}
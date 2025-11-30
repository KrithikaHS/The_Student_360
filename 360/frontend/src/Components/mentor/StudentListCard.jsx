import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export default function StudentListCard({ students }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Students ({students.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No students assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>CGPA</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </TableCell>

                    {/* Student ID */}
                    <TableCell className="font-medium">
                      {student.id ?? "N/A"}
                    </TableCell>

                    {/* Branch */}
                    <TableCell>{student.branch || "N/A"}</TableCell>

                    {/* Phone */}
                    <TableCell>{student.phone || "N/A"}</TableCell>

                    {/* CGPA */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 border-purple-200"
                      >
                        {student.cgpa ? Number(student.cgpa).toFixed(2) : "N/A"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function VerificationOverview({ documents }) {
  const verificationData = [
    { 
      name: 'Verified', 
      value: documents.filter(d => d.verification_status === 'verified').length,
      color: '#10b981'
    },
    { 
      name: 'Pending', 
      value: documents.filter(d => d.verification_status === 'pending').length,
      color: '#f59e0b'
    },
    { 
      name: 'Rejected', 
      value: documents.filter(d => d.verification_status === 'rejected').length,
      color: '#ef4444'
    }
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          Document Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={verificationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {verificationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
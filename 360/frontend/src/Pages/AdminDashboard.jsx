// import { base44 } from "@/api/base44Client";
import { getMentors, getStudents } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import RecentActivity from "../components/admin/RecentActivity";
import StatsOverview from "../components/admin/StatsOverview";
import AdminLayout from "../components/layouts/AdminLayout";

export default function AdminDashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
queryFn: getStudents
  });

 const { data: mentors = [] } = useQuery({
  queryKey: ['mentors'],
  queryFn: getMentors
});


  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: blockchainRecords = [] } = useQuery({
    queryKey: ['blockchainRecords'],
    queryFn: () => base44.entities.BlockchainRecord.list()
  });

  const onChainRecords = blockchainRecords.filter(r => r.status === 'confirmed').length;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your system overview</p>
        </div>

        <StatsOverview
          totalStudents={students.length}
          totalMentors={mentors.length}
          // onChainRecords={onChainRecords}
        />

        <div className="mt-8">
          <RecentActivity documents={documents} students={students} />
        </div>
      </div>
    </AdminLayout>
  );
}
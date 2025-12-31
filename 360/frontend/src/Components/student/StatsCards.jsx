import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, Clock, FileText, UserCheck } from "lucide-react";

export default function StatsCards({ totalDocuments, pendingDocs, verifiedDocs, onChainDocs, mentorName }) {
  const stats = [
    {
      title: "Total Documents",
      value: totalDocuments,
      icon: FileText,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Pending Verification",
      value: pendingDocs,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "Verified",
      value: verifiedDocs,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    // {
    //   title: "On Blockchain",
    //   value: onChainDocs,
    //   icon: Shield,
    //   color: "from-purple-500 to-pink-500",
    //   bgColor: "bg-purple-50",
    //   textColor: "text-purple-600"
    // }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-8 -translate-y-8`}></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {mentorName && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Assigned Mentor</p>
                <p className="text-xl font-bold text-gray-900">{mentorName}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}
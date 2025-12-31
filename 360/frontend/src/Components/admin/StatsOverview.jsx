import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, UserCheck, Users } from "lucide-react";

export default function StatsOverview({ totalStudents, totalMentors, verifiedDocuments, onChainRecords }) {
  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Total Mentors",
      value: totalMentors,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    
    // {
    //   title: "On-Chain Records",
    //   value: onChainRecords,
    //   icon: Shield,
    //   color: "from-orange-500 to-red-500",
    //   bgColor: "bg-orange-50",
    //   textColor: "text-orange-600"
    // }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Live</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
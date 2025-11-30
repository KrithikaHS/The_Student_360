import { useEffect, useState } from "react";
import StudentLayout from "../components/layouts/StudentLayout";
import { getAllCompanies, applyForJob } from "@/api/api";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Building2,
    Calendar,
    Loader2,
    BookOpen,
    FileText,
    GraduationCap,
    CheckCircle,
} from "lucide-react";

export default function StudentJobPortal() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        async function loadCompanies() {
            try {
                const res = await getAllCompanies();

                // Sort companies:
                // 1. Open applications (not applied, deadline not crossed)
                // 2. Applied companies (sorted by created_at desc - latest first)
                // 3. Deadline crossed companies
                const sorted = res.data.sort((a, b) => {
                    // If both applied, sort by created_at (latest first)
                    if (a.applied && b.applied) {
                        return new Date(b.created_at) - new Date(a.created_at);
                    }

                    // Applied companies come before non-applied
                    if (a.applied && !b.applied) return -1;
                    if (!a.applied && b.applied) return 1;

                    // Deadline crossed companies go to bottom
                    if (a.deadline_crossed && !b.deadline_crossed) return 1;
                    if (!a.deadline_crossed && b.deadline_crossed) return -1;

                    // Otherwise maintain order
                    return 0;
                });

                setCompanies(sorted);
                console.log(sorted);
            } catch (err) {
                console.error("Error loading companies:", err);
            }
            setLoading(false);
        }
        loadCompanies();
    }, []);

    const handleApply = async (companyId) => {
        setActionLoading(companyId);
        try {
            await applyForJob({ company: companyId });
            setCompanies((prev) =>
                prev.map((c) =>
                    c.id === companyId ? { ...c, applied: true } : c
                )
            );
        } catch (err) {
            console.error("Apply failed:", err);
        }
        setActionLoading(null);
    };

    return (
        <StudentLayout>
            <div className="p-8 max-w-5xl">
                <h1 className="text-3xl font-bold mb-6">Available Job Opportunities</h1>

                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {companies.map((company, index) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="shadow-lg border">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Building2 className="w-5 h-5" />
                                            {company.company_name}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Eligible Batches */}
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="w-4 h-4 text-purple-600" />
                                            <p className="font-medium">
                                                Eligible Batches:{" "}
                                                <span className="text-gray-700">{company.eligible_batches}</span>
                                            </p>
                                        </div>

                                        {/* Minimum CGPA */}
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <p className="font-medium">
                                                Minimum CGPA:{" "}
                                                <span className="text-gray-700">{company.min_cgpa}</span>
                                            </p>
                                        </div>

                                        {/* Minimum 10th Marks */}
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                            <p className="font-medium">
                                                Min 10th Marks:{" "}
                                                <span className="text-gray-700">{company.min_10th}%</span>
                                            </p>
                                        </div>

                                        {/* Minimum 12th Marks */}
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            <p className="font-medium">
                                                Min 12th Marks:{" "}
                                                <span className="text-gray-700">{company.min_12th}%</span>
                                            </p>
                                        </div>

                                        {/* JD File */}
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-orange-600" />
                                            <p className="font-medium">
                                                Job Description:{" "}
                                                {company.jd_file ? (
                                                    <a
                                                        href={company.jd_file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline"
                                                    >
                                                        View JD File
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">No file uploaded</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Deadline */}
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-red-600" />
                                            <p className="font-medium">
                                                Apply before:{" "}
                                                <span className="text-gray-700">{company.deadline}</span>
                                            </p>
                                        </div>

                                        {/* Apply Button */}
                                        <div className="flex gap-3 pt-4">
                                            {company.applied ? (
                                                <Badge className="bg-green-600 text-white px-3 py-1">
                                                    Applied
                                                </Badge>
                                            ) : company.deadline_crossed ? (
                                                <Badge className="bg-red-500 text-white px-3 py-1">
                                                    Deadline Crossed
                                                </Badge>
                                            ) : (
                                                <Button
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={actionLoading === company.id}
                                                    onClick={() => handleApply(company.id)}
                                                >
                                                    {actionLoading === company.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        "Apply"
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
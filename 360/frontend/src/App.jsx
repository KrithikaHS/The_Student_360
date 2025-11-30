import { Route, Routes } from "react-router-dom";

// Landing & Auth
import Auth from "./Pages/Auth";
import Landing from "./Pages/Landing";
import SetPassword from "./Pages/SetPassword";

// Admin Pages
import AddMentors from "./Pages/AddMentors";
import AddStudents from "./Pages/AddStudents";
import AdminDashboard from "./Pages/AdminDashboard";
import AutoAssignMentors from "./Pages/AutoAssignMentors";
import ManageCredentials from "./Pages/ManageCredentials";

// Student Pages
import StudentDashboard from "./Pages/StudentDashboard";
import StudentProfile from "./Pages/StudentProfile";
import StudentUpload from "./Pages/StudentUpload";
import StudentJobPortal from "./Pages/StudentJobPortal";


// Mentor Pages
import DocumentVerification from "./Pages/DocumentVerification";
import MentorAnalytics from "./Pages/MentorAnalytics";
import MentorDashboard from "./Pages/MentorDashboard";
import MyStudents from "./Pages/MyStudents";
import PlacementDashboard from "./Pages/PlacementDashboard";


// Optional Layout (if you have it)
import Layout from "./Layout";
import DownloadReports from "./Pages/DownloadReports";
import FilterStudents from "./Pages/FilterStudents";
import Registrations from "./Pages/Registrations";
import ViewAnalytics from "./Pages/ViewAnalytics";

export default function App() {
  return (
    <Routes>
      {/* Landing and Auth */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Admin Dashboard and Subpages */}
      <Route path="/admindashboard" element={<AdminDashboard />} />
      <Route path="/addstudents" element={<AddStudents />} />
      <Route path="/addmentors" element={<AddMentors />} />
      <Route path="/autoassignmentors" element={<AutoAssignMentors />} />
      <Route path="/managecredentials" element={<ManageCredentials />} />
      <Route path="/documentverification" element={<DocumentVerification />} />

      {/* Mentor Dashboard and Subpages */}
      <Route path="/mentordashboard" element={<MentorDashboard />} />
      <Route path="/mystudents" element={<MyStudents />} />
      <Route path="/mentoranalytics" element={<MentorAnalytics />} />

      {/* Student Dashboard and Subpages */}
      <Route path="/studentdashboard" element={<StudentDashboard />} />
      <Route path="/studentprofile" element={<StudentProfile />} />
      <Route path="/studentupload" element={<StudentUpload />} />
      <Route path="/studentjobportal" element={<StudentJobPortal />} />


      {/* Placement Dashboard */}
      <Route path="/placementdashboard" element={<PlacementDashboard />} />
      <Route path="/viewanalytics" element={<ViewAnalytics />} />
      <Route path="/filterstudents" element={<FilterStudents />} />
      <Route path="/downloadreports" element={<DownloadReports />} />
      <Route path="/registrations" element={<Registrations />} />



      {/* Optional layout */}
      <Route path="/layout" element={<Layout />} />
      <Route path="/set-password/:token" element={<SetPassword />} />

    </Routes>
  );
}


export const createPageUrl = (pageName) => {
  const routes = {
    Landing: "/",
    Auth: "/auth",
    Layout: "/layout",
    AdminDashboard: "/admindashboard",
    StudentDashboard: "/studentdashboard",
    MentorDashboard: "/mentordashboard",
    PlacementDashboard: "/placementdashboard",
    AddStudents: "/AddStudents",
    UploadDocuments: "/UploadDocuments",
    AddMentors: "/AddMentors",
    AutoAssignMentors: "/AutoAssignMentors",
    ManageCredentials: "/ManageCredentials",
    StudentStatus: "/StudentStatus",
    StudentUpload: "/StudentUpload",
    StudentProfile: "/StudentProfile",
    MyStudents: "/MyStudents",
    DocumentVerification: "/DocumentVerification",
    MentorAnalytics: "/MentorAnalytics",
    PlacementDashboard: "/PlacementDashboard",
    ViewAnalytics: "/ViewAnalytics",
    FilterStudents: "/FilterStudents",
    DownloadReports: "/DownloadReports",
    Registrations: "/Registrations",
    StudentJobPortal: "/StudentJobPortal",
  };

  return routes[pageName] || "/";
};

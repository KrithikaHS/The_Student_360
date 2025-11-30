


// src/api/api.js
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api/student360";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});



// ---------------------
// Response interceptor: handle 401 and refresh token
// ---------------------

// ---------------------
// Auto logout utility
// ---------------------



export const signupStudent = (payload) => api.post("/signup/", payload);

// export const loginUser = (payload) => api.post("/login/", payload);

export const loginUser = async (payload) => {
  console.log("Frontend sending payload:", payload); // <-- what is being sent
  try {
    const response = await api.post("/login/", payload);
    console.log("Backend responded with:", response.data); // <-- what backend returned
    return response;
  } catch (err) {
    console.error("Login error:", err.response?.status, err.response?.data); // <-- backend error
    throw err;
  }
};

export const uploadStudentDocument = (formData) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.post("/students/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};

// / Get all documents for logged-in student
export const getStudentDocuments = (studentId) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.get(`/students/list/${studentId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete a document (only if not approved)
export const deleteDocument = (docId) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.delete(`/students/delete/${docId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Fetch current logged-in user info
export const getCurrentUser = async () => {
  const token = localStorage.getItem("access_token"); // get token
  if (!token) throw new Error("No access token found, login required");

  const res = await api.get("/auth/me/", {
    headers: { Authorization: `Bearer ${token}` }, // send token
  });
  return res.data;
};



// Fetch student data by ID
export const getStudentById = async (id) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  const res = await api.get(`/students/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};



// Fetch student by email
export const getStudentByEmail = async (email) => {
  const res = await api.get(`/students?email=${email}`);
  return res.data.length > 0 ? res.data[0] : null;
};

// Update student profile
export const updateStudent = async (id, payload) => {
  const token = localStorage.getItem("access_token"); // get token
  if (!token) throw new Error("No access token found, login required");

  const res = await api.put(
    `/students/update/${id}/`,
    payload, // this is the body
    {
      headers: { Authorization: `Bearer ${token}` }, // token in header
    }
  );

  return res.data;
};

// Admin

export const bulkUploadStudents = async (year, formData) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  const res = await api.post(
    `/students/bulk-upload/${year}/`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const bulkUploadMentors = async (formData) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  const res = await api.post(
    `/students/bulk-upload-mentor/`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const createMentor = async (formData) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found. Login required!");

  const response = await api.post("/students/addmentor/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// -------------------------------
// 2) Verify Token (Mentor Password Setup)
// -------------------------------
export const verifyToken = (token) =>
  api.get(`/student/verify-token/?token=${token}`);

// -------------------------------
// 3) Set New Password (Mentor)
// -------------------------------
// export const setPassword = (payload) =>
//   api.post(`/student/set-password/`, payload);


export const getStudents = async () => {
  // expects GET /students/list/ returning an array of student objects
  const token = localStorage.getItem("access_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await api.get("/students/list/", { headers });
  return res.data;
};

export const getMentors = async () => {
  // expects GET /students/mentors/ returning an array of mentor objects
  const token = localStorage.getItem("access_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // try likely mentor endpoints; main one is /students/mentors/
  const res = await api.get("/students/mentors/", { headers });
  return res.data;
};

// AUTO ASSIGN (your provided endpoint)
export const autoAssignMentors = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  const res = await api.post(
    "/student/assign-mentors/", // using the endpoint you shared
    {}, // no payload
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
};
// mentor
export const getAllStudents = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");
  console.log("getting copm")
  return api.get("/students/list/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


// added by google (React) - Job Portal APIs
export const getAllCompanies = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.get("/student/companies/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const applyForJob = async (payload) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.post("/student/apply/", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const ignoreJob = async (payload) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found, login required");

  return api.post("/student/ignore/", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default api;

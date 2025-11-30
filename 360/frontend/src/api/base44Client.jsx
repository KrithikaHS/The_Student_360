// src/api/base44Client.js

// ✅ Dummy API client mock (prevents import errors)
export const base44 = {
  auth: {
    login: async (path) => {
      console.log("Mock login called for:", path);
      return Promise.resolve({ success: true, message: "Logged in (mock)" });
    },
    logout: async (path) => {
      console.log("Mock logout called for:", path);
      window.location.href = path || "/";
    },
  },
  students: {
    getAll: async () => {
      console.log("Fetching all students (mock)");
      return Promise.resolve([{ id: 1, name: "John Doe" }]);
    },
    add: async (student) => {
      console.log("Adding student (mock):", student);
      return Promise.resolve({ success: true });
    },
  },
  mentors: {
    getAll: async () => {
      console.log("Fetching mentors (mock)");
      return Promise.resolve([{ id: 1, name: "Jane Mentor" }]);
    },
  },
  documents: {
    upload: async (file) => {
      console.log("Uploading document (mock):", file.name);
      return Promise.resolve({ success: true, url: "/mock/document.pdf" });
    },
  },
};

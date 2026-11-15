/**
 * Campus Harmony — Centralized REST API Client
 * Connects to Spring Boot backend at http://localhost:8080/api.
 * Provides typed, clean methods with robust error handling and response normalization.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && (data.message || data.error)) ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    // Handle generic ApiResponse wrapper if present
    if (
      data &&
      typeof data === "object" &&
      (data.success !== undefined || data.ok !== undefined) &&
      data.data !== undefined
    ) {
      return data.data;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or CORS failure
    throw new ApiError(
      `Cannot connect to Campus Harmony backend at ${url}. Ensure Spring Boot server is running on localhost:8080.`,
      0,
      null
    );
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
    register: (teacherData) => request("/auth/register", { method: "POST", body: teacherData }),
    getTeachers: () => request("/auth/teachers"),
  },

  // Students
  students: {
    getAll: () => request("/students"),
    getById: (id) => request(`/students/${id}`),
    create: (student) => request("/students", { method: "POST", body: student }),
    update: (id, student) => request(`/students/${id}`, { method: "PUT", body: student }),
    delete: (id) => request(`/students/${id}`, { method: "DELETE" }),
    getDepartments: () => request("/students/departments"),
    getAttendance: (id) => request(`/students/${id}/attendance`),
    getMarks: (id) => request(`/students/${id}/marks`),
  },

  // Teachers
  teachers: {
    getAll: () => request("/teachers"),
    getById: (id) => request(`/teachers/${id}`),
    create: (teacher) => request("/teachers", { method: "POST", body: teacher }),
    update: (id, teacher) => request(`/teachers/${id}`, { method: "PUT", body: teacher }),
    delete: (id) => request(`/teachers/${id}`, { method: "DELETE" }),
  },

  // Departments
  departments: {
    getAll: () => request("/departments"),
    getById: (id) => request(`/departments/${id}`),
    create: (dept) => request("/departments", { method: "POST", body: dept }),
    update: (id, dept) => request(`/departments/${id}`, { method: "PUT", body: dept }),
    delete: (id) => request(`/departments/${id}`, { method: "DELETE" }),
  },

  // Subjects
  subjects: {
    getAll: () => request("/subjects"),
    getById: (id) => request(`/subjects/${id}`),
    create: (subj) => request("/subjects", { method: "POST", body: subj }),
    update: (id, subj) => request(`/subjects/${id}`, { method: "PUT", body: subj }),
    delete: (id) => request(`/subjects/${id}`, { method: "DELETE" }),
  },

  // Courses & Course Enrollments
  courses: {
    getAll: () => request("/courses"),
    getById: (id) => request(`/courses/${id}`),
    create: (course) => request("/courses", { method: "POST", body: course }),
    update: (id, course) => request(`/courses/${id}`, { method: "PUT", body: course }),
    delete: (id) => request(`/courses/${id}`, { method: "DELETE" }),
  },

  // Attendance Summaries & Sessions
  attendance: {
    getAllSummaries: () => request("/attendance"),
    getByStudentId: (studentId) => request(`/attendance/${studentId}`),
    updateSummary: (studentId, summary) => request(`/attendance/${studentId}`, { method: "PUT", body: summary }),
    resetAll: () => request("/attendance/reset", { method: "POST" }),
    // Dated sessions
    getSessions: () => request("/attendance/sessions"),
    getSessionById: (id) => request(`/attendance/sessions/${id}`),
    createSession: (sessionData) => request("/attendance/sessions", { method: "POST", body: sessionData }),
    getSessionRecords: (sessionId) => request(`/attendance/sessions/${sessionId}/records`),
    submitSessionRecords: (sessionId, batchPayload) =>
      request(`/attendance/sessions/${sessionId}/records`, { method: "POST", body: batchPayload }),
  },

  // Marks & Academic Transcripts
  marks: {
    getAll: () => request("/marks"),
    getByStudentId: (studentId) => request(`/marks/${studentId}`),
    update: (studentId, marks) => request(`/marks/${studentId}`, { method: "PUT", body: marks }),
    getTranscript: (studentId) => request(`/marks/transcript/${studentId}`),
    getEvaluations: (studentId) => request(`/marks/evaluations/student/${studentId}`),
    recordEvaluation: (evalData) => request("/marks/evaluations", { method: "POST", body: evalData }),
  },

  // Activities
  activities: {
    getAll: () => request("/activities"),
    create: (activity) => request("/activities", { method: "POST", body: activity }),
    delete: (id) => request(`/activities/${id}`, { method: "DELETE" }),
  },

  // DBMS Demonstrations (Cursors, Stored Procedures, Triggers, Views)
  dbms: {
    getDefaulters: (threshold = 75.0) => request(`/dbms/defaulters?threshold=${threshold}`),
    executeTransactionDemo: (simulateError = false) =>
      request(`/dbms/transaction-demo?simulateError=${simulateError}`, { method: "POST" }),
    reconcileStudentCache: (studentId) =>
      request(`/dbms/reconcile-attendance/${studentId}`, { method: "POST" }),
    reconcileAllCaches: () => request("/dbms/reconcile-all", { method: "POST" }),
    getCacheDiscrepancies: () => request("/dbms/cache-discrepancies"),
    archiveStudent: (studentId) =>
      request(`/dbms/archive-student/${studentId}`, { method: "POST" }),
  },

  // Java Academic CHO Demonstrations (JDBC, Comparators, Streams, Generics, Concurrency)
  javaDemo: {
    comparatorSort: (strategy = "name") => request(`/java-demo/comparator-sort?strategy=${strategy}`),
    streamsAnalytics: () => request("/java-demo/streams-analytics"),
    parallelBatchAttendance: (batchCount = 6, recordsPerBatch = 100) =>
      request(`/java-demo/parallel-batch-attendance?batchCount=${batchCount}&recordsPerBatch=${recordsPerBatch}`, {
        method: "POST",
      }),
    csvExport: () => request("/java-demo/csv-export"),
    csvImport: (csvContent) =>
      request("/java-demo/csv-import", { method: "POST", body: csvContent, headers: { "Content-Type": "text/plain" } }),
    jdbcTransaction: (shouldFail = false) =>
      request(`/java-demo/jdbc-transaction?shouldFail=${shouldFail}`, { method: "POST" }),
  },
};

export default api;

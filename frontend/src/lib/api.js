/**
 * Campus Harmony — Centralized REST API Client
 * Connects to Spring Boot backend at http://localhost:8080/api.
 * Provides typed, clean methods with robust error handling and response normalization.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8080/api" : "http://localhost:8080/api");

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Campus-Request": "1",
      Accept: "application/json",
      ...options.headers,
    },
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
      if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("campus-session-expired"));
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
    me: () => request("/auth/me"),
    logout: () => request("/auth/logout", {method:"POST"}),
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
    // Phase 2A Dynamic Course Offerings & Assessment Evaluations
    getOfferingAssessments: (offeringId) => request(`/academic/offerings/${offeringId}/assessments`),
    createAssessment: (offeringId, data) => request(`/academic/offerings/${offeringId}/assessments`, { method: "POST", body: data }),
    getAssessmentRoster: (assessmentId) => request(`/academic/assessments/${assessmentId}/roster`),
    saveAssessmentMarks: (assessmentId, payload) => request(`/academic/assessments/${assessmentId}/marks`, { method: "POST", body: payload }),
    getAssessmentStats: (assessmentId) => request(`/academic/assessments/${assessmentId}/stats`),
    getMyMarks: () => request("/academic/my-marks"),
    getAdminMarksReports: () => request("/academic/admin/marks-reports"),
  },

  // Timetable & Lecture Scheduling (Phase 2B)
  timetable: {
    getSectionSchedule: (sectionId) => request(`/academic/timetable/section/${sectionId}`),
    getTeacherScheduleAdmin: (teacherId) => request(`/academic/timetable/teacher-schedule/${teacherId}`),
    getMySchedule: () => request("/academic/timetable/my-schedule"),
    getTodaySchedule: () => request("/academic/timetable/today"),
    createEntry: (entry) => request("/academic/timetable", { method: "POST", body: entry }),
    updateEntry: (id, entry) => request(`/academic/timetable/${id}`, { method: "PUT", body: entry }),
    deleteEntry: (id) => request(`/academic/timetable/${id}`, { method: "DELETE" }),
    conductLecture: (id, data) => request(`/academic/timetable/${id}/conduct`, { method: "POST", body: data }),
    cancelLecture: (data) => request("/academic/timetable/cancel-lecture", { method: "POST", body: data }),
  },

  // Attendance Analytics & Defaulters (Phase 2C)
  analytics: {
    getThreshold: () => request("/academic/analytics/threshold"),
    updateThreshold: (threshold) => request("/academic/analytics/threshold", { method: "PUT", body: { threshold } }),
    getAdminOverview: (params = {}) => {
      const q = new URLSearchParams();
      if (params.periodId) q.append("periodId", params.periodId);
      if (params.departmentId) q.append("departmentId", params.departmentId);
      if (params.semester) q.append("semester", params.semester);
      if (params.sectionId) q.append("sectionId", params.sectionId);
      if (params.offeringId) q.append("offeringId", params.offeringId);
      return request(`/academic/analytics/admin/overview${q.toString() ? "?" + q.toString() : ""}`);
    },
    getTeacherSummary: (params = {}) => {
      const q = new URLSearchParams();
      if (params.offeringId) q.append("offeringId", params.offeringId);
      if (params.startDate) q.append("startDate", params.startDate);
      if (params.endDate) q.append("endDate", params.endDate);
      return request(`/academic/analytics/teacher/summary${q.toString() ? "?" + q.toString() : ""}`);
    },
    getStudentInsights: () => request("/academic/analytics/student/insights"),
    correctAttendance: (sessionId, data) => request(`/academic/lectures/${sessionId}/attendance`, { method: "PUT", body: data }),
  },

  // Student Complaints & Grievance Management
  complaints: {
    submit: (data) => request("/academic/complaints", { method: "POST", body: data }),
    getMy: (params = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append("status", params.status);
      if (params.search) q.append("search", params.search);
      return request(`/academic/complaints/my${q.toString() ? "?" + q.toString() : ""}`);
    },
    getMyCourses: () => request("/academic/complaints/my-courses"),
    getDetails: (id) => request(`/academic/complaints/${id}`),
    getAdminList: (params = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append("status", params.status);
      if (params.category) q.append("category", params.category);
      if (params.search) q.append("search", params.search);
      if (params.fromDate) q.append("fromDate", params.fromDate);
      if (params.toDate) q.append("toDate", params.toDate);
      return request(`/academic/admin/complaints${q.toString() ? "?" + q.toString() : ""}`);
    },
    getAdminStats: () => request("/academic/admin/complaints/stats"),
    updateStatus: (id, data) => request(`/academic/admin/complaints/${id}/status`, { method: "PUT", body: data }),
    addResponse: (id, data) => request(`/academic/admin/complaints/${id}/response`, { method: "POST", body: data }),
  },

  // Activities & Dashboard
  activities: {
    getAll: () => request("/activities"),
    create: (activity) => request("/activities", { method: "POST", body: activity }),
    delete: (id) => request(`/activities/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    getActivity: () => request("/activities"),
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
      request(`/java-demo/concurrency-simulation?batchCount=${batchCount}&recordsPerBatch=${recordsPerBatch}`, {
        method: "POST",
      }),
    csvExport: () => request("/java-demo/export-csv", { headers: { Accept: "text/csv" } }),
    csvImport: (csvContent) =>
      request("/java-demo/csv-import", { method: "POST", body: csvContent, headers: { "Content-Type": "text/plain" } }),
    jdbcTransaction: (shouldFail = false) =>
      request(`/java-demo/jdbc-transaction?shouldFail=${shouldFail}`, { method: "POST" }),
  },
};

export default api;

/* =========================================================
   data.js — Hardcoded datasets
   ---------------------------------------------------------
   This is the ONLY place data is defined. Swapping to a real
   backend later means replacing the getters in js/app.js
   (SMS.api) with fetch() calls — nothing else changes.
   ========================================================= */

/* The five subjects marks are recorded for. Every teacher teaches ONE of them. */
const SUBJECTS = [
  { key: "mathematics", label: "Mathematics" },
  { key: "physics", label: "Physics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "english", label: "English" },
  { key: "computerScience", label: "Computer Science" },
];

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
];

const students = [
  { id: 101, roll: "CS-2101", name: "Rahul Sharma", department: "Computer Science", semester: 5, email: "rahul.sharma@college.edu", phone: "9876543210", attendance: 92, status: "Active", gender: "Male", address: "12 Nehru Road, Pune" },
  { id: 102, roll: "CS-2102", name: "Ananya Iyer", department: "Computer Science", semester: 5, email: "ananya.iyer@college.edu", phone: "9812345678", attendance: 96, status: "Active", gender: "Female", address: "44 MG Road, Bengaluru" },
  { id: 103, roll: "IT-2103", name: "Mohammed Faiz", department: "Information Technology", semester: 3, email: "m.faiz@college.edu", phone: "9765432109", attendance: 81, status: "Active", gender: "Male", address: "7 Charminar Lane, Hyderabad" },
  { id: 104, roll: "EC-2104", name: "Sneha Kulkarni", department: "Electronics", semester: 7, email: "sneha.k@college.edu", phone: "9898989898", attendance: 74, status: "Active", gender: "Female", address: "9 FC Road, Pune" },
  { id: 105, roll: "ME-2105", name: "Arjun Nair", department: "Mechanical", semester: 1, email: "arjun.nair@college.edu", phone: "9700112233", attendance: 68, status: "Probation", gender: "Male", address: "21 Marine Drive, Kochi" },
  { id: 106, roll: "CV-2106", name: "Priya Deshmukh", department: "Civil", semester: 5, email: "priya.d@college.edu", phone: "9600445566", attendance: 88, status: "Active", gender: "Female", address: "3 Shivaji Nagar, Nagpur" },
  { id: 107, roll: "CS-2107", name: "Vikram Chauhan", department: "Computer Science", semester: 3, email: "vikram.c@college.edu", phone: "9555778899", attendance: 79, status: "Active", gender: "Male", address: "56 Civil Lines, Jaipur" },
  { id: 108, roll: "IT-2108", name: "Meera Joshi", department: "Information Technology", semester: 7, email: "meera.joshi@college.edu", phone: "9445566778", attendance: 94, status: "Active", gender: "Female", address: "18 Lake View, Bhopal" },
  { id: 109, roll: "EC-2109", name: "Rohan Bhatt", department: "Electronics", semester: 5, email: "rohan.bhatt@college.edu", phone: "9334455667", attendance: 62, status: "Probation", gender: "Male", address: "77 Ring Road, Surat" },
  { id: 110, roll: "ME-2110", name: "Kavya Menon", department: "Mechanical", semester: 3, email: "kavya.menon@college.edu", phone: "9223344556", attendance: 90, status: "Active", gender: "Female", address: "5 Temple Street, Thrissur" },
  { id: 111, roll: "CV-2111", name: "Aditya Rane", department: "Civil", semester: 1, email: "aditya.rane@college.edu", phone: "9112233445", attendance: 85, status: "Active", gender: "Male", address: "31 Hill Road, Mumbai" },
  { id: 112, roll: "CS-2112", name: "Nisha Verma", department: "Computer Science", semester: 7, email: "nisha.verma@college.edu", phone: "9001122334", attendance: 98, status: "Active", gender: "Female", address: "2 Park Avenue, Delhi" },
  { id: 113, roll: "IT-2113", name: "Sameer Qureshi", department: "Information Technology", semester: 5, email: "sameer.q@college.edu", phone: "9987654321", attendance: 71, status: "Active", gender: "Male", address: "64 Station Road, Lucknow" },
  { id: 114, roll: "EC-2114", name: "Divya Raghavan", department: "Electronics", semester: 1, email: "divya.r@college.edu", phone: "9876501234", attendance: 83, status: "Active", gender: "Female", address: "8 Anna Salai, Chennai" },
  { id: 115, roll: "ME-2115", name: "Karan Gill", department: "Mechanical", semester: 7, email: "karan.gill@college.edu", phone: "9765012345", attendance: 77, status: "Active", gender: "Male", address: "12 Mall Road, Amritsar" },
  { id: 116, roll: "CV-2116", name: "Ishita Bose", department: "Civil", semester: 3, email: "ishita.bose@college.edu", phone: "9654123456", attendance: 89, status: "Active", gender: "Female", address: "40 Salt Lake, Kolkata" },
  { id: 117, roll: "CS-2117", name: "Yash Patel", department: "Computer Science", semester: 1, email: "yash.patel@college.edu", phone: "9543234567", attendance: 58, status: "Inactive", gender: "Male", address: "77 SG Highway, Ahmedabad" },
  { id: 118, roll: "IT-2118", name: "Tanya Grewal", department: "Information Technology", semester: 1, email: "tanya.g@college.edu", phone: "9432345678", attendance: 93, status: "Active", gender: "Female", address: "6 Sector 17, Chandigarh" },
  { id: 119, roll: "EC-2119", name: "Harsh Vardhan", department: "Electronics", semester: 3, email: "harsh.v@college.edu", phone: "9321456789", attendance: 86, status: "Active", gender: "Male", address: "19 Gomti Nagar, Lucknow" },
  { id: 120, roll: "ME-2120", name: "Ritu Saxena", department: "Mechanical", semester: 5, email: "ritu.saxena@college.edu", phone: "9210567890", attendance: 91, status: "Active", gender: "Female", address: "25 Lodhi Colony, Delhi" },
];

const courses = [
  { code: "CS501", name: "Data Structures & Algorithms", faculty: "Dr. Sudha Rao", credits: 4, semester: 5, status: "Ongoing" },
  { code: "CS502", name: "Operating Systems", faculty: "Prof. Anil Kapoor", credits: 4, semester: 5, status: "Ongoing" },
  { code: "IT301", name: "Database Management Systems", faculty: "Dr. Neha Bansal", credits: 3, semester: 3, status: "Ongoing" },
  { code: "IT302", name: "Web Technologies", faculty: "Prof. Rajeev Menon", credits: 3, semester: 3, status: "Ongoing" },
  { code: "EC701", name: "VLSI Design", faculty: "Dr. Kiran Shetty", credits: 4, semester: 7, status: "Ongoing" },
  { code: "EC702", name: "Embedded Systems", faculty: "Prof. Manoj Tiwari", credits: 3, semester: 7, status: "Completed" },
  { code: "ME101", name: "Engineering Mechanics", faculty: "Dr. Vandana Pillai", credits: 4, semester: 1, status: "Ongoing" },
  { code: "ME102", name: "Thermodynamics", faculty: "Prof. Deepak Sinha", credits: 4, semester: 1, status: "Upcoming" },
  { code: "CV305", name: "Structural Analysis", faculty: "Dr. Farhan Ali", credits: 4, semester: 3, status: "Ongoing" },
  { code: "CS503", name: "Machine Learning Basics", faculty: "Dr. Sudha Rao", credits: 3, semester: 5, status: "Upcoming" },
  { code: "EN101", name: "Technical Communication", faculty: "Prof. Meera Nambiar", credits: 2, semester: 1, status: "Ongoing" },
];

/* Attendance records: present / absent days per student */
const attendanceRecords = students.map((s, i) => {
  const total = 120;
  const present = Math.round((s.attendance / 100) * total);
  return {
    studentId: s.id,
    name: s.name,
    roll: s.roll,
    department: s.department,
    totalDays: total,
    presentDays: present,
    absentDays: total - present,
    lastMarked: `2026-07-${String((i % 28) + 1).padStart(2, "0")}`,
  };
});

/* Marks records — 5 subjects out of 100 each */
const marksRecords = [
  { studentId: 101, mathematics: 88, physics: 79, chemistry: 84, english: 91, computerScience: 95 },
  { studentId: 102, mathematics: 95, physics: 92, chemistry: 90, english: 88, computerScience: 98 },
  { studentId: 103, mathematics: 68, physics: 72, chemistry: 65, english: 74, computerScience: 80 },
  { studentId: 104, mathematics: 74, physics: 66, chemistry: 71, english: 69, computerScience: 63 },
  { studentId: 105, mathematics: 52, physics: 48, chemistry: 55, english: 61, computerScience: 50 },
  { studentId: 106, mathematics: 81, physics: 77, chemistry: 85, english: 80, computerScience: 76 },
  { studentId: 107, mathematics: 70, physics: 74, chemistry: 68, english: 72, computerScience: 84 },
  { studentId: 108, mathematics: 92, physics: 89, chemistry: 87, english: 94, computerScience: 91 },
  { studentId: 109, mathematics: 44, physics: 51, chemistry: 47, english: 58, computerScience: 49 },
  { studentId: 110, mathematics: 85, physics: 83, chemistry: 88, english: 79, computerScience: 81 },
  { studentId: 111, mathematics: 78, physics: 71, chemistry: 74, english: 83, computerScience: 70 },
  { studentId: 112, mathematics: 97, physics: 94, chemistry: 96, english: 92, computerScience: 99 },
  { studentId: 113, mathematics: 64, physics: 59, chemistry: 67, english: 71, computerScience: 73 },
  { studentId: 114, mathematics: 76, physics: 80, chemistry: 72, english: 78, computerScience: 75 },
  { studentId: 115, mathematics: 69, physics: 65, chemistry: 70, english: 66, computerScience: 62 },
  { studentId: 116, mathematics: 84, physics: 86, chemistry: 82, english: 87, computerScience: 85 },
  { studentId: 117, mathematics: 41, physics: 38, chemistry: 45, english: 52, computerScience: 44 },
  { studentId: 118, mathematics: 90, physics: 88, chemistry: 91, english: 89, computerScience: 93 },
  { studentId: 119, mathematics: 79, physics: 82, chemistry: 77, english: 81, computerScience: 86 },
  { studentId: 120, mathematics: 87, physics: 85, chemistry: 89, english: 84, computerScience: 90 },
];

/* Expose a single namespaced payload (backend response shape) */
/* Teacher accounts allowed to sign in as Teacher (name + teacher ID).
   Each teacher teaches one subject (key from SUBJECTS above).
   Add or remove teachers here. */
const TEACHERS = [
  { id: "T-1001", name: "Dr. Sudha Rao", subject: "computerScience" },
  { id: "T-1002", name: "Prof. Anil Kapoor", subject: "computerScience" },
  { id: "T-1003", name: "Dr. Neha Bansal", subject: "computerScience" },
  { id: "T-1004", name: "Prof. Rajeev Menon", subject: "computerScience" },
  { id: "T-1005", name: "Dr. Kiran Shetty", subject: "physics" },
  { id: "T-1006", name: "Prof. Manoj Tiwari", subject: "physics" },
  { id: "T-1007", name: "Dr. Vandana Pillai", subject: "mathematics" },
  { id: "T-1008", name: "Prof. Deepak Sinha", subject: "chemistry" },
  { id: "T-1009", name: "Dr. Farhan Ali", subject: "mathematics" },
  { id: "T-1010", name: "Prof. Meera Nambiar", subject: "english" },
];

window.SMS_SEED = {
  teachers: TEACHERS,
  subjects: SUBJECTS,
  departments: DEPARTMENTS,
  students,
  courses,
  attendanceRecords,
  marksRecords,
};

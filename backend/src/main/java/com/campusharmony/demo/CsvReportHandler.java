package com.campusharmony.demo;

import com.campusharmony.entity.Student;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates Core Java File I/O & Exception Handling:
 * - BufferedReader, BufferedWriter, try-with-resources
 * - Custom Checked Exception (CsvParseException)
 * - CSV parsing, header verification, and formatted CSV export
 */
@Component
public class CsvReportHandler {

    /**
     * Custom Checked Exception for CSV Parsing errors.
     */
    public static class CsvParseException extends Exception {
        public CsvParseException(String message) {
            super(message);
        }

        public CsvParseException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exports a list of students to a CSV formatted string using BufferedWriter.
     */
    public String exportStudentsToCsv(List<Student> students) throws IOException {
        StringWriter sw = new StringWriter();
        try (BufferedWriter bw = new BufferedWriter(sw)) {
            // Write CSV Header
            bw.write("Roll,Name,Department,Semester,Email,Phone,Status,AttendancePct");
            bw.newLine();

            for (Student s : students) {
                String line = String.format("%s,%s,%s,%d,%s,%s,%s,%s",
                        escapeCsv(s.getRoll()),
                        escapeCsv(s.getName()),
                        escapeCsv(s.getDepartment()),
                        s.getSemester() != null ? s.getSemester() : 1,
                        escapeCsv(s.getEmail()),
                        escapeCsv(s.getPhone()),
                        escapeCsv(s.getStatus()),
                        s.getAttendance() != null ? s.getAttendance() : 0
                );
                bw.write(line);
                bw.newLine();
            }
            bw.flush();
        }
        return sw.toString();
    }

    /**
     * Parses a CSV string into Student entity objects using BufferedReader.
     */
    public List<Student> importStudentsFromCsv(String csvContent) throws CsvParseException {
        List<Student> students = new ArrayList<>();
        if (csvContent == null || csvContent.isBlank()) {
            return students;
        }

        try (BufferedReader br = new BufferedReader(new StringReader(csvContent))) {
            String header = br.readLine();
            if (header == null) {
                throw new CsvParseException("CSV content is empty: Missing header row.");
            }

            String line;
            int lineNum = 1;

            while ((line = br.readLine()) != null) {
                lineNum++;
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] tokens = line.split(",", -1);
                if (tokens.length < 7) {
                    throw new CsvParseException("Line " + lineNum + ": Insufficient columns. Expected at least 7, found " + tokens.length);
                }

                try {
                    String roll = tokens[0].trim();
                    String name = tokens[1].trim();
                    String department = tokens[2].trim();
                    int semester = Integer.parseInt(tokens[3].trim());
                    String email = tokens[4].trim();
                    String phone = tokens[5].trim();
                    String status = tokens[6].trim();

                    Student s = new Student(roll, name, department, semester, email, phone, status, "Other", null, null);
                    if (tokens.length >= 8 && !tokens[7].trim().isEmpty()) {
                        s.setAttendance(Integer.parseInt(tokens[7].trim()));
                    }
                    students.add(s);
                } catch (NumberFormatException e) {
                    throw new CsvParseException("Line " + lineNum + ": Numeric parse failure for semester or attendance", e);
                }
            }
        } catch (IOException e) {
            throw new CsvParseException("I/O error during CSV parsing: " + e.getMessage(), e);
        }

        return students;
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}

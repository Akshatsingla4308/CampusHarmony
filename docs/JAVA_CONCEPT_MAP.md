# CAMPUS HARMONY — PROGRAMMING IN JAVA CONCEPT MAP & DEMONSTRATION MODULE DESIGN

**Course:** Programming in Java (25CSE0202)  
**Evaluation:** Continuous Evaluation 3 (CA-3 Milestone - 25 Marks) & CA-4 (Final Viva)  
**Session:** July–December 2026, Semester III, Batch 2025  
**Target Environment:** JDK 21 LTS  

---

## 1. Academic Rationale & Separation of Concerns

Campus Harmony is architected as an industry-standard full-stack ERP web application using Spring Boot and Spring Data JPA. However, the Java Course Handout (CHO) for course 25CSE0202 explicitly requires demonstrable mastery of:
- Direct low-level JDBC (`DriverManager`, `Connection`, `PreparedStatement`, `ResultSet`, explicit manual transaction rollback/commit).
- Core Java Collections Framework and custom Comparators.
- Functional Programming with Lambdas and Stream API.
- Generics with bounded type parameters.
- File I/O with character streams (`BufferedReader`, `BufferedWriter`) in try-with-resources.
- Multithreading and Concurrency primitives (`Thread`, `Runnable`, `synchronized`, `ExecutorService`, `Callable`, `Future`).

To achieve academic excellence without degrading the production-grade JPA backend, we design a dedicated, high-visibility lab package:
`com.campusharmony.lab.*`

```text
com.campusharmony/
├── [Spring Boot Production Layers]
│   ├── controller/               (REST Endpoints)
│   ├── service/                  (JPA Services)
│   ├── repository/               (Spring Data JPA Repositories)
│   └── entity/                   (JPA Entities)
│
└── lab/                          (Java 25CSE0202 Direct Academic Module)
    ├── jdbc/                     (Direct JDBC CRUD & Manual ACID Transactions)
    ├── collections/              (Collections Framework & Custom Comparators)
    ├── streams/                  (Lambdas, Stream API Analytics & Grouping)
    ├── common/                   (Generic Containers & Custom Exceptions)
    ├── file/                     (CSV Import/Export using Character Streams)
    ├── concurrency/              (Threads, Synchronization & ExecutorService)
    └── controller/               (REST Demo Endpoints for Viva Demonstration)
```

---

## 2. Topic-by-Topic Concept Mapping Matrix

| Java Topic | Concept / API | Specific Class / Interface | Method / Technique | Viva Explanation & Student Talking Point |
| :--- | :--- | :--- | :--- | :--- |
| **OOP: Inheritance** | BaseEntity reusability | `BaseEntity.java`, `Student.java` | `public class Student extends BaseEntity` | Common audit attributes (`createdAt`, `updatedAt`) are inherited, eliminating code duplication across entities. |
| **OOP: Encapsulation** | Data hiding & getters/setters | All entity & DTO classes | Private fields with validated public getters/setters | Object state cannot be corrupted directly; access is mediated through methods. |
| **OOP: Abstraction & Polymorphism** | Interface & Multiple Implementations | `StudentService.java`, `DirectJdbcStudentService.java` | Interface contracts implemented by JPA and Direct JDBC | The caller interacts with an abstract contract, decoupling data persistence from business logic. |
| **Direct JDBC** | `Connection`, `PreparedStatement`, `ResultSet` | `com.campusharmony.lab.jdbc.DirectJdbcStudentRepository` | `findStudentById(Long id)` | Uses standard `PreparedStatement` with typed parameter binding (`?`) to prevent SQL Injection attacks. |
| **JDBC Transactions** | Manual ACID commit & rollback | `DirectJdbcStudentRepository` | `transferStudentDepartment(...)` | `conn.setAutoCommit(false);` executes multiple updates atomically, invoking `conn.commit()` on success and `conn.rollback()` inside `catch (SQLException e)`. |
| **JDBC Try-with-Resources** | Safe Resource Cleanup | `DirectJdbcStudentRepository` | `try (Connection conn = ...; PreparedStatement ps = ...)` | Classes implementing `java.lang.AutoCloseable` are guaranteed to close even if an unhandled exception is thrown, preventing connection leaks. |
| **Collections: Lists** | Dynamic Arrays vs Doubly Linked | `StudentCollectionsService` | `List<Student> list = new ArrayList<>();` | `ArrayList` provides $O(1)$ random access by index; `LinkedList` provides $O(1)$ head/tail insertion/deletion. |
| **Collections: Sets** | Uniqueness & Natural Ordering | `StudentCollectionsService` | `Set<Student> set = new TreeSet<>(new StudentRollComparator());` | `HashSet` enforces uniqueness in $O(1)$ time; `TreeSet` maintains Red-Black Tree sorted order of student rolls in $O(\log n)$ time. |
| **Collections: Maps** | Key-Value Indexing & Bucketing | `StudentCollectionsService` | `Map<String, List<Student>> deptMap = new HashMap<>();` | Students are indexed by department code, enabling instant $O(1)$ lookup without scanning entire tables. |
| **Comparators** | Custom Sorting Criteria | `StudentRollComparator`, `StudentAttendanceComparator` | `implements Comparator<Student>` | `StudentAttendanceComparator` sorts ascending/descending by attendance %; `StudentRollComparator` sorts naturally. |
| **Lambdas & Functional Interfaces** | Anonymous functions & Predicates | `StudentStreamAnalyticsService` | `Predicate<Student> isDefaulter = s -> s.getAttendance() < 75;` | Concise function implementations passed directly as arguments without boilerplate anonymous inner classes. |
| **Stream API: Filtering & Mapping** | Declarative Data Processing | `StudentStreamAnalyticsService` | `students.stream().filter(...).map(...).toList()` | Transforms and filters data declaratively in memory without imperative for-loops. |
| **Stream API: Grouping & Partitioning** | Complex In-Memory Analytics | `StudentStreamAnalyticsService` | `collect(Collectors.groupingBy(...))` and `collect(Collectors.partitioningBy(...))` | Groups students by department and partitions cohorts into Exam-Eligible ($\ge 75\%$) vs Defaulters ($< 75\%$). |
| **Stream API: Statistics** | Reductions & Summaries | `StudentStreamAnalyticsService` | `stream.collect(Collectors.summarizingDouble(...))` | Computes count, sum, minimum, average, and maximum of student scores in a single efficient pass. |
| **Generics** | Type Safety & Reusability | `GenericResult<T>`, `GenericInMemoryStore<K, V extends BaseEntity>` | `public class GenericResult<T> { private T data; ... }` | Reusable response wrapper parameterized over type `<T>`, eliminating unsafe runtime type casting (`(Object)`). |
| **File I/O: CSV Export** | Character Streams Writing | `StudentCsvService` | `BufferedWriter`, `FileWriter`, try-with-resources | Streams records directly to disk in CSV format with proper RFC-4180 header and value escaping. |
| **File I/O: CSV Import** | Character Streams Reading & Validation | `StudentCsvService` | `BufferedReader.readLine()` | Reads text line-by-line, parses delimited fields, validates semester/roll constraints, and rejects malformed rows safely. |
| **Concurrency: Threads** | Independent Execution | `ConcurrencyDemoService` | `new Thread(new ReportTask()).start();` | Demonstrates starting background asynchronous execution without freezing the main application request thread. |
| **Concurrency: Thread Pool** | Executor Framework | `ConcurrencyDemoService` | `ExecutorService executor = Executors.newFixedThreadPool(2);` | Reuses bounded worker threads, preventing thread creation overhead and out-of-memory errors. |
| **Concurrency: Futures** | Asynchronous Result Retrieval | `ConcurrencyDemoService` | `Future<DepartmentReport> future = executor.submit(callable);` | Submits a `Callable<T>` and retrieves the calculated report asynchronously with `future.get()`. |
| **Synchronization** | Critical Section & Race Conditions | `ConcurrencyDemoService.CriticalSectionDemo` | `synchronized(this) { counter++; }` vs non-synchronized counter | Demonstrates race condition where multi-threaded increments lose updates, and proves how `synchronized` restores atomicity. |
| **Exception Handling** | Custom Hierarchy & Propagation | `AcademicConstraintViolationException`, `GlobalExceptionHandler` | Custom checked/unchecked exceptions with `@ExceptionHandler` | Custom business exceptions propagate to a central handler, returning clean HTTP status codes (400, 404, 500) to clients. |

---

## 3. Detailed Class Specifications for the Lab Module

### A. Direct JDBC Module (`com.campusharmony.lab.jdbc`)
```java
public class DirectJdbcStudentRepository {
    private final DataSource dataSource;

    public DirectJdbcStudentRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // 1. Direct PreparedStatement Query with AutoCloseable try-with-resources
    public Optional<Student> findByIdDirectJdbc(Long id) throws SQLException {
        String sql = "SELECT id, roll, name, department, semester, email, phone, status, gender FROM students WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToStudent(rs));
                }
            }
        }
        return Optional.empty();
    }

    // 2. Direct ACID Transaction with explicit commit & rollback
    public boolean transferDepartmentTransactional(Long studentId, String newDepartment, boolean simulateError) throws SQLException {
        String updateStudentSql = "UPDATE students SET department = ? WHERE id = ?";
        String logActivitySql = "INSERT INTO activities (text, type, created_at) VALUES (?, 'transfer', NOW())";

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // Begin manual transaction

            // Step 1: Update student department
            try (PreparedStatement ps1 = conn.prepareStatement(updateStudentSql)) {
                ps1.setString(1, newDepartment);
                ps1.setLong(2, studentId);
                ps1.executeUpdate();
            }

            // Step 2: Log transfer in audit table
            try (PreparedStatement ps2 = conn.prepareStatement(logActivitySql)) {
                ps2.setString(1, "Transferred student #" + studentId + " to " + newDepartment);
                ps2.executeUpdate();
            }

            // Intentional failure switch for viva demonstration
            if (simulateError) {
                throw new SQLException("Simulated database failure during department transfer!");
            }

            conn.commit(); // Commit transaction
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                conn.rollback(); // Rollback on error
            }
            throw e;
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }
}
```

### B. Java Stream Analytics Service (`com.campusharmony.lab.streams`)
```java
public class StudentStreamAnalyticsService {

    // 1. Partition students into Eligible (>= 75%) vs Defaulters (< 75%)
    public Map<Boolean, List<Student>> partitionByAttendanceEligibility(List<Student> students) {
        return students.stream()
                .filter(s -> s.getAttendance() != null)
                .collect(Collectors.partitioningBy(s -> s.getAttendance() >= 75));
    }

    // 2. Group students by department and compute average attendance percentage
    public Map<String, Double> getDepartmentAverageAttendance(List<Student> students) {
        return students.stream()
                .filter(s -> s.getAttendance() != null)
                .collect(Collectors.groupingBy(
                        Student::getDepartment,
                        Collectors.averagingDouble(Student::getAttendance)
                ));
    }

    // 3. Summarizing statistics of attendance across the entire institute
    public DoubleSummaryStatistics getAttendanceStatistics(List<Student> students) {
        return students.stream()
                .filter(s -> s.getAttendance() != null)
                .collect(Collectors.summarizingDouble(Student::getAttendance));
    }
}
```

### C. Concurrency Demonstration (`com.campusharmony.lab.concurrency`)
```java
public class ConcurrencyDemoService {
    private final ExecutorService threadPool = Executors.newFixedThreadPool(2);

    // Asynchronous calculation of department metrics using Callable and Future
    public Future<Map<String, Object>> calculateMetricsAsync(List<Student> students) {
        return threadPool.submit(() -> {
            Thread.sleep(300); // Simulate processing work
            long activeCount = students.stream().filter(s -> "Active".equals(s.getStatus())).count();
            return Map.of("total", students.size(), "active", activeCount);
        });
    }

    // Lab Demo: Critical Section Race Condition vs Synchronized Method
    public static class CounterDemo {
        private int unsafeCount = 0;
        private int safeCount = 0;

        public void incrementUnsafe() {
            unsafeCount++; // Non-atomic read-modify-write causes lost updates
        }

        public synchronized void incrementSafe() {
            safeCount++; // Mutex lock guarantees thread safety
        }

        public int getUnsafeCount() { return unsafeCount; }
        public int getSafeCount() { return safeCount; }
    }
}
```

---

## 4. Student Viva Checklist for Java CA-3 / CA-4

When presenting Campus Harmony in the Java viva, students should walk through:
1. **Architecture:** Point out why Spring Data JPA handles everyday web traffic while `com.campusharmony.lab.jdbc` demonstrates direct JDBC driver management and transactions.
2. **Exception Handling:** Explain why custom exceptions extend `RuntimeException` and how `GlobalExceptionHandler` intercepts them with `@ControllerAdvice`.
3. **Collections:** Demonstrate why `StudentRollComparator` uses `Comparator.comparing(Student::getRoll)` and why `TreeSet` maintains sorted order.
4. **Streams:** Open `StudentStreamAnalyticsService` and explain the pipeline: Source (`students.stream()`) $\to$ Intermediate Operations (`filter`, `map`, `sorted`) $\to$ Terminal Operation (`collect(groupingBy)`).
5. **Thread Safety:** Run the `CounterDemo` test showing how 1,000 concurrent threads fail on `unsafeCount` (e.g., getting 942 instead of 1,000) but succeed deterministically on `safeCount` (1,000).

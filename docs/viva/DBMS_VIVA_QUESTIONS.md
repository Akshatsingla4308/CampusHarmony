# DATABASE MANAGEMENT SYSTEMS (24CSE0209) — VIVA QUESTION BANK

**Course Title:** Database Management Systems  
**Course Code:** 24CSE0209  
**Target Audience:** Chitkara University BE CSE, Batch 2025 (Semester III)  
**Evaluation:** Final Project-Based Evaluation (50 Marks)  
**Structure:** 30 Basic Questions + 20 Intermediate Questions + 10 Project-Specific Questions + Viva Tips  

---

## PART 1: 30 BASIC VIVA QUESTIONS & ANSWERS

### Q1: What is a Database and what is a DBMS?
**Answer:** A database is an organized collection of structured data stored electronically. A Database Management System (DBMS) is software that enables users and applications to create, query, update, administer, and retrieve data while maintaining data integrity and security (e.g., MySQL, PostgreSQL, Oracle).

### Q2: What is the difference between a File System and a DBMS?
**Answer:** 
- **File System:** High data redundancy, potential inconsistency, no concurrent access control, no data recovery mechanisms, and weak security.
- **DBMS:** Minimizes data redundancy, guarantees consistency through constraints, supports concurrent multi-user access with locking/MVCC, offers crash recovery via transaction logs, and enforces fine-grained access control.

### Q3: What is a Relational Database Management System (RDBMS)?
**Answer:** An RDBMS is a DBMS based on the relational model introduced by E.F. Codd, where data is organized into two-dimensional tables (relations) consisting of rows (tuples) and columns (attributes), interconnected via primary and foreign key constraints.

### Q4: Define Primary Key, Candidate Key, and Super Key.
**Answer:**
- **Super Key:** Any set of one or more attributes that uniquely identifies a tuple in a table.
- **Candidate Key:** A minimal Super Key with no redundant attributes.
- **Primary Key:** The specific Candidate Key chosen by the database designer to uniquely identify tuples in the table. It must be unique and cannot contain `NULL` values.

### Q5: What is a Foreign Key?
**Answer:** An attribute (or collection of attributes) in one table that references the Primary Key (or unique candidate key) of another table. It enforces referential integrity between related entities.

### Q6: What is a Composite Key?
**Answer:** A primary key or candidate key made up of two or more attributes combined to uniquely identify a record in a table (e.g., `{course_code, session_date, slot_number}` in `attendance_sessions`).

### Q7: What are the sub-languages of SQL?
**Answer:**
1. **DDL (Data Definition Language):** Defines structure (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`).
2. **DML (Data Manipulation Language):** Manipulates data (`INSERT`, `UPDATE`, `DELETE`).
3. **DQL (Data Query Language):** Queries data (`SELECT`).
4. **DCL (Data Control Language):** Manages permissions (`GRANT`, `REVOKE`).
5. **TCL (Transaction Control Language):** Manages transactions (`COMMIT`, `ROLLBACK`, `SAVEPOINT`).

### Q8: What is the difference between `DELETE`, `TRUNCATE`, and `DROP`?
**Answer:**
- `DELETE`: DML command, deletes specific rows based on a `WHERE` clause, activates row triggers, can be rolled back, slower.
- `TRUNCATE`: DDL command, deletes all rows by deallocating table pages, resets auto-increment counters, cannot be rolled back in most engines, does not fire triggers.
- `DROP`: DDL command, completely removes the table schema, constraints, indexes, and data permanently from the database.

### Q9: What are the ACID properties in database transactions?
**Answer:**
- **Atomicity:** All operations in a transaction succeed, or the entire transaction is rolled back ("all-or-nothing").
- **Consistency:** The database transitions strictly from one valid state to another, preserving all integrity constraints.
- **Isolation:** Concurrent transactions execute without interfering with one another.
- **Durability:** Once committed, transaction changes survive permanent system or power failures.

### Q10: What is Normalization and why is it used?
**Answer:** Normalization is the formal process of decomposing tables to minimize data redundancy and eliminate insertion, update, and deletion anomalies while preserving data integrity and functional dependencies.

### Q11: Explain First Normal Form (1NF).
**Answer:** A relation is in 1NF if every attribute domain contains only atomic (indivisible) values, and there are no repeating groups or multi-valued attributes (arrays/comma-separated values).

### Q12: Explain Second Normal Form (2NF).
**Answer:** A relation is in 2NF if it is in 1NF and no non-prime attribute is partially dependent on any candidate key (all non-prime attributes are fully functionally dependent on the entire primary key).

### Q13: Explain Third Normal Form (3NF).
**Answer:** A relation is in 3NF if it is in 2NF and there are no transitive dependencies (no non-prime attribute depends on another non-prime attribute). Formally, for $X \rightarrow Y$, $X$ must be a superkey or $Y$ must be a prime attribute.

### Q14: Explain Boyce-Codd Normal Form (BCNF).
**Answer:** A stronger version of 3NF. A relation is in BCNF if and only if for every non-trivial functional dependency $X \rightarrow Y$, the determinant $X$ is a superkey.

### Q15: What is a `NULL` value in SQL?
**Answer:** `NULL` represents a missing, unknown, or inapplicable value. It is not equivalent to zero, an empty string, or false. Any equality check with NULL (`col = NULL`) yields `UNKNOWN`; checks must use `IS NULL` or `IS NOT NULL`.

### Q16: What is the difference between `WHERE` and `HAVING` clauses?
**Answer:**
- `WHERE`: Filters individual rows *before* any grouping or aggregation takes place. Cannot use aggregate functions.
- `HAVING`: Filters grouped summary rows *after* the `GROUP BY` clause has aggregated the records. Can evaluate aggregate functions (e.g., `HAVING COUNT(*) > 5`).

### Q17: What are SQL Aggregate Functions?
**Answer:** Functions that perform a calculation on a set of values and return a single scalar result: `COUNT()`, `SUM()`, `AVG()`, `MIN()`, and `MAX()`.

### Q18: Explain the different types of SQL JOINs.
**Answer:**
- **INNER JOIN:** Returns only rows with matching values in both tables.
- **LEFT (OUTER) JOIN:** Returns all rows from the left table and matched rows from the right table (unmatched right rows become `NULL`).
- **RIGHT (OUTER) JOIN:** Returns all rows from the right table and matched rows from the left table.
- **FULL (OUTER) JOIN:** Returns all rows when there is a match in either left or right table.
- **CROSS JOIN:** Returns the Cartesian product of both tables ($M \times N$ rows).

### Q19: What is an Entity-Relationship (ER) Diagram?
**Answer:** A conceptual data model representing real-world entities (objects), their attributes (properties), and the relationships (associations) among them, typically rendered using Crow's Foot or Chen notation.

### Q20: What is Cardinality in an ER relationship?
**Answer:** Cardinality specifies the numerical relationship between entities:
- One-to-One (1:1)
- One-to-Many (1:N)
- Many-to-Many (M:N)

### Q21: What is a Weak Entity?
**Answer:** An entity that cannot be uniquely identified by its own attributes alone and depends on the existence of an identifying strong entity through a foreign key (e.g., `attendance_records` depends on `attendance_sessions`).

### Q22: What is an Index in a database?
**Answer:** A data structure (typically a balanced B-Tree) created on table columns to drastically speed up data retrieval operations ($O(\log n)$) at the cost of additional disk storage and slower write operations (`INSERT`/`UPDATE`).

### Q23: What is a Relational View?
**Answer:** A virtual table based on the result-set of a pre-compiled SQL query. It does not store physical data itself (unless materialized); it simplifies complex queries, provides security by restricting column visibility, and isolates applications from schema changes.

### Q24: What is a Stored Procedure?
**Answer:** A pre-compiled collection of SQL statements and procedural control-flow logic (loops, conditionals, exception handlers) stored in the database catalog that can accept input/output parameters and be invoked repeatedly by applications.

### Q25: What is a Stored Function?
**Answer:** A stored routine that takes input parameters, executes deterministic computation, and MUST return a single scalar value. Unlike procedures, functions can be called directly inside SQL `SELECT`, `WHERE`, and `ORDER BY` clauses.

### Q26: What is a Database Trigger?
**Answer:** A special stored procedure that automatically executes (fires) in response to a specific DML event (`INSERT`, `UPDATE`, `DELETE`) occurring on a specified table.

### Q27: What is the difference between `BEFORE` and `AFTER` triggers?
**Answer:**
- `BEFORE`: Fires prior to the row modification being written to the storage engine. Used for data validation, default assignment, or aborting the statement via `SIGNAL SQLSTATE`.
- `AFTER`: Fires after the row modification has been successfully written to the table. Used for audit logging, summary cache synchronization, or cross-table notifications.

### Q28: What is a Database Cursor?
**Answer:** A pointer/work-area mechanism that allows traversing and processing the individual rows of an SQL query result-set one row at a time within procedural code.

### Q29: What is the difference between `UNION` and `UNION ALL`?
**Answer:**
- `UNION`: Combines the result sets of two queries and performs an implicit `DISTINCT` sort operation to remove duplicate rows.
- `UNION ALL`: Combines the result sets and retains all duplicate rows. It is significantly faster because it avoids sorting.

### Q30: What is Referencing Integrity?
**Answer:** A relational database state where every foreign key value in a child table either matches a valid existing primary key value in the referenced parent table or is explicitly `NULL`.

---

## PART 2: 20 INTERMEDIATE VIVA QUESTIONS & ANSWERS

### Q31: How does a B-Tree index work in MySQL InnoDB?
**Answer:** A B-Tree (Balanced Tree) is a self-balancing search tree data structure. Leaf nodes store data pointers or row tuples at a uniform depth. Search, insertion, and deletion take logarithmic time ($O(\log n)$). In InnoDB, the primary key forms the **Clustered Index**, storing actual row data in its leaf nodes, while secondary indexes store the indexed column plus the primary key pointer.

### Q32: What is the difference between a Clustered and Non-Clustered (Secondary) Index?
**Answer:**
- **Clustered Index:** Dictates the physical storage order of rows in the table. There can only be one clustered index per table (the Primary Key in InnoDB). Leaf nodes contain the entire row.
- **Non-Clustered (Secondary) Index:** Separate index structure. Leaf nodes contain the indexed column values and a pointer (the primary key value) back to the clustered index.

### Q33: How do you use `EXPLAIN` to analyze query execution plans?
**Answer:** Prefixing a `SELECT` statement with `EXPLAIN` reveals the MySQL query optimizer's execution plan:
- `type`: `ALL` (full table scan, bad), `index` (index scan), `range` (index range scan), `ref` (non-unique index lookup), `const` (primary key lookup, fastest).
- `possible_keys` and `key`: Indexes considered vs. the actual index selected.
- `rows`: Estimated number of rows MySQL expects to inspect.

### Q34: Explain the four ANSI SQL Transaction Isolation Levels.
**Answer:**
1. **Read Uncommitted:** Lowest isolation; transactions can read uncommitted data modified by others (**Dirty Reads**).
2. **Read Committed:** Transactions only read committed data. Prevents dirty reads, but allows **Non-Repeatable Reads** (re-reading the same row within a transaction returns different values).
3. **Repeatable Read:** (MySQL default). Ensures that any row read during a transaction remains identical across multiple reads. Uses MVCC and Next-Key gap locks to prevent **Phantom Reads**.
4. **Serializable:** Highest isolation; enforces strict sequential execution via table/range locks. Prevents all anomalies at the cost of concurrency.

### Q35: What is Multi-Version Concurrency Control (MVCC) in InnoDB?
**Answer:** MVCC allows concurrent reads and writes without blocking. When a row is updated, InnoDB writes the old version of the row to the Undo Log. Readers see a consistent snapshot of the data as of the transaction start time without acquiring read locks, allowing readers and writers to operate simultaneously.

### Q36: What is the difference between Shared Locks (S-Locks) and Exclusive Locks (X-Locks)?
**Answer:**
- **Shared Lock (`FOR SHARE`):** Permits concurrent transactions to read a row, but prevents any transaction from writing/updating it until all shared locks are released.
- **Exclusive Lock (`FOR UPDATE`):** Grants exclusive write access to a single transaction; blocks all other transactions from acquiring shared or exclusive locks on that row.

### Q37: What is a Deadlock and how does MySQL resolve it?
**Answer:** A situation where two or more transactions hold locks on resources that the other transactions need to proceed, creating a circular wait cycle. MySQL InnoDB detects deadlocks automatically via a wait-for graph and resolves them by rolling back the transaction with the smallest undo log footprint, returning error code 1213.

### Q38: What are Cascading Referential Actions (`ON DELETE CASCADE`, `RESTRICT`, `SET NULL`)?
**Answer:**
- `CASCADE`: Deleting a parent row automatically deletes all corresponding matching rows in child tables.
- `RESTRICT`: Rejects the parent deletion if any matching rows exist in child tables (default).
- `SET NULL`: Deleting the parent sets the foreign key column in child rows to `NULL`.

### Q39: What is the lifecycle of an explicit Cursor in MySQL?
**Answer:**
1. `DECLARE cur CURSOR FOR SELECT ...;`
2. `DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;`
3. `OPEN cur;`
4. `FETCH cur INTO var1, var2;` (executed inside a `LOOP`)
5. `CLOSE cur;`

### Q40: What is the purpose of `SIGNAL SQLSTATE '45000'` in triggers and procedures?
**Answer:** `SIGNAL SQLSTATE '45000'` is the standard ANSI SQL mechanism to throw a user-defined unhandled exception. It immediately aborts the current SQL statement or transaction and returns a custom error message to the client.

### Q41: Why should stored functions be declared `DETERMINISTIC`?
**Answer:** A deterministic function always returns the exact same output for the same input parameters (e.g., mathematical formulas). Declaring it helps the query optimizer cache results and ensures safe binary logging during replication.

### Q42: What is the impact of heavy triggers on database write performance?
**Answer:** Triggers execute synchronously inside the same transaction as the triggering DML statement. If a trigger performs complex subqueries or writes to multiple other tables, it extends transaction duration, holds row locks longer, and increases contention.

### Q43: What is the difference between a Unique Constraint and a Primary Key?
**Answer:**
- **Primary Key:** Only one per table; automatically indexed; strictly forbids `NULL` values; serves as table identifier.
- **Unique Constraint:** Multiple unique constraints allowed per table; allows `NULL` values (in standard SQL, multiple NULLs are permitted because `NULL != NULL`).

### Q44: What is the trade-off between Normalization and Denormalization?
**Answer:**
- **Normalization:** Minimizes redundancy, eliminates anomalies, saves storage, but requires expensive multi-table JOINs for complex read queries.
- **Denormalization:** Stores redundant or pre-computed data to achieve fast $O(1)$ read performance, but introduces the risk of data desynchronization and requires triggers or batch jobs to maintain consistency.

### Q45: What is a Composite Foreign Key?
**Answer:** A foreign key constraint consisting of two or more columns that references a composite unique candidate key or primary key on a parent table, enforcing multi-column referential integrity.

### Q46: How does MySQL handle character encoding and collation?
**Answer:** Encoding defines how characters are mapped to binary bytes (e.g., `utf8mb4` supports full 4-byte Unicode including emojis). Collation defines the rules for comparing and sorting characters (e.g., `utf8mb4_unicode_ci` is case-insensitive and handles multi-language sorting correctly).

### Q47: What is the purpose of the MySQL Redo Log and Undo Log?
**Answer:**
- **Redo Log (`ib_logfile`):** Guarantees **Durability**. Records all committed page changes so they can be replayed during crash recovery.
- **Undo Log:** Guarantees **Atomicity** and powers MVCC. Records reverse operations to roll back uncommitted changes and provide consistent read snapshots.

### Q48: What is the difference between Correlated and Non-Correlated Subqueries?
**Answer:**
- **Non-Correlated Subquery:** Independent query evaluated once; its result is passed to the outer query.
- **Correlated Subquery:** References columns from the outer query; it is re-evaluated for each candidate row processed by the outer query.

### Q49: What is the purpose of a Database Migration script?
**Answer:** Version-controlled SQL scripts that apply incremental, repeatable DDL and DML changes to database schemas across environments (dev, test, prod) without data loss.

### Q50: How do you prevent SQL Injection attacks at the database and application levels?
**Answer:**
- At application level: Always use Parameterized Queries / Prepared Statements (`PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?")`).
- At database level: Implement least-privilege user roles, avoid dynamic SQL in stored routines, and use input validation triggers.

---

## PART 3: 10 PROJECT-SPECIFIC QUESTIONS & SQL REFERENCES

### Q51: Why did Campus Harmony implement composite foreign keys on `attendance_records`?
**Answer:**
Declaring independent foreign keys (`session_id`, `enrollment_id`, `student_id`) would permit severe data corruption: an attendance record could reference a session for Course A in Semester 1, but link an enrollment for Course B in Semester 2 belonging to another student.
We added composite candidate keys:
- `course_enrollments (id, student_id, course_code, academic_period_id)`
- `attendance_sessions (id, course_code, academic_period_id)`
And bound `attendance_records` with composite foreign keys `fk_att_rec_session_composite` and `fk_att_rec_enrollment_composite`, guaranteeing that the session, enrollment, course, period, and student match mathematically.
**Reference:** `docs/DATABASE_DESIGN.md#L15-L55`

### Q52: How do triggers keep the `attendance` summary cache synchronized across INSERT, UPDATE, and DELETE?
**Answer:**
- `trg_after_attendance_record_insert`: Increments `total_days = total_days + 1` and `present_days`/`absent_days` based on status.
- `trg_after_attendance_record_update`: Adjusts counts when status toggles between Present and Absent (`present_days +/- 1`, `absent_days -/+ 1`).
- `trg_after_attendance_record_delete`: Decrements `total_days` and the corresponding status counter.
**Reference:** `database/procedures_triggers.sql#L130-L195`

### Q53: Explain the mathematical formula used in `fn_calculate_classes_needed`.
**Answer:**
To reach a target percentage $\theta = 0.75$ with $P$ present classes and $T$ total classes:
$$\frac{P + x}{T + x} \ge 0.75 \implies P + x \ge 0.75T + 0.75x \implies 0.25x \ge 0.75T - P \implies x = \left\lceil \frac{0.75T - P}{0.25} \right\rceil$$
The stored function evaluates this continuous shortfall formula and returns the integer number of consecutive classes a defaulter must attend to clear debarment.
**Reference:** `database/procedures_triggers.sql#L35-L60`

### Q54: How does `sp_generate_attendance_defaulter_report` use a cursor and exception handler?
**Answer:**
The procedure declares an explicit cursor:
`DECLARE cur_students CURSOR FOR SELECT s.id, s.roll, s.name, s.department_id, a.total_days, a.present_days FROM students s LEFT JOIN attendance a ON s.id = a.student_id;`
It binds a continue handler `DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;`. It loops through each student, computes attendance percentage, and if $< 75\%$, calls `fn_calculate_classes_needed` and writes a snapshot into `defaulter_audit_log`.
**Reference:** `database/procedures_triggers.sql#L65-L125`

### Q55: Why do triggers on `defaulter_audit_log` block both UPDATE and DELETE operations?
**Answer:**
Triggers `trg_prevent_defaulter_audit_update` and `trg_prevent_defaulter_audit_delete` execute `SIGNAL SQLSTATE '45000'` with an error message whenever any user or application attempts an `UPDATE` or `DELETE` on `defaulter_audit_log`. This enforces regulatory compliance: debarment notices are legal institutional records that must remain immutable historical snapshots.
**Reference:** `database/procedures_triggers.sql#L205-L230`

### Q56: What happens when a student is deleted with cascading foreign keys, and how is trigger non-activation mitigated?
**Answer:**
In MySQL InnoDB, cascaded deletions (`ON DELETE CASCADE`) **do not activate child table triggers**. If a student were deleted and we relied on child triggers to clear attendance, triggers wouldn't fire.
**Mitigation:**
1. Both `attendance` and `attendance_records` define `ON DELETE CASCADE` referencing `students(id)`. When a student is deleted, InnoDB cascades and purges both the summary cache and the detailed records simultaneously in the engine.
2. In `defaulter_audit_log`, `student_id` uses `ON DELETE SET NULL`, preserving the student roll, name, department, and attendance percentage historically even if the student is purged.
**Reference:** `docs/DATABASE_DESIGN.md#L75-L115`

### Q57: How does `vw_active_defaulter_roster` isolate defaulter data?
**Answer:**
The view joins `students`, `departments`, and `attendance`, filtering on `total_days > 0 AND fn_calculate_attendance_percentage(present_days, total_days) < 75.00`. It automatically includes the computed column `fn_calculate_classes_needed(...)`. The frontend queries this view directly (`GET /api/attendance/defaulters`), decoupling UI display from underlying table changes.
**Reference:** `database/schema_v5.sql#L250-L270`

### Q58: How does Campus Harmony validate enrollment status before recording attendance?
**Answer:**
Trigger `trg_validate_attendance_enrollment_insert` checks `course_enrollments.status`. If the student's status is `'Dropped'` or `'Completed'`, the trigger raises SQLSTATE `45000` with the message: *"Integrity Violation: Cannot log attendance. Student enrollment status is '[status]'."* This guarantees that attendance cannot be forged or logged for students who have withdrawn.
**Reference:** `database/procedures_triggers.sql#L240-L270`

### Q59: How are marks bounded and validated across different exam tiers?
**Answer:**
In `student_marks`:
- Unique constraint `uk_student_exam_period (student_id, course_code, academic_period_id, subject_key, exam_type)` prevents duplicate marks entries.
- Check constraint `chk_marks_obtained CHECK (marks_obtained >= 0.00 AND marks_obtained <= max_marks)` ensures scores are valid percentages.
- Trigger `trg_validate_marks_bounds` enforces that marks cannot exceed maximum tier limits.
**Reference:** `database/schema_v5.sql#L170-L195`

### Q60: What are the 16 indexes designed in Campus Harmony and how do they improve performance?
**Answer:**
Dedicated B-Tree indexes were created on foreign keys and search paths:
- Student lookups: `idx_students_dept`, `idx_students_mentor`, `idx_students_sem`.
- Enrollment lookups: `idx_ce_student`, `idx_ce_course`, `idx_ce_status`.
- Attendance: `idx_ar_session`, `idx_ar_student`, `idx_ar_course_period`, `idx_ar_status`.
- Timetable scheduling: `idx_as_course_date`.
Without these indexes, querying attendance records for a class of 60 students requires a full table scan of 500,000 rows. With `idx_ar_session`, MySQL locates the rows directly in $O(\log n)$ page reads.
**Reference:** `database/schema_v5.sql#L280-L315`

---

## PART 4: TOP 10 COMMON MISTAKES TO AVOID IN DBMS VIVA

1. **Saying primary keys can accept NULL:** Primary keys strictly forbid `NULL`. Only Unique keys permit `NULL`.
2. **Confusing 2NF and 3NF:** 2NF removes *partial dependencies* (attributes depending on part of a composite key). 3NF removes *transitive dependencies* ($A \rightarrow B \rightarrow C$).
3. **Saying `DELETE` resets auto-increment:** `DELETE` leaves the auto-increment counter unchanged. `TRUNCATE` resets it to 1.
4. **Confusing Stored Procedure and Stored Function:** A function *must* return a scalar value and can be used in `SELECT`; a procedure does not have to return a value and can execute transactions.
5. **Thinking MySQL triggers fire on cascaded foreign keys:** MySQL InnoDB does **NOT** fire triggers for actions caused by foreign key cascades (`ON DELETE CASCADE`). Always explain how Campus Harmony mitigated this.
6. **Saying `HAVING` filters rows before grouping:** `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation.
7. **Confusing candidate keys and superkeys:** All candidate keys are superkeys, but not all superkeys are candidate keys (candidate keys must be minimal).
8. **Claiming you used NoSQL / MongoDB:** Campus Harmony uses **MySQL 8.0 relational database with the InnoDB engine**.
9. **Forgetting ACID definition:** Be ready to give the precise definitions of Atomicity, Consistency, Isolation, and Durability without hesitating.
10. **Not knowing your port and database credentials:** In Campus Harmony, MySQL runs on port 3306 with database name `campus_harmony`, user `root`, password `root`.

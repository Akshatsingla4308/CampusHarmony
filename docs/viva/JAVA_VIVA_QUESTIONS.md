# PROGRAMMING IN JAVA (25CSE0202) — VIVA QUESTION BANK

**Course Title:** Programming in Java  
**Course Code:** 25CSE0202  
**Target Audience:** Chitkara University BE CSE, Batch 2025 (Semester III)  
**Evaluation:** Continuous Assessment 3 (CA-3 Project Milestone — 25 Marks) & CA-4 (Final Viva)  
**Structure:** 30 Basic Questions + 20 Intermediate Questions + 10 Project-Specific Questions + Viva Tips  

---

## PART 1: 30 BASIC VIVA QUESTIONS & ANSWERS

### Q1: What makes Java a platform-independent programming language?
**Answer:** The Java compiler (`javac`) converts human-readable `.java` source code into intermediate `.class` bytecode rather than machine-specific native instructions. This bytecode can run on any operating system that has a compatible Java Virtual Machine (JVM) installed ("Write Once, Run Anywhere").

### Q2: What is the difference between JDK, JRE, and JVM?
**Answer:**
- **JVM (Java Virtual Machine):** The abstract runtime engine that executes compiled Java bytecode and manages memory.
- **JRE (Java Runtime Environment):** JVM + core class libraries needed to *run* compiled Java applications.
- **JDK (Java Development Kit):** JRE + development tools (`javac`, `jar`, `javadoc`, debugger) needed to *write, compile, and run* Java programs.

### Q3: What are the four core pillars of Object-Oriented Programming (OOP)?
**Answer:**
1. **Encapsulation:** Bundling data (attributes) and methods that operate on that data into a single unit (class), restricting direct outside access via private modifiers.
2. **Inheritance:** Deriving a new class (subclass/child) from an existing class (superclass/parent) to promote code reusability.
3. **Polymorphism:** The ability of an object, method, or interface to take on multiple forms (Compile-time via Overloading, Runtime via Overriding).
4. **Abstraction:** Hiding complex implementation details and showing only the essential feature contracts to the user (via abstract classes and interfaces).

### Q4: What is the difference between Method Overloading and Method Overriding?
**Answer:**
- **Method Overloading (Compile-time Polymorphism):** Multiple methods in the *same class* with the identical name but different parameter lists (different count, types, or order). Return type alone is insufficient.
- **Method Overriding (Runtime Polymorphism):** A subclass provides a specific implementation of a method that is already defined in its superclass, with the exact same name, return type, and parameters (`@Override`).

### Q5: What is the difference between `this` and `super` keywords?
**Answer:**
- `this`: References the current object instance within a class (e.g., `this.roll = roll;` or invoking another constructor `this(...)`).
- `super`: References the immediate parent class instance (e.g., calling parent constructor `super()` or parent method `super.getCreatedAt()`).

### Q6: What are Java Access Specifiers and their visibility?
**Answer:**
1. `private`: Accessible only within the same class.
2. `default` (package-private, no keyword): Accessible within classes in the same package.
3. `protected`: Accessible within the same package and by subclasses in other packages.
4. `public`: Accessible from any class in any package.

### Q7: What is the `final` keyword in Java?
**Answer:**
- **Final variable:** Value cannot be modified once assigned (constant).
- **Final method:** Cannot be overridden by subclasses.
- **Final class:** Cannot be extended/inherited (e.g., `java.lang.String` is final).

### Q8: What is the `static` keyword in Java?
**Answer:** Indicates that a member (variable, method, or nested class) belongs to the *class itself* rather than individual instances. Static variables share one copy across all instances; static methods can be called without instantiating the class (e.g., `Math.max(a, b)`).

### Q9: What is the difference between an Abstract Class and an Interface in Java?
**Answer:**
- **Abstract Class:** Can have both abstract methods and concrete methods with state (instance variables). A class can extend only one abstract class (single inheritance).
- **Interface:** Defines a contract of behaviors. Can contain abstract methods, `default` methods (Java 8+), static methods, and `public static final` constants. A class can implement multiple interfaces (multiple inheritance of type).

### Q10: What is the difference between Stack and Heap memory in Java?
**Answer:**
- **Stack Memory:** Stores primitive local variables and references to objects, along with method call frames. Fast, thread-isolated, and memory is freed immediately when a method exits.
- **Heap Memory:** Stores all created objects and instances (`new Student()`). Shared across all threads; managed and cleaned up by the Garbage Collector (GC).

### Q11: How does Java Garbage Collection work?
**Answer:** The JVM automatically frees heap memory occupied by objects that are no longer reachable from any active thread reference (root references). Common algorithms include Mark-and-Sweep and generational collectors (G1, ZGC).

### Q12: Why is `String` immutable in Java?
**Answer:** Once a `String` object is created in the String Constant Pool, its internal character array cannot be changed. Immutability ensures security (passwords, network paths), thread-safety (can be shared across threads without synchronization), and hashcode caching (makes `HashMap` keys fast and safe).

### Q13: What is the difference between `String`, `StringBuilder`, and `StringBuffer`?
**Answer:**
- `String`: Immutable; every concatenation creates a new object.
- `StringBuilder`: Mutable character sequence; not thread-safe; very fast. Best for single-threaded string construction.
- `StringBuffer`: Mutable character sequence; thread-safe (methods are `synchronized`); slightly slower due to synchronization overhead.

### Q14: What is the difference between `==` and `.equals()` in Java?
**Answer:**
- `==`: Compares memory addresses (references) of two objects to see if they point to the exact same memory location (or compares primitive values).
- `.equals()`: Compares the state/contents of the objects if overridden (e.g., `str1.equals(str2)` checks if text characters match).

### Q15: What is the contract between `equals()` and `hashCode()`?
**Answer:**
1. If two objects are equal according to `equals()`, they MUST return the same `hashCode()` integer.
2. If two objects return the same `hashCode()`, they are NOT required to be equal (hash collision).
3. If you override `equals()`, you MUST always override `hashCode()` to avoid breaking hash-based collections (`HashMap`, `HashSet`).

### Q16: What is the difference between Checked and Unchecked Exceptions?
**Answer:**
- **Checked Exceptions:** Subclasses of `Exception` (excluding `RuntimeException`). The compiler forces the developer to handle them using `try-catch` or declare them using `throws` (e.g., `IOException`, `SQLException`, `CsvParseException`).
- **Unchecked Exceptions:** Subclasses of `RuntimeException` (e.g., `NullPointerException`, `IllegalArgumentException`, `ArithmeticException`). Represent programming logic bugs; not enforced by the compiler.

### Q17: What is the `finally` block in exception handling?
**Answer:** A block following `try` or `catch` that is guaranteed to execute regardless of whether an exception is thrown or caught. Commonly used to close resources (though `try-with-resources` is preferred in modern Java).

### Q18: What is `try-with-resources`?
**Answer:** Introduced in Java 7, a language feature where resources that implement `java.lang.AutoCloseable` (like `BufferedReader`, `Connection`) are declared inside parentheses after `try (...)`. The runtime automatically closes them at block exit, eliminating resource leaks.

### Q19: What is Autoboxing and Unboxing in Java?
**Answer:**
- **Autoboxing:** The automatic conversion that the Java compiler makes between primitive types and their corresponding object wrapper classes (e.g., `int` to `Integer`).
- **Unboxing:** The automatic conversion of wrapper objects back to primitive types (e.g., `Double` to `double`).

### Q20: What is the Java Collections Framework (JCF)?
**Answer:** A unified architecture of interfaces, implementations (classes), and algorithms representing and manipulating collections of objects (lists, sets, maps, queues) in memory.

### Q21: What is the difference between `List`, `Set`, and `Map`?
**Answer:**
- `List`: Ordered collection of elements; allows duplicates; elements accessible by integer index (`ArrayList`, `LinkedList`).
- `Set`: Collection of unique elements; does not allow duplicates (`HashSet`, `TreeSet`).
- `Map`: Collection of key-value pairs; keys must be unique; values can be duplicated (`HashMap`, `TreeMap`).

### Q22: What is the difference between `ArrayList` and `LinkedList`?
**Answer:**
- `ArrayList`: Backed by a dynamically resizing array. Fast random access ($O(1)$), but slow middle insertion and deletion ($O(n)$) due to element shifting.
- `LinkedList`: Backed by a doubly linked list. Fast insertion and deletion at head/tail ($O(1)$), but slow random access ($O(n)$) because it must traverse nodes.

### Q23: How does a `HashMap` work internally in Java?
**Answer:** `HashMap` stores key-value pairs in an array of buckets (`Node<K,V>[]`).
1. Computes `hash = key.hashCode()`.
2. Computes bucket index `index = (n - 1) & hash`.
3. If collision occurs, nodes form a singly linked list. In Java 8+, if a bucket's collision chain exceeds 8 nodes and capacity is $\ge 64$, the bucket transforms into a balanced Red-Black Tree ($O(\log n)$ instead of $O(n)$).

### Q24: What is the difference between `Comparable` and `Comparator`?
**Answer:**
- `Comparable`: Interface defining the natural ordering of a class (`int compareTo(T o)`). Implemented directly inside the domain class.
- `Comparator`: Interface defining external or alternative custom sorting strategies (`int compare(T o1, T o2)`). Can create multiple comparators without modifying the domain class.

### Q25: What are Generics in Java?
**Answer:** A feature introduced in Java 5 providing compile-time type safety. It allows classes, interfaces, and methods to operate on parameterized types (e.g., `List<Student>`), eliminating unsafe manual runtime casts and preventing `ClassCastException`.

### Q26: What is a Lambda Expression in Java?
**Answer:** An anonymous function (a function without a name, return type, or access modifier) that can be passed as an argument. Introduced in Java 8 to support functional programming (e.g., `(s) -> s.getAttendance() < 75`).

### Q27: What is a Functional Interface?
**Answer:** An interface that contains exactly one abstract method (SAM — Single Abstract Method). It can be annotated with `@FunctionalInterface` and implemented concisely using lambdas or method references (e.g., `Predicate<T>`, `Function<T,R>`, `Consumer<T>`, `Supplier<T>`).

### Q28: What is the Java Stream API?
**Answer:** Introduced in Java 8, a pipeline abstraction for processing sequences of data elements declaratively using functional-style operations (filtering, mapping, sorting, aggregating) without mutating the underlying collection.

### Q29: What is JDBC (Java Database Connectivity)?
**Answer:** An industry-standard Java API (`java.sql.*`) that enables Java applications to connect to relational databases, execute SQL statements, navigate result sets, and control database transactions.

### Q30: What is a Thread in Java?
**Answer:** The smallest unit of execution within a process. A single Java application can run multiple threads concurrently to perform background tasks without blocking the main program thread.

---

## PART 2: 20 INTERMEDIATE VIVA QUESTIONS & ANSWERS

### Q31: What is Type Erasure in Java Generics?
**Answer:** Generics are enforced only at compile time. During compilation, the Java compiler replaces all generic type parameters with their bounds (or `Object` if unbounded) and inserts appropriate casts. This ensures backward compatibility with older pre-generic JVM bytecode.

### Q32: What are Bounded Type Parameters in Generics (`<T extends BaseEntity>`)?
**Answer:** Restricts the types that can be passed as type arguments. `<T extends BaseEntity>` guarantees that whatever class type `T` is supplied, it is guaranteed to be a subclass of `BaseEntity`, allowing the generic code to safely call methods like `getId()` or `getCreatedAt()` on instances of `T`.

### Q33: What is the difference between Intermediate and Terminal operations in Streams?
**Answer:**
- **Intermediate Operations:** Lazy; return a new Stream without executing until a terminal operation is called (e.g., `filter()`, `map()`, `sorted()`).
- **Terminal Operations:** Eager; trigger the execution of the pipeline, consume the stream, and produce a non-stream result (e.g., `collect()`, `forEach()`, `count()`, `reduce()`).

### Q34: What is the difference between `map()` and `flatMap()` in Streams?
**Answer:**
- `map()`: Transforms each element into another single element ($1 \rightarrow 1$ mapping).
- `flatMap()`: Transforms each element into a stream of elements and flattens multiple nested streams into a single consolidated stream ($1 \rightarrow N$ mapping).

### Q35: How does `Collectors.partitioningBy()` differ from `Collectors.groupingBy()`?
**Answer:**
- `groupingBy()`: Groups elements by an arbitrary key classifier, returning a `Map<K, List<T>>` with any number of keys.
- `partitioningBy()`: A specialized grouping operation that takes a `Predicate<T>` and returns a `Map<Boolean, List<T>>` with exactly two keys: `true` and `false`.

### Q36: What is `IntSummaryStatistics` in Java Streams?
**Answer:** A state object returned by `stream.mapToInt(...).summaryStatistics()`. It computes count, sum, minimum, maximum, and average across numerical data elements in a single, highly-optimized traversal pass.

### Q37: What is the difference between Character Streams and Byte Streams in Java I/O?
**Answer:**
- **Byte Streams (`InputStream`, `OutputStream`):** Read and write raw binary data 8 bits (1 byte) at a time (used for images, audio, compiled classes).
- **Character Streams (`Reader`, `Writer`):** Read and write text data 16 bits (2 bytes, Unicode characters) at a time, handling character encodings (UTF-8) automatically (`BufferedReader`, `BufferedWriter`).

### Q38: Why should you use `PreparedStatement` instead of `Statement` in JDBC?
**Answer:**
1. **Security:** PreparedStatement uses parameter placeholders (`?`), separating SQL code from user data, preventing SQL Injection.
2. **Performance:** The database compiles and caches the query execution plan once, allowing parameterized re-execution with different values.

### Q39: How do you manually manage ACID transactions in JDBC?
**Answer:**
1. Call `connection.setAutoCommit(false);` to begin a manual transaction.
2. Execute one or more `PreparedStatement` operations.
3. Call `connection.commit();` on success.
4. Catch `SQLException` and call `connection.rollback();` to undo changes on error.
5. In a `finally` block, reset `connection.setAutoCommit(true);` and close the connection.

### Q40: What is the difference between extending `Thread` and implementing `Runnable`?
**Answer:**
- Extending `Thread`: Consumes Java's single inheritance allowance; tight coupling between task and thread execution.
- Implementing `Runnable`: Separates task logic from thread execution mechanism; allows the class to extend another superclass; can be executed by thread pools (`ExecutorService`). Implementing `Runnable` is the preferred best practice.

### Q41: What is a Thread Pool and why is `ExecutorService` used?
**Answer:** Creating operating system threads is resource-intensive. An `ExecutorService` maintains a pool of pre-created worker threads that execute submitted tasks and return to the pool when finished, preventing out-of-memory errors and thread creation overhead.

### Q42: What is the difference between `Callable<T>` and `Runnable`?
**Answer:**
- `Runnable`: Method `public void run()` returns no value and cannot throw checked exceptions.
- `Callable<T>`: Method `public T call() throws Exception` returns a typed result of type `T` and can throw checked exceptions.

### Q43: What is a `Future<T>` in Java concurrency?
**Answer:** Represents the result of an asynchronous computation submitted to an `ExecutorService`. Provides methods to check completion (`isDone()`), cancel execution (`cancel()`), and retrieve the computed result (`get()`, which blocks until ready).

### Q44: What is a `CountDownLatch`?
**Answer:** A synchronization primitive initialized with a positive count. It allows one or more threads to wait (`latch.await()`) until a specified set of operations executing in other threads complete and invoke `latch.countDown()`.

### Q45: What is an `AtomicInteger` and how does it prevent race conditions?
**Answer:** A thread-safe integer class in `java.util.concurrent.atomic`. It performs lock-free, atomic operations (like `incrementAndGet()`, `addAndGet()`) using CPU-level Compare-And-Swap (CAS) hardware instructions, preventing lost updates without the overhead of `synchronized` blocks.

### Q46: What is a Race Condition in multithreading?
**Answer:** A concurrency bug that occurs when two or more threads attempt to read and write shared data concurrently, and the final outcome depends on the non-deterministic scheduling and timing of thread execution.

### Q47: What does the `synchronized` keyword do?
**Answer:** Acquires an intrinsic lock (monitor) on an object or class. Only one thread can enter the synchronized method or block at a time, ensuring mutual exclusion and preventing race conditions in critical sections.

### Q48: What is Spring Boot and how does it relate to Java?
**Answer:** An opinionated, enterprise-ready framework built on top of the Spring Framework in Java. It provides convention-over-configuration, embedded HTTP servers (Tomcat), auto-configuration of datasources, and dependency injection, drastically simplifying production Java web development.

### Q49: What is Spring Data JPA and how does it eliminate boilerplate code?
**Answer:** A persistence abstraction layer built on Hibernate and JPA. By declaring repository interfaces that extend `JpaRepository<T, ID>`, Spring Data JPA automatically generates SQL queries, transactions, and CRUD implementations at runtime without writing SQL strings.

### Q50: What is the purpose of `@RestControllerAdvice` in Spring Boot?
**Answer:** A global exception-interceptor annotation. It allows centralized handling of exceptions thrown across all `@RestController` classes, converting exceptions into standardized JSON responses with appropriate HTTP status codes (400, 404, 500).

---

## PART 3: 10 PROJECT-SPECIFIC QUESTIONS & CODE REFERENCES

### Q51: How does `StudentComparatorDemo.java` implement multiple sorting strategies dynamically?
**Answer:**
The class defines `sortStudents(List<Student> students, String strategy)`. Based on the strategy string parameter, it applies custom comparators:
- `"name"`: `Comparator.comparing(Student::getName, String.CASE_INSENSITIVE_ORDER)`
- `"attendance"`: `Comparator.comparingInt(Student::getAttendance).reversed()` (descending order)
- `"department"`: `Comparator.comparing(Student::getDepartment).thenComparing(...)`
It returns a freshly sorted list without mutating the original input collection.
**Reference:** `backend/src/main/java/com/campusharmony/demo/StudentComparatorDemo.java#L15-L55`

### Q52: How does `AnalyticsStreamDemo.java` compute attendance analytics using Streams?
**Answer:**
It uses declarative functional pipelines:
- `partitionDefaulters(students, 75)`: Uses `Collectors.partitioningBy(s -> s.getAttendance() >= 75)` to divide students into eligible vs. debarred cohorts.
- `averageAttendanceByDepartment(students)`: Uses `Collectors.groupingBy(Student::getDepartment, Collectors.averagingInt(Student::getAttendance))`.
- `getAttendanceSummaryStatistics(students)`: Uses `mapToInt(...).summaryStatistics()` to calculate min, max, count, and average in a single pass.
**Reference:** `backend/src/main/java/com/campusharmony/demo/AnalyticsStreamDemo.java#L15-L60`

### Q53: How does `GenericDataRepository.java` demonstrate bounded generics?
**Answer:**
Declared as `public class GenericDataRepository<T extends BaseEntity, ID>`. The bound `<T extends BaseEntity>` ensures that any entity stored has an ID and timestamp methods. Internal storage uses `Map<ID, T> storage = new ConcurrentHashMap<>()`. Methods like `findByPredicate(Predicate<T> filter)` allow callers to query items using lambdas without type casting.
**Reference:** `backend/src/main/java/com/campusharmony/demo/GenericDataRepository.java#L10-L45`

### Q54: How does `CsvReportHandler.java` process character streams and handle checked exceptions?
**Answer:**
- Export: Uses `BufferedWriter` wrapped around `StringWriter` within a `try-with-resources` block to format student fields into RFC-4180 CSV strings.
- Import: Uses `BufferedReader.readLine()` to parse lines. If a line has fewer than 8 columns, it throws a custom checked exception `CsvParseException`, forcing the caller to handle malformed input gracefully.
**Reference:** `backend/src/main/java/com/campusharmony/demo/CsvReportHandler.java#L12-L75`

### Q55: How does `JdbcTransactionDemo.java` demonstrate manual commit and rollback?
**Answer:**
It retrieves a raw JDBC connection via `DriverManager.getConnection(...)` and sets `conn.setAutoCommit(false)`. It inserts a student record using a `PreparedStatement` and retrieves generated keys, then inserts an attendance cache row.
- If `shouldFail == false`, it calls `conn.commit()`.
- If `shouldFail == true`, it throws an exception and enters `catch (SQLException e)` where `conn.rollback()` is executed, ensuring zero orphan rows remain.
**Reference:** `backend/src/main/java/com/campusharmony/demo/JdbcTransactionDemo.java#L25-L85`

### Q56: How does `AttendanceProcessingDemo.java` coordinate parallel threads?
**Answer:**
It initializes an `ExecutorService` with 4 worker threads and a `CountDownLatch(batchCount)`. Each task is a `Callable<BatchResult>` that processes attendance instances. Workers increment thread-safe counters `AtomicInteger totalProcessed`, `totalPresent`, and `totalAbsent`. The main thread calls `latch.await(10, TimeUnit.SECONDS)` to wait for all batch jobs to finish before calculating total execution duration.
**Reference:** `backend/src/main/java/com/campusharmony/demo/AttendanceProcessingDemo.java#L20-L80`

### Q57: How does `BaseEntity.java` promote inheritance in JPA entities?
**Answer:**
Annotated with `@MappedSuperclass`, `BaseEntity` defines `Long id`, `LocalDateTime createdAt`, and `LocalDateTime updatedAt`. Child entities (`Student`, `Teacher`, `Course`) inherit these attributes, eliminating duplicated primary key and audit column definitions across the codebase.
**Reference:** `backend/src/main/java/com/campusharmony/entity/BaseEntity.java#L1-L35`

### Q58: How does `JavaDemoController.java` expose core Java demonstrations via REST?
**Answer:**
Provides dedicated endpoints:
- `POST /api/java-demo/jdbc-transaction`: Triggers manual commit or rollback.
- `GET /api/java-demo/comparator-sort?strategy=attendance`: Triggers custom comparator sorting.
- `GET /api/java-demo/streams-analytics`: Computes grouping, partitioning, and statistical summaries.
- `GET /api/java-demo/export-csv`: Streams a downloadable CSV file.
- `POST /api/java-demo/concurrency-simulation`: Triggers multi-threaded batch execution.
**Reference:** `backend/src/main/java/com/campusharmony/controller/JavaDemoController.java#L25-L95`

### Q59: How does `GlobalExceptionHandler.java` handle exceptions centrally?
**Answer:**
Annotated with `@RestControllerAdvice`, it contains methods annotated with `@ExceptionHandler(ResourceNotFoundException.class)` and `@ExceptionHandler(BadRequestException.class)`. It intercepts thrown exceptions and returns standardized `ResponseEntity<ErrorResponse>` JSON with timestamps and HTTP status codes, preventing server stack traces from leaking to the frontend.
**Reference:** `backend/src/main/java/com/campusharmony/exception/GlobalExceptionHandler.java#L10-L40`

### Q60: How does `CampusHarmonyJavaDemo.java` serve as a standalone CLI runner?
**Answer:**
Contains a standard `public static void main(String[] args)` method that can be executed directly from the terminal (`mvn test-compile exec:java`). It sequentially executes all 5 demonstration modules (Collections, Streams, Generics, CSV File I/O, and Concurrency) and prints formatted execution summaries to `System.out`.
**Reference:** `backend/src/main/java/com/campusharmony/demo/CampusHarmonyJavaDemo.java#L15-L100`

---

## PART 4: TOP 10 COMMON MISTAKES TO AVOID IN JAVA VIVA

1. **Saying Java is 100% Object-Oriented:** Java is *not* 100% pure object-oriented because it supports 8 primitive data types (`int`, `boolean`, `char`, etc.) that are not objects.
2. **Confusing Method Overloading and Overriding:** Overloading happens in the *same class* at *compile time*; Overriding happens in a *subclass* at *runtime*.
3. **Saying `String` can be modified:** Strings are *strictly immutable*. Operations like `.toUpperCase()` return a *new* String; they do not alter the original string.
4. **Forgetting to override `hashCode()` when overriding `equals()`:** This breaks hash-based structures like `HashMap` and `HashSet`.
5. **Confusing Checked and Unchecked Exceptions:** Unchecked exceptions extend `RuntimeException` and are not checked at compile time; Checked exceptions extend `Exception` and must be declared or caught.
6. **Saying Streams modify the source collection:** Streams do *not* mutate the underlying collection; they produce a new stream or collection.
7. **Confusing `Callable` and `Runnable`:** `Runnable` cannot return a value or throw checked exceptions; `Callable` returns a typed value and can throw exceptions.
8. **Claiming you used Hibernate only:** Always emphasize that Campus Harmony includes **both** Spring Data JPA *and* direct low-level JDBC with manual transaction commit/rollback in `com.campusharmony.demo`.
9. **Thinking `try-with-resources` requires a `finally` block:** The compiler automatically generates the cleanup code for all `AutoCloseable` resources; explicit `finally` is optional.
10. **Not knowing your JDK version:** Campus Harmony runs on **Java 21 (LTS)** with Spring Boot 3.2.5.

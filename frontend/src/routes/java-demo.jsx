import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  ListOrdered,
  Cpu,
  FileSpreadsheet,
  Terminal,
  Layers,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/java-demo")({
  component: JavaDemoPage,
});

function JavaDemoPage() {
  const [activeTab, setActiveTab] = useState("streams"); // "streams" | "comparator" | "concurrency" | "jdbc" | "csv"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 1. Streams API
  const runStreamsAnalytics = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.javaDemo.streamsAnalytics();
      setResult({
        title: "Streams API Multi-Dimensional Analytics Completed",
        codeSnippet: `Map<Boolean, List<Student>> partitioned = students.stream()\n    .collect(Collectors.partitioningBy(s -> s.getAttendance() < 75));\nMap<String, Double> deptAvgs = students.stream()\n    .collect(Collectors.groupingBy(Student::getDepartment, Collectors.averagingDouble(Student::getAttendance)));\nIntSummaryStatistics stats = students.stream()\n    .mapToInt(Student::getAttendance).summaryStatistics();`,
        output: data,
        note: "Executed functional pipeline in AnalyticsStreamDemo.java using Java 21 Streams.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Custom Comparator Sorting
  const [sortStrategy, setSortStrategy] = useState("name");
  const runComparatorSort = async (strategy) => {
    const s = strategy || sortStrategy;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.javaDemo.comparatorSort(s);
      setResult({
        title: `Custom Comparator Sorting: Strategy [${s.toUpperCase()}]`,
        codeSnippet:
          s === "name"
            ? `list.sort(Comparator.comparing(Student::getName, String.CASE_INSENSITIVE_ORDER));`
            : s === "attendance"
            ? `list.sort(Comparator.comparing(Student::getAttendance, Comparator.reverseOrder()));`
            : `list.sort(Comparator.comparing(Student::getRoll));`,
        output: data,
        note: "Executed in StudentComparatorDemo.java using java.util.Comparator & lambda expressions.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Concurrency ThreadPool
  const [batchCount, setBatchCount] = useState(6);
  const [recordsPerBatch, setRecordsPerBatch] = useState(100);
  const runConcurrencyDemo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.javaDemo.parallelBatchAttendance(batchCount, recordsPerBatch);
      setResult({
        title: `Parallel Batch Processing (${batchCount * recordsPerBatch} Records across Threads)`,
        codeSnippet: `ExecutorService executor = Executors.newFixedThreadPool(4);\nCountDownLatch latch = new CountDownLatch(batches.size());\nAtomicInteger totalPresent = new AtomicInteger(0);\n// Each batch submitted as Callable<BatchProcessingResult>`,
        output: data,
        note: "Executed in AttendanceProcessingDemo.java with thread-safe atomic counters and Future resolution.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Direct JDBC Transaction
  const runJdbcTransaction = async (shouldFail) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.javaDemo.jdbcTransaction(shouldFail);
      setResult({
        title: shouldFail
          ? "Direct JDBC Transaction: Caught SQLException -> ROLLBACK"
          : "Direct JDBC Transaction: Multi-Table COMMIT Succeeded",
        codeSnippet: `conn.setAutoCommit(false);\ntry {\n    psStudent.executeUpdate();\n    psAttendance.executeUpdate();\n    conn.commit();\n} catch (SQLException e) {\n    conn.rollback();\n}`,
        output: data,
        note: "Direct JDBC implementation in JdbcTransactionDemo.java bypassing ORM abstraction.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. CSV Export
  const runCsvExport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.javaDemo.csvExport();
      setResult({
        title: "CSV Export Stream Generated with Custom Checked Exception Handling",
        codeSnippet: `StringWriter writer = new StringWriter();\nfor (Student s : students) {\n    writer.write(String.format("%s,%s,%s,%d...\\n", s.getRoll(), s.getName()...));\n}`,
        output: typeof data === "string" ? data : JSON.stringify(data, null, 2),
        note: "Handled by CsvReportHandler.java with custom CsvParseException.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Code2 className="w-3.5 h-3.5" />
          <span>Programming in Java (25CSE0202) — CA-3 / Viva Evaluation (25 Marks)</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Core Java Academic Demonstration Module</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dedicated, non-polluting Java CHO demonstration workbench covering Streams, Comparators, Generics, Concurrency & JDBC
        </p>
      </div>

      {/* CLI Evaluation Banner */}
      <div className="p-4 rounded-xl border border-border bg-muted/40 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-foreground">Standalone Terminal CLI Launcher for Evaluators:</span>
          <p className="text-muted-foreground font-mono text-[11px] mt-0.5">
            mvn exec:java "-Dexec.mainClass=com.campusharmony.demo.CampusHarmonyJavaDemo" -f backend/pom.xml
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider">
          JDK 21 LTS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border gap-2">
        {[
          { id: "streams", label: "1. Streams API Analytics" },
          { id: "comparator", label: "2. Collections & Comparator" },
          { id: "concurrency", label: "3. Concurrency & Threads" },
          { id: "jdbc", label: "4. Direct JDBC & ACID" },
          { id: "csv", label: "5. CSV File I/O & Exceptions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Streams */}
      {activeTab === "streams" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Functional Programming & Stream API Multi-Dimensional Analytics</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Demonstrates Stream reduction, Defaulter partitioning (<code className="font-mono">Collectors.partitioningBy</code>),
              department grouping with averages (<code className="font-mono">Collectors.groupingBy</code>), and statistical aggregation
              (<code className="font-mono">IntSummaryStatistics</code>).
            </p>
          </div>

          <button
            onClick={runStreamsAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            Execute Streams Pipeline
          </button>
        </div>
      )}

      {/* Tab 2: Comparator */}
      {activeTab === "comparator" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Java Collections & Custom Comparator Sorting Strategies</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Sorts in-memory student collections using explicit strategies: Alphabetical by Name, Numeric by Roll, or Descending by Attendance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => runComparatorSort("name")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-input bg-card hover:bg-muted text-foreground transition-all shadow-xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              Sort by Name (Ascending)
            </button>
            <button
              onClick={() => runComparatorSort("attendance")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-input bg-card hover:bg-muted text-foreground transition-all shadow-xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              Sort by Attendance (Descending)
            </button>
            <button
              onClick={() => runComparatorSort("roll")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-input bg-card hover:bg-muted text-foreground transition-all shadow-xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              Sort by Roll Number
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Concurrency */}
      {activeTab === "concurrency" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Multithreaded Attendance Batch Processing (ExecutorService & Futures)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dispatches batches across a thread pool (<code className="font-mono">Executors.newFixedThreadPool(4)</code>).
              Coordinates execution using <code className="font-mono">CountDownLatch</code> and thread-safe <code className="font-mono">AtomicInteger</code> counters.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">Batches:</span>
              <input
                type="number"
                min="2"
                max="12"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                className="w-16 px-2.5 py-1.5 rounded-lg border border-input bg-background font-mono text-center"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">Records / Batch:</span>
              <input
                type="number"
                min="50"
                max="500"
                value={recordsPerBatch}
                onChange={(e) => setRecordsPerBatch(parseInt(e.target.value, 10))}
                className="w-20 px-2.5 py-1.5 rounded-lg border border-input bg-background font-mono text-center"
              />
            </div>
            <button
              onClick={runConcurrencyDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              Launch Parallel Workers
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: JDBC & ACID */}
      {activeTab === "jdbc" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Direct JDBC Transactions with Manual Commit and Rollback</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Bypasses Spring Data JPA / Hibernate to execute raw JDBC with <code className="font-mono">conn.setAutoCommit(false)</code>,
              testing explicit rollback on SQL constraint violation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => runJdbcTransaction(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Test JDBC Commit
            </button>
            <button
              onClick={() => runJdbcTransaction(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xs disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Test JDBC Rollback (Simulate Failure)
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: CSV I/O */}
      {activeTab === "csv" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">CSV File Handling & Checked Exception Handling</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Exports student records into formatted CSV streams and demonstrates robust input validation with custom <code className="font-mono">CsvParseException</code>.
            </p>
          </div>

          <button
            onClick={runCsvExport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Stream CSV Export
          </button>
        </div>
      )}

      {loading && <LoadingState message="Executing Java 21 bytecode operations on Spring Boot JVM..." />}
      {error && <ErrorMessage error={error} />}

      {/* Result Terminal */}
      {result && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">{result.title}</span>
            </div>
            <span className="text-[10px] text-slate-500">Java 21 JVM Runtime</span>
          </div>

          {result.codeSnippet && (
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-indigo-300 whitespace-pre font-mono text-[11px] overflow-x-auto">
              {result.codeSnippet}
            </div>
          )}

          {result.note && <div className="text-slate-400 text-[11px] italic"># {result.note}</div>}

          <div className="max-h-80 overflow-y-auto pt-2">
            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
              {typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

package com.campusharmony.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstrates Core Java Multi-threading & Concurrency Framework:
 * - ExecutorService, ThreadPools
 * - Callable<T> and Future<T>
 * - Thread-safe synchronization: AtomicInteger, ConcurrentHashMap, CountDownLatch
 * - Simulating parallel batch attendance record verification across multiple worker threads
 */
@Component
public class AttendanceProcessingDemo {

    private static final Logger log = LoggerFactory.getLogger(AttendanceProcessingDemo.class);

    public static class BatchSummary {
        private final int totalBatches;
        private final int totalRecordsProcessed;
        private final int totalPresent;
        private final int totalAbsent;
        private final long executionTimeMs;
        private final List<String> threadExecutionLog;

        public BatchSummary(int totalBatches, int totalRecordsProcessed, int totalPresent,
                            int totalAbsent, long executionTimeMs, List<String> threadExecutionLog) {
            this.totalBatches = totalBatches;
            this.totalRecordsProcessed = totalRecordsProcessed;
            this.totalPresent = totalPresent;
            this.totalAbsent = totalAbsent;
            this.executionTimeMs = executionTimeMs;
            this.threadExecutionLog = threadExecutionLog;
        }

        public int getTotalBatches() { return totalBatches; }
        public int getTotalRecordsProcessed() { return totalRecordsProcessed; }
        public int getTotalPresent() { return totalPresent; }
        public int getTotalAbsent() { return totalAbsent; }
        public long getExecutionTimeMs() { return executionTimeMs; }
        public List<String> getThreadExecutionLog() { return threadExecutionLog; }
    }

    /**
     * Simulates concurrent batch attendance processing across 4 worker threads.
     */
    public BatchSummary processAttendanceInParallel(int batchCount, int recordsPerBatch) {
        long startTime = System.currentTimeMillis();

        ExecutorService executor = Executors.newFixedThreadPool(4);
        CountDownLatch latch = new CountDownLatch(batchCount);

        AtomicInteger globalRecordsProcessed = new AtomicInteger(0);
        AtomicInteger globalPresent = new AtomicInteger(0);
        AtomicInteger globalAbsent = new AtomicInteger(0);
        List<String> threadLog = Collections.synchronizedList(new ArrayList<>());

        List<Future<Map<String, Integer>>> futures = new ArrayList<>();

        for (int i = 1; i <= batchCount; i++) {
            final int batchId = i;
            Callable<Map<String, Integer>> task = () -> {
                String threadName = Thread.currentThread().getName();
                int presentCount = 0;
                int absentCount = 0;

                // Simulate batch processing
                for (int r = 0; r < recordsPerBatch; r++) {
                    if (ThreadLocalRandom.current().nextDouble() > 0.15) {
                        presentCount++;
                    } else {
                        absentCount++;
                    }
                }

                // Update thread-safe atomic counters
                globalRecordsProcessed.addAndGet(recordsPerBatch);
                globalPresent.addAndGet(presentCount);
                globalAbsent.addAndGet(absentCount);

                String logEntry = String.format("Batch #%d processed by [%s]: %d Present, %d Absent",
                        batchId, threadName, presentCount, absentCount);
                threadLog.add(logEntry);

                latch.countDown();

                Map<String, Integer> res = new HashMap<>();
                res.put("present", presentCount);
                res.put("absent", absentCount);
                return res;
            };

            futures.add(executor.submit(task));
        }

        try {
            // Wait for all worker threads to complete
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Parallel batch attendance execution interrupted", e);
        } finally {
            executor.shutdown();
        }

        long duration = System.currentTimeMillis() - startTime;

        return new BatchSummary(
                batchCount,
                globalRecordsProcessed.get(),
                globalPresent.get(),
                globalAbsent.get(),
                duration,
                threadLog
        );
    }
}

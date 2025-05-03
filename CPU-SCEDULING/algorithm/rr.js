export function calculateRR(processes, timeQuantum) {
  const n = processes.length;
  const completed = [];
  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
  }));
  const ganttChart = [];
  const readyQueue = [];
  const addedToQueue = new Set();

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < n) {
    // Add newly arrived processes to queue
    remaining.forEach((p) => {
      if (
        p.arrival <= currentTime &&
        !addedToQueue.has(p.process) &&
        p.remaining > 0
      ) {
        readyQueue.push(p);
        addedToQueue.add(p.process);
      }
    });

    if (readyQueue.length === 0) {
      // CPU idle: wait for next process to arrive
      const nextArrival = remaining.find(
        (p) => p.remaining > 0 && p.arrival > currentTime
      );
      if (nextArrival) {
        const idleStart = currentTime;
        const idleEnd = nextArrival.arrival;

        const idleQueue = remaining
          .filter((p) => p.arrival <= idleStart && p.remaining > 0)
          .map((p) => ({
            process: p.process,
            priority: p.priority || null,
          }));

        const arrived = remaining
          .filter((p) => p.arrival > idleStart && p.arrival <= idleEnd)
          .map((p) => ({
            process: p.process,
            priority: p.priority || null,
          }));

        ganttChart.push({
          label: "i",
          start: idleStart,
          end: idleEnd,
          queue: idleQueue,
          arrived,
        });

        totalIdle += idleEnd - idleStart;
        currentTime = idleEnd;

        continue;
      } else {
        break;
      }
    }

    const p = readyQueue.shift();

    if (!p.remaining || isNaN(p.remaining)) {
      console.warn("Invalid remaining burst time for process:", p);
      continue;
    }

    if (p.start === null) {
      p.start = currentTime;
    }

    const executionTime = Math.min(timeQuantum, p.remaining);
    const start = currentTime;
    const end = start + executionTime;

    p.remaining -= executionTime;
    currentTime = end;

    const queueDuring = remaining
      .filter((proc) => proc.arrival <= currentTime && proc.remaining > 0)
      .map((proc) => ({
        process: proc.process,
        priority: proc.priority || null,
        isRunning: proc.process === p.process,
      }));

    // Instead of the process label, we now include the remaining burst time
    ganttChart.push({
      label: p.process, // Change this to show remaining burst time
      start,
      end,
      queue: queueDuring,
      rbt: p.remaining, // ✅ Add RBt here
    });

    // Add new arrivals during execution
    remaining.forEach((proc) => {
      if (
        proc.arrival > start &&
        proc.arrival <= end &&
        proc.remaining > 0 &&
        !addedToQueue.has(proc.process)
      ) {
        readyQueue.push(proc);
        addedToQueue.add(proc.process);
      }
    });

    if (p.remaining > 0) {
      readyQueue.push(p); // Re-queue for next round
    } else {
      const turnaround = currentTime - p.arrival;
      const waiting = turnaround - p.burst;
      completed.push({
        ...p,
        completion: currentTime,
        turnaround,
        waiting,
      });
    }
  }

  console.table(completed);
  console.table(ganttChart);

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}

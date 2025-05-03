export function calculateSRTF(processes) {
  const n = processes.length;

  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
    end: null,
  }));

  const completed = [];
  const ganttChart = [];

  let currentTime = 0;
  let totalIdle = 0;
  let lastProcessLabel = null;

  while (completed.length < n) {
    // Queue for selection: sorted by lowest remaining burst time (SRTF)
    const available = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);

    // Display queue: sorted by arrival time (then remaining time)
    const displayQueue = available
      .slice()
      .sort((a, b) => a.arrival - b.arrival || a.remaining - b.remaining)
      .map((p) => ({
        process: p.process,
        remaining: p.remaining,
        arrival: p.arrival,
      }));

    if (available.length === 0) {
      // CPU is idle
      const futureArrivals = remaining.filter(
        (p) => p.remaining > 0 && p.arrival > currentTime
      );
      const nextArrival = Math.min(...futureArrivals.map((p) => p.arrival));

      ganttChart.push({
        label: "i",
        start: currentTime,
        end: nextArrival,
        rbt: null,
        queue: [],
        arrived: futureArrivals
          .filter((p) => p.arrival <= nextArrival)
          .map((p) => ({ process: p.process, priority: p.priority || null })),
      });

      totalIdle += nextArrival - currentTime;
      currentTime = nextArrival;
      lastProcessLabel = null;
      continue;
    }

    const current = available[0];
    if (current.start === null) current.start = currentTime;

    const isNewSlice = lastProcessLabel !== current.process;

    if (isNewSlice) {
      ganttChart.push({
        label: current.process,
        start: currentTime,
        end: currentTime + 1,
        rbt: current.remaining - 1,
        queue: displayQueue,
      });
    } else {
      const lastSlice = ganttChart[ganttChart.length - 1];
      lastSlice.end++;
      lastSlice.rbt = current.remaining - 1;
      lastSlice.queue = displayQueue;
    }

    current.remaining--;
    currentTime++;
    lastProcessLabel = current.process;

    if (current.remaining === 0) {
      current.end = currentTime;
      const turnaround = current.end - current.arrival;
      const waiting = turnaround - current.burst;
      completed.push({
        ...current,
        completion: current.end,
        turnaround,
        waiting,
      });
    }
  }

  console.table(ganttChart);

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}

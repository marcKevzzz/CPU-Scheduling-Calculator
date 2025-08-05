export function calculateSRTF(processes) {
  const ganttChart = [];
  const completed = [];

  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
    end: null,
  }));

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < processes.length) {
    const readyQueue = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) =>
        a.remaining !== b.remaining
          ? a.remaining - b.remaining
          : a.arrival - b.arrival
      );

    if (readyQueue.length === 0) {
      const nextArrival = remaining
        .filter((p) => p.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

      if (nextArrival !== undefined && nextArrival > currentTime) {
        ganttChart.push({
          label: "i",
          start: currentTime,
          end: nextArrival,
          queue: [],
          arrived: remaining
            .filter((p) => p.arrival <= nextArrival && p.remaining > 0)
            .map((p) => ({
              process: p.process,
              priority: p.priority || null,
              burst: p.remaining,
              rbt: p.remaining,
            })),
          rbt: null,
        });

        totalIdle += nextArrival - currentTime;
        currentTime = nextArrival;
        continue;
      } else {
        break;
      }
    }

    const currentProc = readyQueue[0];
    if (currentProc.start === null) {
      currentProc.start = currentTime;
    }

    // 🔁 Modified execution logic here:
    const nextArrivalTime = remaining
      .filter((p) => p.remaining > 0 && p.arrival > currentTime)
      .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

    let execTime;
    if (nextArrivalTime !== undefined) {
      execTime = Math.min(currentProc.remaining, nextArrivalTime - currentTime);
    } else {
      execTime = currentProc.remaining;
    }

    const start = currentTime;
    const end = currentTime + execTime;

    currentProc.remaining -= execTime;
    currentTime = end;

    const queueSnapshot = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => a.arrival - b.arrival)
      .map((p) => ({
        process: p.process,
        priority: p.priority || null,
        arrival: p.arrival,
        burst: p.remaining,
        rbt: p.remaining,
      }));

    const ganttEntry = {
      label: currentProc.process,
      start,
      end,
      queue: queueSnapshot,
      arrived: [],
      rbt: currentProc.remaining,
    };

    const lastGantt = ganttChart[ganttChart.length - 1];
    if (
      lastGantt &&
      lastGantt.label === currentProc.process &&
      lastGantt.end === start
    ) {
      lastGantt.end = end;
      lastGantt.rbt = currentProc.remaining;
      lastGantt.queue = queueSnapshot;
    } else {
      ganttChart.push(ganttEntry);
    }

    if (currentProc.remaining === 0) {
      currentProc.end = currentTime;
      const turnaround = currentProc.end - currentProc.arrival;
      const waiting = turnaround - currentProc.burst;
      completed.push({
        ...currentProc,
        completion: currentProc.end,
        turnaround,
        waiting,
      });
    }
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}

export function calculateSJF(processes) {
  const n = processes.length;
  const completed = [];
  const readyQueue = [];
  const remaining = [...processes]; // Don't mutate the original array
  const addedToQueue = new Set(); // Track added process IDs

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < n) {
    // Add processes to ready queue that have arrived and aren't already added
    remaining.forEach((p) => {
      if (p.arrival <= currentTime && !addedToQueue.has(p.process)) {
        readyQueue.push(p);
        addedToQueue.add(p.process); // Track that it's added
      }
    });

    // Sort readyQueue by burst time (Shortest Job First)
    readyQueue.sort((a, b) => {
      if (a.burst === b.burst) {
        return a.arrival - b.arrival; // Tie-break by arrival time
      }
      return a.burst - b.burst;
    });

    if (readyQueue.length === 0) {
      // Jump to the next arriving process
      const nextArrival = remaining
        .filter((p) => !completed.includes(p))
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

      if (nextArrival !== undefined && nextArrival > currentTime) {
        totalIdle += nextArrival - currentTime;
        currentTime = nextArrival;
      } else {
        break; // No remaining process, just end
      }
    } else {
      const p = readyQueue.shift();

      const start = Math.max(currentTime, p.arrival); // Start when process has arrived
      const end = start + p.burst;
      const turnaround = end - p.arrival;
      const waiting = turnaround - p.burst;

      currentTime = end;

      completed.push({
        ...p,
        start,
        end,
        completion: end,
        turnaround,
        waiting,
      });
    }
  }

  return { result: completed, totalTime: currentTime, totalIdle };
}

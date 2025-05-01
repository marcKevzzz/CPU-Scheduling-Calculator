

export function calculateFCFS(processes) {
    const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;
    let totalIdle = 0;
    const result = [];
  
    sorted.forEach((p) => {
      if (currentTime < p.arrival) {
        totalIdle += p.arrival - currentTime;
        currentTime = p.arrival;
      }
  
      const start = currentTime;
      const completion = start + p.burst;
      const turnaround = completion - p.arrival;
      const waiting = turnaround - p.burst;
      currentTime = completion;
  
      result.push({
        ...p,
        start,
        completion,
        turnaround,
        waiting,
      });
    });
    result.forEach((proc) => {
      console.log(`Process: ${proc.process}, Arrival Time: ${proc.arrival}, Burst Time: ${proc.burst}`);
    });
  
  
    const totalTime = currentTime;
    return { result, totalTime, totalIdle }; // Return the computed data
  }
  
  
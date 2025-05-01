let turnaroundResult = [];

export const fcfs = (arrivalTime, burstTime) => {
  const processes = arrivalTime.map((at, i) => ({
    process: (i + 10).toString(36).toUpperCase(),
    arrival: at,
    burst: burstTime[i]
  }));

  processes.sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;

  processes.forEach(p => {
    p.start = Math.max(currentTime, p.arrival);
    p.end = p.start + p.burst;
    currentTime = p.end;
  });

  return processes;
};


export const sjf = (arrivalTime, burstTime) => {
  const processes = arrivalTime.map((at, i) => ({
    process: (i + 10).toString(36).toUpperCase(),
    arrival: at,
    burst: burstTime[i],
    completed: false
  }));

  const result = [];
  let currentTime = 0;
  let completedCount = 0;
  const n = processes.length;

  while (completedCount < n) {
    // Get all processes that have arrived and are not completed
    const readyQueue = processes
      .filter(p => p.arrival <= currentTime && !p.completed)
      .sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);

    if (readyQueue.length === 0) {
      // If no process is ready, advance the current time to the next process arrival
      currentTime = Math.min(...processes.filter(p => !p.completed).map(p => p.arrival));
      continue;
    }

    const currentProcess = readyQueue[0];
    currentProcess.start = currentTime;
    currentProcess.end = currentTime + currentProcess.burst;
    currentProcess.completed = true;
    result.push(currentProcess);
    currentTime = currentProcess.end;
    completedCount++;
  }

  return result;
};

export function renderGanttChart(result, options = {}) {
  const {
    showQueue = true,
    algorithm = "FCFS",
    containerIds = {
      head: "head",
      body: "gbody",
      tail: "tail",
      queue: "queue",
    },
  } = options;

  const h = document.getElementById(containerIds.head);
  const b = document.getElementById(containerIds.body);
  const t = document.getElementById(containerIds.tail);
  const q = document.getElementById(containerIds.queue);

  h.innerHTML = "";
  b.innerHTML = "";
  t.innerHTML = "";
  if (showQueue && q) q.innerHTML = "";

  const timeline = [];
  const timelineProcess = [];
  let prevEnd = 0;

  console.table(result.map(p => ({
    process: p.process, 
    arrival: p.arrival,
    burst: p.burst,
    start: p.start,
    end: p.end
  })));
  
  result.forEach(p => {
    // Only calculate idle time if there is a gap between processes
    const idleTime = Math.max(0, p.start - prevEnd); // Avoid negative idle time
    if (idleTime > 0) {
      for (let i = 0; i < idleTime; i++) {
        timeline.push(1);  // Idle unit
        timelineProcess.push("i");  // Idle process
      }
    }

    // Process time duration
    const duration = p.end - p.start;
    timeline.push(duration);
    timelineProcess.push(p.process);
    prevEnd = p.end;
  });

  // Tail (Time scale)
  let time = 0;
  timeline.forEach((duration) => {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("text-start");
    timeDiv.style.width = "40px";
    timeDiv.innerHTML = `${time}`;
    t.appendChild(timeDiv);
    time += duration;
  });

  const lastTime = document.createElement("div");
  lastTime.classList.add("text-start", "bg-primary", "px-2", "rounded");
  lastTime.style.width = "fit-content";
  lastTime.style.color = "white";
  lastTime.innerHTML = `${time}`;
  t.appendChild(lastTime);

  // Body (Processes)
  timelineProcess.forEach(p => {
    const box = document.createElement("div");
    box.classList.add("border", "p-2", "text-center");
    box.style.width = "40px";
    box.innerHTML = `<strong>${p}</strong>`;
    b.appendChild(box);
  });

  // Head (Burst times)
  const burstTime = document.createElement("div");
  burstTime.classList.add("text-end");
  burstTime.style.width = "40px";
  burstTime.innerHTML = `Bt`;
  h.appendChild(burstTime);

  timeline.forEach(p => {
    const btDiv = document.createElement("div");
    btDiv.classList.add("text-end");
    btDiv.style.width = "40px";
    btDiv.innerHTML = `${p}`;
    h.appendChild(btDiv);
  });

  // Queue visualization (optional)
  if (showQueue && q) {
    const started = new Set();
    let currentTime = 0;

    timelineProcess.forEach((proc, i) => {
      const queueDiv = document.createElement("div");
      queueDiv.classList.add("text-center");
      queueDiv.style.width = "40px";
      queueDiv.style.fontSize = "14px";

      const readyQueue = result
        .filter(p =>
          p.arrival <= currentTime && !started.has(p.process)
        )
        .sort((a, b) => {
          if (algorithm === "SJF") return a.burst - b.burst;
          return a.arrival - b.arrival;
        })
        .map(p => p.process);

      queueDiv.innerHTML = readyQueue.join("<br />");
      q.appendChild(queueDiv);

      started.add(proc);
      currentTime += timeline[i];
    });
  }
}

export function renderResultTableTurnaround(result) {
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Tt${process++}</td>
        <td class="d-flex flex-row">${r.completion} <pre>  -  </pre> ${
      r.arrival
    } <pre>  =  </pre> ${r.turnaround}</td>
      </tr>
    `;
    ave = (ave || 0) + r.turnaround;
    tbody.insertAdjacentHTML("beforeend", row);
    turnaroundResult.push(r.turnaround); // Store for later use
  });
  const ttave = `<tr>
  <td>TTave</td>
  <td class="d-flex flex-row">${ave} <pre>  /  </pre> ${
    process - 1
  } <pre>  =  </pre> <div class="bg-primary px-2">${
    ave / (process - 1)
  } ms</div></td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function renderResultTableWaiting(result) {
  const tbody = document.querySelector("#resultTableWaitingTime tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Wt${process}</td>
        <td class="d-flex flex-row">${
          turnaroundResult[process - 1]
        } <pre>  -  </pre> ${r.burst} <pre>  =  </pre> ${r.waiting}</td>
      </tr>
    `;
    process++;
    ave = (ave || 0) + r.waiting;
    tbody.insertAdjacentHTML("beforeend", row);
  });
  const ttave = `<tr>
  <td>WTave</td>
  <td class="d-flex flex-row">${ave} <pre>  /  </pre> ${
    process - 1
  } <pre>  =  </pre> <div class="bg-primary px-2">${
    ave / (process - 1)
  } ms</div> </td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function generateTimeline(result) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const vrline = document.createElement("div");
  vrline.className = "timeline-vrline";

  // Group processes by arrival time
  const grouped = {};
  result.forEach((p) => {
    if (!grouped[p.arrival]) {
      grouped[p.arrival] = [];
    }
    grouped[p.arrival].push(p.process);
  });

  // Sort by arrival time
  const sortedArrivals = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  // Render grouped blocks
  sortedArrivals.forEach((arrival) => {
    const block = document.createElement("div");
    block.className =
      "timeline-block d-flex flex-column gap-2 px-2 py-1 text-center";
    block.style.maxWidth = "60px";
    block.style.width = "60px";

    block.innerHTML = `
        <div class="fw-semibold">${grouped[arrival].join(", ")}</div>
        <div class="timeline-hrline"><div class="line"></div></div>
        <div class="text">${arrival}</div>
      `;

    timeline.appendChild(block);
  });

  timeline.appendChild(vrline);
}

export function renderCPUUtilization(totalIdle, totalTime, result) {
  let timeline = [];
  let prevEnd = 0;
  let bt = 0;

  result.forEach((p) => {
    const idleTime = p.start - prevEnd;
    for (let i = 0; i < idleTime; i++) {
      timeline.push(1);
    }

    timeline.push(p.burst);
    prevEnd = p.start + p.burst;
    bt += p.burst;
  });

  const cpuUtil = ((totalTime - totalIdle) / totalTime) * 100;
  document.getElementById("cpuUtil").textContent = ` =  ${(
    (totalTime - totalIdle) /
    totalTime
  ).toFixed(4)}  × 100 = `;
  document.getElementById("cpuTotal").textContent = `${cpuUtil.toFixed(2)}%`;

  // Display all timeline times
  const timelineElement = document.getElementById("completion");
  timelineElement.textContent = `${timeline.join(" + ")}`;

  // Display the number of processes
  const processCountElement = document.getElementById("process");
  processCountElement.textContent = `${bt}`;
}

export function updateTableHeaders(tableSelector) {
  const headers = document.querySelectorAll(`${tableSelector} thead th`);

  if (window.innerWidth <= 480) {
    headers[0].textContent = "P#";
    headers[1].textContent = "AT";
    headers[2].textContent = "BT";
  } else {
    headers[0].textContent = "Process";
    headers[1].textContent = "Arrival Time";
    headers[2].textContent = "Burst Time";
  }
}

// Example wrapper call on load
window.addEventListener("load", () => updateTableHeaders("#processTable"));
window.addEventListener(
  "resize",
  debounce(() => updateTableHeaders("#processTable"), 200)
);

function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}

let processCounter = 4; // Initialize process counter

export function addRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const row = document.createElement("tr");
  row.innerHTML = `
    <th><div class="jobs">P${processCounter++}</div></th>
    <td><input type="number" class="form-control shadow-none border-0 px-0" placeholder="Enter value" /></td>
    <td><input type="number" class="form-control shadow-none border-0 px-0" placeholder="Enter value" /></td>
  `;
  tableBody.appendChild(row);
}

export function deleteRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const rows = tableBody.querySelectorAll("tr");
  if (rows.length > 1) {
    tableBody.removeChild(rows[rows.length - 1]);
    processCounter--;
  }
}

export function clearTable() {
  document.querySelectorAll("#processTable input").forEach((input) => {
    input.value = "";
    input.classList.remove("is-invalid");
  });

  // Clear result areas
  [
    "#resultTable tbody",
    "#resultTableWaitingTime tbody",
    "#head",
    "#gbody",
    "#tail",
    "#queue",
    "#cpuUtil",
    "#timeline",
    "#cpuResult",
  ].forEach((selector) => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = "";
  });
}

export function getProcessData(tableSelector) {
  const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
  const processes = [];
  rows.forEach((row) => {
    const name = row.querySelector(".jobs").textContent.trim();
    const arrival = parseInt(row.querySelectorAll("input")[0].value);
    const burst = parseInt(row.querySelectorAll("input")[1].value);
    if (!isNaN(arrival) && !isNaN(burst)) {
      processes.push({ process: name, arrival, burst });
    }
  });
  return processes;
}

// export function renderGanttChart(result, options = {}) {
//   const {
//     showQueue = true,
//     algorithm = "FCFS",
//     containerIds = {
//       head: "head",
//       body: "gbody",
//       tail: "tail",
//       queue: "queue",
//     },
//   } = options;

//   console.table(result.map(p => ({
//     process: p.process,
//     arrival: p.arrival,
//     burst: p.burst,
//     start: p.start,
//     end: p.end
//   })));
  

//   if (algorithm === "FCFS") {
//     result.sort((a, b) => {
//       if (a.arrival === b.arrival) {
//         return a.process < b.process ? -1 : 1; 
//       }
//       return a.arrival - b.arrival; 
//     });
//   } else if (algorithm === "SJF") {
//     result.sort((a, b) => {
//       if (a.burst === b.burst) {
//         return a.arrival - b.arrival;
//       }
//       return a.burst - b.burst;
//     });
//   }
 
//   const h = document.getElementById(containerIds.head);
//   const b = document.getElementById(containerIds.body);
//   const t = document.getElementById(containerIds.tail);
//   const q = document.getElementById(containerIds.queue);

//   h.innerHTML = "";
//   b.innerHTML = "";
//   t.innerHTML = "";
//   if (showQueue && q) q.innerHTML = "";

//   let timeline = [];
//   let timelineProcess = [];
//   let prevEnd = 0;
//   let bt = 0;

//   const lastTime = document.createElement("div");

//   result.forEach((p) => {
//     const idleTime = p.start - prevEnd;
//     for (let i = 0; i < idleTime; i++) {
//       timeline.push(1);
//       timelineProcess.push("i");
//     }

//     timeline.push(p.burst);
//     timelineProcess.push(p.process);
//     prevEnd = p.start + p.burst;
//   });

//   timeline.forEach((r) => {
//     const exitTime = document.createElement("div");
//     exitTime.classList.add("text-start");
//     exitTime.style.width = "40px";
//     exitTime.style.color = "black";
//     exitTime.innerHTML = `${bt}`;
//     bt += r;
//     t.appendChild(exitTime);
//   });

//   lastTime.classList.add("text-start", "bg-primary", "px-2", "rounded");
//   lastTime.style.width = "fit-content";
//   lastTime.style.height = "fit-content";
//   lastTime.style.color = "white";
//   lastTime.innerHTML = `${bt}`;
//   t.appendChild(lastTime);

//   timelineProcess.forEach((p) => {
//     const process = document.createElement("div");
//     process.classList.add("border", "p-2", "text-center");
//     process.style.width = "40px";
//     process.style.color = "black";
//     process.innerHTML = `<strong>${p}</strong>`;
//     b.appendChild(process);
//   });

//   const burstTime = document.createElement("div");
//   burstTime.classList.add("text-end");
//   burstTime.style.width = "40px";
//   burstTime.innerHTML = `Bt`;
//   burstTime.style.color = "black";
//   h.appendChild(burstTime);

//   timeline.forEach((p) => {
//     const totalTime = document.createElement("div");
//     totalTime.classList.add("text-end");
//     totalTime.style.width = "40px";
//     totalTime.style.color = "black";
//     totalTime.innerHTML = `${p}`;
//     h.appendChild(totalTime);
//   });

//   console.log(algorithm);

//   switch (algorithm) {
//     case "FCFS":
//       const started = new Set();
//       let currentTime = timeline[0];

//       timelineProcess.forEach((p, i) => {
//         const queueDiv = document.createElement("div");
//         queueDiv.classList.add("text-center");
//         queueDiv.style.width = "40px";
//         queueDiv.style.fontSize = "14px";
//         queueDiv.style.color = "black";
//         started.add(p);

//         const readyQueue = result
//           .filter(
//             (proc) => proc.arrival <= currentTime && !started.has(proc.process)
//           )
//           .map((proc) => {
//             const span = document.createElement("span");
//             span.textContent = proc.process;

//             if (timelineProcess[i + 1] === proc.process) {
//               span.classList.add("slashed");
//             }

//             return span.outerHTML;
//           });

//         queueDiv.innerHTML =
//           readyQueue.length > 0 ? readyQueue.join("<br />") : "";

//         started.add(p);

//         q.appendChild(queueDiv);

//         currentTime += timeline[i + 1];
//       });
//       break;
//     case "SJF":
//       if (showQueue && q) {
//         const started = new Set();
//         let currentTime = result.length > 0 ? result[0].start : 0;

//         timelineProcess.forEach((p, i) => {
//           const queueDiv = document.createElement("div");
//           queueDiv.classList.add("text-center");
//           queueDiv.style.width = "40px";
//           queueDiv.style.fontSize = "14px";
//           queueDiv.style.color = "black";

//           started.add(p);

//           const allProcesses = [...result]; // or use the original unsorted process list

//           const readyQueue = allProcesses
//             .filter((proc) =>
//               proc.arrival <= currentTime && !started.has(proc.process)
//             )
//             .sort((a, b) => a.burst - b.burst);

//           queueDiv.innerHTML =
//             readyQueue.length > 0 ? readyQueue.join("<br />") : "";

//           q.appendChild(queueDiv);

//           currentTime += timeline[i + 1] || 0;
//         });
//       }
//       break;
//   }
// }



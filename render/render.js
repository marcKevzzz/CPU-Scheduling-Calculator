let turnaroundResult = [];

export function renderGanttChart(result, options = {}, ganttChart) {
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

  console.table(ganttChart.rbt);
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
  const burstDurations = [];
  const timeMarkers = [];

  renderQueueTimeline(ganttChart, q, algorithm);

  ganttChart.forEach((entry) => {
    timeline.push(entry.start);
    timelineProcess.push(entry.label);
    burstDurations.push(entry.end - entry.start);
    timeMarkers.push(entry.start);
  });

  if (ganttChart.length > 0) {
    timeMarkers.push(ganttChart[ganttChart.length - 1].end);
  }

  // Tail (Time scale)
  const allTimePoints = ganttChart.map((e) => e.start);
  allTimePoints.push(ganttChart[ganttChart.length - 1].end);
  allTimePoints.forEach((time, i) => {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("text-start");
    timeDiv.style.width = "40px";
    timeDiv.style.minWidth = "40px";
    timeDiv.innerHTML = `${time}`;
    if (i === allTimePoints.length - 1) {
      timeDiv.classList.add("bg-primary", "rounded", "px-2");
      timeDiv.style.height = "fit-content";
      timeDiv.style.width = "fit-content";
    }
    t.appendChild(timeDiv);
  });

  // Body (Gantt process blocks)
  timelineProcess.forEach((label) => {
    const box = document.createElement("div");
    box.classList.add("border", "p-2", "text-center");
    box.style.width = "40px";
    box.style.minWidth = "40px";
    box.innerHTML = `<strong>${label}</strong>`;
    b.appendChild(box);
  });

  if (algorithm === "RR" || algorithm === "SRTF" || algorithm === "PP") {
    const headPanel = document.createElement("div");
    headPanel.classList.add("d-flex", "flex-column");

    // Headers
    const rbtHeader = document.createElement("div");
    rbtHeader.classList.add("d-flex", "flex-row");
    const btHeader = document.createElement("div");
    btHeader.classList.add("d-flex", "flex-row");

    // Header Labels
    const rbtLbl = document.createElement("div");
    rbtLbl.style.width = "40px";
    rbtLbl.style.minWidth = "40px";
    rbtLbl.innerHTML = "<strong>RBt</strong>";
    rbtHeader.appendChild(rbtLbl);

    const btLbl = document.createElement("div");
    btLbl.style.width = "40px";
    btLbl.style.minWidth = "40px";
    btLbl.innerHTML = "<strong>Bt</strong>";
    btHeader.appendChild(btLbl);

    // Build burst map for each process
    const burstDurationsMap = {};
    ganttChart.forEach((entry) => {
      if (entry.label !== "i") {
        burstDurationsMap[entry.label] ??= 0;
        burstDurationsMap[entry.label] += entry.end - entry.start;
      }
    });

    // Add RBt and Bt per Gantt chart entry
    ganttChart.forEach((entry) => {
      const rbtDiv = document.createElement("div");
      rbtDiv.style.width = "40px";
      rbtDiv.style.minWidth = "40px";

      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      if (entry.label === "i") {
        rbtDiv.textContent = "";
        btDiv.textContent = "1";
      } else {
        rbtDiv.textContent = entry.rbt === 0 ? "" : entry.rbt ?? "";
        btDiv.textContent = burstDurationsMap[entry.label] ?? "";
      }

      rbtHeader.appendChild(rbtDiv);
      btHeader.appendChild(btDiv);
    });

    headPanel.appendChild(rbtHeader);
    headPanel.appendChild(btHeader);
    h.appendChild(headPanel);
  } else {
    // Head (Burst Times)
    const burstLabel = document.createElement("div");
    burstLabel.style.width = "40px";
    burstLabel.innerHTML = "Bt";
    h.appendChild(burstLabel);

    burstDurations.forEach((dur) => {
      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      btDiv.innerHTML = `${dur}`;
      h.appendChild(btDiv);
    });
  }
}
function renderQueueTimeline(ganttChart, q, algorithm) {
  if (!q) return;
  q.innerHTML = ""; // Reset container

  const allLabels = new Set();
  ganttChart.forEach((entry) => {
    entry.queue?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
    entry.arrived?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
  });

  // 🟢 Track processes that are already completed
  const completedSet = new Set();

  ganttChart.forEach((entry, index) => {
    const queueDiv = document.createElement("div");
    queueDiv.classList.add("text-center");
    queueDiv.style.width = "40px";
    queueDiv.style.minWidth = "40px";
    queueDiv.style.fontSize = "14px";
    queueDiv.style.display = "flex";
    queueDiv.style.flexDirection = "column";
    queueDiv.style.alignItems = "center";

    const renderProc = (proc) => {
      const span = document.createElement("span");
      const name = typeof proc === "object" ? proc.process : proc;
      const priority = typeof proc === "object" ? proc.priority : null;

      span.textContent = priority ? `${name}(${priority})` : name;
      console.log(
        "Checking slash for",
        name,
        "vs",
        entry.label,
        "RBT:",
        entry.rbt
      );

      // ✅ Slash only once — when it finishes
      if (
        (algorithm === "RR" || algorithm === "SRTF" || algorithm === "PP") &&
        entry.label === name &&
        entry.rbt === 0 &&
        !completedSet.has(name)
      ) {
        span.classList.add("slashed");
        completedSet.add(name); // Mark as completed
        console.log("Slashing", name, "at time", entry.end);
      }

      queueDiv.appendChild(span);
    };

    entry.queue?.forEach(renderProc);
    entry.arrived?.forEach(renderProc);

    q.appendChild(queueDiv);
  });
}

// function renderQueueTimeline(ganttChart, q) {
//   if (!q) return;

//   ganttChart.forEach((entry, index) => {
//     const queueDiv = document.createElement("div");
//     queueDiv.classList.add("text-center");
//     queueDiv.style.width = "40px";
//     queueDiv.style.fontSize = "14px";
//     queueDiv.style.display = "flex";
//     queueDiv.style.flexDirection = "column";
//     queueDiv.style.alignItems = "center";

//     const renderProc = (proc) => {
//       const span = document.createElement("span");

//       // Normalize name and priority
//       const name = typeof proc === "object" ? proc.process : proc;
//       const priority = typeof proc === "object" ? proc.priority : null;

//       // Label text
//       span.textContent = priority ? `${name}(${priority})` : name;

//       // Slash if it's the last time the process appears in the Gantt chart
//       const appearsLater = ganttChart.slice(index + 1).some((g) => {
//         const labelName =
//           typeof g.label === "object" ? g.label.process : g.label;
//         return labelName === name;
//       });

//       if (!appearsLater) {
//         span.classList.add("slashed");
//       }

//       queueDiv.appendChild(span);
//     };

//     entry.queue?.forEach(renderProc);
//     entry.arrived?.forEach(renderProc);

//     q.appendChild(queueDiv);
//   });
// }

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

export function renderCPUUtilization(totalIdle, totalTime, ganttChart) {
  let timeline = [];

  ganttChart.forEach((p) => {
    timeline.push(p.end - p.start);
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
  processCountElement.textContent = `${ganttChart.length}`;
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
    <td><input type="number" class="form-control shadow-none border-0 px-0" min="0" placeholder="Enter value" /></td>
    <td><input type="number" class="form-control shadow-none border-0 px-0" min="0" placeholder="Enter value" /></td>
  `;
  tableBody.appendChild(row);
}
export function addRowP(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const row = document.createElement("tr");
  row.innerHTML = `
    <th><div class="jobs">P${processCounter++}</div></th>
    <td><input type="number" class="form-control shadow-none border-0 px-0" min="0" placeholder="Enter value" /></td>
    <td><input type="number" class="form-control shadow-none border-0 px-0" min="0" placeholder="Enter value" /></td>
    <td><input type="number" class="form-control shadow-none border-0 px-0" min="0" placeholder="Enter value" /></td>
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
export function getProcessData(tableSelector, mode = "priority") {
  const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
  const processes = [];

  let timeQuantum = null;
  if (mode === "roundrobin") {
    const tqInput = document.getElementById("timeQuantum");
    if (tqInput) {
      const parsedTQ = parseInt(tqInput.value);
      if (!isNaN(parsedTQ) && parsedTQ > 0) {
        timeQuantum = parsedTQ;
      } else {
        console.warn("Invalid or missing time quantum input.");
      }
    }
  }

  rows.forEach((row) => {
    const name = row.querySelector(".jobs")?.textContent.trim();
    const inputs = row.querySelectorAll("input");

    const arrival = parseInt(inputs[0]?.value);
    const burst = parseInt(inputs[1]?.value);
    const extra = parseInt(inputs[2]?.value);

    if (!isNaN(arrival) && !isNaN(burst)) {
      const process = {
        process: name,
        arrival,
        burst,
      };

      if (mode === "priority" && !isNaN(extra)) {
        process.priority = extra;
      }

      processes.push(process);
    }
  });

  return { processes, timeQuantum }; // Always return both
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

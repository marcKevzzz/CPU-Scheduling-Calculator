let turnaroundResult = [];

import { updateTableColumns } from "../script.js";

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

  console.table(ganttChart);

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
    timeDiv.classList.add("text-start", "mt-1");
    timeDiv.style.width = "42px";
    timeDiv.style.minWidth = "42px";
    timeDiv.innerHTML = `${time}`;
    if (i === ganttChart.length) {
      timeDiv.className = "bg-primary rounded-lg text-center mt-1  text-light";
      timeDiv.style.height = "fit-content";
      timeDiv.style.width = "fit-content";
    }
    t.appendChild(timeDiv);
  });

  // Body (Gantt process blocks)
  timelineProcess.forEach((label) => {
    const box = document.createElement("div");
    box.className = " border border-dark p-1 text-center";
    box.style.width = "40px";
    box.style.minWidth = "40px";
    box.innerHTML = `${label}`;
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
    rbtLbl.style.width = "42px";
    rbtLbl.style.minWidth = "42px";
    rbtLbl.innerHTML = "RBt";
    rbtHeader.appendChild(rbtLbl);

    const btLbl = document.createElement("div");
    btLbl.style.width = "42px";
    btLbl.style.minWidth = "42px";
    btLbl.innerHTML = "Bt";
    btHeader.appendChild(btLbl);

    // Add RBt and Bt per Gantt chart entry
    ganttChart.forEach((entry) => {
      const rbtDiv = document.createElement("div");
      rbtDiv.style.width = "42px";
      rbtDiv.style.minWidth = "42px";

      const btDiv = document.createElement("div");
      btDiv.style.width = "42px";
      btDiv.style.minWidth = "42px";

      if (entry.label === "i") {
        rbtDiv.textContent = "";
        btDiv.textContent = (
          entry.burstUsed ?? entry.end - entry.start
        ).toString();
        // idle burst (usually 1)
      } else {
        rbtDiv.textContent = entry.rbt === 0 ? "" : entry.rbt ?? "";
        btDiv.textContent = (
          entry.burstUsed ?? entry.end - entry.start
        ).toString();
        // Actual burst used per Gantt slice
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
    burstLabel.style.width = "42px";
    burstLabel.innerHTML = "Bt";
    h.appendChild(burstLabel);

    burstDurations.forEach((dur) => {
      const btDiv = document.createElement("div");
      btDiv.style.width = "42px";
      btDiv.style.minWidth = "42px";

      btDiv.innerHTML = `${dur}`;
      h.appendChild(btDiv);
    });
  }
  console.log("ganttChart");
  console.table(ganttChart);
  renderQueueTimeline(result, ganttChart, q, algorithm);
}

function renderQueueTimeline(result, ganttChart, q, algorithm) {
  if (!q || !Array.isArray(ganttChart)) return;

  // Create deep copy to avoid mutating original data
  const gantt = ganttChart.map((entry) => ({ ...entry }));

  // Maps to store original burst times and actual durations
  const originalBurstMap = new Map();
  const bmap = new Map();

  gantt.forEach((entry) => {
    if (entry.label && entry.rbt != null) {
      originalBurstMap.set(entry.label, entry.rbt);
      bmap.set(entry.label, entry.end - entry.start);
    }

    // Normalize and merge 'arrived' and 'queue'
    const arrived = Array.isArray(entry.arrived) ? entry.arrived : [];
    const queue = Array.isArray(entry.queue) ? entry.queue : [];

    entry.processes = [
      ...arrived.map((p) => ({ ...normalizeProc(p), type: "arrived" })),
      ...queue.map((p) => ({ ...normalizeProc(p), type: "queue" })),
    ];
  });

  // Assign next label to each entry
  for (let i = 0; i < gantt.length - 1; i++) {
    gantt[i].nextLabel = gantt[i + 1]?.label || null;
  }
  gantt[gantt.length - 1].nextLabel = null;

  // Clear existing content
  q.innerHTML = "";

  function normalizeProc(p) {
    if (p == null) return {};
    if (typeof p === "object") {
      return {
        process: p.process || p.label || "",
        arrival: p.arrival ?? 0,
        priority: p.priority ?? null,
        rbt: p.rbt ?? (typeof p.burst === "number" ? p.burst : null), // fallback
      };
    }
    return { process: p, arrival: 0, priority: null, rbt: null };
  }

  function shouldBeSlashed(entry, name, algorithm, bt) {
    const group1 = ["SRTF", "RR", "PP"];
    const group2 = ["FCFS", "SJF", "NPP"];

    const original = originalBurstMap.get(name);
    const duration = bmap.get(name);

    // Debug info
    console.log("Check Slash =>", {
      entryLabel: entry.label,
      nextLabel: entry.nextLabel,
      name,
      original,
      bt,
      duration,
    });

    if (group1.includes(algorithm)) {
      return entry.nextLabel === name && original === 0 && bt === duration;
    } else if (group2.includes(algorithm)) {
      return entry.nextLabel === name;
    }

    return false;
  }

  gantt.forEach((entry) => {
    // Sort for RR if needed
    if (algorithm === "RR" && Array.isArray(entry.processes)) {
      entry.processes.sort((a, b) => (a.arrival || 0) - (b.arrival || 0));
    }

    const queueDiv = document.createElement("div");
    queueDiv.classList.add("gap-2", "tracking-tighter", "text-sm");
    queueDiv.style.width = "42px";
    queueDiv.style.minWidth = "42px";
    queueDiv.style.display = "flex";
    queueDiv.style.flexDirection = "column";

    if (Array.isArray(entry.processes)) {
      entry.processes.forEach((proc) => {
        const span = document.createElement("span");
        const name = proc.process;
        const priority = proc.priority;
        const rbt = proc.rbt;

        console.log("Proc in queue:", proc);

        span.textContent = priority != null ? `${name}(${priority})` : name;

        try {
          if (shouldBeSlashed(entry, name, algorithm, rbt)) {
            span.classList.add("slashed");
          }
        } catch (e) {
          console.warn("Error checking slashed for", name, e);
        }

        queueDiv.appendChild(span);
      });
    }

    q.appendChild(queueDiv);
  });
}

let processCounter = 4;

export function addRow(tableSelector, algorithm = "", isFirstRow = false) {
  const tableBody = document.querySelector(`${tableSelector} .body`);

  const row = document.createElement("tr");

  let rowContent = `
    <th>
      <div class="jobs">
        P${processCounter++}
      </div>
    </th>
    <td>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter value"
                          class="form-control shadow-none border-0 px-0"
                        />
                      </td>
  <td>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter value"
                          class="form-control shadow-none border-0 px-0"
                        />
                      </td>
  `;

  // Add Time Quantum column only if it's the first row and algorithm is RR
  if (algorithm === "RR" && isFirstRow) {
    rowContent += `
      <td class="timeQuantum-col">
    
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter value"
                          class="form-control shadow-none border-0 px-0"
                          id="timeQuantum"
                        />
                   
      </td>
    `;
  }

  // Add Priority column if algorithm is NPP or PP
  if (algorithm === "NPP" || algorithm === "PP") {
    rowContent += `
      <td class="priority-col">
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter value"
                          class="form-control shadow-none border-0 px-0"
                        />
      </td>
    `;
  }

  row.innerHTML = rowContent;

  tableBody.appendChild(row);
}
let algo;

export function onAlgorithmChange(algorithm) {
  processCounter = 1;

  const tableBody = document.querySelector("#processTable tbody");
  tableBody.innerHTML = ""; // Clear previous rows

  // Add the first row (with or without Time Quantum depending on algorithm)
  addRow("#processTable", algorithm, true); // Pass `true` for first row

  // Add subsequent rows (only Arrival Time, Burst Time, Priority if needed)
  for (let i = 1; i < 3; i++) {
    // Change 5 to your desired number of rows
    addRow("#processTable", algorithm);
  }
  algo = algorithm;
  updateTableColumns(algorithm); // Also updates headers
}

export function deleteRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const rows = tableBody.querySelectorAll("tr");
  if (rows.length > 1) {
    tableBody.removeChild(rows[rows.length - 1]);
    processCounter--;
  }
}

export function renderResultTableTurnaround(result) {
  turnaroundResult = [];
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
  } <pre>  =  </pre> <div class="bg-primary px-2">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div></td>
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
  } <pre>  =  </pre> <div class="bg-primary px-2">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div> </td>
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

export function renderCPUUtilization(totalIdle, result, ganttChart) {
  console.table(ganttChart);
  let timeline = [];
  let totalBurst = 0;

  ganttChart.forEach((p) => {
    const burst = p.end - p.start;
    timeline.push(burst);
    totalBurst += burst;
  });

  let totalBt = 0;

  result.forEach((p) => {
    totalBt += p.burst;
  });

  // Get the last end time as the total time
  const totalTime =
    ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].end : 0;

  const cpuUtil =
    totalTime === 0 ? 0 : ((totalTime - totalIdle) / totalTime) * 100;

  // Update HTML content
  document.getElementById("burstt").textContent = ` ${totalBurst}`;
  document.getElementById("adds").textContent = ` ${totalBt}`;
  document.getElementById("cpuTotal").textContent = `${cpuUtil.toFixed(2)}%`;

  // Display burst times
  const timelineElement = document.getElementById("completion");
  timelineElement.textContent = `${timeline.join(" + ")}`;

  // Display number of processes (or total burst, depending on your intention)
  const processCountElement = document.getElementById("process");
  processCountElement.textContent = `${totalBt}`;
}
export function updateTableHeaders(tableSelector) {
  const headers = document.querySelectorAll(`${tableSelector} thead th`);

  if (window.innerWidth <= 480 && (algo == "NPP" || algo == "PP")) {
    headers[0].textContent = "P#";
    headers[1].textContent = "AT";
    headers[2].textContent = "BT";
    headers[3].textContent = "P";
  } else if (window.innerWidth <= 480 && algo == "RR") {
    headers[0].textContent = "P#";
    headers[1].textContent = "AT";
    headers[2].textContent = "BT";
    headers[3].textContent = "TQ";
  } else if (algo == "RR") {
    headers[0].textContent = "Process";
    headers[1].textContent = "Arrival Time";
    headers[2].textContent = "Burst Time";
    headers[3].textContent = "Time Quantum";
  } else if (algo == "NPP" || algo == "PP") {
    headers[0].textContent = "Process";
    headers[1].textContent = "Arrival Time";
    headers[2].textContent = "Burst Time";
    headers[3].textContent = "Priority";
  } else if (window.innerWidth <= 480) {
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
  debounce(() => updateTableHeaders("#processTable"), 300)
);

function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
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

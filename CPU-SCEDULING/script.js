import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
} from "./fcfs.js";

import { renderResultTableTurnaround as sjfRenderResultTableTurnaround } from "./sjf.js";
import { renderResultTableWaiting as sjfRenderResultTableWaiting } from "./sjf.js";
import { renderGanttChart as sjfRenderGanttChart } from "./sjf.js";
import { generateTimeline as sjfGenerateTimeline } from "./sjf.js";
import { renderCPUUtilization as sjfRenderCPUUtilization } from "./sjf.js";

function initializeScheduler({
  scheduleButtonId,
  addRowButtonId,
  deleteRowButtonId,
  clearButtonId,
  tableSelector,
  resultTableSelector,
  resultTableWaitingSelector,
  calculateCallback,
}) {
  document.addEventListener("DOMContentLoaded", function () {
    const scheduleButton = document.getElementById(scheduleButtonId);
    const addRowButton = document.getElementById(addRowButtonId);
    const deleteRowButton = document.getElementById(deleteRowButtonId);
    const clearButton = document.getElementById(clearButtonId);

    scheduleButton.addEventListener("click", function () {
      validateTableInputs(calculateCallback);
    });

    addRowButton.addEventListener("click", function () {
      addRow(tableSelector);
    });

    deleteRowButton.addEventListener("click", function () {
      deleteRow(tableSelector);
    });

    clearButton.addEventListener("click", function () {
      clearTable();
      updateTableHeaders(tableSelector);
      document.querySelector(resultTableSelector).style.display = "none";
      document.querySelector(resultTableWaitingSelector).style.display = "none";
    });
  });
}

initializeScheduler({
  scheduleButtonId: "calculate",
  addRowButtonId: "addrow",
  deleteRowButtonId: "deleterow",
  clearButtonId: "clear",
  tableSelector: "#processTable",
  resultTableSelector: "#resultTable",
  resultTableWaitingSelector: "#resultTableWaitingTime",
  calculateCallback: calculateSJF, // or any other algorithm
});

let processCounter = 4;

function updateTableHeaders(tableSelector) {
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

function addRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const row = document.createElement("tr");
  row.innerHTML = `
    <th><div class="jobs">P${processCounter++}</div></th>
    <td><input type="number" class="form-control shadow-none border-0 px-0" placeholder="Enter value" /></td>
    <td><input type="number" class="form-control shadow-none border-0 px-0" placeholder="Enter value" /></td>
  `;
  tableBody.appendChild(row);
}

function deleteRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const rows = tableBody.querySelectorAll("tr");
  if (rows.length > 1) {
    tableBody.removeChild(rows[rows.length - 1]);
    processCounter--;
  }
}

function clearTable() {
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

function getProcessData(tableSelector) {
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
function calculateFCFS(processes) {
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

  const totalTime = currentTime;
  return { result, totalTime, totalIdle }; // Return the computed data
}

function calculateSJF(processes) {
  const n = processes.length;
  const completed = [];
  const readyQueue = [];
  let currentTime = 0;
  let totalIdle = 0;
  const all = [...processes];
  let remaining = [...processes];

  while (completed.length < n) {
    // Add arrived processes to readyQueue
    remaining.forEach((p) => {
      if (p.arrival <= currentTime && !readyQueue.includes(p)) {
        readyQueue.push(p);
      }
    });

    // Sort by burst time (shortest job first)
    readyQueue.sort((a, b) => a.burst - b.burst);

    if (readyQueue.length === 0) {
      currentTime++;
      totalIdle++;
    } else {
      const p = readyQueue.shift();
      remaining = remaining.filter((proc) => proc !== p);

      const start = currentTime;
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

function scheduleAndRender(algorithm) {
  const processes = getProcessData("#processTable"); // Get processes
  if (!processes.length) return;

  try {
    const { result, totalTime, totalIdle } = algorithm(processes);
    renderResultTableTurnaround([...result]);
    renderResultTableWaiting([...result]);
    renderGanttChart(result);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, totalTime, result);
  } catch (error) {
    console.error("Error during scheduling or rendering: ", error);
  }
}

function validateTableInputs(algorithm) {
  let invalid = false;
  let firstInvalidInput = null;

  // Get all number inputs inside the table
  const inputs = document.querySelectorAll(
    "#processTable input[type='number']"
  );

  inputs.forEach((input) => {
    // Reset validation classes
    input.classList.remove("is-invalid");

    if (!input.value) {
      input.classList.add("is-invalid");
      if (!invalid) {
        firstInvalidInput = input;
      }
      invalid = true;
    }
  });

  if (invalid) {
    // Scroll to and focus the first invalid input
    firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidInput.focus();

    // Show modal
    const modal = new bootstrap.Toast(document.getElementById("liveToast"));
    modal.show();
    return false;
  }

  // If valid, run your computation
  scheduleAndRender(algorithm); // Or any other valid function
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

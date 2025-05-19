import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  addRow,
  deleteRow,
  onAlgorithmChange,
} from "./algorithms/render.js";

import { calculateFCFS } from "./algorithms/fcfs.js";
import { calculateSJF } from "./algorithms/sjf.js";
import { calculateNPP } from "./algorithms/npp.js";
import { calculateRR } from "./algorithms/rr.js";
import { calculateSRTF } from "./algorithms/srtf.js";
import { calculatePP } from "./algorithms/pp.js";

function scheduleAndRender(algorithm, options = {}, mode) {
  resetUI();
  const { processes, timeQuantum } = getProcessData("#processTable", mode);
  if (!processes || !processes.length) return;

  try {
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(result, options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, result, ganttChart);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

let algorithmValue = "";
export function updateTableColumns(selectedValue) {
  const table = document.getElementById("processTable");
  const headerRow = table.querySelector("thead tr");
  const bodyRows = table.querySelectorAll("tbody tr");

  let hasPriorityColumn = table.querySelector("th.priority-col");
  let hasTimeQuantumColumn = table.querySelector("th.timeQuantum-col");

  const needsPriority = selectedValue === "NPP" || selectedValue === "PP";
  const needsTimeQuantum = selectedValue === "RR";

  // Remove Priority column if not needed
  if (!needsPriority && hasPriorityColumn) {
    hasPriorityColumn.remove();
    bodyRows.forEach((row) => {
      const priorityCell = row.querySelector("td.priority-col");
      if (priorityCell) priorityCell.remove();
    });
    hasPriorityColumn = null;
  }

  // Remove Time Quantum column if not needed
  if (!needsTimeQuantum && hasTimeQuantumColumn) {
    hasTimeQuantumColumn.remove();
    bodyRows.forEach((row) => {
      const tqCell = row.querySelector("td.timeQuantum-col");
      if (tqCell) tqCell.remove();
    });
    hasTimeQuantumColumn = null;
  }

  // Add Priority column if needed
  if (needsPriority && !hasPriorityColumn) {
    const priorityHeader = document.createElement("th");
    priorityHeader.className =
      "priority-col pe-3 bg-primary text-light rounded-end";
    priorityHeader.innerHTML = window.innerWidth <= 480 ? "P" : "Priority";
    document.getElementById("btcol").className =
      "bg-primary text-light border-end";
    headerRow.appendChild(priorityHeader);
  }

  // Add Time Quantum column if needed
  if (needsTimeQuantum && !hasTimeQuantumColumn) {
    const tqHeader = document.createElement("th");
    tqHeader.className =
      "timeQuantum-col pe-3 bg-primary text-light rounded-end";
    tqHeader.innerHTML = window.innerWidth <= 480 ? "TQ" : "Time Quantum";
    document.getElementById("btcol").className =
      "bg-primary text-light border-end";
    headerRow.appendChild(tqHeader);
  }

  // 👇 Add listener for screen resize to dynamically update header text
  window.addEventListener("resize", () => {
    const isSmallScreen = window.innerWidth <= 480;

    const priorityTh = table.querySelector("th.priority-col");
    if (priorityTh) {
      priorityTh.innerHTML = isSmallScreen ? "P" : "Priority";
    }

    const tqTh = table.querySelector("th.timeQuantum-col");
    if (tqTh) {
      tqTh.innerHTML = isSmallScreen ? "TQ" : "Time Quantum";
    }
  });
}

// // Initial check
// document.addEventListener("DOMContentLoaded", () => {
//   const selectedRadio = document.querySelectorAll("input[name='btnradio']");

//   selectedRadio.forEach((radio) => {
//     radio.addEventListener("change", () => {
//       updateTableColumns(radio.value);
//       onAlgorithmChange(radio.value);
//       updateTableColumns(radio.value);
//     });
//   });
// });

function validateTableInputs(algorithm, options = {}, mode) {
  let invalid = false;
  let firstInvalidInput = null;

  // Get all number inputs inside the table
  const inputs = document.querySelectorAll(
    "#processTable input[type='number']"
  );

  invalid = [...inputs].some((input) => {
    if (!input.value) {
      input.classList.add("is-invalid");
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
      return true; // Stop as soon as one invalid input is found
    }
    input.classList.remove("is-invalid");
    return false;
  });

  if (invalid) {
    firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidInput.focus();

    const modal = new bootstrap.Toast(document.getElementById("liveToast"));
    modal.show();
    return false;
  }

  const hide = document.querySelector(".hide");
  if (hide) {
    hide.classList.remove("hide");
  }
  showToast("Calculate successful.", true);
  // If valid, run your computation
  scheduleAndRender(algorithm, options, mode);
}

function resetUI() {
  ["head", "gbody", "tail", "queue", "timeline"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  document.querySelector("#resultTableWaitingTime tbody").innerHTML = "";
  document.querySelector("#resultTable tbody").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", function () {
  const radioButtons = document.querySelectorAll('input[name="options-base"]');

  radioButtons.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const selectedValue = e.target.value.trim();
      algorithmValue = selectedValue;

      const b =
        selectedValue === "NPP" || selectedValue === "PP"
          ? "priority"
          : selectedValue === "RR"
          ? "roundrobin"
          : "";
      console.log(algorithmValue + b);
      // updateTableColumns(b);
      onAlgorithmChange(selectedValue);
      updateTableColumns(selectedValue);
    });
  });

  const addRows = document.getElementById("addRow");
  addRows.addEventListener("click", () => {
    addRow("#processTable", algorithmValue);
  });
  const deleteRows = document.getElementById("deleteRow");
  deleteRows.addEventListener("click", () => {
    deleteRow("#processTable", algorithmValue);
  });

  const clearBtn = document.getElementById("clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      radioButtons.forEach((radio) => (radio.checked = false));
      algorithmValue = "";
      // updateTableColumns("");
      resetUI(algorithmValue);
      document.getElementById("cpuResult").classList.add("hide");

      const tbody = document.querySelector("#processTable .body");

      tbody.innerHTML = `
    <tr>
      <th><div class="jobs">P1</div></th>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
    </tr>
    <tr>
      <th><div class="jobs">P2</div></th>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
    </tr>
    <tr>
      <th><div class="jobs">P3</div></th>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
      <td><input type="number" min="0" placeholder="Enter value" class="form-control shadow-none border-0 px-0" /></td>
    </tr>
  `;

      showToast("Calculation restart!", true);
    });
  }

  const calculate = document.getElementById("calculate");

  calculate.addEventListener("click", () => {
    if (!algorithmValue) {
      showToast("Please select an algorithm.");

      const firstRadio = document.getElementById("scheduling");
      if (firstRadio) {
        firstRadio.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    let algorithmFn;
    let algos;
    switch (algorithmValue) {
      case "FCFS":
        algorithmFn = calculateFCFS;
        break;
      case "SJF":
        algorithmFn = calculateSJF;
        break;
      case "NPP":
        algorithmFn = calculateNPP;
        algos = "priority";
        break;
      case "RR":
        algorithmFn = calculateRR;
        algos = "roundrobin";
        break;
      case "SRTF":
        algorithmFn = calculateSRTF;
        break;
      case "PP":
        algorithmFn = calculatePP;
        algos = "priority";
        break;
      default:
        showToast("Unknown algorithm selected.");
        return;
    }
    validateTableInputs(algorithmFn, { algorithm: algorithmValue }, algos);
  });
});

function showToast(message, isSuccess = false) {
  const toastEl = document.getElementById("liveToast");
  const toastBody = document.getElementById("toastBody");
  const toastIcon = document.getElementById("toastIcon");

  // Set the message
  toastBody.textContent = message;

  // Update icon and style
  if (isSuccess) {
    toastIcon.className = "toast-header text-success pe-1 pt-2 fs-5";
    toastIcon.innerHTML = `<i class="bi bi-check2-all"></i>`;
  } else {
    toastIcon.className = "toast-header text-danger pe-1 pt-2 fs-5";
    toastIcon.innerHTML = `<i class="bi bi-exclamation-circle"></i>`;
  }

  // Initialize and show the toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

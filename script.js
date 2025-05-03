import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  addRow,
  deleteRow,
  clearTable,
  addRowP,
} from "render/render.js";

import { calculateFCFS } from "algorithm/fcfs.js";
import { calculateSJF } from "algorithm/sjf.js";
import { calculateNPP } from "algorithm/npp.js";
import { calculateRR } from "algorithm/rr.js";
import { calculateSRTF } from "algorithm/srtf.js";
import { calculatePP } from "algorithm/pp.js";
function scheduleAndRender(algorithm, options = {}, mode) {
  resetUI();
  const { processes, timeQuantum } = getProcessData("#processTable", mode);
  if (!processes || !processes.length) return;

  try {
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalTime, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(result, options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, totalTime, ganttChart);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

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

  // If valid, run your computation
  scheduleAndRender(algorithm, options, mode);
}

function resetUI() {
  ["head", "gbody", "tail", "queue", "turnaroundTable", "waitingTable"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    }
  );
}

document.addEventListener("DOMContentLoaded", function () {
  const fcfsBtn = document.getElementById("calculateFCFS");
  if (fcfsBtn) {
    fcfsBtn.addEventListener("click", () => {
      validateTableInputs(calculateFCFS, {
        showQueue: true,
        algorithm: "FCFS",
      });
    });
  }

  const sjfBtn = document.getElementById("calculateSJF");
  if (sjfBtn) {
    sjfBtn.addEventListener("click", () => {
      validateTableInputs(calculateSJF, { showQueue: true, algorithm: "SJF" });
    });
  }
  const nppBtn = document.getElementById("calculateNPP");
  if (nppBtn) {
    nppBtn.addEventListener("click", () => {
      validateTableInputs(calculateNPP, { showQueue: true, algorithm: "NPP" });
    });
  }
  const rrBtn = document.getElementById("calculateRR");
  if (rrBtn) {
    rrBtn.addEventListener("click", () => {
      validateTableInputs(
        calculateRR,
        { showQueue: true, algorithm: "RR" },
        "roundrobin"
      );
    });
  }
  const srtfBtn = document.getElementById("calculateSRTF");
  if (srtfBtn) {
    srtfBtn.addEventListener("click", () => {
      validateTableInputs(calculateSRTF, {
        showQueue: true,
        algorithm: "SRTF",
      });
    });
  }
  const ppBtn = document.getElementById("calculatePP");
  if (ppBtn) {
    ppBtn.addEventListener("click", () => {
      validateTableInputs(calculatePP, {
        showQueue: true,
        algorithm: "SRTF",
      });
    });
  }

  const addRowBtn = document.getElementById("addrow");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => {
      addRow("#processTable");
    });
  }

  const addRowBtnP = document.getElementById("addrowP");
  if (addRowBtnP) {
    addRowBtnP.addEventListener("click", () => {
      addRowP("#processTable");
    });
  }

  const deleteRowBtn = document.getElementById("deleterow");
  if (deleteRowBtn) {
    deleteRowBtn.addEventListener("click", () => {
      deleteRow("#processTable");
    });
  }

  const clearTableBtn = document.getElementById("clear");
  if (clearTableBtn) {
    clearTableBtn.addEventListener("click", () => {
      clearTable();
    });
  }
});

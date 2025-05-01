
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
} from './render/render.js';

import { calculateFCFS } from './algorithm/fcfs.js';
import { calculateSJF } from './algorithm/sjf.js';

function scheduleAndRender(algorithm, options = {}) {
  resetUI()
  const processes = getProcessData('#processTable');
  if (!processes.length) return;

  try {
    const { result, totalTime, totalIdle } = algorithm(processes);
    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(result, options); 
    generateTimeline(result);
    renderCPUUtilization(totalIdle, totalTime, result);
  } catch (error) {
    console.error('Error during scheduling or rendering:', error);
  }
}

function validateTableInputs(algorithm, options = {}) {
  let invalid = false;
  let firstInvalidInput = null;

  // Get all number inputs inside the table
  const inputs = document.querySelectorAll("#processTable input[type='number']");

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
  scheduleAndRender(algorithm, options);
}



function resetUI() {
  ['head', 'gbody', 'tail', 'queue', 'turnaroundTable', 'waitingTable'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const fcfsBtn = document.getElementById('calculateFCFS');
if (fcfsBtn) {
  fcfsBtn.addEventListener('click', () => {
    validateTableInputs(calculateFCFS, { showQueue: true, algorithm: 'FCFS' });
  });
}

const sjfBtn = document.getElementById('calculateSJF');
if (sjfBtn) {
  sjfBtn.addEventListener('click', () => {
    validateTableInputs(calculateSJF, { showQueue: true, algorithm: 'SJF' });
  });
}

const addRowBtn = document.getElementById('addrow');
if (addRowBtn) {
  addRowBtn.addEventListener('click', () => {
    addRow('#processTable');
  });
}

const deleteRowBtn = document.getElementById('deleterow');
if (deleteRowBtn) {
  deleteRowBtn.addEventListener('click', () => {
    deleteRow('#processTable');
  }); 
}

const clearTableBtn = document.getElementById('clear');
if (clearTableBtn) {
  clearTableBtn.addEventListener('click', () => {
    clearTable();
  });
}
});




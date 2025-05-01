let turnaroundResult = [];

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
  }</div></td>
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
  }</div> </td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function renderGanttChart(result) {
  const h = document.getElementById("head");
  h.innerHTML = ""; // Clear previous header content
  const b = document.getElementById("gbody");
  b.innerHTML = ""; // Clear previous body content
  const t = document.getElementById("tail");
  const q = document.getElementById("queue");
  q.innerHTML = ""; // Clear previous queue content
  t.innerHTML = ""; // Clear previous tail content

  let timeline = [];
  let timelineProcess = [];
  let prevEnd = 0;
  let bt = 0;

  result.forEach((p) => {
    const idleTime = p.start - prevEnd;
    // Add idle time blocks
    for (let i = 0; i < idleTime; i++) {
      timeline.push(1);
      timelineProcess.push("i");
    }

    // Add process burst time
    timeline.push(p.burst);
    timelineProcess.push(p.process);
    prevEnd = p.start + p.burst; // Update previous end time
  });

  // Render the exit times in the tail (completion time markers)
  timeline.forEach((r) => {
    const exitTime = document.createElement("div");
    exitTime.classList.add("text-start");
    exitTime.style.width = "40px";
    exitTime.style.color = "black";
    exitTime.innerHTML = `${bt}`;
    bt += r; // Add the current block time (idle or process burst)
    t.appendChild(exitTime);
  });

  // Add the last time marker (end of last process)
  const lastTime = document.createElement("div");
  lastTime.classList.add("text-start", "bg-primary", "px-2", "rounded");
  lastTime.style.width = "fit-content";
  lastTime.style.height = "fit-content";
  lastTime.style.color = "white";
  lastTime.innerHTML = `${bt}`;
  t.appendChild(lastTime);

  // Render the process blocks in the body (Gantt chart body)
  timelineProcess.forEach((p) => {
    const process = document.createElement("div");
    process.classList.add("border", "p-2", "text-center");
    process.style.width = "40px"; // Adjust width if necessary
    process.style.color = "black";
    process.innerHTML = `<strong>${p}</strong>`;
    b.appendChild(process);
  });

  // Render the timeline at the top (header)
  timeline.forEach((p) => {
    const totalTime = document.createElement("div");
    totalTime.classList.add("text-end");
    totalTime.style.width = "40px";
    totalTime.style.color = "black";
    totalTime.innerHTML = `${p}`;
    h.appendChild(totalTime);
  });

  const started = new Set();
  let currentTime = timeline[0]; // Start from the first time block

  timelineProcess.forEach((p, i) => {
    const queueDiv = document.createElement("div");
    queueDiv.classList.add("text-center");
    queueDiv.style.width = "40px";
    queueDiv.style.fontSize = "14px";
    queueDiv.style.color = "black";
    started.add(p); // Mark the current process as started

    // Filter all processes that have arrived and are not the current one
    const readyQueue = result
      .filter(
        (proc) => proc.arrival <= currentTime && !started.has(proc.process)
      )
      .map((proc) => {
        const span = document.createElement("span");
        span.textContent = proc.process;

        // Add a slash if the process already started
        if (timelineProcess[i + 1] === proc.process) {
          span.classList.add("slashed");
        }

        console.log("p" + p[i + 1]);
        console.log("has" + [...started]);
        return span.outerHTML;
      });

    // Join and set HTML
    queueDiv.innerHTML = readyQueue.length > 0 ? readyQueue.join("<br />") : "";

    console.log(`arrival ${i}: ${result.map((p) => p.arrival)}`);
    console.log(`bt ${i}: ${timeline}`);
    console.log(`currentTime ${i}: ${currentTime}`);
    // Mark the current process as started
    started.add(p);

    q.appendChild(queueDiv);

    currentTime += timeline[i + 1]; // Move to next time block
  });
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

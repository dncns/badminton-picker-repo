// Keep track of the current team type globally
let teamType = "Team";

// ← Back button: return to Load screen
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("teamView").classList.add("hidden");
  document.getElementById("loadView").classList.remove("hidden");
  document.getElementById("teamActions").classList.add("hidden");
});

// + Add manual unassigned player
document.getElementById("addUnassignedBtn").addEventListener("click", () => {
  const name = prompt("Enter player name:");
  if (!name) return;
  const pref = prompt("Enter preference (optional):") || "";
  addUnassignedRow(name, pref);
  checkTeamsCount();
});

// Create a single empty team slot (cell)
function createSlot() {
  const slot = document.createElement("div");
  slot.className = [
    "slot",
    "w-full", "h-24", "p-4", "select-none",
    "flex items-center justify-center",
    "border border-gray-700 rounded",
    "bg-gray-900 dropzone",
    "text-center text-gray-300"
  ].join(" ");
  slot.addEventListener("dragover", e => e.preventDefault());
  slot.addEventListener("drop", dropOnSlot);
  return slot;
}

// Generate Teams & Unassigned columns
document.getElementById("generateButton").addEventListener("click", () => {
  teamType = document.getElementById("teamTypeInput").value.trim() || "Team";
  const lines = document.getElementById("namesInput").value
    .split("\n").map(l => l.trim()).filter(Boolean);

  // Build Unassigned list
  const unassigned = document.getElementById("unassignedTable");
  unassigned.innerHTML = "";
  lines.forEach(line => {
    const [name, pref = ""] = line.split("|").map(s => s.trim());
    addUnassignedRow(name, pref);
  });

  // Build initial Team cards
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";
  const teamCount = Math.floor(lines.length / 6);
  for (let i = 0; i < teamCount; i++) {
    addTeamCard(i);
  }

  // Switch views
  document.getElementById("loadView").classList.add("hidden");
  document.getElementById("teamView").classList.remove("hidden");
  document.getElementById("teamActions").classList.remove("hidden");

  unassigned.addEventListener("dragover", e => e.preventDefault());
  unassigned.addEventListener("drop", dropToUnassigned);
});

// Helper: add row to Unassigned list
function addUnassignedRow(name, pref = "") {
  // prevent duplicates
  if (document.querySelector(`#unassignedTable [data-name="${name}"]`)) return;

  const row = document.createElement("div");
  row.className = [
    "flex flex-col bg-gray-700 rounded p-3 select-none",
    "shadow-sm cursor-grab hover:bg-gray-600 transition-colors"
  ].join(" ");
  row.draggable = true;
  row.dataset.name = name;
  row.dataset.pref = pref;
  row.innerHTML = `
    <span class="font-medium text-gray-100 truncate">${name}</span>
    <small class="text-gray-400 text-xs truncate">${pref}</small>
  `;
  row.addEventListener("dragstart", dragStartRow);
  document.getElementById("unassignedTable").appendChild(row);
}

// Drag start from Unassigned
function dragStartRow(e) {
  e.dataTransfer.setData("text/plain", JSON.stringify({
    name: e.target.dataset.name,
    pref:  e.target.dataset.pref
  }));
}

// Drop onto a team slot
function dropOnSlot(e) {
  e.preventDefault();
  const slot = e.currentTarget;
  const { name } = JSON.parse(e.dataTransfer.getData("text/plain"));

  // 1) If occupied, return old player
  const oldDiv = slot.querySelector("div");
  if (oldDiv) {
    returnToUnassigned(oldDiv.textContent.trim());
    slot.innerHTML = "";
    slot.classList.replace("bg-blue-900","bg-gray-900");
    slot.classList.replace("border-blue-500","border-gray-700");
  }

  // 2) Disable the dragged‑from Unassigned row
  const origRow = document.querySelector(`#unassignedTable [data-name="${name}"]`);
  if (origRow) {
    origRow.classList.add("opacity-40");
    origRow.draggable = false;
    origRow.removeEventListener("dragstart", dragStartRow);
  }

  // 3) Place new player into slot
  slot.innerHTML = `<div class="font-medium text-gray-100">${name}</div>`;
  slot.classList.replace("bg-gray-900","bg-blue-900");
  slot.classList.replace("border-gray-700","border-blue-500");
  slot.draggable = true;
  slot.addEventListener("dragstart", dragFromSlot);
}

// Drag a player out of a filled slot
function dragFromSlot(e) {
  const slot = e.target.closest(".slot");
  const name = slot.querySelector("div").textContent;
  e.dataTransfer.setData("text/plain", JSON.stringify({ name }));
  slot.innerHTML = "";
  slot.classList.replace("bg-blue-900","bg-gray-900");
  slot.classList.replace("border-blue-500","border-gray-700");
  returnToUnassigned(name);
}

// Drop back into Unassigned column
function dropToUnassigned(e) {
  e.preventDefault();
  const { name } = JSON.parse(e.dataTransfer.getData("text/plain"));

  // clear any filled slot containing them
  document.querySelectorAll(".slot").forEach(slot => {
    const d = slot.querySelector("div");
    if (d && d.textContent === name) {
      slot.innerHTML = "";
      slot.classList.replace("bg-blue-900","bg-gray-900");
      slot.classList.replace("border-blue-500","border-gray-700");
    }
  });
  returnToUnassigned(name);
}

// Return a player to Unassigned and re-enable
function returnToUnassigned(name) {
  if (!document.querySelector(`#unassignedTable [data-name="${name}"]`)) {
    addUnassignedRow(name,"");
  }
  const row = document.querySelector(`#unassignedTable [data-name="${name}"]`);
  if (row) {
    row.classList.remove("opacity-40");
    row.draggable = true;
    row.addEventListener("dragstart", dragStartRow);
  }
}

// Build & append a new team card (index 0 → A, 1 → B, etc)
function addTeamCard(index) {
  const letter = String.fromCharCode(65 + index);
  const container = document.getElementById("teamsContainer");

  const card = document.createElement("div");
  card.className = "w-full bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4";
  card.dataset.team = `${teamType} ${letter}`;
  card.innerHTML = `<h3 class="text-lg font-semibold text-gray-100">${teamType} ${letter}</h3>`;

  const wrapper = document.createElement("div");
  wrapper.className = "pb-4";
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-x-4 gap-y-6";
  grid.style.gridAutoRows = "5rem";
  for (let j = 0; j < 6; j++) grid.appendChild(createSlot());
  wrapper.appendChild(grid);
  card.appendChild(wrapper);

  const league = document.createElement("input");
  league.type = "text";
  league.placeholder = "League";
  league.className =
    "w-full border border-gray-700 rounded p-2 text-sm bg-gray-900 text-gray-300 focus:ring-blue-400 focus:outline-none";
  league.addEventListener("dragover", e => e.preventDefault());
  league.addEventListener("drop",     e => e.preventDefault());
  card.appendChild(league);

  container.appendChild(card);
}

// After any manual add, ensure enough teams exist
function checkTeamsCount() {
  const unassignedCount = document.querySelectorAll("#unassignedTable > div").length;
  const assignedCount   = document.querySelectorAll(".slot div").length;
  const totalPlayers    = unassignedCount + assignedCount;
  const neededTeams     = Math.ceil(totalPlayers / 6);
  const currentTeams    = document.querySelectorAll("#teamsContainer > div").length;

  for (let i = currentTeams; i < neededTeams; i++) {
    addTeamCard(i);
  }
}

// Export current teams to CSV
document.getElementById("exportBtn").addEventListener("click", () => {
  const headers = ["Team","League",...Array.from({ length:6 },(_,i)=>`Player${i+1}`)];
  const rows = [];
  document.querySelectorAll("#teamsContainer > div").forEach(card => {
    const team = card.dataset.team;
    const league = card.querySelector("input").value;
    const data = [team, league];
    card.querySelectorAll(".slot").forEach(slot => {
      const d = slot.querySelector("div");
      data.push(d ? d.textContent : "");
    });
    rows.push(data);
  });

  const csv = [headers, ...rows]
    .map(r => r.map(c=>`"${c.replace(/"/g,'""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "badminton-teams.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Global state
let teamType = "Team";
let playerCount = 0;   // total players loaded + manually added

// ← Back button
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

  // 1) Increment master count
  playerCount++;

  // 2) Add to Unassigned
  addUnassignedRow(name, pref);

  // 3) Possibly add one new team
  checkTeamsCount();
});

// Create a single empty team slot
function createSlot() {
  const slot = document.createElement("div");
  slot.className = [
    "slot", "w-full", "h-24", "p-4", "select-none",
    "flex items-center justify-center",
    "border border-gray-700 rounded",
    "bg-gray-900 dropzone",
    "text-center text-gray-300"
  ].join(" ");
  slot.addEventListener("dragover", e => e.preventDefault());
  slot.addEventListener("drop", dropOnSlot);
  return slot;
}

// Generate initial teams + unassigned
document.getElementById("generateButton").addEventListener("click", () => {
  teamType = document.getElementById("teamTypeInput").value.trim() || "Team";
  const lines = document.getElementById("namesInput").value
    .split("\n").map(l => l.trim()).filter(Boolean);

  // Set master count
  playerCount = lines.length;

  // Build Unassigned
  const unassigned = document.getElementById("unassignedTable");
  unassigned.innerHTML = "";
  lines.forEach(line => {
    const [name, pref = ""] = line.split("|").map(s => s.trim());
    addUnassignedRow(name, pref);
  });

  // Build Teams
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";
  const needed = Math.ceil(playerCount / 6);
  for (let i = 0; i < needed; i++) {
    addTeamCard(i);
  }

  // Show view
  document.getElementById("loadView").classList.add("hidden");
  document.getElementById("teamView").classList.remove("hidden");
  document.getElementById("teamActions").classList.remove("hidden");

  unassigned.addEventListener("dragover", e => e.preventDefault());
  unassigned.addEventListener("drop", dropToUnassigned);
});

// Add a row to the Unassigned list
function addUnassignedRow(name, pref = "") {
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
    name: e.target.dataset.name
  }));
}

// Drop onto a team slot
function dropOnSlot(e) {
  e.preventDefault();
  const slot = e.currentTarget;
  const { name } = JSON.parse(e.dataTransfer.getData("text/plain"));

  // If occupied, return old player
  const old = slot.querySelector("div");
  if (old) {
    returnToUnassigned(old.textContent.trim());
    slot.innerHTML = "";
    slot.classList.replace("bg-blue-900", "bg-gray-900");
    slot.classList.replace("border-blue-500", "border-gray-700");
  }

  // Disable the original Unassigned row
  const orig = document.querySelector(`#unassignedTable [data-name="${name}"]`);
  if (orig) {
    orig.classList.add("opacity-40");
    orig.draggable = false;
    orig.removeEventListener("dragstart", dragStartRow);
  }

  // Place new player
  slot.innerHTML = `<div class="font-medium text-gray-100">${name}</div>`;
  slot.classList.replace("bg-gray-900", "bg-blue-900");
  slot.classList.replace("border-gray-700", "border-blue-500");
  slot.draggable = true;
  slot.addEventListener("dragstart", dragFromSlot);
}

// Dragging from a filled slot
function dragFromSlot(e) {
  const slot = e.target.closest(".slot");
  const name = slot.querySelector("div").textContent;
  e.dataTransfer.setData("text/plain", JSON.stringify({ name }));

  slot.innerHTML = "";
  slot.classList.replace("bg-blue-900", "bg-gray-900");
  slot.classList.replace("border-blue-500", "border-gray-700");

  returnToUnassigned(name);
}

// Drop back to Unassigned
function dropToUnassigned(e) {
  e.preventDefault();
  const { name } = JSON.parse(e.dataTransfer.getData("text/plain"));

  // Clear any slot containing them
  document.querySelectorAll(".slot").forEach(slot => {
    const d = slot.querySelector("div");
    if (d && d.textContent === name) {
      slot.innerHTML = "";
      slot.classList.replace("bg-blue-900", "bg-gray-900");
      slot.classList.replace("border-blue-500", "border-gray-700");
    }
  });

  returnToUnassigned(name);
}

// Return a player to Unassigned and re-enable
function returnToUnassigned(name) {
  if (!document.querySelector(`#unassignedTable [data-name="${name}"]`)) {
    addUnassignedRow(name, "");
  }
  const row = document.querySelector(`#unassignedTable [data-name="${name}"]`);
  if (row) {
    row.classList.remove("opacity-40");
    row.draggable = true;
    row.addEventListener("dragstart", dragStartRow);
  }
}

// Add a new team card at index i (0 → A, 1 → B, etc)
function addTeamCard(i) {
  const letter = String.fromCharCode(65 + i);
  const container = document.getElementById("teamsContainer");
  const card = document.createElement("div");
  card.className = "w-full bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4";
  card.dataset.team = `${teamType} ${letter}`;
  card.innerHTML = `<h3 class="text-lg font-semibold text-gray-100">${teamType} ${letter}</h3>`;

  const wrap = document.createElement("div");
  wrap.className = "pb-4";
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-x-4 gap-y-6";
  grid.style.gridAutoRows = "5rem";
  for (let j = 0; j < 6; j++) grid.appendChild(createSlot());
  wrap.appendChild(grid);
  card.appendChild(wrap);

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

// Ensure we've created enough teams for playerCount
function checkTeamsCount() {
  const needed = Math.ceil(playerCount / 6);
  const current = document.querySelectorAll("#teamsContainer > div").length;
  for (let i = current; i < needed; i++) {
    addTeamCard(i);
  }
}

// Export to CSV
document.getElementById("exportBtn").addEventListener("click", () => {
  const headers = ["Team","League",...Array.from({length:6},(_,i)=>`Player${i+1}`)];
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

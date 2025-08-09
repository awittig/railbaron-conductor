(function() {
  'use strict';

  if (typeof window.cities === 'undefined' || typeof window.findPayout === 'undefined') {
    alert('Error: City/payout data failed to load. Please ensure payouts.js is available.');
    return;
  }

  // ----- Data enrichment -----
  // cities array and findPayout are provided by payouts.js
  const idToCity = new Map();
  for (const c of cities) {
    idToCity.set(c.id, { id: c.id, name: c.name, region: null });
  }
  // Enrich with region using BOXCARS tables
  const idToRegion = new Map();
  for (const [regionName, ids] of Object.entries(BOXCARS.CITY_IDS_BY_REGION)) {
    for (const id of ids) idToRegion.set(id, regionName);
  }
  for (const [id, c] of idToCity) {
    c.region = idToRegion.get(id) || 'Unknown';
  }
  const enrichedCities = Array.from(idToCity.values());
  enrichedCities.sort((a, b) => a.name.localeCompare(b.name));

  // ----- State management -----
  const STORAGE_KEY = 'rb_conductor_state_v2';

  /** @typedef {{ cityId: number|null, payoutFromPrev: number|null, unreachable: boolean, lastRollText: string }} Stop */
  /** @typedef {{ id: string, name: string, color: string, train: 'Standard'|'Express'|'Super Chief', stops: Stop[], collapsed: boolean, homeCityId?: number|null, visitedCityIds?: number[] }} Player */

  /** @type {{ players: Player[] }} */
  let state = { players: [] };

  function uuid() {
    return 'p-' + Math.random().toString(36).slice(2, 9);
  }

  function defaultPlayer() {
    return {
      id: uuid(),
      name: 'Player',
      color: 'black',
      train: 'Standard',
      stops: [defaultStop()],
      collapsed: false,
    };
  }

  function defaultStop() {
    return { cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return;
      state.players = parsed.players.map((p) => ({
        id: String(p.id || uuid()),
        name: String(p.name || 'Player'),
        color: ['black','red','blue','green','white','yellow'].includes(String(p.color)) ? String(p.color) : 'black',
        train: p.train === 'Express' || p.train === 'Super Chief' ? p.train : 'Standard',
        collapsed: !!p.collapsed,
        stops: Array.isArray(p.stops) && p.stops.length ? p.stops.map((s) => ({
          cityId: s.cityId ?? null,
          payoutFromPrev: null,
          unreachable: !!s.unreachable,
          lastRollText: String(s.lastRollText || ''),
        })) : [defaultStop()],
      }));
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  // ----- Payouts and recomputation -----
  function computePayout(prevCityId, currCityId) {
    if (!prevCityId || !currCityId) return null;
    const amount = findPayout(prevCityId, currCityId);
    return typeof amount === 'number' ? amount : null;
  }

  function formatCurrency(amt) {
    if (amt == null) return '';
    return '$' + amt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function recomputeAllPayouts(player) {
    const stops = player.stops;
    for (let i = 0; i < stops.length; i++) {
      const curr = stops[i];
      const prev = stops[i + 1]; // older stop is next in the list (newest at top)
      curr.payoutFromPrev = computePayout(prev?.cityId || null, curr.cityId || null);
    }
    updateDerivedFields(player);
  }

  function getCurrentRegion(player) {
    const latest = player.stops.find((s) => s.cityId);
    if (!latest) return null;
    const c = idToCity.get(latest.cityId);
    return c?.region || null;
  }

  function updateDerivedFields(player) {
    const visited = player.stops.map((s) => s.cityId).filter(Boolean);
    player.visitedCityIds = visited;
    // Home city is first stop with a city chronologically (oldest): last in array
    let home = null;
    for (let i = player.stops.length - 1; i >= 0; i--) {
      const cid = player.stops[i].cityId;
      if (cid) { home = cid; break; }
    }
    player.homeCityId = home;
  }

  // ----- Rendering -----
  const playersRoot = document.getElementById('players');
  const tplPlayerCard = document.getElementById('tpl-player-card');
  const tplStopItem = document.getElementById('tpl-stop-item');

  // Only the six player colors used in Rail Baron
  const colorOptions = ['black','red','blue','green','white','yellow'];

  function render() {
    playersRoot.innerHTML = '';
    state.players.forEach((player, idx) => {
      const card = renderPlayerCard(player, idx);
      playersRoot.appendChild(card);
    });
    bindDragAndDrop();
  }

  function renderPlayerCard(player, index) {
    const node = tplPlayerCard.content.firstElementChild.cloneNode(true);
    node.dataset.playerId = player.id;
    node.classList.toggle('collapsed', !!player.collapsed);
    node.style.setProperty('--accent', colorToken(player.color));
    node.setAttribute('draggable', 'true');

    const nameInput = node.querySelector('.player-name');
    nameInput.value = player.name;
    nameInput.addEventListener('input', () => {
      player.name = nameInput.value;
      saveState();
    });

    // Toolbar: color cycle
    const colorBtn = node.querySelector('.btn-color');
    const applyAccent = () => colorBtn && colorBtn.style.setProperty('background', colorToken(player.color));
    applyAccent();
    colorBtn.addEventListener('click', () => {
      const idx = (colorOptions.indexOf(player.color) + 1) % colorOptions.length;
      player.color = colorOptions[idx];
      node.style.setProperty('--accent', colorToken(player.color));
      applyAccent();
      saveState();
    });

    // Train bubbles
    const bubbleGroup = node.querySelector('.train-bubbles');
    const updateBubbles = () => {
      bubbleGroup.querySelectorAll('.bubble').forEach((b) => {
        const val = b.dataset.value;
        const checked = val === player.train;
        b.dataset.checked = checked ? 'true' : 'false';
        const input = b.querySelector('input[type="radio"]');
        if (input) input.checked = checked;
      });
    };
    bubbleGroup.addEventListener('click', (e) => {
      const label = e.target.closest('.bubble');
      if (!label) return;
      const val = label.dataset.value;
      if (val && val !== player.train) {
        player.train = val;
        saveState();
        updateBubbles();
      }
    });
    updateBubbles();

    node.querySelector('.btn-collapse').addEventListener('click', () => {
      player.collapsed = !player.collapsed;
      saveState();
      render();
    });
    node.querySelector('.btn-up').addEventListener('click', () => movePlayer(index, -1));
    node.querySelector('.btn-down').addEventListener('click', () => movePlayer(index, +1));
    node.querySelector('.btn-delete').addEventListener('click', () => deletePlayer(player.id));

    // Stops
    const stopsRoot = node.querySelector('.stop-list');
    stopsRoot.innerHTML = '';
    recomputeAllPayouts(player);
    player.stops.forEach((stop, stopIdx) => {
      const stopNode = renderStopItem(player, stop, stopIdx);
      stopsRoot.appendChild(stopNode);
    });

    node.querySelector('.btn-add-stop').addEventListener('click', () => {
      player.stops.unshift(defaultStop());
      saveState();
      render();
    });

    node.querySelector('.btn-roll-stop').addEventListener('click', () => {
      rollNextStop(player, node);
    });

    // Last roll indicator shows on header (last stop's roll)
    const lastRollText = player._pendingRollText || player.stops[0]?.lastRollText || '';
    node.querySelector('.last-roll').textContent = lastRollText;

    return node;
  }

  function renderStopItem(player, stop, stopIdx) {
    const node = tplStopItem.content.firstElementChild.cloneNode(true);
    node.dataset.stopIndex = String(stopIdx);
    node.classList.toggle('unreachable', !!stop.unreachable);

    // City select
    const citySelect = node.querySelector('.stop-city');
    citySelect.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Select City —';
    citySelect.appendChild(blank);
    for (const c of enrichedCities) {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = `${c.name} (${c.region})`;
      if (stop.cityId === c.id) opt.selected = true;
      citySelect.appendChild(opt);
    }
    citySelect.addEventListener('change', () => {
      stop.cityId = citySelect.value ? Number(citySelect.value) : null;
      recomputeAllPayouts(player);
      saveState();
      render();
    });

    // Payout
    const payoutSpan = node.querySelector('.payout');
    payoutSpan.textContent = formatCurrency(stop.payoutFromPrev);

    // Unreachable
    const unreachableCheckbox = node.querySelector('.stop-unreachable');
    unreachableCheckbox.checked = !!stop.unreachable;
    unreachableCheckbox.addEventListener('change', () => {
      stop.unreachable = unreachableCheckbox.checked;
      saveState();
      render();
    });

    // Delete stop
    node.querySelector('.btn-delete-stop').addEventListener('click', () => {
      player.stops.splice(stopIdx, 1);
      if (player.stops.length === 0) player.stops.push(defaultStop());
      recomputeAllPayouts(player);
      saveState();
      render();
    });

    // Roll text
    node.querySelector('.roll-text').textContent = stop.lastRollText || '';

    return node;
  }

  function movePlayer(index, delta) {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= state.players.length) return;
    const [p] = state.players.splice(index, 1);
    state.players.splice(newIndex, 0, p);
    saveState();
    render();
  }

  function deletePlayer(playerId) {
    const p = state.players.find((x) => x.id === playerId);
    if (!p) return;
    if (!confirm(`Delete player "${p.name}" and all their stops?`)) return;
    state.players = state.players.filter((x) => x.id !== playerId);
    saveState();
    render();
  }

  function colorToken(colorName) {
    return `var(--${colorName}, var(--teal))`;
  }

  // ----- Rolling logic -----
  function rollNextStop(player, cardNode) {
    const oe1 = BOXCARS.rollOddEven();
    const s1 = BOXCARS.roll2d6();
    let region = BOXCARS.mapRegion(oe1, s1);

    const currentRegion = getCurrentRegion(player);
    if (currentRegion && region === currentRegion) {
      // Operator may choose any region instead
      const choice = prompt(
        `Rolled ${oe1}+${s1} → ${region}. You may choose any region instead.\nEnter region name or leave blank to keep:`,
        region
      );
      if (choice && BOXCARS.CITY_IDS_BY_REGION[choice]) region = choice;
    }

    const oe2 = BOXCARS.rollOddEven();
    const s2 = BOXCARS.roll2d6();
    const cityId = BOXCARS.pickCityDeterministic(region, oe2, s2);
    const cityName = idToCity.get(cityId)?.name || '—';

    const rollText = `${capitalize(oe1)}+${s1} → ${region}; ${capitalize(oe2)}+${s2} → ${cityName}.`;

    // Automatically apply the rolled stop
    const newStop = defaultStop();
    newStop.cityId = cityId;
    newStop.lastRollText = rollText;
    player.stops.unshift(newStop);
    player._pendingRollText = '';
    recomputeAllPayouts(player);
    saveState();
    render();
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ----- Stats -----
  function computeStats(includeUnreachable) {
    const rows = state.players.map((p) => {
      const legs = p.stops.filter((s, idx) => {
        if (idx === p.stops.length - 1) return false; // last has no previous
        if (s.cityId == null || p.stops[idx + 1].cityId == null) return false;
        if (!includeUnreachable && s.unreachable) return false;
        return true;
      });
      const totalPayout = legs.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
      const uniqueCities = new Set(p.stops.map((s) => s.cityId).filter(Boolean)).size;
      return {
        playerId: p.id,
        name: p.name,
        legsCount: legs.length,
        totalPayout,
        uniqueCities,
      };
    });
    const totals = rows.reduce(
      (acc, r) => {
        acc.legsCount += r.legsCount;
        acc.totalPayout += r.totalPayout;
        acc.uniqueCities += r.uniqueCities; // note: not truly unique across players, shown as sum
        return acc;
      },
      { legsCount: 0, totalPayout: 0, uniqueCities: 0 }
    );
    return { rows, totals };
  }

  function renderStatsTable(includeUnreachable) {
    const wrap = document.getElementById('stats-table-wrap');
    const { rows, totals } = computeStats(includeUnreachable);
    const table = document.createElement('table');
    table.className = 'stats-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Player</th>
          <th>Completed legs</th>
          <th>Total payouts</th>
          <th>Unique cities</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${r.legsCount}</td>
            <td>${formatCurrency(r.totalPayout)}</td>
            <td>${r.uniqueCities}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>Totals</td>
          <td>${totals.legsCount}</td>
          <td>${formatCurrency(totals.totalPayout)}</td>
          <td>${totals.uniqueCities}</td>
        </tr>
      </tfoot>
    `;
    wrap.innerHTML = '';
    wrap.appendChild(table);
  }

  function exportCSV(includeUnreachable) {
    const { rows } = computeStats(includeUnreachable);
    const header = ['Player','Completed legs','Total payouts','Unique cities'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        csvEscape(r.name),
        r.legsCount,
        r.totalPayout,
        r.uniqueCities,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railbaron-stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvEscape(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ----- Import/Export/New Game -----
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railbaron-state.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.players)) throw new Error('Invalid file');
        if (!confirm('Importing will replace the current game state. Continue?')) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        loadState();
        render();
      } catch (e) {
        alert('Import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function newGame() {
    if (!confirm('Start a new game? This will clear all players and stops.')) return;
    state = { players: [] };
    saveState();
    render();
  }

  // ----- Global controls -----
  function bindGlobalControls() {
    document.getElementById('btn-add-player').addEventListener('click', () => {
      state.players.push(defaultPlayer());
      saveState();
      render();
    });

    document.getElementById('btn-new').addEventListener('click', newGame);

    document.getElementById('btn-export').addEventListener('click', exportJSON);

    const fileInput = document.getElementById('file-import');
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) importJSON(file);
      fileInput.value = '';
    });

    const statsDialog = document.getElementById('stats-dialog');
    const includeUnreachable = document.getElementById('toggle-include-unreachable');
    document.getElementById('btn-stats').addEventListener('click', () => {
      includeUnreachable.checked = false;
      renderStatsTable(false);
      statsDialog.showModal();
    });
    document.getElementById('btn-close-stats').addEventListener('click', () => statsDialog.close());
    // Close on backdrop click
    statsDialog.addEventListener('click', (e) => {
      const rect = statsDialog.getBoundingClientRect();
      const inDialog = (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      );
      if (!inDialog) statsDialog.close();
    });
    includeUnreachable.addEventListener('change', () => renderStatsTable(includeUnreachable.checked));
    document.getElementById('btn-export-csv').addEventListener('click', (e) => {
      e.preventDefault();
      exportCSV(includeUnreachable.checked);
    });
  }

  // Drag-and-drop reordering
  function bindDragAndDrop() {
    const cards = Array.from(playersRoot.querySelectorAll('.player-card'));
    let dragId = null;
    cards.forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        dragId = card.dataset.playerId;
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = card.dataset.playerId;
        if (!dragId || dragId === targetId) return;
        const fromIdx = state.players.findIndex((p) => p.id === dragId);
        const toIdx = state.players.findIndex((p) => p.id === targetId);
        if (fromIdx < 0 || toIdx < 0) return;
        const [p] = state.players.splice(fromIdx, 1);
        state.players.splice(toIdx, 0, p);
        saveState();
        render();
      });
    });
  }

  // ----- Init -----
  function ensureDefaultPlayers() {
    if (state.players.length === 0) {
      state.players.push(defaultPlayer());
      state.players.push(defaultPlayer());
    }
  }

  loadState();
  ensureDefaultPlayers();
  bindGlobalControls();
  render();
})();



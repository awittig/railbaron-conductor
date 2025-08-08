(function() {
  // Ensure payouts.js is loaded providing `cities` and `findPayout(a,b)`
  if (typeof cities === 'undefined' || typeof findPayout === 'undefined') {
    alert('Data file missing. Ensure payouts.js is available.');
    return;
  }

  // Utilities
  const currency = (n) => n == null ? '—' : '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const byName = (a, b) => a.name.localeCompare(b.name);
  const cityById = (id) => cities[id - 1];

  // State
  const state = {
    players: []
  };

  // Persistence
  const STORAGE_KEY = 'rb_v2_state';
  function save() {
    const toPersist = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, toPersist);
  }
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players)) {
        state.players = parsed.players.map(hydratePlayer);
      }
    } catch (_) {
      // ignore
    }
  }

  // Models
  function newPlayer() {
    const id = crypto.randomUUID();
    return {
      id,
      name: 'Player',
      color: ['red','blue','green','yellow','purple','cyan','gray'][state.players.length % 7],
      train: 'Standard',
      homeCityId: null,
      visitedCityIds: [],
      stops: [{ cityId: null, payoutFromPrev: null, unreachable: false }] // start with first stop for Home
    };
  }
  function hydratePlayer(p) {
    p.stops = Array.isArray(p.stops) ? p.stops : [{ cityId: null, payoutFromPrev: null, unreachable: false }];
    p.visitedCityIds = Array.isArray(p.visitedCityIds) ? p.visitedCityIds : [];
    p.train = p.train || 'Standard';
    return p;
  }

  // DOM
  const playersContainer = document.getElementById('playersContainer');
  const addPlayerBtn = document.getElementById('addPlayerBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const statsBtn = document.getElementById('statsBtn');
  const statsModal = document.getElementById('statsModal');
  const closeStatsBtn = document.getElementById('closeStatsBtn');
  const perPlayerStats = document.getElementById('perPlayerStats');
  const overallStats = document.getElementById('overallStats');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');

  const sortedCities = [...cities].sort(byName);

  function render() {
    playersContainer.innerHTML = '';
    state.players.forEach((player, index) => {
      playersContainer.appendChild(renderPlayerCard(player, index));
    });
  }

  function renderPlayerCard(player, index) {
    const root = document.createElement('div');
    root.className = 'player-card';
    root.dataset.color = player.color;
    root.setAttribute('draggable', 'true');
    root.setAttribute('aria-grabbed', 'false');

    // DnD handlers for reordering
    root.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', player.id);
      e.dataTransfer.effectAllowed = 'move';
      root.style.opacity = '0.6';
    });
    root.addEventListener('dragend', () => {
      root.style.opacity = '';
    });
    root.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    root.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === player.id) return;
      const fromIdx = state.players.findIndex(p => p.id === draggedId);
      const toIdx = index;
      if (fromIdx < 0) return;
      const [moved] = state.players.splice(fromIdx, 1);
      state.players.splice(toIdx, 0, moved);
      save();
      render();
    });

    const colorBar = document.createElement('div');
    colorBar.className = 'player-color';

    const main = document.createElement('div');
    main.className = 'player-main';

    const controls = document.createElement('div');
    controls.className = 'controls';

    // Row: name and color select
    const row1 = document.createElement('div');
    row1.className = 'player-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = player.name;
    nameInput.placeholder = 'Name';
    nameInput.addEventListener('input', () => { player.name = nameInput.value; save(); });

    const colorSelect = document.createElement('select');
    for (const col of ['red','blue','green','yellow','purple','cyan','gray']) {
      const opt = document.createElement('option');
      opt.value = col;
      opt.textContent = col.charAt(0).toUpperCase() + col.slice(1);
      if (player.color === col) opt.selected = true;
      colorSelect.appendChild(opt);
    }
    colorSelect.addEventListener('change', () => { player.color = colorSelect.value; root.dataset.color = player.color; save(); });

    row1.appendChild(nameInput);
    row1.appendChild(colorSelect);

    // Row: train selector + keyboard reorder
    const rowTrain = document.createElement('div');
    rowTrain.className = 'player-row';

    const trainSelect = document.createElement('select');
    for (const t of ['Standard','Express','Super Chief']) {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (player.train === t) opt.selected = true;
      trainSelect.appendChild(opt);
    }
    trainSelect.addEventListener('change', () => { player.train = trainSelect.value; save(); });

    const reorderWrap = document.createElement('div');
    reorderWrap.style.display = 'flex';
    reorderWrap.style.gap = '6px';
    const upBtn = document.createElement('button');
    upBtn.className = 'btn';
    upBtn.textContent = '▲';
    upBtn.title = 'Move up';
    upBtn.addEventListener('click', () => movePlayer(index, -1));
    const downBtn = document.createElement('button');
    downBtn.className = 'btn';
    downBtn.textContent = '▼';
    downBtn.title = 'Move down';
    downBtn.addEventListener('click', () => movePlayer(index, +1));
    reorderWrap.appendChild(upBtn);
    reorderWrap.appendChild(downBtn);

    rowTrain.appendChild(trainSelect);
    rowTrain.appendChild(reorderWrap);

    // Stops
    const stopsWrap = document.createElement('div');
    stopsWrap.className = 'player-stops';

    const addStopBtn = document.createElement('button');
    addStopBtn.textContent = 'Add Stop';
    addStopBtn.className = 'btn btn-primary';
    addStopBtn.addEventListener('click', () => {
      // Offer destination roller choice
      const nextId = rollDestination(player);
      if (nextId) {
        appendStop(player, nextId);
      } else {
        player.stops.push({ cityId: null, payoutFromPrev: null, unreachable: false });
      }
      save();
      render();
    });

    // build each stop row
    player.stops.forEach((stop, sIndex) => {
      const row = document.createElement('div');
      row.className = 'stop-row';

      const stopSelect = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = sIndex === 0 ? 'First stop (sets Home)' : 'Next stop';
      stopSelect.appendChild(blank);
      for (const c of sortedCities) {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.name;
        if (stop.cityId === c.id) opt.selected = true;
        stopSelect.appendChild(opt);
      }

      stopSelect.addEventListener('change', () => {
        stop.cityId = stopSelect.value ? Number(stopSelect.value) : null;
        if (sIndex === 0 && stop.cityId && !player.homeCityId) {
          player.homeCityId = stop.cityId;
        }
        if (stop.cityId && !player.visitedCityIds.includes(stop.cityId)) {
          player.visitedCityIds.push(stop.cityId);
        }
        if (sIndex > 0) {
          const prev = player.stops[sIndex - 1];
          stop.payoutFromPrev = (prev && prev.cityId && stop.cityId) ? findPayout(prev.cityId, stop.cityId) : null;
        } else {
          stop.payoutFromPrev = null;
        }
        save();
        render();
      });

      const payoutCell = document.createElement('div');
      payoutCell.className = 'money';
      payoutCell.textContent = currency(stop.payoutFromPrev);

      const rowActions = document.createElement('div');
      rowActions.className = 'stop-actions';

      const rollerBtn = document.createElement('button');
      rollerBtn.textContent = 'Roll';
      rollerBtn.className = 'btn';
      rollerBtn.title = 'Suggest a random destination';
      rollerBtn.addEventListener('click', () => {
        const id = rollDestination(player, stop.cityId);
        if (!id) return;
        if (sIndex === player.stops.length - 1 && stop.cityId == null) {
          // fill current empty row if last
          stop.cityId = id;
          // compute payout from previous
          if (sIndex > 0) {
            const prev = player.stops[sIndex - 1];
            stop.payoutFromPrev = (prev && prev.cityId && stop.cityId) ? findPayout(prev.cityId, stop.cityId) : null;
          }
        } else {
          appendStop(player, id);
        }
        save();
        render();
      });

      const unreachableBtn = document.createElement('button');
      unreachableBtn.textContent = '⛔';
      unreachableBtn.className = 'btn btn-ghost btn-icon';
      unreachableBtn.title = 'Toggle unreachable';
      unreachableBtn.setAttribute('aria-label', 'Toggle unreachable');
      if (stop.unreachable) unreachableBtn.classList.add('is-active');
      unreachableBtn.addEventListener('click', () => {
        stop.unreachable = !stop.unreachable;
        unreachableBtn.classList.toggle('is-active', stop.unreachable);
        save();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.className = 'btn btn-ghost btn-icon';
      deleteBtn.title = 'Delete stop';
      deleteBtn.setAttribute('aria-label', 'Delete stop');
      deleteBtn.addEventListener('click', () => {
        player.stops.splice(sIndex, 1);
        for (let i = 1; i < player.stops.length; i++) {
          const prev = player.stops[i - 1];
          const cur = player.stops[i];
          cur.payoutFromPrev = (prev.cityId && cur.cityId) ? findPayout(prev.cityId, cur.cityId) : null;
        }
        save();
        render();
      });

      rowActions.appendChild(rollerBtn);
      rowActions.appendChild(unreachableBtn);
      rowActions.appendChild(deleteBtn);

      row.appendChild(stopSelect);
      row.appendChild(payoutCell);
      row.appendChild(rowActions);

      if (sIndex === player.stops.length - 1) {
        const addWrap = document.createElement('div');
        addWrap.appendChild(addStopBtn);
        row.appendChild(addWrap);
      } else {
        const spacer = document.createElement('div');
        row.appendChild(spacer);
      }

      stopsWrap.appendChild(row);
    });

    // Visited cities display
    const visited = document.createElement('div');
    visited.className = 'visited-list';
    const uniqueVisited = [...new Set(player.visitedCityIds)].map(id => cityById(id)).filter(Boolean).sort(byName);
    uniqueVisited.forEach(c => {
      const tag = document.createElement('span');
      tag.className = 'visited-item';
      tag.textContent = c.name;
      visited.appendChild(tag);
    });

    // Badges row
    const badges = document.createElement('div');
    badges.className = 'badges';
    const homeBadge = document.createElement('span');
    homeBadge.className = 'badge';
    homeBadge.textContent = player.homeCityId ? `Home: ${cityById(player.homeCityId).name}` : 'Home: —';

    const tripTotal = player.stops.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
    const tripBadge = document.createElement('span');
    tripBadge.className = 'badge';
    tripBadge.textContent = `Trip: ${currency(tripTotal)}`;

    const trainBadge = document.createElement('span');
    trainBadge.className = 'badge';
    trainBadge.textContent = `Train: ${player.train}`;

    badges.appendChild(homeBadge);
    badges.appendChild(trainBadge);
    badges.appendChild(tripBadge);

    // Player controls
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'btn btn-danger';
    removeBtn.addEventListener('click', () => {
      if (!confirm(`Remove ${player.name}?`)) return;
      state.players = state.players.filter(p => p.id !== player.id);
      save();
      render();
    });

    controls.appendChild(removeBtn);

    main.appendChild(row1);
    main.appendChild(rowTrain);
    main.appendChild(badges);
    main.appendChild(stopsWrap);
    main.appendChild(visited);

    root.appendChild(colorBar);
    root.appendChild(main);
    root.appendChild(controls);

    return root;
  }

  function movePlayer(index, delta) {
    const to = index + delta;
    if (to < 0 || to >= state.players.length) return;
    const [moved] = state.players.splice(index, 1);
    state.players.splice(to, 0, moved);
    save();
    render();
  }

  function appendStop(player, newCityId) {
    const prev = player.stops[player.stops.length - 1];
    const payout = (prev && prev.cityId) ? findPayout(prev.cityId, newCityId) : null;
    player.stops.push({ cityId: newCityId, payoutFromPrev: payout, unreachable: false });
    if (!player.visitedCityIds.includes(newCityId)) player.visitedCityIds.push(newCityId);
  }

  // Destination roller utility
  function rollDestination(player, excludeId) {
    const allIds = cities.map(c => c.id);
    const visitedSet = new Set(player.visitedCityIds);
    const last = player.stops[player.stops.length - 1];
    const lastId = last && last.cityId ? last.cityId : null;

    // Prefer cities not yet visited; avoid current lastId and excludeId; avoid Home unless confirmed
    let candidates = allIds.filter(id => id !== lastId && id !== excludeId);
    const unvisited = candidates.filter(id => !visitedSet.has(id));
    const pool = unvisited.length > 0 ? unvisited : candidates;
    if (pool.length === 0) return null;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (player.homeCityId && pick === player.homeCityId) {
      const ok = confirm('Rolled your Home city. Use it?');
      if (!ok) return null;
    }
    return pick;
  }

  // Stats modal
  const statsModal = document.getElementById('statsModal');
  const closeStatsBtn = document.getElementById('closeStatsBtn');
  const perPlayerStats = document.getElementById('perPlayerStats');
  const overallStats = document.getElementById('overallStats');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');

  function openStats() {
    populateStats();
    statsModal.classList.remove('hidden');
  }
  function closeStats() {
    statsModal.classList.add('hidden');
  }
  function populateStats() {
    // per-player rows
    perPlayerStats.innerHTML = '';
    const rows = state.players.map(p => {
      const stops = p.stops.filter(s => s.cityId);
      const visited = new Set(p.visitedCityIds).size;
      const legs = stops.slice(1); // legs have a payout from previous
      const total = legs.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
      const avg = legs.length ? Math.round(total / legs.length) : 0;
      const longest = legs.reduce((m, s) => Math.max(m, s.payoutFromPrev || 0), 0);
      const last3 = legs.slice(-3).map(s => currency(s.payoutFromPrev || 0)).join(', ');
      return { p, stopsCount: stops.length, visited, total, avg, longest, last3 };
    });

    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(r.p.name)}</td>
        <td>${escapeHtml(r.p.train)}</td>
        <td>${r.stopsCount}</td>
        <td>${r.visited}</td>
        <td>${currency(r.total)}</td>
        <td>${currency(r.avg)}</td>
        <td>${currency(r.longest)}</td>
        <td>${r.last3 || '—'}</td>
      `;
      perPlayerStats.appendChild(tr);
    }

    // overall stats
    const allLegs = state.players.flatMap(p => p.stops.slice(1));
    const totalAll = allLegs.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
    const cityVisitCounts = new Map();
    state.players.forEach(p => p.visitedCityIds.forEach(id => {
      cityVisitCounts.set(id, (cityVisitCounts.get(id) || 0) + 1);
    }));
    const topCities = [...cityVisitCounts.entries()]
      .sort((a,b) => b[1] - a[1])
      .slice(0,5)
      .map(([id,count]) => `${escapeHtml(cityById(id).name)} (${count})`)
      .join(', ');
    overallStats.innerHTML = `
      <div><strong>Total Trip Payout (all players):</strong> ${currency(totalAll)}</div>
      <div><strong>Most-visited cities:</strong> ${topCities || '—'}</div>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function downloadCsv() {
    const header = ['Player','Train','Stops','Visited','Total','Avg/Leg','Longest'];
    const lines = [header.join(',')];
    state.players.forEach(p => {
      const stops = p.stops.filter(s => s.cityId);
      const legs = stops.slice(1);
      const total = legs.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
      const avg = legs.length ? Math.round(total / legs.length) : 0;
      const longest = legs.reduce((m, s) => Math.max(m, s.payoutFromPrev || 0), 0);
      const row = [p.name, p.train, stops.length, new Set(p.visitedCityIds).size, total, avg, longest]
        .map(v => String(v).replace(/"/g,'""'))
        .map(v => /[",\n]/.test(v) ? `"${v}"` : v)
        .join(',');
      lines.push(row);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railbaron-stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Events
  addPlayerBtn.addEventListener('click', () => {
    state.players.push(newPlayer());
    save();
    render();
  });

  newGameBtn.addEventListener('click', () => {
    if (!confirm('Start a new game? This will clear all local data.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state.players = [];
    render();
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railbaron-helper-state.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.players)) throw new Error('Invalid file');
      state.players = parsed.players.map(hydratePlayer);
      save();
      render();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      importFile.value = '';
    }
  });

  const statsBtn = document.getElementById('statsBtn');
  statsBtn.addEventListener('click', openStats);
  closeStatsBtn.addEventListener('click', closeStats);
  statsModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeStats(); });
  downloadCsvBtn.addEventListener('click', downloadCsv);

  // Init
  load();
  if (state.players.length === 0) {
    state.players = [newPlayer(), newPlayer()];
  }
  render();
})(); 
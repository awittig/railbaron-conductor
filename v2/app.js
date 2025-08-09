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
  const playerColors = ['red','blue','green','yellow','purple','cyan','gray'];
  const colorHex = { red:'#d83a3a', blue:'#2f6fed', green:'#27a36a', yellow:'#d0b234', purple:'#8a56e2', cyan:'#20bebe', gray:'#5f697a' };

  // State
  const state = {
    players: []
  };

  // Persistence
  const STORAGE_KEY = 'rb_v2_state';
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players)) state.players = parsed.players.map(hydratePlayer);
    } catch (_) {}
  }

  // Models
  function newPlayer() {
    const id = crypto.randomUUID();
    return {
      id,
      name: 'Player',
      color: playerColors[state.players.length % playerColors.length],
      train: 'Standard',
      collapsed: false,
      stopLayout: 'horizontal',
      homeCityId: null,
      visitedCityIds: [],
      stops: [{ cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' }]
    };
  }
  function hydratePlayer(p) {
    p.stops = Array.isArray(p.stops) ? p.stops : [{ cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' }];
    p.stops.forEach(s => { if (typeof s.lastRollText !== 'string') s.lastRollText = ''; });
    p.visitedCityIds = Array.isArray(p.visitedCityIds) ? p.visitedCityIds : [];
    p.train = p.train || 'Standard';
    if (typeof p.collapsed !== 'boolean') p.collapsed = false;
    if (p.stopLayout !== 'horizontal' && p.stopLayout !== 'vertical') p.stopLayout = 'horizontal';
    if (!playerColors.includes(p.color)) p.color = 'gray';
    return p;
  }

  // DOM refs
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
    state.players.forEach((player, index) => playersContainer.appendChild(renderPlayerCard(player, index)));
  }

  function renderPlayerCard(player, index) {
    const root = document.createElement('div');
    root.className = 'player-card';
    root.dataset.color = player.color;
    root.setAttribute('draggable', 'true');
    root.setAttribute('aria-grabbed', 'false');
    root.classList.toggle('is-collapsed', !!player.collapsed);
    root.classList.toggle('layout-vertical', pLayoutIsVertical(player));

    root.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', player.id); e.dataTransfer.effectAllowed = 'move'; root.style.opacity = '0.6'; });
    root.addEventListener('dragend', () => { root.style.opacity = ''; });
    root.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    root.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === player.id) return;
      const fromIdx = state.players.findIndex(p => p.id === draggedId);
      const toIdx = index;
      if (fromIdx < 0) return;
      const [moved] = state.players.splice(fromIdx, 1); state.players.splice(toIdx, 0, moved); save(); render();
    });

    const colorBar = document.createElement('div');
    colorBar.className = 'player-color';

    const main = document.createElement('div');
    main.className = 'player-main';

    const controls = document.createElement('div');
    controls.className = 'controls';

    // Controls panel: [color][remove][up][down][collapse]
    const colorBtn = document.createElement('button');
    colorBtn.className = 'btn btn-ghost btn-icon control-icon';
    colorBtn.title = 'Change color';
    colorBtn.textContent = '●';
    colorBtn.style.color = colorHex[player.color] || '#8aa0c1';
    colorBtn.addEventListener('click', () => {
      const idx = playerColors.indexOf(player.color);
      const next = playerColors[(idx + 1) % playerColors.length];
      player.color = next;
      root.dataset.color = next;
      colorBtn.style.color = colorHex[next] || '#8aa0c1';
      save();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost btn-icon control-icon';
    removeBtn.title = 'Remove player';
    removeBtn.textContent = '🗑';
    removeBtn.addEventListener('click', () => {
      if (!confirm(`Remove ${player.name}?`)) return;
      state.players = state.players.filter(p => p.id !== player.id);
      save(); render();
    });

    const upBtn = document.createElement('button');
    upBtn.className = 'btn btn-ghost btn-icon control-icon';
    upBtn.title = 'Move up';
    upBtn.textContent = '▲';
    upBtn.addEventListener('click', () => movePlayer(index, -1));

    const downBtn = document.createElement('button');
    downBtn.className = 'btn btn-ghost btn-icon control-icon';
    downBtn.title = 'Move down';
    downBtn.textContent = '▼';
    downBtn.addEventListener('click', () => movePlayer(index, +1));

    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'btn btn-ghost btn-icon control-icon';
    const setLayoutIcon = () => { layoutBtn.textContent = player.stopLayout === 'vertical' ? '☰' : '⇄'; layoutBtn.title = 'Toggle stop layout'; };
    setLayoutIcon();
    layoutBtn.addEventListener('click', () => {
      player.stopLayout = (player.stopLayout === 'horizontal') ? 'vertical' : 'horizontal';
      setLayoutIcon();
      root.classList.toggle('layout-vertical', pLayoutIsVertical(player));
      save();
    });

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'btn btn-ghost btn-icon control-icon';
    const updateCollapseIcon = () => { collapseBtn.textContent = player.collapsed ? '▸' : '▾'; collapseBtn.title = player.collapsed ? 'Expand' : 'Collapse'; };
    updateCollapseIcon();
    collapseBtn.addEventListener('click', () => { player.collapsed = !player.collapsed; updateCollapseIcon(); save(); render(); });

    controls.appendChild(colorBtn);
    controls.appendChild(removeBtn);
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(layoutBtn);
    controls.appendChild(collapseBtn);

    // Row: player name (larger)
    const row1 = document.createElement('div');
    row1.className = 'player-row';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = player.name;
    nameInput.placeholder = 'Name';
    nameInput.className = 'player-name';
    nameInput.addEventListener('input', () => { player.name = nameInput.value; save(); });

    // Collapsed summary (destination + payout)
    const collapsedSummary = document.createElement('span');
    collapsedSummary.className = 'collapsed-summary';
    collapsedSummary.textContent = getCollapsedSummary(player);

    row1.appendChild(nameInput);
    row1.appendChild(collapsedSummary);

    // Row: train segmented selector
    const rowTrain = document.createElement('div');
    rowTrain.className = 'player-row';
    const trainGroup = document.createElement('div');
    trainGroup.className = 'train-segmented';
    ['Standard','Express','Super Chief'].forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'seg-btn' + (player.train === t ? ' is-active' : '');
      btn.textContent = t;
      btn.setAttribute('aria-pressed', player.train === t ? 'true' : 'false');
      btn.addEventListener('click', () => {
        player.train = t;
        Array.from(trainGroup.children).forEach(ch => { ch.classList.remove('is-active'); ch.setAttribute('aria-pressed','false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed','true');
        save();
      });
      trainGroup.appendChild(btn);
    });
    rowTrain.appendChild(trainGroup);

    // Stops
    const stopsWrap = document.createElement('div');
    stopsWrap.className = 'player-stops';

    player.stops.forEach((stop, sIndex) => {
      const row = document.createElement('div');
      row.className = 'stop-row';
      if (stop.unreachable) row.classList.add('is-unreachable');

      const stopSelect = document.createElement('select');
      const blank = document.createElement('option'); blank.value = ''; blank.textContent = sIndex === 0 ? 'First stop (sets Home)' : 'Next stop';
      stopSelect.appendChild(blank);
      for (const c of sortedCities) {
        const opt = document.createElement('option'); opt.value = String(c.id); opt.textContent = c.name; if (stop.cityId === c.id) opt.selected = true; stopSelect.appendChild(opt);
      }
      stopSelect.addEventListener('change', () => {
        stop.cityId = stopSelect.value ? Number(stopSelect.value) : null;
        if (sIndex === 0 && stop.cityId && !player.homeCityId) player.homeCityId = stop.cityId;
        if (stop.cityId && !player.visitedCityIds.includes(stop.cityId)) player.visitedCityIds.push(stop.cityId);
        if (sIndex > 0) { const prev = player.stops[sIndex - 1]; stop.payoutFromPrev = (prev && prev.cityId && stop.cityId) ? findPayout(prev.cityId, stop.cityId) : null; } else { stop.payoutFromPrev = null; }
        save(); render();
      });

      const payoutCell = document.createElement('div'); payoutCell.className = 'money'; payoutCell.textContent = currency(stop.payoutFromPrev);

      const rowActions = document.createElement('div'); rowActions.className = 'stop-actions';
      const rollHint = document.createElement('span'); rollHint.className = 'roll-hint'; rollHint.textContent = stop.lastRollText || '';

      const unreachableBtn = document.createElement('button');
      unreachableBtn.textContent = '⛔';
      unreachableBtn.className = 'btn btn-ghost btn-icon';
      unreachableBtn.title = 'Toggle unreachable';
      unreachableBtn.setAttribute('aria-label', 'Toggle unreachable');
      if (stop.unreachable) unreachableBtn.classList.add('is-active');
      unreachableBtn.addEventListener('click', () => { stop.unreachable = !stop.unreachable; unreachableBtn.classList.toggle('is-active', stop.unreachable); row.classList.toggle('is-unreachable', stop.unreachable); save(); });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.className = 'btn btn-ghost btn-icon';
      deleteBtn.title = 'Delete stop';
      deleteBtn.setAttribute('aria-label', 'Delete stop');
      deleteBtn.addEventListener('click', () => {
        player.stops.splice(sIndex, 1);
        for (let i = 1; i < player.stops.length; i++) { const prev = player.stops[i - 1]; const cur = player.stops[i]; cur.payoutFromPrev = (prev.cityId && cur.cityId) ? findPayout(prev.cityId, cur.cityId) : null; }
        save(); render();
      });

      const isLast = sIndex === player.stops.length - 1;
      if (isLast) {
        const addManualBtn = document.createElement('button'); addManualBtn.textContent = 'Add Stop'; addManualBtn.className = 'btn btn-primary'; addManualBtn.title = 'Add a new stop to select manually';
        addManualBtn.addEventListener('click', () => { player.stops.push({ cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' }); save(); render(); });
        const rollStopBtn = document.createElement('button'); rollStopBtn.textContent = 'Roll Stop'; rollStopBtn.className = 'btn'; rollStopBtn.title = 'Automatically roll a new destination';
        rollStopBtn.addEventListener('click', () => {
          const rolled = rollDestinationRich(player, stop.cityId); if (!rolled || !rolled.id) return;
          if (stop.cityId == null) { stop.cityId = rolled.id; stop.lastRollText = rolled.text; if (sIndex > 0) { const prev = player.stops[sIndex - 1]; stop.payoutFromPrev = (prev && prev.cityId && stop.cityId) ? findPayout(prev.cityId, stop.cityId) : null; } }
          else { appendStop(player, rolled.id, rolled.text); }
          save(); render();
        });
        rowActions.appendChild(rollHint); rowActions.appendChild(addManualBtn); rowActions.appendChild(rollStopBtn);
      } else { rowActions.appendChild(rollHint); }

      rowActions.appendChild(unreachableBtn); rowActions.appendChild(deleteBtn);
      row.appendChild(stopSelect); row.appendChild(payoutCell); row.appendChild(rowActions);
      stopsWrap.appendChild(row);
    });

    const visited = document.createElement('div'); visited.className = 'visited-list';
    const uniqueVisited = [...new Set(player.visitedCityIds)].map(id => cityById(id)).filter(Boolean).sort(byName);
    uniqueVisited.forEach(c => { const tag = document.createElement('span'); tag.className = 'visited-item'; tag.textContent = c.name; visited.appendChild(tag); });

    const badges = document.createElement('div'); badges.className = 'badges';
    const homeBadge = document.createElement('span'); homeBadge.className = 'badge'; homeBadge.textContent = player.homeCityId ? `Home: ${cityById(player.homeCityId).name}` : 'Home: —';
    const tripTotal = player.stops.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
    const tripBadge = document.createElement('span'); tripBadge.className = 'badge'; tripBadge.textContent = `Trip: ${currency(tripTotal)}`;
    const trainBadge = document.createElement('span'); trainBadge.className = 'badge'; trainBadge.textContent = `Train: ${player.train}`;
    badges.appendChild(homeBadge); badges.appendChild(trainBadge); badges.appendChild(tripBadge);

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

  function getCollapsedSummary(player) {
    // Find last stop that has a city selected
    let idx = player.stops.length - 1;
    while (idx >= 0 && !player.stops[idx].cityId) idx--;
    if (idx <= 0) return '—';
    const stop = player.stops[idx];
    const city = cityById(stop.cityId)?.name || '—';
    const pay = stop.payoutFromPrev != null ? currency(stop.payoutFromPrev) : '—';
    return `${city} • ${pay}`;
  }

  function movePlayer(index, delta) {
    const to = index + delta; if (to < 0 || to >= state.players.length) return;
    const [moved] = state.players.splice(index, 1); state.players.splice(to, 0, moved); save(); render();
  }

  function appendStop(player, newCityId, lastRollText) {
    const prev = player.stops[player.stops.length - 1];
    const payout = (prev && prev.cityId) ? findPayout(prev.cityId, newCityId) : null;
    player.stops.push({ cityId: newCityId, payoutFromPrev: payout, unreachable: false, lastRollText: lastRollText || '' });
    if (!player.visitedCityIds.includes(newCityId)) player.visitedCityIds.push(newCityId);
  }

  // Destination roller utility with real Boxcars (Rail Baron) destination table
  const REGION_NAMES = {
    NORTHEAST: 'Northeast',
    SOUTHEAST: 'Southeast',
    NORTH_CENTRAL: 'North Central',
    SOUTH_CENTRAL: 'South Central',
    PLAINS: 'Plains',
    NORTHWEST: 'Northwest',
    SOUTHWEST: 'Southwest',
  };

  // Region table: index by sum 2..12
  const regionTable = {
    odd: {
      2: 'PLAINS',
      3: 'SOUTHEAST',
      4: 'SOUTHEAST',
      5: 'SOUTHEAST',
      6: 'NORTH_CENTRAL',
      7: 'NORTH_CENTRAL',
      8: 'NORTHEAST',
      9: 'NORTHEAST',
      10: 'NORTHEAST',
      11: 'NORTHEAST',
      12: 'NORTHEAST',
    },
    even: {
      2: 'SOUTHWEST',
      3: 'SOUTH_CENTRAL',
      4: 'SOUTH_CENTRAL',
      5: 'SOUTH_CENTRAL',
      6: 'SOUTHWEST',
      7: 'SOUTHWEST',
      8: 'PLAINS',
      9: 'NORTHWEST',
      10: 'NORTHWEST',
      11: 'PLAINS',
      12: 'NORTHWEST',
    }
  };

  // Per-region city tables: index by sum 2..12; values are city labels from chart
  const regionCities = {
    NORTHEAST: {
      odd: { 2:'NEW YORK',3:'NEW YORK',4:'NEW YORK',5:'ALBANY',6:'BOSTON',7:'BUFFALO',8:'BOSTON',9:'PORTLAND ME',10:'NEW YORK',11:'NEW YORK',12:'NEW YORK' },
      even:{ 2:'NEW YORK',3:'WASHINGTON',4:'PITTSBURGH',5:'PITTSBURGH',6:'PHILADELPHIA',7:'WASHINGTON',8:'PHILADELPHIA',9:'BALTIMORE',10:'BALTIMORE',11:'NEW YORK',12:'NEW YORK' }
    },
    SOUTHEAST: {
      odd: { 2:'CHARLOTTE',3:'CHARLOTTE',4:'CHATTANOOGA',5:'ATLANTA',6:'ATLANTA',7:'ATLANTA',8:'RICHMOND',9:'MOBILE',10:'MOBILE',11:'MOBILE',12:'MOBILE' },
      even:{ 2:'NORFOLK',3:'NORFOLK',4:'NORFOLK',5:'CHARLESTON',6:'MIAMI',7:'JACKSONVILLE',8:'MIAMI',9:'TAMPA',10:'TAMPA',11:'NORFOLK',12:'NORFOLK' }
    },
    NORTH_CENTRAL: {
      odd: { 2:'CLEVELAND',3:'CLEVELAND',4:'CLEVELAND',5:'CLEVELAND',6:'DETROIT',7:'DETROIT',8:'INDIANAPOLIS',9:'MILWAUKEE',10:'MILWAUKEE',11:'CHICAGO',12:'MILWAUKEE' },
      even:{ 2:'CINCINNATI',3:'CHICAGO',4:'CINCINNATI',5:'CINCINNATI',6:'COLUMBUS',7:'CHICAGO',8:'CHICAGO',9:'ST LOUIS',10:'ST LOUIS',11:'ST LOUIS',12:'CHICAGO' }
    },
    SOUTH_CENTRAL: {
      odd: { 2:'MEMPHIS',3:'MEMPHIS',4:'MEMPHIS',5:'LITTLE ROCK',6:'NEW ORLEANS',7:'BIRMINGHAM',8:'LOUISVILLE',9:'NASHVILLE',10:'NASHVILLE',11:'LOUISVILLE',12:'MEMPHIS' },
      even:{ 2:'SHREVEPORT',3:'SHREVEPORT',4:'DALLAS',5:'NEW ORLEANS',6:'DALLAS',7:'SAN ANTONIO',8:'HOUSTON',9:'HOUSTON',10:'FORT WORTH',11:'FORT WORTH',12:'FORT WORTH' }
    },
    PLAINS: {
      odd: { 2:'KANSAS CITY',3:'KANSAS CITY',4:'DENVER',5:'DENVER',6:'DENVER',7:'KANSAS CITY',8:'KANSAS CITY',9:'KANSAS CITY',10:'PUEBLO',11:'PUEBLO',12:'OKLAHOMA CITY' },
      even:{ 2:'OKLAHOMA CITY',3:'ST PAUL',4:'MINNEAPOLIS',5:'ST PAUL',6:'MINNEAPOLIS',7:'OKLAHOMA CITY',8:'DES MOINES',9:'OMAHA',10:'OMAHA',11:'FARGO',12:'FARGO' }
    },
    NORTHWEST: {
      odd: { 2:'SPOKANE',3:'SPOKANE',4:'SEATTLE',5:'SEATTLE',6:'SEATTLE',7:'SEATTLE',8:'RAPID CITY',9:'CASPER',10:'BILLINGS',11:'BILLINGS',12:'SPOKANE' },
      even:{ 2:'SPOKANE',3:'SALT LAKE CITY',4:'SALT LAKE CITY',5:'SALT LAKE CITY',6:'PORTLAND OR',7:'PORTLAND OR',8:'PORTLAND OR',9:'POCATELLO',10:'BUTTE',11:'BUTTE',12:'PORTLAND OR' }
    },
    SOUTHWEST: {
      odd: { 2:'SAN DIEGO',3:'SAN DIEGO',4:'RENO',5:'SACRAMENTO',6:'SACRAMENTO',7:'LAS VEGAS',8:'PHOENIX',9:'EL PASO',10:'TUCUMCARI',11:'PHOENIX',12:'PHOENIX' },
      even:{ 2:'LOS ANGELES',3:'OAKLAND',4:'OAKLAND',5:'OAKLAND',6:'LOS ANGELES',7:'LOS ANGELES',8:'LOS ANGELES',9:'SAN FRANCISCO',10:'SAN FRANCISCO',11:'SAN FRANCISCO',12:'SAN FRANCISCO' }
    }
  };

  // Normalize city names and create lookup
  const normalizedName = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g,'')
    .replace(/^OKLACITY$/,'OKLAHOMACITY')
    .replace(/^OKLACITY$/,'OKLAHOMACITY')
    .replace(/^STPAUL$/,'STPAUL')
    .replace(/^STLOUIS$/,'STLOUIS')
    .replace(/^FTWORTH$/,'FORTWORTH')
    ;
  const cityNameToId = (()=>{
    const map = new Map();
    for (const c of cities) {
      map.set(normalizedName(c.name), c.id);
    }
    // Disambiguations
    map.set('PORTLANDME', cities.find(c=>c.name.startsWith('Portland, ME')).id);
    map.set('PORTLANDOR', cities.find(c=>c.name==='Portland, OR').id);
    map.set('STPAUL', cities.find(c=>normalizedName(c.name)==='STPAUL').id);
    map.set('STLOUIS', cities.find(c=>normalizedName(c.name)==='STLOUIS').id);
    map.set('CINCINNATI', cities.find(c=>normalizedName(c.name)==='CINCINNATTI').id);
    map.set('FORTWORTH', cities.find(c=>normalizedName(c.name)==='FORTWORTH').id);
    map.set('SALTLAKECITY', cities.find(c=>normalizedName(c.name)==='SALTLAKECITY').id);
    map.set('OKLAHOMACITY', cities.find(c=>normalizedName(c.name)==='OKLAHOMACITY').id);
    return map;
  })();

  function cityIdFromLabel(label, regionKey) {
    const key = normalizedName(label).replace(/^PORTLAND$/,(regionKey==='NORTHWEST'?'PORTLANDOR':'PORTLANDME'));
    const id = cityNameToId.get(key);
    return id || null;
  }

  // Build quick city->region mapping
  const cityIdToRegion = (()=>{
    const m = new Map();
    for (const rk of Object.keys(regionCities)) {
      const rc = regionCities[rk];
      for (const parity of ['odd','even']) {
        for (let s=2;s<=12;s++) {
          const lbl = rc[parity][s]; if (!lbl) continue;
          const id = cityIdFromLabel(lbl, rk);
          if (id) m.set(id, rk);
        }
      }
    }
    return m;
  })();

  function currentRegionForPlayer(player) {
    const last = player.stops[player.stops.length - 1];
    if (!last || !last.cityId) return null;
    return cityIdToRegion.get(last.cityId) || null;
  }

  function d6(){ return 1 + Math.floor(Math.random()*6); }

  function rollDestinationRich(player, excludeId) {
    // First roll: region
    const red1 = d6();
    const w11 = d6();
    const w12 = d6();
    const sum1 = w11 + w12;
    const regParity = (red1 % 2 === 0) ? 'even' : 'odd';
    const regionKey = regionTable[regParity][sum1];

    // If same region as current city, allow pick
    const currentRegion = currentRegionForPlayer(player);
    let chosenRegion = regionKey;
    if (currentRegion && currentRegion === regionKey) {
      const names = Object.keys(REGION_NAMES);
      const choice = prompt(`Rolled your current region (${REGION_NAMES[regionKey]}). Pick any region: ${names.map(k=>REGION_NAMES[k]).join(', ')}`, REGION_NAMES[regionKey]);
      if (choice) {
        const match = names.find(k => REGION_NAMES[k].toLowerCase() === String(choice).toLowerCase());
        if (match) chosenRegion = match;
      }
    }

    // Second roll: city within region
    const red2 = d6();
    const w21 = d6();
    const w22 = d6();
    const sum2 = w21 + w22;
    const cityParity = (red2 % 2 === 0) ? 'even' : 'odd';
    const label = regionCities[chosenRegion][cityParity][sum2];
    const cityId = cityIdFromLabel(label, chosenRegion);
    if (!cityId) return null;

    const text = `${regParity === 'even' ? 'Even' : 'Odd'} ${sum1}: ${REGION_NAMES[regionKey]}; ` +
                 `${cityParity === 'even' ? 'Even' : 'Odd'} ${sum2}: ${cities[cityId-1].name}`;
    return { id: cityId, text };
  }

  // Stats modal
  function openStats() { populateStats(); statsModal.classList.remove('hidden'); }
  function closeStats() { statsModal.classList.add('hidden'); }
  function populateStats() {
    perPlayerStats.innerHTML = '';
    const rows = state.players.map(p => {
      const stops = p.stops.filter(s => s.cityId);
      const visited = new Set(p.visitedCityIds).size;
      const legs = stops.slice(1);
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
    const allLegs = state.players.flatMap(p => p.stops.slice(1));
    const totalAll = allLegs.reduce((sum, s) => sum + (s.payoutFromPrev || 0), 0);
    const cityVisitCounts = new Map();
    state.players.forEach(p => p.visitedCityIds.forEach(id => { cityVisitCounts.set(id, (cityVisitCounts.get(id) || 0) + 1); }));
    const topCities = [...cityVisitCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0,5).map(([id,count]) => `${escapeHtml(cityById(id).name)} (${count})`).join(', ');
    overallStats.innerHTML = `<div><strong>Total Trip Payout (all players):</strong> ${currency(totalAll)}</div><div><strong>Most-visited cities:</strong> ${topCities || '—'}</div>`;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

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
        .map(v => String(v).replace(/\"/g,'""')).map(v => /[",\n]/.test(v) ? `"${v}"` : v).join(',');
      lines.push(row);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'railbaron-stats.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // Events
  addPlayerBtn.addEventListener('click', () => { state.players.push(newPlayer()); save(); render(); });
  newGameBtn.addEventListener('click', () => { if (!confirm('Start a new game? This will clear all local data.')) return; localStorage.removeItem(STORAGE_KEY); state.players = []; render(); });
  exportBtn.addEventListener('click', () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'railbaron-helper-state.json'; a.click(); URL.revokeObjectURL(url); });
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return; const text = await file.text();
    try { const parsed = JSON.parse(text); if (!Array.isArray(parsed.players)) throw new Error('Invalid file'); state.players = parsed.players.map(hydratePlayer); save(); render(); }
    catch (err) { alert('Import failed: ' + err.message); } finally { importFile.value = ''; }
  });
  statsBtn.addEventListener('click', openStats); closeStatsBtn.addEventListener('click', closeStats);
  statsModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeStats(); });
  downloadCsvBtn.addEventListener('click', downloadCsv);

  // Init
  load(); if (state.players.length === 0) { state.players = [newPlayer(), newPlayer()]; } render();
})(); 
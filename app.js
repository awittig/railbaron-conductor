(function() {
  'use strict';

  if (typeof window.BOXCARS === 'undefined' || (typeof window.BOXCARS_US === 'undefined' && typeof window.BOXCARS_GB === 'undefined')) {
    alert('Error: Core tables failed to load.');
    return;
  }

  // ----- Data enrichment (per selected map) -----
  let activeFindPayout = (a, b) => undefined;
  let idToCity = new Map();
  let enrichedCities = [];
  let activeRegions = [];

  function setupActiveDataset(map) {
    // Use unified BOXCARS_* APIs for both US and GB
    const dataset = (map === 'GB' && window.BOXCARS_GB) ? window.BOXCARS_GB : window.BOXCARS_US;
    if (!dataset) {
      console.error(`Error: Dataset for map '${map}' not found. Available:`, {
        BOXCARS_US: !!window.BOXCARS_US,
        BOXCARS_GB: !!window.BOXCARS_GB
      });
      return;
    }

    // Build city map from unified dataset
    idToCity = new Map();
    const srcCities = dataset.CITIES || [];
    for (const c of srcCities) {
      idToCity.set(c.id, { id: c.id, name: c.name, region: null });
    }

    // Region membership
    const idToRegion = new Map();
    const cityIdsByRegion = dataset.CITY_IDS_BY_REGION || {};
    for (const [regionName, ids] of Object.entries(cityIdsByRegion)) {
      for (const id of ids) idToRegion.set(id, regionName);
    }
    for (const [id, c] of idToCity) {
      c.region = idToRegion.get(id) || 'Unknown';
    }
    enrichedCities = Array.from(idToCity.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Unified payout resolver and regions list
    activeFindPayout = dataset.findPayout;
    activeRegions = dataset.REGIONS || [];
  }

  // ----- State management -----
  const STORAGE_KEY = 'rb_conductor_state_v3';

  /** @typedef {{ cityId: number|null, payoutFromPrev: number|null, unreachable: boolean, lastRollText: string }} Stop */
  /** @typedef {{ id: string, name: string, color: string, train: 'Standard'|'Express'|'Super Chief', stops: Stop[], collapsed: boolean, homeCityId?: number|null, visitedCityIds?: number[] }} Player */

  /** @type {{ players: Player[], settings: { map: 'US'|'GB' } }} */
  let state = { players: [], settings: { map: 'US' } };

  const uuid = window.RB.models.uuid;
  const defaultStop = window.RB.models.defaultStop;
  const defaultPlayer = window.RB.models.defaultPlayer;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return;
      state.settings = parsed.settings && parsed.settings.map === 'GB' ? { map: 'GB' } : { map: 'US' };
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
    return window.RB.payouts.computePayout(activeFindPayout, prevCityId, currCityId);
  }

  function formatCurrency(amt) {
    return window.RB.format.formatCurrency(amt, state.settings.map);
  }

  function recomputeAllPayouts(player) {
    window.RB.payouts.recomputeAllPayouts(player, activeFindPayout);
    updateDerivedFields(player);
  }

  function getCurrentRegion(player) {
    return window.RB.derived.getCurrentRegion(player, idToCity);
  }

  function updateDerivedFields(player) {
    return window.RB.derived.updateDerivedFields(player);
  }

  // ----- Rendering -----
  const playersRoot = document.getElementById('players');
  const tplPlayerCard = document.getElementById('tpl-player-card');
  const tplStopItem = document.getElementById('tpl-stop-item');

  // Only the six player colors used in Rail Baron
  const colorOptions = ['black','red','blue','green','white','yellow'];

  function render() {
    if (typeof document === 'undefined') return;
    if (!playersRoot) return;
    // Update header with selected map
    const headerTitle = document.querySelector('header.app-header h1');
    if (headerTitle) {
      const mapText = state.settings.map === 'GB' ? 'Great Britain' : 'America';
      headerTitle.textContent = `Boxcars Conductor: ${mapText}`;
    }

    playersRoot.innerHTML = '';
    state.players.forEach((player, idx) => {
      const card = renderPlayerCard(player, idx);
      playersRoot.appendChild(card);
    });
    bindDragAndDrop();
  }

  function renderPlayerCard(player, index) {
    return window.RB.ui.components.playerCard.renderPlayerCard(player, index, {
      idToCity,
      colorToken,
      saveState,
      colorOptions,
      computePayout,
      formatCurrency,
      recomputeAllPayouts,
      render,
      movePlayer,
      deletePlayer,
      defaultStop,
      rollNextStop,
      renderStopItem,
    });
  }

  function renderStopItem(player, stop, stopIdx) {
    return window.RB.ui.components.stopItem.renderStopItem(player, stop, stopIdx, {
      enrichedCities,
      formatCurrency,
      recomputeAllPayouts,
      saveState,
      render,
      defaultStop,
    });
  }

  function movePlayer(index, delta) {
    window.RB.state.movePlayer(state, index, delta);
    saveState();
    render();
  }

  function deletePlayer(playerId) {
    return window.RB.ui.controllers.deletePlayer(state, saveState, render, playerId);
  }

  function colorToken(colorName) {
    return `var(--${colorName}, var(--teal))`;
  }

  // ----- Rolling logic -----
  async function rollNextStop(player, cardNode) {
    const dataset = (state.settings.map === 'GB' && window.BOXCARS_GB) ? window.BOXCARS_GB : window.BOXCARS_US;
    const ctx = {
      map: state.settings.map,
      idToCity,
      chooseRegion: (defaultRegion) => chooseRegionInApp(defaultRegion),
      chooseHomeCity: (region) => chooseHomeCityInApp(region, player),
      rngOddEven: () => window.RB.rolling.rollOddEven(),
      rng2d6: () => window.RB.rolling.roll2d6(),
      dataset,
      defaultStop,
      recomputeAllPayouts,
      saveState,
      render,
    };
    if (window.RB && window.RB.rolling && typeof window.RB.rolling.rollNextStop === 'function') {
      return window.RB.rolling.rollNextStop(player, ctx);
    }
  }

  async function rollHomeCity(player, cardNode) {
    const dataset = (state.settings.map === 'GB' && window.BOXCARS_GB) ? window.BOXCARS_GB : window.BOXCARS_US;
    const ctx = {
      map: state.settings.map,
      idToCity,
      chooseRegion: (defaultRegion) => chooseRegionInApp(defaultRegion),
      chooseHomeCity: (region) => chooseHomeCityInApp(region, player),
      rngOddEven: () => window.RB.rolling.rollOddEven(),
      rng2d6: () => window.RB.rolling.roll2d6(),
      dataset,
      defaultStop,
      recomputeAllPayouts,
      saveState,
      render,
    };
    if (window.RB && window.RB.rolling && typeof window.RB.rolling.rollHomeCity === 'function') {
      return window.RB.rolling.rollHomeCity(player, ctx);
    }
  }

  function chooseRegionInApp(defaultRegion) {
    const RBs = (typeof window !== 'undefined' && window.RB) || (typeof global !== 'undefined' && global.RB) || null;
    const chooseRegion = RBs && RBs.ui && RBs.ui.dialogs && RBs.ui.dialogs.chooseRegion;
    if (typeof chooseRegion === 'function') {
      const regions = activeRegions;
      return chooseRegion(defaultRegion, regions);
    }
    const dialog = document.getElementById('region-dialog');
    const optionsWrap = document.getElementById('region-options');
    const confirmBtn = document.getElementById('btn-region-confirm');
    const closeBtn = document.getElementById('btn-close-region');
    if (!dialog || !optionsWrap) return Promise.resolve(defaultRegion);

    return new Promise((resolve) => {
      const regions = activeRegions;
      optionsWrap.innerHTML = '';
      let selected = defaultRegion;
      regions.forEach((r) => {
        const label = document.createElement('label');
        label.className = 'region';
        label.dataset.value = r;
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'region';
        input.value = r;
        if (r === selected) input.checked = true;
        const span = document.createElement('span');
        span.textContent = r;
        label.appendChild(input);
        label.appendChild(span);
        label.addEventListener('click', () => {
          selected = r;
          updateRegionSelection();
        });
        optionsWrap.appendChild(label);
      });

      function updateRegionSelection() {
        optionsWrap.querySelectorAll('.region').forEach((el) => {
          el.dataset.checked = el.dataset.value === selected ? 'true' : 'false';
          const input = el.querySelector('input[type="radio"]');
          if (input) input.checked = el.dataset.value === selected;
        });
      }
      updateRegionSelection();

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selected); }
      function onClose() { cleanup(); resolve(defaultRegion); }
      function onBackdrop(e) {
        const rect = dialog.getBoundingClientRect();
        const inDialog = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
        if (!inDialog) { cleanup(); dialog.close(); resolve(defaultRegion); }
      }

      confirmBtn.addEventListener('click', onConfirm);
      closeBtn.addEventListener('click', onClose);
      dialog.addEventListener('click', onBackdrop);
      dialog.showModal();

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        closeBtn.removeEventListener('click', onClose);
        dialog.removeEventListener('click', onBackdrop);
      }
    });
  }

  async function chooseHomeCityInApp(region, player) {
    const RBs = (typeof window !== 'undefined' && window.RB) || (typeof global !== 'undefined' && global.RB) || null;
    const chooseHomeCity = RBs && RBs.ui && RBs.ui.dialogs && RBs.ui.dialogs.chooseHomeCity;
    if (typeof chooseHomeCity === 'function') {
      const takenCityIds = state.players
        .filter(p => p.id !== player.id && p.homeCityId)
        .map(p => p.homeCityId);
      return chooseHomeCity(region, player, enrichedCities, takenCityIds);
    }
    const dialog = document.getElementById('home-city-dialog');
    const optionsWrap = document.getElementById('home-city-options');
    const regionSpan = document.getElementById('home-city-region');
    const confirmBtn = document.getElementById('btn-home-city-confirm');
    const closeBtn = document.getElementById('btn-close-home-city');
    if (!dialog || !optionsWrap || !regionSpan) return null;

    // Update the region text
    regionSpan.textContent = region;

    return new Promise((resolve) => {
      // Get all cities in the region that haven't been taken by other players
      const takenCityIds = state.players
        .filter(p => p.id !== player.id && p.homeCityId)
        .map(p => p.homeCityId);
      
      const availableCities = enrichedCities.filter(c => 
        c.region === region && !takenCityIds.includes(c.id)
      );

      optionsWrap.innerHTML = '';
      let selectedCityId = null;

      if (availableCities.length === 0) {
        // No available cities in this region - show message
        const noCitiesMsg = document.createElement('p');
        noCitiesMsg.className = 'muted';
        noCitiesMsg.textContent = 'No cities available in this region. All cities have been taken by other players.';
        optionsWrap.appendChild(noCitiesMsg);
        confirmBtn.disabled = true;
      } else {
        availableCities.forEach((c) => {
          const label = document.createElement('label');
          label.className = 'home-city-option';
          label.dataset.value = String(c.id);
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = 'home-city';
          input.value = String(c.id);
          const span = document.createElement('span');
          span.textContent = c.name;
          label.appendChild(input);
          label.appendChild(span);
          label.addEventListener('click', () => {
            selectedCityId = c.id;
            updateHomeCitySelection();
          });
          optionsWrap.appendChild(label);
        });
        
        // Auto-select first city if available
        if (availableCities.length > 0) {
          selectedCityId = availableCities[0].id;
        }
      }

      function updateHomeCitySelection() {
        optionsWrap.querySelectorAll('.home-city-option').forEach((el) => {
          el.dataset.checked = el.dataset.value === String(selectedCityId) ? 'true' : 'false';
          const input = el.querySelector('input[type="radio"]');
          if (input) input.checked = el.dataset.value === String(selectedCityId);
        });
        confirmBtn.disabled = !selectedCityId;
      }
      updateHomeCitySelection();

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selectedCityId); }
      function onClose() { cleanup(); resolve(null); }
      function onBackdrop(e) {
        const rect = dialog.getBoundingClientRect();
        const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!inside) { onClose(); }
      }

      confirmBtn.addEventListener('click', onConfirm);
      closeBtn.addEventListener('click', onClose);
      dialog.addEventListener('click', onBackdrop);
      dialog.showModal();

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        closeBtn.removeEventListener('click', onClose);
        dialog.removeEventListener('click', onBackdrop);
      }
    });
  }


  // capitalize helper removed (not used)

  // ----- Stats -----
  function computeStats(includeUnreachable) {
    return window.RB.stats.computeStats(state, includeUnreachable);
  }

  function renderStatsTable(includeUnreachable) {
    return window.RB.ui.stats.renderStatsTable(state, includeUnreachable);
  }

  function exportCSV(includeUnreachable) {
    const csv = window.RB.stats.buildCSV(state, includeUnreachable);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railbaron-stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const csvEscape = window.RB.format.csvEscape;
  const escapeHtml = window.RB.format.escapeHtml;

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
        setupActiveDataset(state.settings.map || 'US');
        render();
      } catch (e) {
        alert('Import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function newGame() {
    if (!confirm('Start a new game? This will clear all players and stops.')) return;
    showMapDialog(state.settings.map || 'US').then((map) => {
      // Mutate in place to preserve references captured by event handlers
      state.players = [];
      state.settings = { map: map };
      saveState();
      setupActiveDataset(map || 'US');
      ensureDefaultPlayers();
      render();
    }).catch(() => {/* noop on cancel */});
  }

  // ----- Global controls -----
  function bindGlobalControls() {
    return window.RB.ui.controllers.bindGlobalControls(document, state, {
      saveState,
      render,
      newGame,
      exportJSON,
      importJSON,
      renderStatsTable,
      exportCSV,
    });
  }

  // Drag-and-drop reordering
  function bindDragAndDrop() {
    const RBs = (typeof window !== 'undefined' && window.RB) || (typeof global !== 'undefined' && global.RB) || null;
    const bind = RBs && RBs.ui && RBs.ui.dragdrop && RBs.ui.dragdrop.bind;
    if (typeof bind === 'function') return bind(playersRoot, state, saveState, render);
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

  // Map selection dialog
  function showMapDialog(defaultMap) {
    const RBs = (typeof window !== 'undefined' && window.RB) || (typeof global !== 'undefined' && global.RB) || null;
    const showMap = RBs && RBs.ui && RBs.ui.dialogs && RBs.ui.dialogs.showMapDialog;
    if (typeof showMap === 'function') return showMap(defaultMap);
    const dialog = document.getElementById('map-dialog');
    const options = document.getElementById('map-options');
    const closeBtn = document.getElementById('btn-close-map');
    const confirmBtn = document.getElementById('btn-map-confirm');
    if (!dialog || !options) return Promise.resolve(defaultMap);

    return new Promise((resolve, reject) => {
      let selected = (defaultMap === 'GB') ? 'GB' : 'US';
      options.querySelectorAll('.map-card').forEach((el) => {
        const val = el.dataset.value;
        const input = el.querySelector('input[type="radio"]');
        if (input) input.checked = (val === selected);
        el.dataset.checked = (val === selected) ? 'true' : 'false';
        el.addEventListener('click', () => {
          selected = val;
          update();
        });
      });
      function update() {
        options.querySelectorAll('.map-card').forEach((el) => {
          const val = el.dataset.value;
          el.dataset.checked = (val === selected) ? 'true' : 'false';
          const input = el.querySelector('input[type="radio"]');
          if (input) input.checked = (val === selected);
        });
      }

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selected); }
      function onClose() { cleanup(); dialog.close(); reject(); }
      function onBackdrop(e) {
        const rect = dialog.getBoundingClientRect();
        const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!inside) { onClose(); }
      }

      confirmBtn.addEventListener('click', onConfirm);
      closeBtn.addEventListener('click', onClose);
      dialog.addEventListener('click', onBackdrop);
      dialog.showModal();

      function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        closeBtn.removeEventListener('click', onClose);
        dialog.removeEventListener('click', onBackdrop);
      }
    });
  }

  // ----- Init -----
  function ensureDefaultPlayers() {
    if (state.players.length === 0) {
      state.players.push(defaultPlayer());
    }
  }

  loadState();
  setupActiveDataset(state.settings.map || 'US');
  if (typeof global !== 'undefined') {
    global.railbaronApp = {
      get activeFindPayout() { return activeFindPayout; },
      setMap: function(map) {
        state.settings.map = (map === 'GB') ? 'GB' : 'US';
        setupActiveDataset(state.settings.map);
        return state.settings.map;
      },
    };
  }
  // If first load (no players) show map select once
  if (!localStorage.getItem(STORAGE_KEY)) {
    showMapDialog(state.settings.map || 'US').then((map) => {
      state.settings.map = map;
      saveState();
      setupActiveDataset(map || 'US');
      render();
    });
  }
  ensureDefaultPlayers();
  const hasDOM = (typeof document !== 'undefined') && !!document.getElementById;
  if (hasDOM) {
    bindGlobalControls();
    render();
  }
})();



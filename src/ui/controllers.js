(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var controllers = ui.controllers || (ui.controllers = {});

  function bindGlobalControls(doc, state, actions) {
    var addBtn = doc.getElementById('btn-add-player');
    if (!addBtn) return;
    
    // Mobile menu handling
    var navToggle = doc.getElementById('nav-toggle');
    var globalActions = doc.querySelector('.global-actions');
    
    // Close menu when any menu item is clicked
    if (navToggle && globalActions) {
      var menuButtons = globalActions.querySelectorAll('.btn, .file-btn');
      menuButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          navToggle.checked = false;
        });
      });
      
      // Close menu when clicking outside
      doc.addEventListener('click', function(e) {
        if (!navToggle.checked) return;
        
        var hamburger = doc.querySelector('.hamburger');
        var clickedInsideMenu = globalActions.contains(e.target);
        var clickedHamburger = hamburger && hamburger.contains(e.target);
        
        // Also check if clicked on the nav-toggle input itself
        var clickedToggle = e.target === navToggle;
        
        if (!clickedInsideMenu && !clickedHamburger && !clickedToggle) {
          navToggle.checked = false;
        }
      });
    }
    
    addBtn.addEventListener('click', function () {
      state.players.push(RB.models.defaultPlayer());
      actions.saveState();
      actions.render();
    });

    var newBtn = doc.getElementById('btn-new');
    if (newBtn) newBtn.addEventListener('click', actions.newGame);

    var exportBtn = doc.getElementById('btn-export');
    if (exportBtn) exportBtn.addEventListener('click', actions.exportJSON);

    var fileInput = doc.getElementById('file-import');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (file) actions.importJSON(file);
        fileInput.value = '';
      });
    }

    var statsDialog = doc.getElementById('stats-dialog');
    var includeUnreachable = doc.getElementById('toggle-include-unreachable');
    var statsBtn = doc.getElementById('btn-stats');
    if (statsDialog && includeUnreachable && statsBtn) {
      statsBtn.addEventListener('click', function () {
        includeUnreachable.checked = false;
        actions.renderStatsTable(false);
        statsDialog.showModal();
      });
      var closeStats = doc.getElementById('btn-close-stats');
      if (closeStats) closeStats.addEventListener('click', function () { statsDialog.close(); });
      statsDialog.addEventListener('click', function (e) {
        var rect = statsDialog.getBoundingClientRect();
        var inDialog = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
        if (!inDialog) statsDialog.close();
      });
      includeUnreachable.addEventListener('change', function () { actions.renderStatsTable(includeUnreachable.checked); });
      var exportCsvBtn = doc.getElementById('btn-export-csv');
      if (exportCsvBtn) exportCsvBtn.addEventListener('click', function (e) {
        e.preventDefault();
        actions.exportCSV(includeUnreachable.checked);
      });
    }

    // Mobile hamburger menu behavior: close after selecting an option
    // or when interacting anywhere outside the header.
    var navToggle = doc.getElementById('nav-toggle');
    var headerEl = doc.querySelector('.app-header');
    var actionsToolbar = doc.querySelector('.global-actions');
    if (navToggle && headerEl) {
      if (actionsToolbar) {
        // Close when any interactive control inside the menu is activated
        actionsToolbar.addEventListener('click', function (e) {
          var interactive = e.target && typeof e.target.closest === 'function' ? e.target.closest('button, a, input, label, select') : null;
          if (interactive) navToggle.checked = false;
        });
        // Also close on changes (e.g., file input selection)
        actionsToolbar.addEventListener('change', function () { navToggle.checked = false; });
      }

      // Close on outside interactions
      doc.addEventListener('pointerdown', function (e) {
        if (navToggle.checked && !(headerEl.contains(e.target))) navToggle.checked = false;
      });
      // Close on Escape for accessibility/keyboard users
      doc.addEventListener('keydown', function (e) {
        if (e && (e.key === 'Escape' || e.key === 'Esc') && navToggle.checked) navToggle.checked = false;
      });
    }
  }

  function deletePlayer(state, saveState, render, playerId) {
    var p = state.players.find(function (x) { return x.id === playerId; });
    if (!p) return;
    if (!(typeof confirm === 'function' ? confirm('Delete player "' + p.name + '" and all their stops?') : true)) return;
    state.players = state.players.filter(function (x) { return x.id !== playerId; });
    saveState();
    render();
  }

  controllers.bindGlobalControls = bindGlobalControls;
  controllers.deletePlayer = deletePlayer;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bindGlobalControls: bindGlobalControls, deletePlayer: deletePlayer };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



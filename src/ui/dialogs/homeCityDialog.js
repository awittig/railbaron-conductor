(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var dialogs = ui.dialogs || (ui.dialogs = {});

  function chooseHomeCity(region, player, enrichedCities, takenCityIds) {
    var dialog = document.getElementById('home-city-dialog');
    var optionsWrap = document.getElementById('home-city-options');
    var regionSpan = document.getElementById('home-city-region');
    var confirmBtn = document.getElementById('btn-home-city-confirm');
    var closeBtn = document.getElementById('btn-close-home-city');
    if (!dialog || !optionsWrap || !regionSpan) return Promise.resolve(null);

    regionSpan.textContent = region;

    return new Promise(function (resolve) {
      var availableCities = (enrichedCities || []).filter(function (c) { return c.region === region && takenCityIds.indexOf(c.id) === -1; });
      optionsWrap.innerHTML = '';
      var selectedCityId = null;
      if (availableCities.length === 0) {
        var noCitiesMsg = document.createElement('p');
        noCitiesMsg.className = 'muted';
        noCitiesMsg.textContent = 'No cities available in this region. All cities have been taken by other players.';
        optionsWrap.appendChild(noCitiesMsg);
        confirmBtn.disabled = true;
      } else {
        availableCities.forEach(function (c) {
          var label = document.createElement('label');
          label.className = 'home-city-option';
          label.dataset.value = String(c.id);
          var input = document.createElement('input');
          input.type = 'radio';
          input.name = 'home-city';
          input.value = String(c.id);
          var span = document.createElement('span');
          span.textContent = c.name;
          label.appendChild(input);
          label.appendChild(span);
          label.addEventListener('click', function () {
            selectedCityId = c.id;
            updateHomeCitySelection();
          });
          optionsWrap.appendChild(label);
        });
        selectedCityId = availableCities[0].id;
      }

      function updateHomeCitySelection() {
        optionsWrap.querySelectorAll('.home-city-option').forEach(function (el) {
          el.dataset.checked = el.dataset.value === String(selectedCityId) ? 'true' : 'false';
          var input = el.querySelector('input[type="radio"]');
          if (input) input.checked = el.dataset.value === String(selectedCityId);
        });
        confirmBtn.disabled = !selectedCityId;
      }
      updateHomeCitySelection();

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selectedCityId); }
      function onClose() { cleanup(); resolve(null); }
      function onBackdrop(e) {
        var rect = dialog.getBoundingClientRect();
        var inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
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

  dialogs.chooseHomeCity = chooseHomeCity;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { chooseHomeCity: chooseHomeCity };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



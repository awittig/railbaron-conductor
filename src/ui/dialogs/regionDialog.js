(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var dialogs = ui.dialogs || (ui.dialogs = {});

  function chooseRegion(defaultRegion, regions) {
    var dialog = document.getElementById('region-dialog');
    var optionsWrap = document.getElementById('region-options');
    var confirmBtn = document.getElementById('btn-region-confirm');
    var closeBtn = document.getElementById('btn-close-region');
    if (!dialog || !optionsWrap) return Promise.resolve(defaultRegion);

    return new Promise(function (resolve) {
      optionsWrap.innerHTML = '';
      var selected = defaultRegion;
      regions.forEach(function (r) {
        var label = document.createElement('label');
        label.className = 'region';
        label.dataset.value = r;
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'region';
        input.value = r;
        if (r === selected) input.checked = true;
        var span = document.createElement('span');
        span.textContent = r;
        label.appendChild(input);
        label.appendChild(span);
        label.addEventListener('click', function () {
          selected = r;
          updateRegionSelection();
        });
        optionsWrap.appendChild(label);
      });

      function updateRegionSelection() {
        optionsWrap.querySelectorAll('.region').forEach(function (el) {
          el.dataset.checked = el.dataset.value === selected ? 'true' : 'false';
          var input = el.querySelector('input[type="radio"]');
          if (input) input.checked = el.dataset.value === selected;
        });
      }
      updateRegionSelection();

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selected); }
      function onClose() { cleanup(); dialog.close(); resolve(defaultRegion); }
      function onBackdrop(e) {
        var rect = dialog.getBoundingClientRect();
        var inDialog = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
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

  dialogs.chooseRegion = chooseRegion;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { chooseRegion: chooseRegion };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



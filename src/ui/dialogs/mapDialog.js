(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var dialogs = ui.dialogs || (ui.dialogs = {});

  function showMapDialog(defaultMap) {
    var dialog = document.getElementById('map-dialog');
    var options = document.getElementById('map-options');
    var closeBtn = document.getElementById('btn-close-map');
    var confirmBtn = document.getElementById('btn-map-confirm');
    if (!dialog || !options) return Promise.resolve(defaultMap);

    return new Promise(function (resolve, reject) {
      var selected = (defaultMap === 'GB') ? 'GB' : 'US';
      options.querySelectorAll('.map-card').forEach(function (el) {
        var val = el.dataset.value;
        var input = el.querySelector('input[type="radio"]');
        if (input) input.checked = (val === selected);
        el.dataset.checked = (val === selected) ? 'true' : 'false';
        el.addEventListener('click', function () {
          selected = val;
          update();
        });
      });
      function update() {
        options.querySelectorAll('.map-card').forEach(function (el) {
          var val = el.dataset.value;
          el.dataset.checked = (val === selected) ? 'true' : 'false';
          var input = el.querySelector('input[type="radio"]');
          if (input) input.checked = (val === selected);
        });
      }

      function onConfirm(e) { e.preventDefault(); cleanup(); dialog.close(); resolve(selected); }
      function onClose() { cleanup(); dialog.close(); reject(); }
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

  dialogs.showMapDialog = showMapDialog;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showMapDialog: showMapDialog };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



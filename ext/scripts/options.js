'use strict';

console.log("options.js");

function save_options(evt) {
  evt.preventDefault();
  var xp_count_elm = document.forms.options.xp_count_elm.value;
  var xp_folders = document.forms.options.xp_folders.value;
  chrome.storage.sync.set({
    xp_count_elm: xp_count_elm,
    xp_folders: xp_folders
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.runtime.sendMessage(
    {action: 'defaults'}, function(response) {
      let xp_count_elm = response.xp_count_elm;
      let xp_folders = response.xp_folders;
      chrome.storage.sync.get(
          {xp_count_elm: response.xp_count_elm,
           xp_folders: response.xp_folders},
      function(items) {
        document.forms.options.xp_count_elm.value = items.xp_count_elm;
        document.forms.options.xp_folders.value = items.xp_folders;
      });
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.forms.options.addEventListener('submit', save_options);

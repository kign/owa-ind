'use strict';

console.log("options.js");

function save_options(evt) {
  evt.preventDefault();
  var url = document.forms.options.url.value;
  chrome.storage.sync.set({
    url: url
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}


function restore_options() {
  chrome.storage.sync.get({
    url: ''
  }, function(items) {
    document.forms.options.url.value = items.url;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.forms.options.addEventListener('submit', save_options);

'use strict';

function time () {
  return (new Date()).getTime()/1000.0;
}

function hide(elm) {
  if (typeof elm === 'string')
    elm = document.getElementById(elm);
  elm.style.display = 'none';
}

function show(elm) {
  if (typeof elm === 'string')
    elm = document.getElementById(elm);
  elm.style.removeProperty('display');
}

function update() {
  for (let elm of document.getElementsByClassName("hidden"))
    hide(elm);

  document.getElementById('status').textContent = localStorage.status;
  if (['ok', 'ok_attn'].includes(localStorage.status)) {
    show('ok');
    document.getElementById('counter').textContent = localStorage.last_count;
    document.getElementById('last_reported').textContent = (time() - localStorage.last_ping).toFixed(2);
  }
  else if (['cs_err', 'err', 'init'].includes(localStorage.status)) {
    show('init');
    if (localStorage.status == "err" ) {
      show('err');
      document.getElementById('last_seen').textContent =
             (new Date(localStorage.last_ping*1000)).toLocaleTimeString("de");
    }
    else if(localStorage.status == "cs_err" ) {
      show('cs_err');
    }
  }
}

document.getElementById('options').addEventListener('click',
  function() {
      chrome.runtime.openOptionsPage();
  });

document.getElementById('ready').addEventListener('click',
  function() {
    var status = event.target.nextElementSibling;
    chrome.runtime.sendMessage({action: 'inject'}, function(response) {
      console.log("Received response ", response);
      if (response && response.result && !response.error) {
        status.innerHTML = `<span style='color: green;'>` + response.result + `</span>`;
      }
      else {
        status.innerHTML = `<span style='color: red;'>Failed to load: ` + (response.error || "unknown script error") + `</span>`;
      }
    });
  });

var inject_a = document.querySelectorAll(".inject");
for (var ii = 0; ii < inject_a.length; ii ++) {
    inject_a[ii].addEventListener('click',
      function() {
        chrome.runtime.sendMessage({action: 'inject'}, function(response) {
          console.log('Received response from inject action!');
        });
    });
}

if(false) {
  document.getElementById('click_inbox').addEventListener('click',
    function() {
      chrome.runtime.sendMessage({action: 'click_inbox'}, function(response) {
        console.log('Received response from inject action!');

      });
  });
}

document.getElementById('open_in_tab').addEventListener('click',
  function() {
    window.open(chrome.runtime.getURL('html/popup.html'));
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.info) {
    update ();
  }
});

update ();

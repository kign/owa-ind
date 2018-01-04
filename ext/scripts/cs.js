var inbox;
var count;
var title;

var timer = 30;

function log(s) {
  console.log("[" +  (new Date()).toLocaleTimeString('de') + "] " + s);
}

function check_count(do_ping) {
  if (inbox === undefined) {
    var ff = document.getElementById('MailFolderPane.FavoritesFolders');
    if (ff) {
      title = document.title;
      document.title = title + '+';
      var spanList = ff.getElementsByTagName('span');
      inbox = null;
      for (var ii = 0; ii < spanList.length; ii ++ ) {
        if (spanList[ii].firstChild.nodeValue=='Inbox') {
          inbox = spanList[ii];
          break;
        }
      }
    }
  }
  var count_new;
  if (!inbox) {
    count_new = null;
  }
  else if (inbox.nextElementSibling.innerText == '') {
    count_new = 0;
  }
  else {
    count_new = parseInt(inbox.nextElementSibling.innerText);
  }
  log("setInterval fired from content script, count = " + count_new);
  var payload;
  if (count_new !== null && (count === undefined || count_new != count)) {
    count = count_new;
    payload = {count: count.toString()};
  }
  else if (do_ping) {
    payload = {ping : 'ok'};
  }
  if (payload) {
    chrome.runtime.sendMessage(
      payload, function(response) {
        if (response.reload) {
          log("About to call window.location.reload()");
          window.location.reload();
          log("Called window.location.reload()");
        }
    });
  }
}

document.onvisibilitychange = function() {
  log("onvisibilitychange(visible = " + (!document.hidden) + ")");
  chrome.runtime.sendMessage({visible: !document.hidden}, function(response) {
    if (response.check) {
      log("About to check count in response to visibility message");
      check_count(false);
    }
  });
}

check_count(true);
window.setInterval(function() {check_count(true);}, timer * 1000);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    log("Received message " + request.action);
    check_count(false);
  });



// lvHighlightSubjectClass

var inbox;
var count;
var title;

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
  var count_new = inbox?parseInt(inbox.nextElementSibling.innerText):null;
  console.log("setInterval fired from content script, count = " + count_new);
  if (count === undefined || count_new != count) {
    count = count_new;
    chrome.runtime.sendMessage(
      {count: count.toString()}, function(response) {
        if (response.reload) {
          window.location.reload();
        }
    });
  }
  else if (do_ping) {
    chrome.runtime.sendMessage({ping : 'ok'});
  }
}

document.onvisibilitychange = function() {
  console.log("onvisibilitychange(visible = " + (!document.hidden) + ")");
  chrome.runtime.sendMessage({visible: !document.hidden}, function(response) {
  });
}

window.setInterval(function() {check_count(true);}, 10000);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Received message " + request.action);
    check_count(false);
  });



// lvHighlightSubjectClass

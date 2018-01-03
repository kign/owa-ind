var inbox;
var count;
var title;

window.setInterval(function(){
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
  else {
    chrome.runtime.sendMessage({ping : 'ok'});
  }
}, 10000);

document.onvisibilitychange = function() {
  console.log("onvisibilitychange(visible = " + (!document.hidden) + ")");
  chrome.runtime.sendMessage({visible: !document.hidden}, function(response) {
  });
}
// lvHighlightSubjectClass

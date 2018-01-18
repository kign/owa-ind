'use strict';

var xp_count = "//div[@id='MailFolderPane.FavoritesFolders']//span[text()='Inbox']/following-sibling::*[1]/span[1]/text()";
//var xp_inbox = "//div[@id='MailFolderPane.FavoritesFolders']//span[text()='Inbox']";

var xp_folders = "//div[@class='subfolders' and @role='group']/..//span[@role='heading' and @autoid]";

var folder_idx = 0;
var is_active = true;

function unload () {
  if (is_active) {
    console.log("Disabling this incarnation of content script");
    window.clearInterval(is_active);
    is_active = false;
  }
}

function check_count() {
  // if (inbox === undefined) {
  //   var ff = document.getElementById('MailFolderPane.FavoritesFolders');
  //   if (ff) {
  //     var spanList = ff.getElementsByTagName('span');
  //     inbox = null;
  //     for (var ii = 0; ii < spanList.length; ii ++ ) {
  //       if (spanList[ii].firstChild.nodeValue=='Inbox') {
  //         inbox = spanList[ii];
  //         break;
  //       }
  //     }
  //   }
  // }
  var count = document.evaluate(xp_count, document, null,
                                XPathResult.STRING_TYPE ).stringValue;
  var payload;
  if (count === undefined) {
    payload = {error: "XPath expression failed to match"};
  }
  else if (count == '') {
    payload = {count : 0};
  }
  else {
    payload = {count: parseInt(count)};
  }
  console.log("setInterval fired from content script, sending payload = ", payload);
  try {
    chrome.runtime.sendMessage(
      payload, function(response) {
        if (response && response.reload) {
          //window.location.reload();

          var folders = document.evaluate(xp_folders, document, null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
          if (folders.snapshotLength > 0) {
            if (folder_idx >= folders.snapshotLength) {
              folder_idx = 0;
            }
            var folder = folders.snapshotItem(folder_idx ++);
            folder.click();
            console.log("Simulated " + folder.textContent + " click");
          }
          else {
            console.log("Can't simulate click, XPath returned empty set");
          }

        //   var inbox = document.evaluate(xp_inbox, document, null,
        //                                 XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
        //   if (inbox !== undefined) {
        //       inbox.click();
        //       console.log("Simulated Inbox click");
        //     }
        //     else {
        //       console.log("Can't click on Inbox, not initialized");
        //     }
        // }
      }
    });
  }
  catch (err) {
    console.log("Error trying to sendMessage() ", err);
    unload();
  }
}

function config () {
  chrome.runtime.sendMessage(
    {action: 'config'}, function(response) {
      check_count();
      is_active = window.setInterval(
        function() {check_count(true);}, response.timer * 1000);
  });
}

document.onvisibilitychange = function() {
  if (!is_active) return;
  console.log("onvisibilitychange(visible = " + (!document.hidden) + ")");
  chrome.runtime.sendMessage({visible: !document.hidden}, function(response) {
    if (response.check) {
      console.log("About to check count in response to visibility message");
      check_count();
    }
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!is_active) return;
    console.log("Received message " + request.action);
    if (request.action == 'click_inbox') {
      if (inbox !== undefined)
        inbox.click();
    }
    else {
      check_count(false);
    }
  });

config ();

'loaded';



// lvHighlightSubjectClass

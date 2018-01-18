'use strict';

//var xp_count = "//div[@id='MailFolderPane.FavoritesFolders']//span[text()='Inbox']/following-sibling::*[1]/span[1]/text()";
//var xp_inbox = "//div[@id='MailFolderPane.FavoritesFolders']//span[text()='Inbox']";

var xp_count_elm = "//div[@id='MailFolderPane.FavoritesFolders']//span[text()='Inbox']/following-sibling::*[1]/span[1]";


var xp_folders = "//div[@class='subfolders' and @role='group']/..//span[@role='heading' and @autoid]";

var count_elm;
var folder_idx = 0;
var interval_handler;
var observer = new MutationObserver(function(e) {
  console.log("About to check count due to MutationObserver triggered");
  check_count ();
});

function unload () {
  if (interval_handler) {
    console.log("Disabling this incarnation of content script");
    window.clearInterval(interval_handler);
    observer.disconnect ();
    interval_handler = false;
  }
}

function buzz () {
  console.log("About to check count due to timer");
  check_count ();
}

function check_count() {
  var count = count_elm.textContent;
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
      count_elm = document.evaluate(xp_count_elm, document, null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
      if (count_elm) {
        console.log("Performing initial count check");
        check_count();
        interval_handler = window.setInterval(buzz, response.buzz_interval * 1000);
        observer.observe(count_elm, {
            characterData: true,
            childList: true,
            subtree: true,
            attributes: true
        });
      }
      else {
        chrome.runtime.sendMessage({error: "XPath counter element not found"});
      }
  });
}

document.onvisibilitychange = function() {
  if (!interval_handler) return;
  console.log("onvisibilitychange(visible = " + (!document.hidden) + ")");
  chrome.runtime.sendMessage({visible: !document.hidden}, function(response) {
    if (response.check) {
      console.log("About to check count due to response received from visibility change message");
      check_count();
    }
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!interval_handler) return;
    console.log("Received message " + request.action);
    if (request.action == 'click_inbox') {
      if (inbox !== undefined)
        inbox.click();
    }
    else {
      console.log("About to check count in response to explicit message ", request);
      check_count();
    }
  });

config ();

'loaded';

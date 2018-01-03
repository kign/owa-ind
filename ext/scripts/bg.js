'use strict';

chrome.alarms.create("owa-ind", {delayInMinutes: 1, periodInMinutes: 1});

console.log("Page bg.js loaded");
localStorage.last_ping = 0;
localStorage.status = 'init';
chrome.browserAction.setTitle({title: "Initializing"});
localStorage.last_reload = time();
localStorage.last_activated = 0;
localStorage.last_count = -1;
localStorage.tabId = -1;

chrome.alarms.onAlarm.addListener(function() {
  console.log("Alarm fired");
  if (time() - localStorage.last_ping > 30) {
    set_status('err');
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  localStorage.last_ping = time();
  localStorage.tabId = sender.tab.id;
  if (request.count != undefined) {
    console.log("Badge changed to " + request.count);
    chrome.browserAction.setBadgeText({text: request.count});
    if (localStorage.visible == "false"   &&
        localStorage.last_count>-1        &&
        request.count>localStorage.last_count) {
      chrome.notifications.create({
            type:     'basic',
            iconUrl:  'icons/icon_128.png',
            title:    "You've got mail!",
            message:  "" + request.count + " unread messages",
            // buttons: [
            //   {title: 'Keep it Flowing.'}
            // ],
            priority: 0});
      set_status('ok_attn');
      console.log("Show notifications, " + request.count + " messages > " + localStorage.last_count);
    }
    else {
      console.log("No notifications, visible = " + localStorage.visible + ", last_count = " + localStorage.last_count);
    }
    chrome.browserAction.setTitle({title: "" + request.count + " unread messages"});
    localStorage.last_count = request.count;
  }
  else if (request.visible !== undefined) {
    localStorage.visible = request.visible;
    console.log("Visibility changed to " + request.visible  + ", " + localStorage.visible);
    if (request.visible) {
      var td = time() - localStorage.last_activated;
      console.log("Time since last activated : " + td);
      set_status('ok');
    }
  }
  else if (request.ping !== undefined) {
    console.log("Received ping");
  }
  else {
    console.log("Received unknown message from content script");
  }
  var td = time() - localStorage.last_reload;
  var do_reload = td > 600 && localStorage.visible == "false";
  if (do_reload) {
    console.log("Requesting content script to reload, " + td + " secs since last reload");
    localStorage.last_reload = time();
  }
  else {
    console.log("No need to reload, " + td + " elapsed");
  }
  sendResponse({reload : do_reload});
  if (localStorage.status != "ok" && localStorage.status != "ok_attn")
    set_status('ok');
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  var tabId = activeInfo.tabId;
  localStorage.last_activated = (new Date()).getTime();
  console.log("tab " + tabId + " activated");
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var change =
    ((undefined !== changeInfo.url)               ?"url":
    ((undefined !== changeInfo.audible)           ?"audible":
    ((undefined !== changeInfo.title)             ?"title":
    ((undefined !== changeInfo.status)            ?"status":
    ((undefined !== changeInfo.pinned)            ?"pinned":
    ((undefined !== changeInfo.discarded)         ?"discarded":
    ((undefined !== changeInfo.autoDiscardable)   ?"autoDiscardable":
    ((undefined !== changeInfo.mutedInfo)         ?"mutedInfo":
    ((undefined !== changeInfo.favIconUrl)        ?"favIconUrl":
    "other")))))))));
  console.log("tab " + tabId + " changed " + change);
});

function time () {
  return (new Date()).getTime()/1000.0;
}

function set_status(status) {
  if (localStorage.status == status)
    return;

  console.log("Status changed to " + status);

  if (status == "init") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_red.png'});
    chrome.browserAction.setTitle({title: "Initialization"});
  }
  else if (status == "err") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_red.png'});
    chrome.browserAction.setTitle({title: "Error"});
  }
  else if (status == "ok") {
    chrome.browserAction.setIcon({path : 'icons/icon_128.png'});
    if (localStorage.status != "ok_attn")
      chrome.browserAction.setTitle({title: "OK"});
  }
  else if (status == "ok_attn") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_attn.png'});
    if (localStorage.status != "ok")
      chrome.browserAction.setTitle({title: "OK"});
  }

  localStorage.status = status;
}

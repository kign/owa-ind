'use strict';

log("Page bg.js (re-)loaded");

// Options/constants
var lost_connection_timeout = 60;
var reload_timer = 700;

// Aux functions

function time () {
  return (new Date()).getTime()/1000.0;
}

function set_status(status) {
  if (localStorage.status == status)
    return;

  log("Status changed to " + status);

  if (status == "init") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_red.png'});
    chrome.browserAction.setTitle({title: "Initialization"});
  }
  else if (status == "err") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_red.png'});
    chrome.browserAction.setTitle({title: "Error"});
    chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icons/icon_128_red.png',
          title:    "ERROR",
          message:  "Lost connection to OWA tab",
          requireInteraction: true,
          // buttons: [
          //   {title: 'Keep it Flowing.'}
          // ],
          priority: 0});
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

function log(s) {
  console.log("[" +  (new Date()).toLocaleTimeString('de') + "] " + s);
}

// event listeners

chrome.runtime.onInstalled.addListener(function(details) {
  localStorage.status = 'init';
  localStorage.last_ping = 0;
  localStorage.last_reload = time();
  localStorage.last_activated = 0;
  localStorage.last_count = -1;
  localStorage.tabId = -1;

  chrome.alarms.create("owa-ind", {delayInMinutes: 1, periodInMinutes: 1});

  log("Extension installed");
});

chrome.alarms.onAlarm.addListener(function() {
  log("Alarm fired");
  if (time() - localStorage.last_ping > lost_connection_timeout) {
    log("" + (time() - localStorage.last_ping) + " elapsed since last ping");
    set_status('err');
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  localStorage.last_ping = time();
  localStorage.tabId = sender.tab.id;
  if (request.count != undefined) {
    log("Badge changed to " + request.count);
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
      log("Show notifications, " + request.count + " messages > " + localStorage.last_count);
    }
    else {
      log("No notifications, visible = " + localStorage.visible + ", last_count = " + localStorage.last_count);
    }
    chrome.browserAction.setTitle({title: "" + request.count + " unread messages"});
    localStorage.last_count = request.count;
  }
  else if (request.visible !== undefined) {
    localStorage.visible = request.visible;
    log("Visibility changed to " + request.visible  + ", " + localStorage.visible);
    if (request.visible) {
      var td = time() - localStorage.last_activated;
      log("Time since last activated : " + td);
      set_status('ok');
    }
    else {
      sendResponse({check : true});
    }
  }
  else if (request.ping !== undefined) {
    log("Received ping");
  }
  else {
    log("Received unknown message from content script");
  }
  var td = time() - localStorage.last_reload;
  var do_reload = td > reload_timer && localStorage.visible == "false";
  if (do_reload) {
    log("Requesting content script to reload, " + td + " secs since last reload");
    localStorage.last_reload = time();
  }
  else {
    log("No need to reload, " + td + " elapsed");
  }
  sendResponse({reload : do_reload});
  if (localStorage.status != "ok" && localStorage.status != "ok_attn")
    set_status('ok');
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  var tabId = activeInfo.tabId;
  localStorage.last_activated = (new Date()).getTime();
  log("tab " + tabId + " activated");
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
  log("tab " + tabId + " changed " + change);

  if (tabId == localStorage.tabId) {
    if (changeInfo.audible !== undefined) {
      log("Audible tab, sending message to check count");
      chrome.tabs.sendMessage(tabId, {action: 'check'});
    }
    localStorage.last_ping = time();
  }
});

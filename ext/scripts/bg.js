'use strict';

console.log("Page bg.js (re-)loaded");

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

  console.log("Status changed to " + status);

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
  else if (status == "cs_err") {
    chrome.browserAction.setIcon({path : 'icons/icon_128_yellow.png'});
    chrome.browserAction.setTitle({title: localStorage.cs_error});
  }
  localStorage.status = status;
  chrome.runtime.sendMessage({info: 'status_upd'});
}

// event listeners

chrome.runtime.onInstalled.addListener(function(details) {
  localStorage.status = 'init';
  localStorage.last_ping = 0;
  localStorage.last_reload = time();
  localStorage.last_activated = 0;
  localStorage.last_count = -1;
  localStorage.tabId = -1;

  chrome.browserAction.setPopup({popup: 'html/popup.html'});
  chrome.alarms.create("owa-ind", {delayInMinutes: 1, periodInMinutes: 1});

  console.log("Extension installed");
});

chrome.alarms.onAlarm.addListener(function() {
  console.log("Alarm fired");
  if (['ok','ok_attn'].includes(localStorage.status) &&
      time() - localStorage.last_ping > lost_connection_timeout) {
    console.log("" + (time() - localStorage.last_ping) + " elapsed since last ping");
    set_status('err');
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var asynchResponseRequested = false;

  if (!sender.tab) {
    if (request.action == 'inject') {
      console.log("Message inject");
      chrome.tabs.executeScript({
        file: 'scripts/cs.js'
      }, function (res_a) {
        if (chrome.runtime.lastError)
          console.log("Cannot load script cs.js, " + chrome.runtime.lastError.message);

        sendResponse({error: chrome.runtime.lastError?
                             chrome.runtime.lastError.message:null,
                      result: res_a?res_a[0]:null});
      });
      asynchResponseRequested = true;
    }
    else if (request.action == 'click_inbox') {
      console.log("Message click_inbox");
      var tabId = parseInt(localStorage.tabId);
      if (tabId > 0) {
        chrome.tabs.sendMessage(tabId, {action: 'click_inbox'});
      }
    }
    else {
      console.log("Received unknown message from somewhere");
    }
  }

  else {
    localStorage.last_ping = time();
    console.log("Message from " + sender.tab.id);

    if (request.action == 'config') {
      console.log("Received config call from tab " + sender.tab.id);
      localStorage.tabId = sender.tab.id;
      sendResponse({timer: 30});
    }
    else if (request.count != undefined) {
      if (localStorage.last_count == request.count) {
        console.log("Count reported " + request.count + ", no changes");
      }
      else {
        console.log("Badge changed to " + request.count);
        chrome.browserAction.setBadgeText({text: request.count.toString()});
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
      var td = time() - localStorage.last_reload;
      var do_reload = td > reload_timer && localStorage.visible == "false";
      if (do_reload) {
        console.log("Requesting content script to reload, " + td + " secs since last reload");
        localStorage.last_reload = time();
      }
      else if (request.error != undefined) {
        localStorage.cs_error = request.error;
        set_status('cs_err');
      }
      else {
        console.log("No need to reload, " + td + " elapsed");
      }
      sendResponse({reload : do_reload});
    }
    else if (request.visible !== undefined) {
      localStorage.visible = request.visible;
      console.log("Visibility changed to " + request.visible  + ", " + localStorage.visible);
      if (request.visible) {
        var td = time() - localStorage.last_activated;
        console.log("Time since last activated : " + td);
        set_status('ok');
      }
      else {
        sendResponse({check : true});
      }
    }
    else {
      console.log("Received unknown message from content script");
    }
    if (localStorage.status != "ok" && localStorage.status != "ok_attn")
      set_status('ok');
  }

  return asynchResponseRequested;
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

  if (tabId == localStorage.tabId) {
    if (changeInfo.audible !== undefined) {
      console.log("Audible tab, sending message to check count");
      chrome.tabs.sendMessage(tabId, {action: 'check'});
    }
    localStorage.last_ping = time();
  }
});

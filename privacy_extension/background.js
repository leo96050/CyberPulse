// background.js
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // Your logic for blocking third-party cookies and scripts
    // Example:
    if (details.originUrl && !details.initiatorUrl.startsWith(details.originUrl.split('/', 3).join('/'))) {
      return {cancel: true};
    }
  },
  {urls: ["<all_urls>"]},
  ["blocking"]
);

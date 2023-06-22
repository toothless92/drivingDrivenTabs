document.addEventListener('mousedown', function(e) {
  console.log('mousedown');
  if (e.button === 1) {  // Detect middle-click
    console.log('middle click')
    if (e.altKey) {
      console.log('alt key held during click')
      newTab = true
    }
    else newTab = false
    lastClickInfo = {
      time: Date.now(),
      href: e.target.href,  // Grab href directly if available
      newTab: newTab
    };
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console
  if (message.type === "get-last-click-info") {
    sendResponse(lastClickInfo);
  }
});
document.addEventListener('mousedown', function(e) {
  console.log('mousedown');
  if (e.button === 1) {  // Detect middle-click
    console.log('middle click')
    lastClickInfo = {
      time: Date.now(),
      href: e.target.href  // Grab href directly if available
    };
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console
  if (message.type === "get-last-click-info") {
    sendResponse(lastClickInfo);
  }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "setDrivingTab",
      title: "Set as driving tab",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "setDrivenTab",
      title: "Set as driven tab",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
        id: "unbindDrivingTab",
        title: "Unbind Driving Tab",
        contexts: ["page"]
      });
      chrome.contextMenus.create({
        id: "unbindDrivenTab",
        title: "Unbind Driven Tab",
        contexts: ["page"]
      });
      chrome.contextMenus.create({
        id: "unbindBothTabs",
        title: "Unbind Both Tabs",
        contexts: ["page"]
      });

      chrome.storage.local.set({ 'drivingTabId': 0 })
      chrome.storage.local.set({ 'drivenTabId': 0 })
      chrome.storage.local.set({ 'previousDrivingTabId': 0 })
      chrome.storage.local.set({ 'previousDrivenTabId': 0 })
  });

  async function getTabIds(){
    return await chrome.storage.local.get(['drivingTabId', 'drivenTabId', 'previousDrivingTabId', 'previousDrivenTabId'])
  }

  async function setDrivingTab(tabId) {
    var _previousDrivingTabId
    await chrome.storage.local.set({ 'drivingTabId': tabId })
    result = await getTabIds();
    console.log(`driving tab set with ID ${tabId}. Previous id was ${result.PreviousDrivingTabId}.`)
    await updateTabLabel(tabId);
    console.log(result.drivenTabId)
    console.log(parseInt(result.drivenTabId))
    await updateTabLabel(parseInt(result.drivenTabId));
    if (result.previousDrivingTabId === undefined) _previousDrivingTabId = tabId;
    else _previousDrivingTabId = parseInt(result.previousDrivingTabId);
    await updateTabLabel(_previousDrivingTabId);
    await chrome.storage.local.set({ 'previousDrivingTabId': tabId })
  }

  async function setDrivenTab(tabId) {
    await chrome.storage.local.set({ 'drivenTabId': tabId });
    result = await getTabIds();
    console.log(`driving tab set with ID ${tabId}. Previous id was ${result.PreviousDrivenTabId}.`)
    await updateTabLabel(tabId);
    await updateTabLabel(parseInt(result.drivingTabId));
    if (result.previousDrivenTabId === undefined) _previousDrivenTabId = tabId;
    else _previousDrivenTabId = parseInt(result.previousDrivenTabId);
    await updateTabLabel(_previousDrivenTabId);
    await chrome.storage.local.set({ 'previousDrivenTabId': tabId })
  }
  
  async function unbindDrivingTab() {
    console.log('unbinding driving tab')
    result = await getTabIds();
    await chrome.storage.local.set({ 'drivingTabId': 0 })
    await updateTabLabel(parseInt(result.drivingTabId));
    await updateTabLabel(parseInt(result.drivenTabId));
    }
  
  async function unbindDrivenTab() {
    console.log('unbinding driven tab')
    result = await getTabIds();
    await chrome.storage.local.set({ 'drivenTabId': 0 })
    await updateTabLabel(parseInt(result.drivenTabId));
    await updateTabLabel(parseInt(result.drivingTabId));
  }
  
  async function unbindBothTabs() {
    await unbindDrivingTab();
    await unbindDrivenTab();
    }


function updateTitle (label) {
    console.log(`Injected code updating title using label: ${label}`)
    firstThreeChars = document.title.substring(0,3)
    firstFourChars = document.title.substring(0,4)
    hasLabel =
        ((firstThreeChars === '(D)') ||
        (firstThreeChars === '(d)')  || 
        (firstFourChars === '(D*)')  ||
        (firstFourChars === '(d*)'))
    console.log(firstThreeChars)

    if ((label != "0") && !(hasLabel)) {
        console.log("setting label; previously unset")
        document.title = label + document.title
    }
    else {
        if (hasLabel && (label === "0")) {
            console.log("unsetting label; previously set")
            document.title = document.title.split(')').pop()
        }
    }
};


async function updateTabLabel(_tabId) {
    result = await getTabIds();
    drivingTabId = result.drivingTabId
    drivenTabId = result.drivenTabId

    console.log(`current driving tab is ${drivingTabId} and current driven tab is ${drivenTabId}`)
    if ((_tabId != drivingTabId) && (_tabId != drivenTabId)) {label = "0"}
    else if ((_tabId === drivingTabId) && (drivenTabId === 0)) {label = '(D*)'}
    else if ((_tabId === drivenTabId) && (drivingTabId === 0)) {label = '(d*)'}
    else if ((_tabId === drivingTabId) && (drivenTabId != 0)) {label = '(D)'}
    else if ((_tabId === drivenTabId) && (drivingTabId != 0)) {label = '(d)'}
    console.log(`updating tab ${_tabId} label --> ${label}`)
    // Inject a script into the tab to extract the form
    chrome.scripting.executeScript({
        target: { tabId: _tabId },
        func: updateTitle,
        args: [label]
        }); 
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    // skip urls like "chrome://" to avoid extension error
    if (tab.url?.startsWith("chrome://")) return undefined;
    updateTabLabel(tabId) 
})

  
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "setDrivingTab":
            setDrivingTab(tab.id);
            break;
        case "setDrivenTab":
            setDrivenTab(tab.id);
            break;
        case "unbindDrivingTab":
            unbindDrivingTab();
            break;
        case "unbindDrivenTab":
            unbindDrivenTab();
            break;
        case "unbindBothTabs":
            unbindBothTabs();
            break;
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    previousTabId = currentTabId;
    currentTabId = activeInfo.tabId;
  });

chrome.tabs.onCreated.addListener(async function(tab) {
    let activeTabs = await chrome.tabs.query({active: true, currentWindow: true});
    let result = await getTabIds();
    console.log(`new tab ${tab.id} created, current active tab is ${activeTabs[0].id}`)
    console.log(`active tab array: ${JSON.stringify(activeTabs)}`)
    console.log(`previous active tab id was ${previousTabId}`)
    
    console.log(`openerid: ${activeTabs[0].openerTabId}`)
    if (activeTabs[0].openerTabId === undefined) {id = activeTabs[0].id; console.log(`using standard ID ${id} as origin ID`)}
    else {id = activeTabs[0].openerTabId; console.log(`using OpenerTabId ${id} as origin ID`);}

    if (((id === result.drivingTabId) || (previousTabId === result.drivingTabId)) && result.drivenTabId !== null) {
        console.log('created tab was spawned from the driving tab')
        let response = await chrome.tabs.sendMessage(result.drivingTabId, {type: "get-last-click-info"});
        if (response && Date.now() - response.time < 500) {  // Adjust the threshold as needed
            console.log('Middle click detected from driving tab within time threshold')
            // If a real link was clicked, send URL directly to driven page
            if (response.href) {
                console.log(`Normal link. URL: ${tab.url}`)
                await chrome.tabs.update(result.drivenTabId, {url: response.href, active: true});
                await chrome.tabs.remove(tab.id);
                console.log(`Removing tab ${tab.id}`)
            } 
            // If a simulated link was clicked (new tab was opened after clicking non-link element), delay to get URL
            else {
                setTimeout(async function(){
                let newTab = await chrome.tabs.get(tab.id);
                console.log(`Simulated link. URL: ${newTab.url.url}`)
                await chrome.tabs.update(result.drivenTabId, {url: newTab.url, active: true});
                await chrome.tabs.remove(tab.id);
                console.log(`Removing tab ${tab.id}`)
                }, 500); // Adjust delay time as needed
            }
        }
    }
});
  
chrome.tabs.onRemoved.addListener(async function(tabId, removeInfo) {
    let result = await getTabIds();

    if(tabId === result.drivenTabId) {
        await chrome.storage.local.remove("drivenTabId");
    } else if(tabId === result.drivingTabId) {
        await chrome.storage.local.remove("drivingTabId");
    }
});
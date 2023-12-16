// code to inject content.js file into active tab
var masterTab;
var pagesCount;
var domain;
var lastIndexUrl = "";
// var lastAnchorTag;

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (message.anchorTagsLength) {
    pagesCount = message.anchorTagsLength;
    domain = message.domain;
  }
});
chrome.action.onClicked.addListener(async (tab) => {
  let fetchedContrastResult = [];
  var count = 0;
  // code to inject content.js file into active tab
  masterTab = tab.id;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });

  // code to open new tab to check contrast
  chrome.runtime.onMessage.addListener(async function (
    message,
    sender,
    sendResponse
  ) {
    if (message.action === "openNewTab") {
      console.log("message recevied for open new tab");
      const tab = await openNewTab(message.url);
      await executeFunction(tab.id);
      await delay(1000);
      await closeTab(tab.id);
    }
    if (message.action === "lastIndex") {
      lastIndexUrl = message.url;
      console.log(lastIndexUrl);
    }
    if (Array.isArray(message.elementContrast)) {
      fetchedContrastResult.push(message.elementContrast);
    }

    if (message.addChildExtMsg === "addChildExt") {
      addChildExt(message.url, message.domain);
    }

    // function to refresh the background script

    if (message.action === "refresh") {
      console.log("refreshed");
      chrome.runtime.reload();
    }
  });

  // ************* All FunctionS Start Here **********************************************************************************

  //function to open New Tabs
  async function openNewTab(url) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tab);
        }
      });
    });
  }

  //function to insert logic.js file
  async function executeFunction(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["logic.js"],
      });
    } catch (error) {
      console.error(error);
    }
  }

  // function to delay to close the tab so logic.js file executes
  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //function to close all tabs
  async function closeTab(tabId) {
    // check url of the tab
    const tabInfo = await chrome.tabs.get(tabId);
    const tabPendingUrl1 = tabInfo.pendingUrl;
    const tabPendingUrl2 = tabInfo.url;
    const tabUrl = tabPendingUrl1 ? tabPendingUrl1 : tabPendingUrl2;
    console.log(tabPendingUrl1, tabPendingUrl2, tabUrl);

    // console.log("lastIndexUrl ",lastIndexUrl);

    count++;
    //  console.log(count,pagesCount)
    if (count == pagesCount) {
      // console.log(domain, fetchedContrastResult);
      const data = {
        contrastResult: fetchedContrastResult,
      };
      chrome.tabs.sendMessage(masterTab, {
        type: "dataFromBackground",
        data: data,
      });
      fetchedContrastResult = [];
    }
    return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
      // console.log(lastIndexUrl, "inside closed tab", tabUrl);
      if (lastIndexUrl === tabUrl) {
        console.log("lastIndexClosed", tabUrl);
        chrome.tabs.sendMessage(masterTab, {
          action: "lastIndexClosed",
          url: tabUrl,
        });
      }
    });
  }

  // // Function to open child extensions
  // chrome.tabs.onCreated.addListener(async function (tab) {
  //   const tabId = tab.id;
  //   const tabInfo = await chrome.tabs.get(tabId);
  //   const url = tabInfo.url;
  //   const pendingUrl = tabInfo.pendingUrl;
  //   console.log(tab, url, domain, pendingUrl);
  //   if (tab.id !== masterTab) {
  //     try {
  //       if (url.includes(domain) || pendingUrl.includes(domain)) {
  //         console.log("childExt added");
  //         await chrome.scripting.executeScript({
  //           target: { tabId: tab.id },
  //           files: ["childExt.js"],
  //         });
  //       }
  //     } catch (error) {
  //       console.log("Error executing script:", "Different Domain");
  //     }
  //   }
  // });
});

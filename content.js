(function () {
  let ext = document.querySelector(".client-extension-container");
  // var myPort = chrome.runtime.connect({ name: "port-from-cs" });
  let anchorTagsLength = 0;
  let allHref;
  let fetchedHeadingsResult = [];
  let allHeadings = [];
  let fetchedTileResult = [];
  let fetchedimgValues = [];

  if (ext != null) {
    removeExt();
  } else {
    const activePageUrl = window.location.href.includes("flsitebuilder");
    if (!activePageUrl) {
      init();
      sendRequest();
      // console.log(anchorTagsLength, "anchorTagsLength");
      chrome.runtime.sendMessage({
        domain: document.domain,
        anchorTagsLength: anchorTagsLength,
        lastAnchorTag: allHref[anchorTagsLength - 1],
      });
    } else {
      alert(
        "You are using the extension on a builder site. Please try it on a live site."
      );
    }
  }

  function init() {
    console.log("content script is added through background js");
    const injectExt = addExthtml();
    const injectElement = document.createElement("div");
    injectElement.className = "client-extension-container";
    injectElement.id = "pr-ext";
    injectElement.innerHTML = injectExt;
    document.body.appendChild(injectElement);
    loader();
  }

  // code to send the request to background script to open all links
  function sendRequest() {
    let count = 0;
    let domain = "https://" + document.domain;
    getAllAnchor();
    allHref.map(async (hrefValues) => {
      try {
        let url = domain + hrefValues;
        const response = await fetch(url);
        const htmlString = await response.text();
        const parser = new DOMParser();
        const document = parser.parseFromString(htmlString, "text/html");
        checkHeadingStructure(document, url);
        checkTitles(document, url);
        getAllimg(document, url);
      } catch (error) {
        console.log(error);
      }
      count++;

      if (count === anchorTagsLength) {
        const receivedData = {
          fetchedHeadingsResult,
          fetchedTileResult,
          allHeadings,
          fetchedimgValues,
        };
        displayResult(receivedData);
        displayContrastElement();
        runExtScript();
        copyCheckedElementsFunc();
        checkAllFailedElementsFunc();
        openIframe();
      }
    });
  }
  // code to get all anchor tags prsent on th epage
  function getAllAnchor() {
    let domain = "https://" + document.domain;
    const anchorTags = document.querySelectorAll("a");
    let hrefValues = [];
    let targetValues = [];
    anchorTags.forEach((anchor) => {
      let href = anchor.getAttribute("href");
      let target = anchor.getAttribute("target");
      if (
        href &&
        !href.includes("tel:") &&
        !href.includes("mailto:") &&
        !href.includes("#")
      ) {
        hrefValues.push(href);
      }
      if (href && target && target.includes("_blank")) {
        targetValues.push(href);
      }
    });
    let href = [];
    let filterdHrefValues = hrefValues.filter(
      (value) => !targetValues.includes(value)
    );
    filterdHrefValues.forEach((anchor) => {
      if (anchor.includes(domain)) {
        let nHref = anchor.replace(domain, "");

        href.push(nHref);
      } else {
        href.push(anchor);
      }
    });
    href = href.filter(Boolean);
    allHref = [...new Set(href)];
    anchorTagsLength = allHref.length;
    // console.log(anchorTagsLength);
    // return allHref;
  }

  // code to add the popup into content script
  function addExthtml() {
    const insertExt = `
  <div class="client-side-extension-body ext-popup" id="ext_body">
   <navbar class="m-nav">
    <ul>
        <li>
            <button type="button" class="m-btn-data-0 m-btn active" data-tab="0">Heading</button>
        </li>
        <li>
            <button type="button" class="m-btn-data-1 m-btn" data-tab="1">Contrast</button>
        </li>
        <li>
            <button type="button" class="m-btn-data-2 m-btn" data-tab="2">Title</button>
        </li>
        <li>
            <button type="button" class="m-btn-data-3 m-btn" data-tab="3">img</button>
        </li>
        </ul>
   </navbar>


   <div class="m-main-content">
   </div>
   <button class="ext-close btn" id="ext_close">X</button>
</div>
<button class="ext-open btn" id="ext_open">A</button>
<div class="ext-overlay show" id ='ext_overlay'></div>  


  `;
    return insertExt;
  }
  function runExtScript() {
    const extClose = document.getElementById("ext_close");
    const extBody = document.getElementById("ext_body");
    const extOpen = document.getElementById("ext_open");
    const extOverLay = document.getElementById("ext_overlay");
    const checkContrastBtn = document.getElementById("checkContrastBtn");
    // extension open and close
    extClose.addEventListener("click", function () {
      extBody.classList.remove("ext-popup");
      extOpen.classList.add("show");
      extOverLay.classList.remove("show");
    });

    extOpen.addEventListener("click", function () {
      extBody.classList.add("ext-popup");
      extOverLay.classList.add("show");
      extOpen.classList.remove("show");
    });

    //******************/ show div on respective btn click***********************
    const listContainer = document.querySelector(".m-nav ul");
    const listBtn = document.querySelectorAll(".m-btn");
    listContainer.addEventListener("click", function (e) {
      const clicked = e.target.closest(".m-btn");
      // console.log(clicked)
      if (!clicked) return;
      document.querySelectorAll(".m-result-row").forEach(function (e) {
        e.classList.remove("active");
      });
      document.querySelectorAll(".m-btn").forEach(function (e) {
        e.classList.remove("active");
      });
      if (clicked.classList.contains("m-btn")) {
        const dataTab = clicked.getAttribute("data-tab");
        clicked.classList.add("active");
        document
          .querySelector(`.m-result-row-${dataTab}`)
          .classList.add("active");
      }
    });

    //**************** */ check Color Contrast - open  links in badges single click***************************/
    let index = 0;
    const batchSize = 30;
    let loaderInitialized = false;

    checkContrastBtn.addEventListener("click", function () {
      if (!loaderInitialized) {
        loader();
        loaderInitialized = true;
      }
      let domain = "https://" + document.domain;

      for (let i = index; i < index + batchSize && i < allHref.length; i++) {
        try {
          let url = domain + allHref[i];
          chrome.runtime.sendMessage({ action: "openNewTab", url: url });
          console.log("message sent to open tab");
          if (i === index + batchSize - 1 || i === allHref.length - 1) {
            chrome.runtime.sendMessage({
              action: "lastIndex",
              lastIndex: i,
              url: url,
            });
            console.log(
              url,
              "ekdam last url",
              allHref[anchorTagsLength - 1],
              allHref.length - 1,
              "i=",
              i,
              "index=",
              index,
              "batchSize=",
              batchSize
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
      index += batchSize;

      if (index >= allHref.length) {
        index = 0; // Reset index if all links have been processed
        checkContrastBtn.remove();
      }
      checkContrastBtn.innerText = `Button Will Trigger Automatically To Check Contrast For Remaining (${Math.max(
        0,
        allHref.length - index
      )}) Links`;
      checkContrastBtn.style.opacity = "0.6";
      checkContrastBtn.style.backgroundColor = "#fff";
      checkContrastBtn.style.color = "#333";
    });

    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      let domain = "https://" + document.domain;
      if (
        request.action === "lastIndexClosed" &&
        request.url !== domain + allHref[anchorTagsLength - 1]
      ) {
        checkContrastBtn.click();
        console.log("btn clicked", domain + allHref[anchorTagsLength - 1]);
      }
    });

    //**************** */ check Color Contrast open 30 links in single click***************************/
  }
  function loader() {
    const loaderDiv = document.createElement("div");
    loaderDiv.className = "loader";
    loaderDiv.innerHTML = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
    const extBody = document.getElementById("ext_body");
    extBody.appendChild(loaderDiv);
  }

  // code to add the result into popup

  function displayResult(receivedData) {
    document.querySelector(".loader").remove();
    console.log(receivedData);
    const {
      allHeadings,
      fetchedHeadingsResult,
      fetchedTileResult,
      fetchedimgValues,
    } = receivedData;

    displayHeadingResult(fetchedHeadingsResult);
    allHeadingsFunc(allHeadings);
    displayTitleResult(fetchedTileResult);
    allImageFunc(fetchedimgValues);
  }

  // *********************************functions to dispaly results**************************

  function displayHeadingResult(headingResult) {
    // console.log(headingResult);
    const mainContent = document.querySelector(".m-main-content");
    const selectAllFailed = document.createElement("input");
    selectAllFailed.setAttribute("type", "checkbox");
    selectAllFailed.classList.add("selectAllFailed");
    const selectAllFailedLabel = document.createElement("label");
    selectAllFailedLabel.setAttribute("class", "selectAllFailedLabel");
    selectAllFailedLabel.innerText = "Select all failed elements";
    const headingResultDiv = document.createElement("div");
    headingResultDiv.classList.add("m-result-row", "active", "m-result-row-0");
    headingResultDiv.setAttribute("id", "headingResult");
    headingResultDiv.setAttribute("data-target", "result-0");
    headingResultDiv.appendChild(selectAllFailed);
    headingResultDiv.appendChild(selectAllFailedLabel);
    mainContent.appendChild(headingResultDiv);

    if (headingResult.length > 0) {
      const headingContainer = document.createElement("div");
      headingContainer.classList.add("headingContainer");
      headingResultDiv.appendChild(headingContainer);

      const ulBold = document.createElement("ul");
      ulBold.classList.add("headingTitle", "m-title");
      ulBold.innerHTML = `
    <li>Element</li>
    <li>Element Heading</li>
    `;
      headingContainer.appendChild(ulBold);
      for (let i = 0; i < headingResult.length; i++) {
        headingResult[i].forEach((heading) => {
          let { result, url } = heading;
          result = result || "";
          url = url || "";

          const container = document.createElement("div");
          container.classList.add("page-heading", "m-failed-container");
          container.innerHTML = `
              <ul class="failed-heading-container failed-container">
              <li>${result}</li>
                <li><a data-href=${url}>${url}</a></li>
              </ul>
            `;
          headingContainer.appendChild(container);
        });
      }
    } else {
      const noIssueContainer = document.createElement("div");
      noIssueContainer.classList.add("noIssueContainer");
      noIssueContainer.innerHTML = "No Heading structure Issues";
      headingResultDiv.appendChild(noIssueContainer);
    }
  }

  function displayContrastElement() {
    const mainContent = document.querySelector(".m-main-content");
    const contrastResultDiv = document.createElement("div");
    contrastResultDiv.classList.add("m-result-row", "m-result-row-1");
    contrastResultDiv.setAttribute("id", "contrastResult");
    contrastResultDiv.setAttribute("data-target", "result-1");
    mainContent.appendChild(contrastResultDiv);
    const checkContrastBtn = document.createElement("button");
    checkContrastBtn.classList.add("m-btn");
    checkContrastBtn.setAttribute("id", "checkContrastBtn");
    checkContrastBtn.innerText = `Check Contrast for ${allHref.length}`;
    contrastResultDiv.appendChild(checkContrastBtn);
  }
  function displayContrastResult(contrastResult) {
    // console.log(contrastResult);
    const contrastResultDiv = document.getElementById("contrastResult");
    const selectAllFailed = document.createElement("input");
    selectAllFailed.setAttribute("type", "checkbox");
    selectAllFailed.classList.add("selectAllFailed");
    const selectAllFailedLabel = document.createElement("label");
    selectAllFailedLabel.setAttribute("class", "selectAllFailedLabel");
    selectAllFailedLabel.innerText = "Select all failed elements";

    contrastResultDiv.appendChild(selectAllFailed);
    contrastResultDiv.appendChild(selectAllFailedLabel);
    // document.getElementById("checkContrastBtn").remove();
    document.querySelector(".loader").remove();
    if (contrastResult.length > 0) {
      const contrastContainer = document.createElement("div");
      contrastContainer.classList.add("contrastContainer");
      contrastResultDiv.appendChild(contrastContainer);

      // unique datas

      const commonData = {};

      for (const item of contrastResult) {
        const url = item[0];
        const data = item.slice(1);

        for (const entry of data) {
          const entryString = JSON.stringify(entry);
          if (commonData[entryString]) {
            commonData[entryString].urls.push(url);
          } else {
            commonData[entryString] = { ...entry, urls: [url] };
          }
        }
      }

      const commonDataArray = Object.values(commonData);

      // unique datas

      for (let i = 0; i < commonDataArray.length; i++) {
        const ulBold = document.createElement("ul");
        ulBold.classList.add("contrastTitle", "m-title");
        ulBold.innerHTML = `
                        <li>Element</li>
                        <li>Element Type</li>
                        <li>Element FG Color</li>
                        <li>Element BG Color</li>
                        `;
        let { element, type, fgColor, bgColor, urls } = commonDataArray[i];
        element = element || "";
        type = type || "";
        fgColor = fgColor ? `rgb ${fgColor.r}, ${fgColor.g}, ${fgColor.b}` : "";
        bgColor = bgColor ? `rgb ${bgColor.r}, ${bgColor.g}, ${bgColor.b}` : "";
        // console.log(element, type, fgColor, bgColor,urls)

        const pageUrlDiv = document.createElement("div");
        pageUrlDiv.classList.add("pageUrl");

        const container = document.createElement("div");
        container.classList.add("page-cc", "m-failed-container");

        const ulElement = document.createElement("ul");
        ulElement.classList.add(
          "failed-contrast-container",
          "failed-container"
        );

        const ulUrlElement = document.createElement("ul");
        ulUrlElement.classList.add(
          "failed-contrast-container-url",
          "failed-container"
        );

        const liElement1 = document.createElement("li");
        // liElement1.textContent = element;
        liElement1.innerHTML = `<input type="checkbox"> ${element}`;

        const liElement2 = document.createElement("li");
        liElement2.textContent = type;

        const liElement3 = document.createElement("li");
        liElement3.textContent = fgColor;

        const liElement4 = document.createElement("li");
        liElement4.textContent = bgColor;

        ulElement.appendChild(liElement1);
        ulElement.appendChild(liElement2);
        ulElement.appendChild(liElement3);
        ulElement.appendChild(liElement4);

        contrastContainer.appendChild(container);
        urls.forEach((url) => {
          const urlList = document.createElement("li");
          urlList.className = "failed-urls";
          urlList.innerHTML = `<a data-href=${url} target="_blank">${url}</a>`;
          ulUrlElement.appendChild(urlList);
        });
        container.appendChild(ulBold);
        container.appendChild(ulElement);
        container.appendChild(ulUrlElement);
      }
      const checkCcDiv = document.querySelector(".contrastContainer .page-cc");
      if (!checkCcDiv) {
        const noIssueContainer = document.createElement("div");
        noIssueContainer.classList.add("noIssueContainer");
        noIssueContainer.innerHTML = "No Color Contrast Issue";
        contrastResultDiv.appendChild(noIssueContainer);
      }
    } else {
      const noIssueContainer = document.createElement("div");
      noIssueContainer.classList.add("noIssueContainer");
      noIssueContainer.innerHTML = "No Color Contrast Issue";
      contrastResultDiv.appendChild(noIssueContainer);
    }
  }

  function displayTitleResult(titleResult) {
    const flfooterbrand = document.querySelector(".flfooterbrand a");
    let firmName;
    let titleContainer;
    const mainContent = document.querySelector(".m-main-content");
    const titleResultDiv = document.createElement("div");
    titleResultDiv.classList.add("m-result-row", "m-result-row-2");
    titleResultDiv.setAttribute("id", "titleResult");
    titleResultDiv.setAttribute("data-target", "result-2");

    const selectAllFailed = document.createElement("input");
    selectAllFailed.setAttribute("type", "checkbox");
    selectAllFailed.setAttribute("style", "visibility:hidden");
    selectAllFailed.classList.add("selectAllFailed");
    const selectAllFailedLabel = document.createElement("label");
    selectAllFailedLabel.setAttribute("class", "selectAllFailedLabel");
    selectAllFailedLabel.setAttribute("style", "visibility:hidden");
    selectAllFailedLabel.innerText = "Select all failed elements";

    if (flfooterbrand) {
      firmName = flfooterbrand.text;
    } else {
      firmName = "";
    }
    if (titleResult.length > 0) {
      titleContainer = document.createElement("div");
      titleContainer.classList.add("titleContainer");

      function checkTitlesFunc(firmName, titleContainer) {
        titleContainer.innerHTML = "";

        const ulBold = document.createElement("ul");
        ulBold.classList.add("pagetTitle", "m-title");
        ulBold.innerHTML = `
        <li><Strong style="font-size:25px;padding:10px 0px;display:block;">Site Titles</strong></li>
        `;
        titleContainer.appendChild(ulBold);

        for (let i = 0; i < titleResult.length; i++) {
          titleResult[i].forEach((title) => {
            let { pageTitle, url } = title;
            pageTitle = pageTitle || "";
            url = url || "";

            // logic to check the firm name is added or not
            const checkSiteTitle = !title.pageTitle.includes(firmName);
            const checkTitlePosn = title.pageTitle.substring(
              title.pageTitle.length - firmName.length,
              title.pageTitle.length
            );

            const failedTitles = checkSiteTitle || checkTitlePosn !== firmName;
            const container = document.createElement("div");
            container.classList.add("page-titles", "m-failed-container");
            if (failedTitles) {
              titleResultDiv.classList.add("has-failed-elements");
            } else {
              console.log("no failed element");
            }
            const failedStyle = failedTitles
              ? "color:#d80000 !important"
              : "color:#333333";
            container.innerHTML = `
            <ul class="failed-title-container failed-container">
            <input type="checkbox">
                <li style="${failedStyle}">${pageTitle}</li>
                <li style="${failedStyle}"><a data-href=${url} target="_blank">${url}</a></li>
            </ul>
        `;

            titleContainer.appendChild(container);
          });
        }
      }
      checkTitlesFunc(firmName, titleContainer);

      // function to check the titles if firm name is empyt
      function addFirmNameManually(titleResultDiv, titleContainer) {
        const firmNameInput = document.createElement("input");
        firmNameInput.setAttribute("type", "text");
        firmNameInput.setAttribute("placeholder", "Enter Site Title");
        firmNameInput.classList.add("ext-title-firmNameInput");
        firmNameInput.style.margin = "10px";
        firmNameInput.style.padding = "10px";

        const firmNameInputBtn = document.createElement("button");
        firmNameInputBtn.setAttribute("type", "button");
        firmNameInputBtn.classList.add("ext-title-firmNameInputBtn", "m-btn");
        firmNameInputBtn.style.margin = "10px";
        firmNameInputBtn.innerText = "Submit";

        // document
        //   .querySelector("#titleResult .titleContainer")
        //   .insertAdjacentElement("beforebegin", firmNameInput);
        // document
        //   .querySelector("#titleResult .titleContainer")
        //   .insertAdjacentElement("beforebegin", firmNameInputBtn);

        firmNameInputBtn.addEventListener("click", function () {
          const firmName = document.querySelector(
            ".ext-title-firmNameInput"
          ).value;
          console.log(firmName);
          checkTitlesFunc(firmName.trim(), titleContainer);
        });
        titleResultDiv.appendChild(firmNameInput);
        titleResultDiv.appendChild(firmNameInputBtn);
      }
      if (firmName === "") {
        addFirmNameManually(titleResultDiv, titleContainer);
      }
    }
    const pageHeading = document.querySelectorAll(".page-heading-container");
    pageHeading.forEach((element) => {
      const hasPageHeading = element.querySelector(".page-heading") !== null;

      if (!hasPageHeading) {
        // element.style.display = "none";
        element.remove();
      }
    });

    titleResultDiv.appendChild(selectAllFailed);
    titleResultDiv.appendChild(selectAllFailedLabel);
    titleResultDiv.appendChild(titleContainer);
    mainContent.appendChild(titleResultDiv);
  }

  function allHeadingsFunc(allHeadings) {
    const headingResultDiv = document.getElementById("headingResult");
    if (allHeadings.length > 0) {
      const headingContainer = document.createElement("div");
      headingContainer.classList.add("headingContainer");
      headingResultDiv.appendChild(headingContainer);

      const headingContainerHeading = document.createElement("strong");
      headingContainerHeading.innerText = "Headings To Be Capitlized";
      headingContainerHeading.style.padding = "15px 0px";
      headingContainerHeading.style.fontSize = "25px";
      headingContainer.appendChild(headingContainerHeading);

      for (let i = 0; i < allHeadings.length; i++) {
        const url = allHeadings[i][0];
        const pageHeadingContainer = document.createElement("div");
        pageHeadingContainer.className =
          "page-heading-container m-failed-container";
        const failedUrl = document.createElement("div");
        failedUrl.className = "failed-url";
        // failedUrl.innerHTML = `<input type="checkbox"><a data-href=${url} target="_blank">${url}</a>`;
        failedUrl.innerHTML = `<input type="checkbox"><a  data-href =${url}>${url}</a>`;
        pageHeadingContainer.appendChild(failedUrl);

        allHeadings[i].forEach((headings) => {
          let { headingText } = headings;
          // console.log(headingText);
          headingText = headingText || "";
          // console.log(headingText, url);
          const headingWords = headingText.split(/ /);
          let hasLowercase = false;
          // to Chack For the Lowe Case Heading
          headingWords.forEach((word) => {
            // console.log(headingText,url)
            const firstWord = word.charAt(0);
            if (/[a-z]/.test(firstWord)) {
              hasLowercase = true;
            }
          });

          if (hasLowercase) {
            const container = document.createElement("div");
            container.classList.add("page-heading", "m-failed-container");
            container.innerHTML = `<li>${headingText}</li>`;
            pageHeadingContainer.appendChild(container);
          }

          // to check for the Uppercase Headings
          let hasUpperCase = false;
          headingWords.forEach((word) => {
            if (word.length > 1) {
              const isString = /^[a-zA-Z]+$/.test(word);
              const isUppercase = word.toUpperCase() === word;
              // console.log(isString, isUppercase, headingWords, headingText, url);
              // console.log(word, caplitalWords === word);
              if (isUppercase && isString) {
                hasUpperCase = true;
              }
            }
          });

          if (hasUpperCase) {
            // console.log("hasUpperCase", headingText, url);

            const container = document.createElement("div");
            container.classList.add("page-heading", "m-failed-container");
            container.innerHTML = `
                      <ul class="failed-heading-container failed-container">
                          <li>${headingText}</li>
                      </ul>
                  `;
            pageHeadingContainer.appendChild(container);
          }
        });
        headingContainer.appendChild(pageHeadingContainer);
      }
    } else {
      const noIssueContainer = document.createElement("div");
      noIssueContainer.classList.add("noIssueContainer");
      noIssueContainer.innerHTML = "No Heading structure Issues";
      headingResultDiv.appendChild(noIssueContainer);
    }
  }

  function allImageFunc(imgValuesResult) {
    function getUniqueImages(imgValues) {
      const uniqueImages = [];

      imgValues.forEach((imgList) => {
        imgList.forEach((img) => {
          const { src, alt, url } = img;
          const isUnique = !uniqueImages.some(
            (uniqueImg) => uniqueImg.src === src && uniqueImg.alt === alt
          );

          if (isUnique) {
            uniqueImages.push({ src, alt, url });
          }
        });
      });

      return uniqueImages;
    }

    const uniqueImgValues = getUniqueImages(imgValuesResult);

    // console.log("uniqueImgValues", uniqueImgValues);
    let domain = "https://" + document.domain;
    const mainContent = document.querySelector(".m-main-content");
    const imgResultDiv = document.createElement("div");
    imgResultDiv.classList.add("m-result-row", "m-result-row-3");
    imgResultDiv.setAttribute("id", "imgResult");
    imgResultDiv.setAttribute("data-target", "result-3");
    mainContent.appendChild(imgResultDiv);

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("imgContainer");
    imgResultDiv.appendChild(imgContainer);

    const ulBold = document.createElement("ul");
    ulBold.classList.add("imgTitle", "m-title");
    ulBold.innerHTML = `
    <li style="font-size:25px;padding:10px 0;">Images</li>
    <li style="font-size:25px;padding:10px 0;">Alt Text</li>
    `;
    imgContainer.appendChild(ulBold);
    for (let i = 0; i < uniqueImgValues.length; i++) {
      const container = document.createElement("div");
      container.classList.add("page-heading", "m-failed-container");
      container.innerHTML = `
              <ul class="img-container failed-container">
              <input type="checkbox">
             
              <li><img style="width:150px;height:auto;background-color:rgba(0,0,0,0.25)" src= ${
                uniqueImgValues[i].src.startsWith("http")
                  ? uniqueImgValues[i].src
                  : domain + uniqueImgValues[i].src
              } alt=${uniqueImgValues[i].alt}></li>
              <li class='alt-text'><a data-href=${
                uniqueImgValues[i].url
              } target="_blank">"${uniqueImgValues[i].alt}"</a></li>
              </ul>
            `;
      imgContainer.appendChild(container);
    }
  }

  // *******************functions to dispaly results End***********************

  // #########################functions run on Http Request#########################

  // **************code to check Heading Start*****************

  function checkHeadingStructure(document, url) {
    let validHeadings = [];
    let invalidHeadings = [];
    let innerHeadingText = [];

    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let firstHeading = headings[0];
    let isValidStructure = true;
    let hasMultipleH1 = false;
    let hasBlankHeading = false;
    let result = "";

    if (document.querySelectorAll("h1").length > 1) {
      hasMultipleH1 = true;
    }

    for (let i = 0; i < headings.length; i++) {
      let headingText = headings[i].innerText.trim();
      if (headingText === "") {
        hasBlankHeading = true;
        break;
      }
    }

    let previousLevel = 0;
    for (let i = 0; i < headings.length; i++) {
      let currentLevel = parseInt(headings[i].tagName.charAt(1));

      if (currentLevel > previousLevel + 1) {
        isValidStructure = false;
        break;
      }
      previousLevel = currentLevel;
    }

    if (firstHeading.tagName.toLowerCase() !== "h1") {
      result += "h1 is not the first heading. ";
      invalidHeadings.push({ result, url });
    } else if (hasMultipleH1) {
      result += "Multiple h1 headings detected. ";
      invalidHeadings.push({ result, url });
    } else if (hasBlankHeading) {
      result += "Blank heading detected. ";
      invalidHeadings.push({ result, url });
    } else if (!isValidStructure) {
      result += "Invalid heading structure. ";
      invalidHeadings.push({ result, url });
    } else {
      result += "Heading structure is valid. ";
      validHeadings.push({ result, url });
    }
    Array.from(headings).forEach(function (heading) {
      const headingText = heading.textContent;
      innerHeadingText.push({ headingText });
    });
    // let myPort = chrome.runtime.connect({ name: "port-from-cs" });
    // console.log(invalidHeadings);
    if (invalidHeadings.length >= 1) {
      fetchedHeadingsResult.push(invalidHeadings);
    }

    innerHeadingText.unshift(url);
    allHeadings.push(innerHeadingText);
  }
  // **************code to check Heading End*****************

  //************************Code To check Title Tags Starts*********************************************//
  function checkTitles(document, url) {
    let titles = [];
    const pageTitle = document.querySelector("title").text;
    titles.push({ pageTitle, url });
    fetchedTileResult.push(titles);
  }
  //************************Code To check Title Tags Ends*********************************************//

  //************************Code To check img Tags start*********************************************//

  function getAllimg(document, url) {
    const imgTags = document.querySelectorAll("img");
    let imgValues = [];
    imgTags.forEach((img) => {
      let src = img.getAttribute("src");
      // let src = document.domain + img.getAttribute("src");
      let alt = img.getAttribute("alt");
      const hasAlt = img.hasAttribute("alt");
      const isAltVsbl = !src.startsWith("http");
      if (hasAlt) {
        // console.log(src);
        imgValues.push({ src, alt, url });
      } else if (!hasAlt && isAltVsbl) {
        imgValues.push({ src, alt: "No alt", url });
      }
    });

    fetchedimgValues.push(imgValues);
  }

  //************************Code To check img Tags Ends*********************************************//

  // to check the contrast
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.type === "dataFromBackground") {
      const receivedData = request.data;

      const { contrastResult } = receivedData;
      displayContrastResult(contrastResult);
      copyCheckedElementsFunc();
    }
  });

  // function to remove and refresh extension
  function removeExt() {
    ext.remove();
    chrome.runtime.sendMessage({ action: "refresh" });
  }

  window.addEventListener("beforeunload", function () {
    try {
      chrome.runtime.sendMessage({ action: "refresh" });
    } catch (error) {
      console.log("Extension refreshed");
    }
  });

  //***************** */Start Copy the content btn ***********************
  function copyCheckedElementsFunc() {
    const checkBoxes = document.querySelectorAll(
      "#ext_body .m-main-content .m-result-row"
    );

    function createCopyBtn(element) {
      const extMainContent = element.closest(".m-result-row");
      const mCopyBtn = extMainContent.querySelector("#m-copy-btn");
      if (!mCopyBtn) {
        const copyBtnInsert = document.createElement("button");
        copyBtnInsert.classList.add("m-btn");
        copyBtnInsert.setAttribute("type", "button");
        copyBtnInsert.setAttribute("id", "m-copy-btn");
        copyBtnInsert.classList.add("m-copy-btn");
        copyBtnInsert.innerText = "Copy Checked Elements";
        extMainContent.insertBefore(copyBtnInsert, extMainContent.firstChild);
        copyCheckedElements();
      }
    }

    function copyCheckedElements() {
      const copyBtns = document.querySelectorAll(
        "#ext_body .m-main-content .m-copy-btn"
      );
      copyBtns.forEach((copyBtn) => {
        copyBtn.addEventListener("click", (element) => {
          const parentElement = element.target.closest(".m-result-row");
          const mFailedCopy = parentElement.querySelectorAll(
            ".m-failed-container-copy"
          );
          let copyText = "";
          mFailedCopy.forEach((e) => {
            copyText = copyText + "\n" + e.innerText;
          });

          navigator.clipboard.writeText(copyText);
          element.target.innerText = "Text Copied!";

          setTimeout(function () {
            element.target.innerText = "Copy Checked Elements";
          }, 2000);
        });
      });
    }

    checkBoxes.forEach((checkBox) => {
      checkBox.addEventListener("click", (event) => {
        if (
          event.target.tagName === "INPUT" &&
          !event.target.classList.contains("selectAllFailed")
        ) {
          event.target
            .closest(".m-failed-container")
            .classList.add("m-failed-container-copy");
          createCopyBtn(event.target);
        }
        if (
          event.target.tagName === "INPUT" &&
          !event.target.classList.contains("selectAllFailed") &&
          !event.target.checked
        ) {
          event.target
            .closest(".m-failed-container")
            .classList.remove("m-failed-container-copy");
        }
      });
    });
  }

  function checkAllFailedElementsFunc() {
    const allFailedChecks = document.querySelectorAll(
      "#ext_body .m-main-content .m-result-row"
    );

    allFailedChecks.forEach((failedChecks) => {
      failedChecks.addEventListener("click", function (e) {
        console.log(e.target.classList.contains("selectAllFailed"));
        if (e.target.classList.contains("selectAllFailed")) {
          const checkBoxes = failedChecks.querySelectorAll(
            ".m-failed-container input[type='checkbox']"
          );

          function createCopyBtn(element) {
            const extMainContent = element.closest(".m-result-row");
            const mCopyBtn = extMainContent.querySelector("#m-copy-btn");
            if (!mCopyBtn) {
              const copyBtnInsert = document.createElement("button");
              copyBtnInsert.classList.add("m-btn");
              copyBtnInsert.setAttribute("type", "button");
              copyBtnInsert.setAttribute("id", "m-copy-btn");
              copyBtnInsert.classList.add("m-copy-btn");
              copyBtnInsert.innerText = "Copy Checked Elements";
              extMainContent.insertBefore(
                copyBtnInsert,
                extMainContent.firstChild
              );
              copyCheckedElements();
            }
          }

          function copyCheckedElements() {
            const copyBtns = document.querySelectorAll(
              "#ext_body .m-main-content .m-copy-btn"
            );
            copyBtns.forEach((copyBtn) => {
              copyBtn.addEventListener("click", (element) => {
                const parentElement = element.target.closest(".m-result-row");
                const mFailedCopy = parentElement.querySelectorAll(
                  ".m-failed-container-copy"
                );
                let copyText = "";
                mFailedCopy.forEach((e) => {
                  copyText = copyText + "\n" + e.innerText;
                });

                navigator.clipboard.writeText(copyText);
                element.target.innerText = "Text Copied!";

                setTimeout(function () {
                  element.target.innerText = "Copy Checked Elements";
                }, 2000);
              });
            });
          }

          checkBoxes.forEach((checkBox) => {
            checkBox.checked = true;
            checkBox
              .closest(".m-failed-container")
              .classList.add("m-failed-container-copy");
            createCopyBtn(checkBox);
            checkBox.dispatchEvent(new Event("click"));
          });
        }
      });
    });
  }

  //***************** */End Copy the content btn ***********************
  // ############################### Child Extension Code ###########################################

  // code to open iframe for respective click

  function openIframe() {
    const target = document.querySelector(
      ".client-side-extension-body .m-main-content"
    );
    target.addEventListener("click", async function (e) {
      if (e.target.tagName === "A") {
        const iframeSrc = e.target.getAttribute("data-href");
        try {
          let url = iframeSrc;
          const response = await fetch(url);
          const htmlString = await response.text();

          const iframeContainer = document.createElement("div");
          iframeContainer.classList.add("m-ext-ally-iframe-container");
          iframeContainer.setAttribute("id", "m-ext-ally-iframe-container");

          const iframe = document.createElement("iframe");
          iframe.classList.add("m-ext-ally-iframe");
          iframe.setAttribute("id", "m-ext-ally-iframe");

          iframe.srcdoc = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                a{cursor:pointer !important;}
                #prt-ch-ext .client-side-extension-body {
                  width: auto;
                  position: fixed;
                  top: 10%;
                  transform: translate(-50%);
                  left: 50%;
                  min-width: 70vw;
                  max-width: 70vw;
                  background-color: #fff;
                  padding: 1rem;
                  overflow: hidden;
                  border-width: 3px;
                  border-style: solid;
                  border-color: #6400FF;
                  border-image: initial;
                  border-radius: 15px;
                  box-sizing: border-box;
                  color: #333 !important;
                  min-height: 70vh;
              }
              
              #prt-ch-ext #ext_body {
                  min-height: 70vh !important;
                  max-height: fit-content;
                  padding-bottom: 4vh;
              }
              
              /* hide the popup */
              #prt-ch-ext .client-side-extension-body {
                  display: none;
              }
              
              #prt-ch-ext .client-side-extension-body.ext-popup {
                  display: block;
                  z-index: 99999;
              }
              
              /* Overlay */
              #prt-ch-ext .ext-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background-color: rgba(0, 0, 0, 0.2);
                  backdrop-filter: blur(1px);
                  z-index: 9999;
                  display: none;
              }
              
              #prt-ch-ext .ext-overlay.show {
                  display: block;
              }
              
              /* popup close btn */
              #prt-ch-ext .ext-close {
                  position: absolute;
                  top: 10px;
                  right: 20px;
                  font-size: 20px;
                  font-family: sans-serif;
                  border: none;
                  font-weight: 700;
              }
              #prt-ch-ext .ext-move {
                  position: absolute;
                  top: -5px;
                  background-color:transparent;
                  right: 50%;
                  font-size: 20px;
                  font-family: sans-serif;
                  border: none;
                  font-weight: 700;
                  transform:translateX(50%);
              }
              
              /* Popup Open Btn */
              #prt-ch-ext .ext-open {
                  position: fixed;
                  bottom: 10px;
                  left: 20px;
                  font-size: 20px;
                  font-family: sans-serif;
                  border: none;
                  font-weight: 700;
                  height: 60px;
                  width: 60px;
                  border-radius: 50%;
                  background-color: #6400FF;
                  color: #fff;
                  border: 1px solid #fff;
                  display: none;
                  z-index: 999999;
              }
              
              /* show and hide popup upen btn */
              #prt-ch-ext .ext-open.show {
                  display: block;
              }
              
              #prt-ch-ext .m-main-content {
                  overflow-y: scroll;
                  overflow-x: auto;
                  word-break: break-word;
                  min-height: 70vh;
                  max-height: 70vh;
                  padding-top: 00px;
              }
              
              #prt-ch-ext .m-nav ul {
                  list-style: none;
                  display: flex;
                  flex-direction: row;
                  justify-content: flex-start;
                  flex-wrap: wrap;
                  gap: 10px;
                  padding: 0;
              
              }
              
              #prt-ch-ext .m-btn {
                  padding: 10px 15px;
                  background-color: #6400FF;
                  color: #fff;
                  border: 1px solid #6400FF;
                  font-size: 16px;
                  cursor: pointer;
                  font-weight: bold;
                  border-radius: 5px;
              }
              
              #prt-ch-ext .m-btn:hover {
                  background-color: #f0f0f0;
                  color: #333;
              }
              
              #prt-ch-ext .pulse-container {
                  width: 120px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin: auto;
                  margin-top: 5rem;
              }
              
              /* loader */
              #prt-ch-ext .loader {
              
                  margin-top: 0;
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%);
              
              }
              
              #prt-ch-ext .lds-ring {
                  display: inline-block;
                  position: relative;
                  width: 80px;
                  height: 80px;
              }
              
              #prt-ch-ext .lds-ring div {
                  box-sizing: border-box;
                  display: block;
                  position: absolute;
                  width: 64px;
                  height: 64px;
                  margin: 8px;
                  border: 8px solid #fff;
                  border-radius: 50%;
                  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                  border-color: #6400FF transparent transparent transparent;
              }
              
              #prt-ch-ext .lds-ring div:nth-child(1) {
                  animation-delay: -0.45s;
              }
              
              #prt-ch-ext .lds-ring div:nth-child(2) {
                  animation-delay: -0.3s;
              }
              
              #prt-ch-ext .lds-ring div:nth-child(3) {
                  animation-delay: -0.15s;
              }
              
              @keyframes lds-ring {
                  0% {
                      transform: rotate(0deg);
                  }
              
                  100% {
                      transform: rotate(360deg);
                  }
              }
              
              #prt-ch-ext .failed-contrast-container li:empty {
                  display: none;
              }
              
              #prt-ch-ext .contrastTitle,
              #prt-ch-ext .headingTitle,
              #prt-ch-ext .failed-container {
                  display: flex;
                  align-items: flex-start;
                  list-style: none;
                  gap: 10px;
              }
              
              #prt-ch-ext .failed-contrast-container li {
                  width: 25%;
                  padding: 5px 0;
              }
              
              #prt-ch-ext .contrastTitle li {
                  font-weight: bold;
                  width: 25%;
              }
              
              #prt-ch-ext .headingTitle li,
              #prt-ch-ext .failed-heading-container li,
              #prt-ch-ext .page-titles li {
                  width: 50%;
                  padding: 5px 0;
              }
              
              #prt-ch-ext .headingTitle li,
              #prt-ch-ext .m-title {
                  font-weight: bold;
                  list-style: none;
              }
              
              #prt-ch-ext .contrastContainer,
              #prt-ch-ext .headinContainer {
                  padding-bottom: 2rem;
              }
              
              #prt-ch-ext #contrastResult,
              #prt-ch-ext #headingResult {
                  padding-top: 1rem;
              }
              
              #prt-ch-ext .pageUrl span {
                  padding-bottom: 5px;
                  display: block;
              }
              
              #prt-ch-ext .noIssueContainer {
                  display: block;
                  margin: auto;
                  text-align: center;
                  font-size: 20px;
                  padding: 1.5rem 0;
              }
              
              #prt-ch-ext .m-result-row {
                  display: block;
                  padding: 0 5px;
              }
              
              #prt-ch-ext .m-result-row.active {
                  display: block;
              }
              
              #prt-ch-ext .m-btn.active {
                  background-color: transparent;
                  color: #000;
              }
              
              #prt-ch-ext .page-titles li {
                  font-size: 14px;
                  list-style: none;
                  display: block;
                  padding: 5px 0;
              }
              
              #prt-ch-ext .img-container {
                  display: flex;
                  row-gap: 10px;
                  column-gap: 10px;
                  justify-content: space-between;
                  border: 1px solid;
                  padding: 20px;
              }
              
              #prt-ch-ext .imgTitle {
                  display: flex;
              }
              
              #prt-ch-ext .imgContainer li {
                  width: 40%;
                  text-align: center;
              }
              
              #prt-ch-ext .alt-text {
                  font-size: 20px;
              }
              
              /* failed texts */
              #prt-ch-ext .failed-url a,
              #prt-ch-ext .failed-contrast-container li {
                  color: #d80000 !important;
                  font-weight: 600;
              }
              
              #prt-ch-ext .m-main-content {
                  padding: 0 3px 3px 3px;
                  border: 1px solid #333;
              }
              
              #prt-ch-ext .m-main-content input[type='checkbox'] {
                  margin: 0px 10px !important;
              }
              
              #prt-ch-ext .failed-title-container input[type='checkbox'] {
                  position: relative;
                  top: 11px;
                  outline-offset: 0 !important;
              }
              
              #prt-ch-ext .failed-contrast-container-url {
                  flex-direction: column;
              }
              
              #prt-ch-ext .m-main-content a {
                  color: #333;
                  text-decoration: underline;
              }
              
              #prt-ch-ext .m-main-content a:hover {
                  color: #333;
                  text-decoration: none;
              }
              
              #prt-ch-ext .page-cc {
                  border: 1px solid #333;
                  padding: 10px;
                  margin: 10px;
              }
              
              
              /* Child Extension */
              #prt-ch-ext .client-extension-container .child-ext-popup .m-result-row{
                  display: block !important;
                  margin: 20px 0 !important;
              }
              #prt-ch-ext .client-extension-container .child-ext-popup .failed-heading-container li{width: fit-content !important;}
              #prt-ch-ext .child-ext-popup .headingContainer,
              #prt-ch-ext .child-ext-popup .titleContainer{
                  border: 1px solid #000 !important;
                  margin-bottom: 15px;
                  padding: 0px 10px !important;
              }
              #prt-ch-ext .child-ext-popup strong{
                  font-size: 30px !important;
                  padding-bottom: 15px !important;
              }
              #prt-ch-ext #ext_body.child-ext-popup{
                  max-width: 800px !important;
                  min-width: 460px;
                  right: 0 !important;
                  transform: none !important;
                  font-size: 14px;
                  resize:horizontal;
              }
              #prt-ch-ext .failed-container{
                  box-sizing: border-box;
                  padding: 10px;
                  border: 1px dashed rgba(0,0,0,0);
              
                }
                .pr-failed-cc-container{
                  position: absolute;
                  width: 50px;
                  letter-spacing: 0 !important;
                  line-height: 1 !important;
                  z-index: 999;
                  word-spacing: 0 !important;
                }
                
                span.pr-failed-heading-container{position:absolute;}

                </style>
                <script type="text/javascript">
                window.addEventListener('DOMContentLoaded', function () {
                  const iframeExtButton = document.createElement('button');
                  iframeExtButton.innerText = 'Read11Y';
                  iframeExtButton.setAttribute('id', 'ext-iframe-btn');
                  iframeExtButton.classList.add('ext-open','btn')
                  iframeExtButton.setAttribute('style', 'position:fixed;bottom:0;left:0;padding:15px;z-index:999;');
                  document.body.appendChild(iframeExtButton);
              
                  document.getElementById('ext-iframe-btn').addEventListener('click', function (e) {
                    // Dynamically add the JavaScript file to the document
                    const read11Y = document.createElement('script');
                    read11Y.type = 'text/javascript';
                    read11Y.src = 'https://cdn.jsdelivr.net/gh/priteshbalujawale/CheckAll/mini.js';
                    document.getElementsByTagName('head')[0].appendChild(read11Y);
              
                    // Hide the button after it is clicked
                    iframeExtButton.style.display = 'none';
                  });
                });
              </script>
              
            </head>
            <body>
                ${htmlString}
            </body>
            </html>
          `;

          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.position = "fixed";
          iframe.style.left = "0";
          iframe.style.top = "0";
          iframe.style.zIndex = "9999999999";

          iframeContainer.style.width = "99vw";
          iframeContainer.style.height = "99vh";
          iframeContainer.style.position = "fixed";
          iframeContainer.style.left = "0";
          iframeContainer.style.top = "0";
          iframeContainer.style.zIndex = "9999999999";

          // Add a close button if needed
          const closeButton = document.createElement("button");
          closeButton.classList.add("ext-close", "btn");
          closeButton.setAttribute("id", "ext_close_iframe");
          closeButton.setAttribute(
            "style",
            "z-index:9999999999999999999999999999999;position:absolute;top:0;right:0;padding:10px;background-color:rgba(0,0,0,0.6);color:#fff;font-size:18px;text-align:center;"
          );
          closeButton.textContent = "X";

          const ifraneSrcContainer = document.createElement("span");
          ifraneSrcContainer.classList.add("ext-iframe-link");
          ifraneSrcContainer.setAttribute("id", "ext_iframe_link");
          ifraneSrcContainer.setAttribute(
            "style",
            "z-index:999999999999999999999999999;position:absolute;top:0;left:0;padding:10px;background-color:rgba(0,0,0,0.6);color:#fff;font-size:18px;text-align:center;"
          );
          ifraneSrcContainer.textContent = iframeSrc;

          document.body.appendChild(iframeContainer);
          iframeContainer.appendChild(iframe);
          iframeContainer.appendChild(ifraneSrcContainer);
          iframeContainer.appendChild(closeButton);
        } catch (error) {
          console.log("Error:", error);
        }
        const extIframeContainer = document.getElementById("ext_close_iframe");
        console.log("extIframeContainer", extIframeContainer);
        if (extIframeContainer) {
          extIframeContainer.addEventListener("click", function () {
            console.log("iframe closed");
            document.getElementById("m-ext-ally-iframe-container").remove();
          });
        } else {
          console.log("No Button found");
        }
      }
    });
  }
})();

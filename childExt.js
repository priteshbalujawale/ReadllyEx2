(function () {
  var ext = document.querySelector(".client-extension-container");
  if (ext != null) {
    removeExtObject();
  } else {
    addBookMarklete();
  }

  function addBookMarklete() {
    childExtStyle();
    createElemnt();
    runExtScript();
    checkContrast();
    checkHeadingStructure();
    checkTitles();
    getAllimg();
  }

  function createElemnt() {
    // main child container
    const childContainerDiv = document.createElement("div");
    childContainerDiv.classList.add("client-extension-container");
    childContainerDiv.id = "pr-ext";
    document.body.appendChild(childContainerDiv);

    // child container body
    const childContainerBody = document.createElement("div");
    childContainerBody.classList.add(
      "client-side-extension-body",
      "child-ext-popup",
      "ext-popup"
    );
    childContainerBody.id = "ext_body";
    childContainerDiv.appendChild(childContainerBody);

    //child extension Open button
    const extOpen = document.createElement("button");
    extOpen.classList.add("ext-open", "btn");
    extOpen.id = "ext_open";
    extOpen.innerText = "A";
    childContainerDiv.appendChild(extOpen);

    //child extension close button
    const extClose = document.createElement("button");
    extClose.classList.add("ext-close", "btn");
    extClose.id = "ext_close";
    extClose.innerText = "X";
    childContainerBody.appendChild(extClose);

    // //child extension Move button
    const extMove = document.createElement("button");
    extMove.classList.add("ext-move", "btn");
    extMove.id = "ext_move";
    extMove.innerText = "Ⓜ";
    childContainerBody.appendChild(extMove);

    //   child main content
    const maniContent = document.createElement("div");
    maniContent.classList.add("m-main-content");
    childContainerBody.appendChild(maniContent);
  }

  function runExtScript() {
    const extClose = document.getElementById("ext_close");
    const extBody = document.getElementById("ext_body");
    const extOpen = document.getElementById("ext_open");
    const movableElement = document.getElementById("ext_body");
    const movableElementBtn = document.getElementById("ext_move");

    // extension open and close

    extOpen.addEventListener("click", function () {
      extBody.classList.add("ext-popup");
      extOpen.classList.remove("show");
      extBody.style.left = "auto";
      extBody.style.top = "10%";
    });
    extClose.addEventListener("click", function () {
      extBody.classList.remove("ext-popup");
      extOpen.classList.add("show");
    });

    //  to move the child extension within view port

    let isMoving = false;
    let initialX;
    let initialY;
    movableElementBtn.addEventListener("mousedown", function (event) {
      event.preventDefault();
      isMoving = true;
      initialX = event.clientX - movableElement.offsetLeft;
      initialY = event.clientY - movableElement.offsetTop;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", function () {
        isMoving = false;
        document.removeEventListener("mousemove", handleMouseMove);
      });
    });

    function handleMouseMove(event) {
      if (isMoving) {
        const newX = event.clientX - initialX;
        const newY = event.clientY - initialY;

        const maxX = window.innerWidth - movableElement.offsetWidth;
        const maxY = window.innerHeight - movableElement.offsetHeight;

        const boundedX = Math.min(maxX, Math.max(0, newX));
        const boundedY = Math.min(maxY, Math.max(0, newY));

        movableElement.style.left = boundedX + "px";
        movableElement.style.top = boundedY + "px";
      }
    }
  }

  // **************code to check contrast Start**************
  function checkContrast() {
    // console.log("inside chceckcontrast")
    let allElementsContrasts = [];
    let allElementsContrastsHTML = [];
    //   currentPage = document.URL;
    let allElements = [];
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") {
        const parentElement = node.parentElement;
        const rect = parentElement.getBoundingClientRect();

        // Check if the element's width and height are greater than 0
        if (rect.width > 0 && rect.height > 0) {
          allElements.push(parentElement);
        }
      } else {
        for (const childNode of node.childNodes) {
          traverse(childNode);
        }
      }
    }

    traverse(document.body);
    allElements.forEach((element) => {
      function extractBackgroundColor(element) {
        const computedStyles = window.getComputedStyle(element);
        const bgColor = computedStyles.backgroundColor;
        const colorComponents = bgColor.match(
          /rgba?\((\d+), (\d+), (\d+), ([\d.]+)\)/
        );
        if (
          (colorComponents && parseFloat(colorComponents[4]) < 0.55) ||
          bgColor === "transparent"
        ) {
          const parentElement = element.parentElement;

          if (parentElement) {
            return extractBackgroundColor(parentElement);
          } else {
            return "";
          }
        } else {
          return bgColor;
        }
      }
      const computedStyles = window.getComputedStyle(element);
      let fgColor = computedStyles.color;
      let bgColor = extractBackgroundColor(element);
      const fontSize = parseFloat(computedStyles.fontSize);
      function rgb2hex(rgba) {
        function extractColorValues(colorString) {
          const colorMatch = colorString.match(
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/
          );
          if (colorMatch) {
            const [, r, g, b, a] = colorMatch.map(Number);
            return { r, g, b, a: a || 1 }; // If alpha is not provided, default to 1
          } else {
            return null; // Invalid color string format
          }
        }
        let extractColor = extractColorValues(rgba);
        const red = extractColor.r;
        const green = extractColor.g;
        const blue = extractColor.b;
        const alpha = extractColor.a;

        const calculatedRed = Math.round(red * alpha + 255 * (1 - alpha));
        const calculatedGreen = Math.round(green * alpha + 255 * (1 - alpha));
        const calculatedBlue = Math.round(blue * alpha + 255 * (1 - alpha));

        const hexRed = ("0" + calculatedRed.toString(16)).slice(-2);
        const hexGreen = ("0" + calculatedGreen.toString(16)).slice(-2);
        const hexBlue = ("0" + calculatedBlue.toString(16)).slice(-2);
        // console.log("RGB 2 Hex Leaved")
        return `#${hexRed}${hexGreen}${hexBlue}`;
      }
      // taking white as standar background color to check element having background color with some opacity value

      bgColor = rgb2hex(bgColor);
      fgColor = rgb2hex(fgColor);

      // Convert hex color to rgb
      function hexToRgb(hex) {
        // console.log("Inside Hex 2 RGB")
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
          return r + r + g + g + b + b;
        });

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        // console.log("Leave Hex 2 RGB")
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      }
      // End  convert rgb color into hex
      bgColor = hexToRgb(bgColor);
      fgColor = hexToRgb(fgColor);

      function luminance(r, g, b) {
        let a = [r, g, b].map(function (v) {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }
      //     // calculate the relative luminance
      const color1luminance = luminance(fgColor.r, fgColor.g, fgColor.b);
      const color2luminance = luminance(bgColor.r, bgColor.g, bgColor.b);
      const ratio =
        color1luminance > color2luminance
          ? (color2luminance + 0.05) / (color1luminance + 0.05)
          : (color1luminance + 0.05) / (color2luminance + 0.05);

      if (ratio > 1 / 3 && fontSize > 24) {
        allElementsContrasts.push({
          element: element.textContent.trim(),
          type: "large text",
          result: "FAIL",
          fgColor: fgColor,
          bgColor: bgColor,
        });
        allElementsContrastsHTML.push(element);
      } else if (ratio > 1 / 4.5 && fontSize <= 24) {
        allElementsContrasts.push({
          element: element.textContent.trim(),
          type: "small text",
          result: "FAIL",
          fgColor: fgColor,
          bgColor: bgColor,
        });
        allElementsContrastsHTML.push(element);
      }
    });

    //   allElementsContrasts.unshift(currentPage);
    //   console.log(allElementsContrasts);
    displayContrastResult(allElementsContrasts, allElementsContrastsHTML);
  }
  // **************code to check contrast End*****************

  // **************code to check Heading Start*****************

  function checkHeadingStructure() {
    let validHeadings = [];
    let invalidHeadings = [];
    let innerHeadingText = [];
    // console.log("Inside Check Headings")
    const url = document.URL;
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let firstHeading = headings[0];
    let isValidStructure = true;
    let hasMultipleH1 = false;
    let hasBlankHeading = false;
    let result = "";
    // const resultDiv = document.getElementById('result');
    // console.log('inside headings')

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
      invalidHeadings.push({ result });
    } else if (hasMultipleH1) {
      result += "Multiple h1 headings detected. ";
      invalidHeadings.push({ result });
    } else if (hasBlankHeading) {
      result += "Blank heading detected. ";
      invalidHeadings.push({ result });
    } else if (!isValidStructure) {
      result += "Invalid heading structure. ";
      invalidHeadings.push({ result });
    } else {
      result += "Heading structure is valid. ";
      validHeadings.push({ result });
    }

    for (let i = 0; i < headings.length; i++) {
      const headingLevel = headings[i].tagName;
      const headingText = headings[i].textContent;
      innerHeadingText.push({ headingLevel, headingText });
    }
    // console.log(invalidHeadings);
    displayInvalidHeadingResult(invalidHeadings);
    displayHeadingResult(innerHeadingText);
    allElementsHeadindHTMLFunc(headings);
  }
  // **************code to check Heading End*****************

  // **************code to check Title Start *****************

  function checkTitles() {
    const url = document.URL;
    const pageTitle = document.querySelector("title").text;
    displayTitleResult(pageTitle);
  }
  // **************code to check Title End *****************
  //************************Code To check img Tags start*********************************************//

  function getAllimg() {
    const imgTags = document.querySelectorAll("img");
    let imgValues = [];
    imgTags.forEach((img) => {
      let src = document.domain + img.getAttribute("src");
      let alt = img.getAttribute("alt");
      const hasAlt = img.hasAttribute("alt");
      const isAltVsbl =
        img.getBoundingClientRect().width !== 0 &&
        img.getBoundingClientRect().height !== 0 &&
        !src.startsWith("http");

      if (hasAlt && isAltVsbl) {
        imgValues.push({ src, alt });
      } else if (!hasAlt && isAltVsbl) {
        imgValues.push({ src, alt: "No alt" });
      }
    });
    allImageFunc(imgValues);
  }

  //************************Code To check img Tags Ends*********************************************//

  function displayContrastResult(contrastResult, allElementsContrastsHTML) {
    const mainContent = document.querySelector(".m-main-content");
    const contrastResultDiv = document.createElement("div");
    contrastResultDiv.classList.add("m-result-row", "m-result-row-1");
    contrastResultDiv.setAttribute("id", "contrastResult");
    contrastResultDiv.setAttribute("data-target", "result-1");
    mainContent.appendChild(contrastResultDiv);

    if (contrastResult.length > 0) {
      const contrastContainerTitle = document.createElement("strong");
      contrastContainerTitle.classList.add("contrastContainerTitle");
      contrastContainerTitle.innerText = "Color Contrast";
      contrastResultDiv.appendChild(contrastContainerTitle);

      const highlightFailedCC = document.createElement("input");
      highlightFailedCC.setAttribute("type", "checkbox");
      highlightFailedCC.classList.add("pr-contrast-Container-CheckBox");
      contrastResultDiv.appendChild(highlightFailedCC);

      const highlightFailedCCLabel = document.createElement("label");
      highlightFailedCCLabel.classList.add(
        "pr-contrast-Container-CheckBox-label"
      );
      highlightFailedCCLabel.innerText = "Highlight Failed CC";
      highlightFailedCC.insertAdjacentHTML(
        "afterend",
        highlightFailedCCLabel.innerHTML
      );

      const contrastContainer = document.createElement("div");
      contrastContainer.classList.add("contrastContainer");
      contrastResultDiv.appendChild(contrastContainer);

      for (let i = 0; i < contrastResult.length; i++) {
        const ulBold = document.createElement("ul");
        ulBold.classList.add("contrastTitle", "m-title");
        ulBold.innerHTML = `
                          <li>Element</li>
                          <li>Element Type</li>
                          <li>Element FG Color</li>
                          <li>Element BG Color</li>
                          `;
        let { element, type, fgColor, bgColor, urls } = contrastResult[i];
        element = element || "";
        type = type || "";
        fgColor = fgColor ? `rgb ${fgColor.r}, ${fgColor.g}, ${fgColor.b}` : "";
        bgColor = bgColor ? `rgb ${bgColor.r}, ${bgColor.g}, ${bgColor.b}` : "";

        const container = document.createElement("div");
        container.classList.add("page-cc");

        const ulElement = document.createElement("ul");
        ulElement.classList.add(
          "failed-contrast-container",
          "failed-container",
          "hover-failed-contrast-container"
        );

        const liElement1 = document.createElement("li");
        liElement1.innerText = element;

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

        container.appendChild(ulBold);
        container.appendChild(ulElement);
        // container.appendChild(ulUrlElement);
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
    allElementsContrastsHTMLFunc(allElementsContrastsHTML);
  }

  function displayHeadingResult(headingResult) {
    // console.log(headingResult)
    const headingResultDiv = document.getElementById("headingResult");

    if (headingResult) {
      const headingContainer = document.createElement("div");
      headingContainer.classList.add("headingContainer");
      headingResultDiv.appendChild(headingContainer);

      // for (let i = 0; i < headingResult.length; i++) {
      headingResult.forEach((heading) => {
        const { headingLevel, headingText } = heading;

        const headingWords = headingText.split(" ");
        // to Chack For the Lowe Case Heading
        var style = "color:#000 !important";

        headingWords.forEach((word) => {
          if (word.length > 1) {
            // console.log(headingText);
            const firstWord = word.charAt(0);
            if (/[a-z]/.test(firstWord)) {
              style = "color:#d80000 !important";
            }
            // to check for the Uppercase Headings
            else if (/^[A-Z]+$/.test(word)) {
              style = "color:#d80000 !important";
            }
          }
        });

        const container = document.createElement("div");
        container.classList.add("page-heading");
        container.innerHTML = `
              <ul class="failed-heading-container failed-container">
              <li>${headingLevel}</li>
              <li style="${style}">${headingText}</li>
              </ul>
            `;
        headingContainer.appendChild(container);
      });
      // }
    } else {
      const noIssueContainer = document.createElement("div");
      noIssueContainer.classList.add("noIssueContainer");
      noIssueContainer.innerHTML = "No Heading structure Issues";
      headingResultDiv.appendChild(noIssueContainer);
    }
  }

  function displayInvalidHeadingResult(headingResult) {
    const mainContent = document.querySelector(".m-main-content");
    const headingResultDiv = document.createElement("div");
    headingResultDiv.classList.add("m-result-row", "active", "m-result-row-0");
    headingResultDiv.setAttribute("id", "headingResult");
    headingResultDiv.setAttribute("data-target", "result-0");
    mainContent.appendChild(headingResultDiv);

    const headingContainerTitle = document.createElement("strong");
    headingContainerTitle.classList.add("headingContainerTitle");
    headingContainerTitle.innerText = "Headings";
    headingResultDiv.appendChild(headingContainerTitle);

    const highlightheading = document.createElement("input");
    highlightheading.setAttribute("type", "checkbox");
    highlightheading.classList.add("pr-heading-Container-CheckBox");
    headingResultDiv.appendChild(highlightheading);

    const highlightFailedheadingLabel = document.createElement("label");
    highlightFailedheadingLabel.classList.add(
      "pr-heading-Container-CheckBox-label"
    );
    highlightFailedheadingLabel.innerText = "Highlight Headings";
    highlightheading.insertAdjacentHTML(
      "afterend",
      highlightFailedheadingLabel.innerHTML
    );

    if (headingResult.length > 0) {
      const headingContainer = document.createElement("div");
      headingContainer.classList.add("headingContainer");
      headingResultDiv.appendChild(headingContainer);

      headingResult.forEach((heading) => {
        let { result } = heading;
        const container = document.createElement("div");
        container.classList.add("page-heading");
        container.innerHTML = `
                <ul class="failed-heading-container failed-container">
                <li>${result}</li>
                </ul>
              `;
        headingContainer.appendChild(container);
      });
    } else {
      const noIssueContainer = document.createElement("strong");
      noIssueContainer.classList.add("noIssueContainer");
      noIssueContainer.innerHTML = "No Heading structure Issues";
      headingResultDiv.appendChild(noIssueContainer);
    }
  }

  function displayTitleResult(titleResult) {
    const flfooterbrand = document.querySelector(".flfooterbrand a");
    let firmName;
    if (flfooterbrand) {
      firmName = flfooterbrand.text;
    } else {
      firmName = "";
    }
    const mainContent = document.querySelector(".m-main-content");
    const titleResultDiv = document.createElement("div");
    titleResultDiv.classList.add("m-result-row", "m-result-row-2");
    titleResultDiv.setAttribute("id", "titleResult");
    titleResultDiv.setAttribute("data-target", "result-2");
    mainContent.appendChild(titleResultDiv);

    const titleContainerTitle = document.createElement("strong");
    titleContainerTitle.classList.add("titleContainerTitle");
    titleContainerTitle.innerText = "Page Title";
    titleResultDiv.appendChild(titleContainerTitle);

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("titleContainer");
    titleResultDiv.appendChild(titleContainer);

    const checkSiteTitle = !titleResult.includes(firmName);
    const checkTitlePosn = titleResult.substring(
      titleResult.length - firmName.length,
      titleResult.length
    );

    const failedTitles = checkSiteTitle || checkTitlePosn !== firmName;
    const container = document.createElement("div");
    container.classList.add("page-titles");
    const failedStyle = failedTitles
      ? "color:#d80000 !important"
      : "color:#333333";
    container.innerHTML = `
              <ul class="failed-title-container failed-container">
                  <li style="${failedStyle}">${titleResult}</li>
              </ul>
          `;

    titleContainer.appendChild(container);
  }

  function allImageFunc(imgValuesResult) {
    // console.log("imgValuesResult",imgValuesResult);

    function getUniqueImages(imgValues) {
      const uniqueSrcs = new Set();
      const uniqueImages = [];

      imgValues.forEach((img) => {
        const { src, alt } = img;
        if (!uniqueSrcs.has(src)) {
          uniqueSrcs.add(src);
          uniqueImages.push({ src, alt });
        }
      });

      return uniqueImages;
    }

    const uniqueImgValues = getUniqueImages(imgValuesResult);

    // console.log("uniqueImgValues",uniqueImgValues)
    const mainContent = document.querySelector(".m-main-content");
    const imgResultDiv = document.createElement("div");
    imgResultDiv.classList.add("m-result-row", "m-result-row-3");
    imgResultDiv.setAttribute("id", "imgResult");
    imgResultDiv.setAttribute("data-target", "result-3");
    mainContent.appendChild(imgResultDiv);

    const imgContainerTitle = document.createElement("strong");
    imgContainerTitle.classList.add("imgContainerTitle");
    imgContainerTitle.innerText = "Image";
    imgResultDiv.appendChild(imgContainerTitle);

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("imgContainer");
    imgResultDiv.appendChild(imgContainer);

    const ulBold = document.createElement("ul");
    ulBold.classList.add("imgTitle", "m-title");
    ulBold.innerHTML = `
      <li>Images</li>
      <li>Alt Text</li>
      `;
    imgContainer.appendChild(ulBold);
    for (let i = 0; i < uniqueImgValues.length; i++) {
      const container = document.createElement("div");
      container.classList.add("page-heading");
      container.innerHTML = `
                <ul class="img-container failed-container">
                  <li><img style="width:150px;height:auto" src= 'https://${uniqueImgValues[i].src}' alt=${uniqueImgValues[i].alt}></li>
                <li class='alt-text'>"${uniqueImgValues[i].alt}"</li>
                </ul>
              `;
      imgContainer.appendChild(container);
    }
  }

  // style to child extension
  function childExtStyle() {
    const childStyle = document.createElement("style");
    childStyle.type = "text/css";
    const cssContent = `
  #pr-ext .client-side-extension-body {
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

#pr-ext #ext_body {
    min-height: 70vh !important;
    max-height: fit-content;
    padding-bottom: 4vh;
}

/* hide the popup */
#pr-ext .client-side-extension-body {
    display: none;
}

#pr-ext .client-side-extension-body.ext-popup {
    display: block;
    z-index: 99999;
}

/* Overlay */
#pr-ext .ext-overlay {
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

#pr-ext .ext-overlay.show {
    display: block;
}

/* popup close btn */
#pr-ext .ext-close {
    position: absolute;
    top: 10px;
    right: 20px;
    font-size: 20px;
    font-family: sans-serif;
    border: none;
    font-weight: 700;
}
#pr-ext .ext-move {
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
#pr-ext .ext-open {
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
#pr-ext .ext-open.show {
    display: block;
}

#pr-ext .m-main-content {
    overflow-y: scroll;
    overflow-x: auto;
    word-break: break-word;
    min-height: 70vh;
    max-height: 70vh;
    padding-top: 00px;
}

#pr-ext .m-nav ul {
    list-style: none;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0;

}

#pr-ext .m-btn {
    padding: 10px 15px;
    background-color: #6400FF;
    color: #fff;
    border: 1px solid #6400FF;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
    border-radius: 5px;
}

#pr-ext .m-btn:hover {
    background-color: #f0f0f0;
    color: #333;
}

#pr-ext .pulse-container {
    width: 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: auto;
    margin-top: 5rem;
}

/* loader */
#pr-ext .loader {

    margin-top: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%);

}

#pr-ext .lds-ring {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
}

#pr-ext .lds-ring div {
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

#pr-ext .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
}

#pr-ext .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
}

#pr-ext .lds-ring div:nth-child(3) {
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

#pr-ext .failed-contrast-container li:empty {
    display: none;
}

#pr-ext .contrastTitle,
#pr-ext .headingTitle,
#pr-ext .failed-container {
    display: flex;
    align-items: flex-start;
    list-style: none;
    gap: 10px;
}

#pr-ext .failed-contrast-container li {
    width: 25%;
    padding: 5px 0;
}

#pr-ext .contrastTitle li {
    font-weight: bold;
    width: 25%;
}

#pr-ext .headingTitle li,
#pr-ext .failed-heading-container li,
#pr-ext .page-titles li {
    width: 50%;
    padding: 5px 0;
}

#pr-ext .headingTitle li,
#pr-ext .m-title {
    font-weight: bold;
    list-style: none;
}

#pr-ext .contrastContainer,
#pr-ext .headinContainer {
    padding-bottom: 2rem;
}

#pr-ext #contrastResult,
#pr-ext #headingResult {
    padding-top: 1rem;
}

#pr-ext .pageUrl span {
    padding-bottom: 5px;
    display: block;
}

#pr-ext .noIssueContainer {
    display: block;
    margin: auto;
    text-align: center;
    font-size: 20px;
    padding: 1.5rem 0;
}

#pr-ext .m-result-row {
    display: none;
    padding: 0 5px;
}

#pr-ext .m-result-row.active {
    display: block;
}

#pr-ext .m-btn.active {
    background-color: transparent;
    color: #000;
}

#pr-ext .page-titles li {
    font-size: 14px;
    list-style: none;
    display: block;
    padding: 5px 0;
}

#pr-ext .img-container {
    display: flex;
    row-gap: 10px;
    column-gap: 10px;
    justify-content: space-between;
    border: 1px solid;
    padding: 20px;
}

#pr-ext .imgTitle {
    display: flex;
}

#pr-ext .imgContainer li {
    width: 40%;
    text-align: center;
}

#pr-ext .alt-text {
    font-size: 20px;
}

/* failed texts */
#pr-ext .failed-url a,
#pr-ext .failed-contrast-container li {
    color: #d80000 !important;
    font-weight: 600;
}

#pr-ext .m-main-content {
    padding: 0 3px 3px 3px;
    border: 1px solid #333;
}

#pr-ext .m-main-content input[type='checkbox'] {
    margin: 0px 10px !important;
}

#pr-ext .failed-title-container input[type='checkbox'] {
    position: relative;
    top: 11px;
    outline-offset: 0 !important;
}

#pr-ext .failed-contrast-container-url {
    flex-direction: column;
}

#pr-ext .m-main-content a {
    color: #333;
    text-decoration: underline;
}

#pr-ext .m-main-content a:hover {
    color: #333;
    text-decoration: none;
}

#pr-ext .page-cc {
    border: 1px solid #333;
    padding: 10px;
    margin: 10px;
}


/* Child Extension */
#pr-ext .client-extension-container .child-ext-popup .m-result-row{
    display: block !important;
    margin: 20px 0 !important;
}
#pr-ext .client-extension-container .child-ext-popup .failed-heading-container li{width: fit-content !important;}
#pr-ext .child-ext-popup .headingContainer,
#pr-ext .child-ext-popup .titleContainer{
    border: 1px solid #000 !important;
    margin-bottom: 15px;
    padding: 0px 10px !important;
}
#pr-ext .child-ext-popup strong{
    font-size: 30px !important;
    padding-bottom: 15px !important;
}
#pr-ext #ext_body.child-ext-popup{
    max-width: 800px !important;
    min-width: 460px;
    right: 0 !important;
    transform: none !important;
    font-size: 14px;
    resize:horizontal;
}
#pr-ext .failed-container{
    box-sizing: border-box;
    padding: 10px;
    border: 1px dashed rgba(0,0,0,0);

  }


  `;
    childStyle.textContent = cssContent;
    document.head.appendChild(childStyle);
  }

  function allElementsContrastsHTMLFunc(allElementsContrastsHTML) {
    const failedElement = document.createElement("div");
    failedElement.innerHTML = `<span class="pr-failed-cc-container" style="background-color:#e80000;color:#fff;padding:5px;font-size:10px;">CC Fail</span>`;
    const element = allElementsContrastsHTML;
    const checkBox = document.querySelector(".pr-contrast-Container-CheckBox");
    if (checkBox) {
      checkBox.addEventListener("click", function () {
        if (checkBox.checked == true) {
          element.forEach((e) => {
            e.insertAdjacentHTML("beforebegin", failedElement.innerHTML);
          });
        } else {
          const faildCcContainer = document.querySelectorAll(
            ".pr-failed-cc-container"
          );
          faildCcContainer.forEach((e) => e.remove());
        }
      });
    }
  }
  function allElementsHeadindHTMLFunc(headings) {
    console.log(headings);
    const element = headings;
    const checkBox = document.querySelector(".pr-heading-Container-CheckBox");
    if (checkBox) {
      checkBox.addEventListener("click", function () {
        if (checkBox.checked == true) {
          element.forEach((e) => {
            const failedElement = document.createElement("div");
            failedElement.innerHTML = `<span class="pr-failed-heading-container" style="background-color:#6400FF;color:#fff;padding:5px;font-size:10px;">${e.tagName}</span>`;
            e.insertAdjacentHTML("beforebegin", failedElement.innerHTML);
          });
        } else {
          const faildHdContainer = document.querySelectorAll(
            ".pr-failed-heading-container"
          );
          faildHdContainer.forEach((e) => e.remove());
        }
      });
    }
  }

  // remove the object when extension removed
  function removeExtObject() {
    const confirmClose = confirm("Do You Want To Close The Extension");
    if (confirmClose) {
      ext.remove();

      const faildCcContainer = document.querySelectorAll(
        ".pr-failed-cc-container"
      );
      faildCcContainer.forEach((e) => e.remove());

      const faildHdContainer = document.querySelectorAll(
        ".pr-failed-heading-container"
      );
      faildHdContainer.forEach((e) => e.remove());
    }
  }
})();

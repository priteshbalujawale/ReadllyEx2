// **************code to check contrast Start**************
function checkContrast() {
  // console.log("inside chceckcontrast")
  let allElementsContrasts = [];
  currentPage = document.URL;
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
    // console.log("bgColor :",bgColor,"fgColor :", fgColor)

    bgColor = rgb2hex(bgColor);
    fgColor = rgb2hex(fgColor);
    // allElementsContrasts.push({ fgColor, bgColor, fontSize, element });

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
    //     // End  convert rgb color into hex
    bgColor = hexToRgb(bgColor);
    fgColor = hexToRgb(fgColor);
    // console.log("bgColor :",bgColor,"fgColor :", fgColor)
    // allElementsContrasts.push({ fgColor, bgColor, fontSize, element });

    //   //  logic to check contrast
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
    // console.log(color1luminance)
    // console.log(color2luminance)
    // // calculate the color contrast ratio
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
    } else if (ratio > 1 / 4.5 && fontSize <= 24) {
      allElementsContrasts.push({
        element: element.textContent.trim(),
        type: "small text",
        result: "FAIL",
        fgColor: fgColor,
        bgColor: bgColor,
      });
    }
  });

  allElementsContrasts.unshift(currentPage);
  // let myPort = chrome.runtime.connect({ name: "port-from-cs" });
  // myPort.postMessage({ elementContrast: allElementsContrasts });
  chrome.runtime.sendMessage({ elementContrast: allElementsContrasts });
  // console.log(allElementsContrasts);


}
// **************code to check contrast End*****************
checkContrast();

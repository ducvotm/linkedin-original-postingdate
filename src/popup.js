import { processJobData } from "./services/jobProcessor";
import { displayError, displayResult } from "./utils/domUtils";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup loaded!");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    console.log("Current tab:", currentTab.url);

    if (!currentTab.url.includes("linkedin.com/jobs/view/")) {
      document.getElementById("status").textContent =
        "Please open a LinkedIn job posting to see the original posting date.";
      return;
    }

    console.log("On LinkedIn job page!");

    chrome.scripting
      .executeScript({
        target: { tabId: currentTab.id },
        func: processJobData,
      })
      .then((results) => {
        const result = results[0].result;
        console.log("Got result:", result);

        if (result && result.originalDate) {
          displayResult(result);
        } else {
          throw new Error("Could not find original posting date");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        displayError(error);
      });
  });
});

// This is like our control room
document.addEventListener("DOMContentLoaded", () => {
  console.group("LinkedIn Job Date Extension");
  console.log("Popup opened!");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    console.log("Current tab URL:", currentTab.url);

    if (!currentTab.url.includes("linkedin.com/jobs/view/")) {
      console.log("Not a LinkedIn job page");
      document.getElementById("status").textContent =
        "Please open a LinkedIn job posting to see the original posting date.";
      console.groupEnd();
      return;
    }

    // Get the job ID from URL
    const jobId = currentTab.url.match(/\/jobs\/view\/(\d+)/)?.[1];
    console.log("Job ID:", jobId);

    if (!jobId) {
      console.log("Could not find job ID in URL");
      document.getElementById("status").textContent = "Invalid job URL.";
      console.groupEnd();
      return;
    }

    // Get the current job's date
    console.log("Starting to fetch job data...");
    chrome.scripting
      .executeScript({
        target: { tabId: currentTab.id },
        func: async (jobId) => {
          // Add a counter to limit retries
          let retryCount = 0;
          const MAX_RETRIES = 3;

          const fetchJobData = async () => {
            try {
              console.group(`Attempt ${retryCount + 1} to fetch job data`);

              // Get headers from the page
              const getHeaders = () => {
                // Get CSRF token from cookies
                const csrfToken =
                  document.cookie.match(/JSESSIONID="([^"]+)"/)?.[1] || "";

                // Get other headers from any existing request on the page
                const headers = {
                  accept: "application/vnd.linkedin.normalized+json+2.1",
                  "csrf-token": csrfToken,
                  "x-li-lang": "en_US",
                  "x-restli-protocol-version": "2.0.0",
                };

                // Try to get x-li-track from the page
                const liTrackElement = document.querySelector(
                  'meta[name="li-track"]'
                );
                if (liTrackElement) {
                  headers["x-li-track"] = liTrackElement.content;
                } else {
                  // Fallback to a basic track object if not found
                  headers["x-li-track"] = JSON.stringify({
                    clientVersion: "1.13.0",
                    mpVersion: "1.13.0",
                    osName: "web",
                    timezoneOffset: new Date().getTimezoneOffset(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    deviceFormFactor: "DESKTOP",
                    mpName: "voyager-web",
                  });
                }

                return headers;
              };

              const headers = getHeaders();
              console.group("Request Details");
              console.log(
                "URL:",
                `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}`
              );
              console.log("Method: GET");
              console.log("Headers:", headers);
              console.groupEnd();

              const response = await fetch(
                `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}`,
                {
                  headers: headers,
                  credentials: "include",
                }
              );

              console.group("Response Details");
              console.log("Status:", response.status);
              console.log("Status Text:", response.statusText);
              console.log(
                "Headers:",
                Object.fromEntries(response.headers.entries())
              );

              if (!response.ok) {
                console.error("Failed to fetch job data");
                console.groupEnd();
                console.groupEnd();
                throw new Error(
                  `Failed to fetch job data. Status: ${response.status}`
                );
              }

              const data = await response.json();
              console.log("Response Data:", data);
              console.groupEnd();

              if (data.data && data.data.originalListedAt) {
                const originalDate = new Date(
                  parseInt(data.data.originalListedAt)
                );
                console.log("Original Timestamp:", data.data.originalListedAt);
                console.log("Parsed Date:", originalDate);
                console.groupEnd();

                // Try multiple selectors for the posted date
                const selectors = [
                  ".jobs-unified-top-card__posted-date-ago",
                  ".jobs-unified-top-card__posted-date",
                  ".jobs-unified-top-card__posted-date-ago-text",
                  ".jobs-unified-top-card__posted-date-text",
                  '[data-test-id="job-posted-date"]',
                  ".jobs-unified-top-card__posted-date-ago-text",
                  ".jobs-unified-top-card__posted-date-text",
                  ".jobs-unified-top-card__posted-date-ago-text-container",
                ];

                let relativeDate = "Unknown";

                // First try specific selectors
                for (const selector of selectors) {
                  const element = document.querySelector(selector);
                  console.log(
                    `Trying selector "${selector}":`,
                    element?.textContent
                  );
                  if (element) {
                    const text = element.textContent.trim();
                    // Only accept text that looks like a date (contains "posted" or "ago")
                    if (
                      text.toLowerCase().includes("posted") ||
                      text.toLowerCase().includes("ago")
                    ) {
                      relativeDate = text;
                      break;
                    }
                  }
                }

                // If we still don't have a date, try to find any element containing "posted" or "ago"
                if (relativeDate === "Unknown") {
                  const allElements = document.querySelectorAll("*");
                  for (const element of allElements) {
                    const text = element.textContent.trim();
                    // Skip empty text, CSS, or very long text
                    if (
                      !text ||
                      text.length > 100 ||
                      text.includes("{") ||
                      text.includes("}")
                    ) {
                      continue;
                    }
                    if (
                      text.toLowerCase().includes("posted") ||
                      text.toLowerCase().includes("ago")
                    ) {
                      console.log("Found date text:", text);
                      relativeDate = text;
                      break;
                    }
                  }
                }

                // Clean up the relative date
                if (relativeDate !== "Unknown") {
                  // Remove any extra whitespace
                  relativeDate = relativeDate.replace(/\s+/g, " ").trim();
                  // Remove any CSS-like content
                  if (
                    relativeDate.includes("{") ||
                    relativeDate.includes("}")
                  ) {
                    relativeDate = "Unknown";
                  }
                }

                return {
                  originalDate: originalDate.toLocaleDateString(),
                  relativeDate: relativeDate,
                };
              }

              console.log("No original date found in data");
              console.groupEnd();
              console.groupEnd();
              return null;
            } catch (error) {
              console.error("Error:", error);
              console.groupEnd();
              console.groupEnd();

              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
                return fetchJobData();
              }

              throw error;
            }
          };

          return fetchJobData();
        },
        args: [jobId],
      })
      .then((results) => {
        console.group("Script Results");
        const result = results[0].result;

        if (result) {
          console.log("Job Dates:", result);
          const status = document.getElementById("status");
          if (status) {
            status.innerHTML = `
              <div style="margin-bottom: 8px;">Posted: ${result.relativeDate}</div>
              <div style="color: #0a66c2;">Original posting date: ${result.originalDate}</div>
            `;
          } else {
            console.error("Status element not found");
          }
        } else {
          console.log("No result returned from script");
          const status = document.getElementById("status");
          if (status) {
            status.textContent =
              "Could not fetch job data. Please refresh the page.";
          }
        }
        console.groupEnd();
        console.groupEnd();
      })
      .catch((error) => {
        console.error("Final error:", error);
        const status = document.getElementById("status");
        if (status) {
          status.textContent =
            "Error getting job information. Please refresh the page.";
        }
        console.groupEnd();
      });
  });
});

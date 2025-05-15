import { API } from "../constants";
import { formatDate } from "../utils/dateUtils";
import { fetchJobData, findApiRequest } from "./linkedinService";
import { setupRequestObserver } from "./observerService";

export const processJobData = async () => {
  let retryCount = 0;

  while (retryCount < API.MAX_RETRIES) {
    try {
      const apiUrl = findApiRequest();

      if (!apiUrl) {
        console.log("No existing request found, waiting for new request...");
        return new Promise((resolve, reject) => {
          const observer = setupRequestObserver(resolve, reject);

          setTimeout(() => {
            observer.disconnect();
            retryCount++;
            if (retryCount < API.MAX_RETRIES) {
              console.log(`Retry attempt ${retryCount} of ${API.MAX_RETRIES}`);
              processJobData();
            } else {
              reject("Max retries reached waiting for job data");
            }
          }, API.OBSERVER_TIMEOUT);
        });
      }

      const timestamp = await fetchJobData(apiUrl);
      return {
        originalDate: formatDate(timestamp),
        timestamp: timestamp,
      };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;

      if (retryCount < API.MAX_RETRIES) {
        console.log(`Retrying... (${retryCount}/${API.MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, API.RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }
};

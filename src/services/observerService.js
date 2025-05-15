import { API } from "../constants";
import { formatDate } from "../utils/dateUtils";
import { fetchJobData } from "./linkedinService";

export const setupRequestObserver = (resolve, reject) => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes("voyager/api/jobs/jobPostings")) {
        console.log("Found new request:", entry.name);
        observer.disconnect();

        fetchJobData(entry.name)
          .then((timestamp) => {
            resolve({
              originalDate: formatDate(timestamp),
              timestamp: timestamp,
            });
          })
          .catch(reject);
        return;
      }
    }
  });

  observer.observe({ entryTypes: ["resource"] });
  return observer;
};

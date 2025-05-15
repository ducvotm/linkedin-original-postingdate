import { API } from "../constants";

export const getCsrfToken = () => {
  return document.cookie.match(/JSESSIONID="([^"]+)"/)?.[1] || "";
};

export const findApiRequest = () => {
  const entries = performance.getEntriesByType("resource");
  console.log("Checking network entries:", entries.length);

  for (const entry of entries) {
    if (entry.name.includes("voyager/api/jobs/jobPostings")) {
      console.log("Found API request:", entry.name);
      return entry.name;
    }
  }
  return null;
};

export const fetchJobData = async (url) => {
  console.log("Fetching data from:", url);

  const originalRequest = performance.getEntriesByName(url)[0];
  if (!originalRequest) {
    throw new Error("Could not find original request");
  }

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      ...API.LINKEDIN_HEADERS,
      "csrf-token": getCsrfToken(),
    },
  });

  console.log("Response status:", response.status);
  const data = await response.json();
  console.log("Response data:", data);

  if (data?.data?.originalListedAt) {
    console.log("Found originalListedAt:", data.data.originalListedAt);
    return data.data.originalListedAt;
  }

  throw new Error("Could not find originalListedAt in response");
};

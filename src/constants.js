// API Constants
export const API = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  OBSERVER_TIMEOUT: 5000,
  LINKEDIN_HEADERS: {
    accept: "application/vnd.linkedin.normalized+json+2.1",
    "x-li-lang": "en_US",
    "x-li-track":
      '{"clientVersion":"1.13.11583","mpVersion":"1.13.11583","osName":"web","timezoneOffset":-7,"timezone":"America/Los_Angeles","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
    "x-restli-protocol-version": "2.0.0",
  },
};

// UI Constants
export const UI = {
  DATE_FORMAT: {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

export const displayResult = (result) => {
  document.getElementById("status").textContent = "Original posting date:";
  document.getElementById("originalDate").innerHTML = `
    <div>${result.originalDate}</div>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">
      Timestamp: ${result.timestamp}
    </div>
  `;
};

export const displayError = (error) => {
  let errorMessage = "Could not get the original posting date. ";

  if (error.message.includes("timed out")) {
    errorMessage += "The request took too long to complete. ";
  } else if (error.message.includes("Max retries")) {
    errorMessage += "Maximum retry attempts reached. ";
  } else if (error.message.includes("403")) {
    errorMessage +=
      "Access denied. Please make sure you're logged into LinkedIn. ";
  }

  errorMessage += "Please refresh the page and try again.";
  document.getElementById("status").textContent = errorMessage;
};

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString("en-US", UI.DATE_FORMAT);
};

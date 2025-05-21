export const scrollToBottom = (scrollElement) => {
  if (!scrollElement) return;
  
  const scroll = () => {
    scrollElement.scrollTop = scrollElement.scrollHeight;
  };

  // Attempt immediate scroll
  scroll();

  // Backup scroll after a short delay to ensure content is rendered
  setTimeout(scroll, 100);
};

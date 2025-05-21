export const customScrollbarStyles = `
  .simplebar-scrollbar::before {
    background-color: #FFB800 !important;
  }
  .simplebar-content-wrapper {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .simplebar-content-wrapper::-webkit-scrollbar {
    display: none;
  }
`;

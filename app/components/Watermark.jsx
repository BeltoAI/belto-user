"use client";

import React from "react";

const Watermark = ({ text, fontSize = 48, opacity = 0.1, rotate = -30, gap = 100 }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // Prevent interaction
        zIndex: 0, // Ensure it's behind the content
        backgroundImage: `repeating-linear-gradient(
          ${rotate}deg,
          transparent,
          transparent ${gap}px,
          rgba(0, 0, 0, ${opacity}) ${gap}px,
          rgba(0, 0, 0, ${opacity}) ${gap * 2}px
        )`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: `${fontSize}px`,
          fontFamily: "Arial, sans-serif",
          color: `rgba(0, 0, 0, ${opacity})`,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "#FFB800" }}>B</span>
        {text.replace("B", "")} {/* Replace "B" to avoid duplication */}
      </div>
    </div>
  );
};

export default Watermark;
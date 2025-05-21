"use client";

import React, { useState, useEffect } from "react";
import { Palette, Settings, Grid, FileText, Search } from "lucide-react";

// Draggable Divider Component
const DraggableDivider = ({ onClose }) => {
  return (
    <div
      onClick={onClose}
      className="w-[5px] h-8 rounded-md bg-white hover:bg-gray-300 cursor-pointer transition-colors duration-200 absolute right-0 top-1/2 -translate-y-1/2"
      role="separator"
      aria-orientation="vertical"
    />
  );
};

// Template Panel Component
const TemplatePanel = ({ onClose, isClosing }) => {
  return (
    <div className={`relative flex h-screen ${isClosing ? "animate-slideOut" : "animate-slideIn"}`}>
      <div className="w-72 bg-[#262626] border-l border-[#363636] mt-1 rounded-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <span className="text-white text-sm font-medium border-b-2 border-orange-500 pb-1">Templates</span>
              <span className="text-gray-400 text-sm font-medium pb-1">Style</span>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalogue templates"
              className="w-full bg-[#363636] text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="aspect-square bg-[#363636] rounded-lg hover:bg-[#404040] transition-colors cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>
      <DraggableDivider onClose={onClose} />
    </div>
  );
};

// Custom Panel Component
const CustomPanel = ({ onClose, isClosing }) => {
  return (
    <div className={`relative flex h-screen ${isClosing ? "animate-slideOut" : "animate-slideIn"}`}>
      <div className="w-72 bg-[#262626] border-l border-[#363636] mt-1 rounded-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Custom</h2>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search custom options"
              className="w-full bg-[#363636] text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="aspect-square bg-[#363636] rounded-lg hover:bg-[#404040] transition-colors cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>
      <DraggableDivider onClose={onClose} />
    </div>
  );
};

// Elements Panel Component
const ElementsPanel = ({ onClose, isClosing }) => {
  const categories = [
    {
      title: "Recently Used",
      images: [
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
      ],
    },
    {
      title: "Shapes",
      images: [
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
      ],
    },
    {
      title: "Graphics",
      images: [
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
      ],
    },
  ];

  return (
    <div className={`relative flex h-screen ${isClosing ? "animate-slideOut" : "animate-slideIn"}`}>
      <div className="w-72 bg-[#262626] border-l border-[#363636] mt-1 rounded-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Elements</h2>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search elements"
              className="w-full bg-[#363636] text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div className="space-y-6">
            {categories.map((category, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-medium">{category.title}</h3>
                  <button className="text-gray-400 hover:text-white text-xs">See all</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {category.images.map((img, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="w-20 h-20 flex-shrink-0 bg-[#363636] rounded-lg hover:bg-[#404040] transition-colors cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`${category.title} ${imgIndex + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DraggableDivider onClose={onClose} />
    </div>
  );
};

// Form Data Panel Component
const FormDataPanel = ({ onClose, isClosing }) => {
  const formFields = [
    { label: "Name", value: "Eroll" },
    { label: "Sharkish", value: "Sharkish" },
    { label: "Date of birth", value: "11.11.1989" },
    { label: "National ID", value: "11111111" },
    { label: "Social Security Number", value: "11111111" },
    { label: "Email", value: "Eroll@example.com" },
    { label: "City", value: "Los Angeles" },
    { label: "Zip Code", value: "90012" },
  ];

  return (
    <div className={`relative flex h-screen ${isClosing ? "animate-slideOut" : "animate-slideIn"}`}>
      <div className="w-72 bg-[#262626] border-l border-[#363636] mt-1 rounded-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Values</h2>
          </div>

          <div className="space-y-3">
            {formFields.map((field, index) => (
              <div key={index} className="space-y-1">
                <label className="text-gray-400 text-sm">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  className="w-full bg-[#363636] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                  readOnly
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <DraggableDivider onClose={onClose} />
    </div>
  );
};

// Sidebar Component
const Sidebar = () => {
  const [activePanel, setActivePanel] = useState(null); // No panel is open by default
  const [isClosing, setIsClosing] = useState(false);

  // Add styles to the document
  useEffect(() => {
    const styles = `
    @keyframes slideIn {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(-100%);
        opacity: 0;
      }
    }

    .animate-slideIn {
      animation: slideIn 0.3s ease-out forwards;
    }

    .animate-slideOut {
      animation: slideOut 0.3s ease-out forwards;
    }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Cleanup function to remove the stylesheet when the component unmounts
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActivePanel(null); // Close the panel
      setIsClosing(false);
    }, 300); // Match this with animation duration
  };

  const handleButtonClick = (panel) => {
    if (activePanel === panel) {
      handleClose(); // Close the panel if the same button is clicked again
    } else {
      setActivePanel(panel); // Open the selected panel
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case "templates":
        return <TemplatePanel onClose={handleClose} isClosing={isClosing} />;
      case "custom":
        return <CustomPanel onClose={handleClose} isClosing={isClosing} />;
      case "elements":
        return <ElementsPanel onClose={handleClose} isClosing={isClosing} />;
      case "formData":
        return <FormDataPanel onClose={handleClose} isClosing={isClosing} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex">
      {/* Main Sidebar */}
      <div className="z-1 h-screen w-20 bg-[#262626] px-2 py-4 flex flex-col gap-2 mt-1 rounded-md">
        <button
          onClick={() => handleButtonClick("templates")}
          className={`w-full aspect-square p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
            activePanel === "templates" ? "bg-[#363636]" : "hover:bg-[#363636]"
          }`}
        >
          <Palette className="w-5 h-5 text-white" />
          <span className="text-white text-xs">Designs</span>
        </button>

        <button
          onClick={() => handleButtonClick("custom")}
          className={`w-full aspect-square p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
            activePanel === "custom" ? "bg-[#363636]" : "hover:bg-[#363636]"
          }`}
        >
          <Settings className="w-5 h-5 text-white" />
          <span className="text-white text-xs">Custom</span>
        </button>

        <button
          onClick={() => handleButtonClick("elements")}
          className={`w-full aspect-square p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
            activePanel === "elements" ? "bg-[#363636]" : "hover:bg-[#363636]"
          }`}
        >
          <Grid className="w-5 h-5 text-white" />
          <span className="text-white text-xs">Elements</span>
        </button>

        <button
          onClick={() => handleButtonClick("formData")}
          className={`w-full aspect-square p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
            activePanel === "formData" ? "bg-[#363636]" : "hover:bg-[#363636]"
          }`}
        >
          <FileText className="w-5 h-5 text-white" />
          <span className="text-white text-xs">Form Data</span>
        </button>
      </div>

      {/* Panels */}
      {renderPanel()}
    </div>
  );
};

export default Sidebar;
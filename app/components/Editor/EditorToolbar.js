import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DropdownPortal = ({ children, buttonRef }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [buttonRef]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 999999
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const EditorToolbar = ({ activeDropdown, setActiveDropdown, menuItems, isEditorReady = true }) => {
  const buttonRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownClick = Object.values(buttonRefs.current).some(
        ref => ref && (ref.contains(event.target) || event.target.closest('.dropdown-menu'))
      );
      
      if (!isDropdownClick) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveDropdown]);

  return (
    <div className="sticky top-0">
      <div className="flex items-center justify-between px-4 py-1 border-b border-[#262626] bg-[#262626] rounded-md">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {Object.keys(menuItems).map((menu) => (
            <div key={menu} className="relative h-full">
              <button
                ref={el => buttonRefs.current[menu] = el}
                className={`text-white px-3 py-2 rounded whitespace-nowrap transition-colors ${
                  activeDropdown === menu ? "bg-[#363636]" : "hover:bg-[#363636]"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === menu ? null : menu);
                }}
              >
                {menu.charAt(0).toUpperCase() + menu.slice(1)}
              </button>
              {activeDropdown === menu && (
                <DropdownPortal buttonRef={{ current: buttonRefs.current[menu] }}>
                  <div
                    className="dropdown-menu bg-[#262626] rounded-lg shadow-lg min-w-[200px] border border-[#363636]"
                    style={{
                      maxHeight: "80vh",
                      overflowY: "auto"
                    }}
                  >
                    {menuItems[menu].map((item, index) => (
                      <button
                        key={index}
                        className="flex items-center w-full px-4 py-2 text-white hover:bg-[#363636] text-sm whitespace-nowrap transition-colors duration-150"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                          setActiveDropdown(null);
                        }}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </DropdownPortal>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
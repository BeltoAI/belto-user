import { 
  FileText,
  Printer,
  Plus,
  Minus,
  X, 
  Maximize2,
  Type,
  HelpCircle,
  Users,
  UsersRound // Add this import
} from 'lucide-react';

// EditorMenu.js
const getMenuItems = (joditInstance, setIsEditorVisible, handleFileOpen, handlePrint, handleSaveVersion, handleShowOldVersions, handleShowCollaboration, handleShowYourCollaborations) => ({
  file: [
    {
      label: "New",
      icon: FileText,
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt,.html,.htm,.md,.doc,.docx";
        input.style.display = "none";
        input.onchange = handleFileOpen;
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      },
    },
    {
      label: "Print",
      icon: Printer,
      action: handlePrint,
    },
  ],
  view: [
    {
      label: "Zoom In",
      icon: Plus,
      action: () => {
        if (!joditInstance) {
          console.warn('Editor not ready yet, zoom in unavailable');
          return;
        }
        try {
          // Get the editor element - try wysiwyg first, then iframe
          let editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          let isIframe = false;
          
          if (!editorElement) {
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              editorElement = iframe.contentDocument.body;
              isIframe = true;
            }
          }
          
          if (editorElement) {
            // Get current zoom level from a data attribute or default to 100%
            let currentZoom = parseInt(editorElement.getAttribute('data-zoom-level')) || 100;
            const newZoom = Math.min(currentZoom + 10, 200); // Max 200%
            
            // Apply zoom using CSS transform
            editorElement.style.transform = `scale(${newZoom / 100})`;
            editorElement.style.transformOrigin = 'top left';
            
            // Store zoom level for future reference
            editorElement.setAttribute('data-zoom-level', newZoom);
            
            // Adjust container if needed
            const container = isIframe ? editorElement.parentElement : editorElement;
            if (container) {
              container.style.overflow = 'auto';
            }
            
            console.log(`Zoomed in to ${newZoom}%`);
          }
        } catch (error) {
          console.error('Zoom in error:', error);
        }
      },
    },
    {
      label: "Zoom Out",
      icon: Minus,
      action: () => {
        if (!joditInstance) {
          console.warn('Editor not ready yet, zoom out unavailable');
          return;
        }
        try {
          // Get the editor element - try wysiwyg first, then iframe
          let editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          let isIframe = false;
          
          if (!editorElement) {
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              editorElement = iframe.contentDocument.body;
              isIframe = true;
            }
          }
          
          if (editorElement) {
            // Get current zoom level from a data attribute or default to 100%
            let currentZoom = parseInt(editorElement.getAttribute('data-zoom-level')) || 100;
            const newZoom = Math.max(currentZoom - 10, 50); // Min 50%
            
            // Apply zoom using CSS transform
            editorElement.style.transform = `scale(${newZoom / 100})`;
            editorElement.style.transformOrigin = 'top left';
            
            // Store zoom level for future reference
            editorElement.setAttribute('data-zoom-level', newZoom);
            
            // Adjust container if needed
            const container = isIframe ? editorElement.parentElement : editorElement;
            if (container) {
              container.style.overflow = 'auto';
            }
            
            console.log(`Zoomed out to ${newZoom}%`);
          }
        } catch (error) {
          console.error('Zoom out error:', error);
        }
      },
    },
    { 
      label: "Toggle Editor",
      icon: X,
      action: () => setIsEditorVisible((prev) => !prev)
    },
    {
      label: "Reset Zoom",
      icon: Type,
      action: () => {
        if (!joditInstance) {
          console.warn('Editor not ready yet, reset zoom unavailable');
          return;
        }
        try {
          // Get the editor element - try wysiwyg first, then iframe
          let editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          let isIframe = false;
          
          if (!editorElement) {
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              editorElement = iframe.contentDocument.body;
              isIframe = true;
            }
          }
          
          if (editorElement) {
            // Reset zoom to 100%
            editorElement.style.transform = 'scale(1)';
            editorElement.style.transformOrigin = 'top left';
            editorElement.setAttribute('data-zoom-level', '100');
            
            console.log('Zoom reset to 100%');
          }
        } catch (error) {
          console.error('Reset zoom error:', error);
        }
      },
    },
    {
      label: "Full Screen",
      icon: Maximize2,
      action: () => {
        if (!joditInstance) {
          console.warn('Editor not ready yet, fullscreen unavailable');
          return;
        }
        try {
          // Skip Jodit's built-in fullscreen and use custom implementation
          const editorContainer = joditInstance.container;
          const isAlreadyFullscreen = editorContainer.classList.contains('custom-fullscreen');
          
          if (!isAlreadyFullscreen) {
            console.log('Entering custom fullscreen mode');
            
            // Store original styles to restore later
            const originalStyles = {
              position: editorContainer.style.position,
              top: editorContainer.style.top,
              left: editorContainer.style.left,
              width: editorContainer.style.width,
              height: editorContainer.style.height,
              zIndex: editorContainer.style.zIndex,
              backgroundColor: editorContainer.style.backgroundColor
            };
            editorContainer.setAttribute('data-original-styles', JSON.stringify(originalStyles));
            
            // Enter custom fullscreen
            editorContainer.classList.add('custom-fullscreen');
            
            // Apply fullscreen styles with higher specificity
            editorContainer.style.setProperty('position', 'fixed', 'important');
            editorContainer.style.setProperty('top', '0', 'important');
            editorContainer.style.setProperty('left', '0', 'important');
            editorContainer.style.setProperty('width', '100vw', 'important');
            editorContainer.style.setProperty('height', '100vh', 'important');
            editorContainer.style.setProperty('z-index', '9999', 'important');
            editorContainer.style.setProperty('background-color', 'white', 'important');
            editorContainer.style.setProperty('margin', '0', 'important');
            editorContainer.style.setProperty('padding', '0', 'important');
            editorContainer.style.setProperty('overflow', 'hidden', 'important');
            
            // Also style the workplace container
            const workplace = editorContainer.querySelector('.jodit-workplace');
            if (workplace) {
              workplace.style.setProperty('height', '100vh', 'important');
              workplace.style.setProperty('background-color', 'white', 'important');
              workplace.style.setProperty('margin', '0', 'important');
              workplace.style.setProperty('padding', '0', 'important');
              workplace.style.setProperty('display', 'flex', 'important');
              workplace.style.setProperty('flex-direction', 'column', 'important');
            }
            
            // Find and style the editor content area
            const editorArea = editorContainer.querySelector('.jodit-wysiwyg') || 
                              editorContainer.querySelector('.jodit-source') ||
                              editorContainer.querySelector('[contenteditable="true"]');
            const toolbar = editorContainer.querySelector('.jodit-toolbar');
            const statusbar = editorContainer.querySelector('.jodit-statusbar');
            
            if (editorArea) {
              // Calculate proper height considering toolbar and statusbar
              let toolbarHeight = 0;
              let statusbarHeight = 0;
              
              if (toolbar && toolbar.offsetHeight) {
                toolbarHeight = toolbar.offsetHeight;
              }
              if (statusbar && statusbar.offsetHeight) {
                statusbarHeight = statusbar.offsetHeight;
              }
              
              // Set editor area styles with high priority - fill remaining space
              editorArea.style.setProperty('height', `calc(100vh - ${toolbarHeight + statusbarHeight}px)`, 'important');
              editorArea.style.setProperty('min-height', `calc(100vh - ${toolbarHeight + statusbarHeight}px)`, 'important');
              editorArea.style.setProperty('max-height', `calc(100vh - ${toolbarHeight + statusbarHeight}px)`, 'important');
              editorArea.style.setProperty('background-color', 'white', 'important');
              editorArea.style.setProperty('color', 'black', 'important');
              editorArea.style.setProperty('overflow', 'auto', 'important');
              editorArea.style.setProperty('display', 'block', 'important');
              editorArea.style.setProperty('visibility', 'visible', 'important');
              editorArea.style.setProperty('opacity', '1', 'important');
              editorArea.style.setProperty('margin', '0', 'important');
              editorArea.style.setProperty('padding', '10px', 'important');
              editorArea.style.setProperty('box-sizing', 'border-box', 'important');
              
              console.log('Editor area styled for fullscreen');
            }
            
            // Ensure toolbar is visible and properly styled
            if (toolbar) {
              toolbar.style.setProperty('background-color', '#2a2a2a', 'important');
              toolbar.style.setProperty('border-bottom', '1px solid #444', 'important');
              toolbar.style.setProperty('display', 'flex', 'important');
              toolbar.style.setProperty('visibility', 'visible', 'important');
            }
            
            // Ensure statusbar is visible if it exists
            if (statusbar) {
              statusbar.style.setProperty('display', 'block', 'important');
              statusbar.style.setProperty('visibility', 'visible', 'important');
            }
            
            // Add exit button
            const exitBtn = document.createElement('button');
            exitBtn.innerHTML = '✕ Exit Fullscreen';
            exitBtn.className = 'fullscreen-exit-btn';
            exitBtn.style.cssText = `
              position: absolute !important;
              top: 10px !important;
              right: 10px !important;
              z-index: 10000 !important;
              padding: 8px 12px !important;
              background-color: #262626 !important;
              color: white !important;
              border: none !important;
              border-radius: 4px !important;
              cursor: pointer !important;
              font-size: 12px !important;
              font-family: system-ui, -apple-system, sans-serif !important;
            `;
            
            exitBtn.onclick = () => {
              console.log('Exiting custom fullscreen mode');
              
              // Exit custom fullscreen
              editorContainer.classList.remove('custom-fullscreen');
              
              // Restore original styles
              const originalStylesStr = editorContainer.getAttribute('data-original-styles');
              if (originalStylesStr) {
                const originalStyles = JSON.parse(originalStylesStr);
                Object.keys(originalStyles).forEach(prop => {
                  editorContainer.style[prop] = originalStyles[prop] || '';
                });
                editorContainer.removeAttribute('data-original-styles');
              } else {
                // Fallback: reset to empty
                editorContainer.style.position = '';
                editorContainer.style.top = '';
                editorContainer.style.left = '';
                editorContainer.style.width = '';
                editorContainer.style.height = '';
                editorContainer.style.zIndex = '';
                editorContainer.style.backgroundColor = '';
              }
              
              // Reset editor area
              const editorArea = editorContainer.querySelector('.jodit-wysiwyg, .jodit-source, [contenteditable="true"]');
              const toolbar = editorContainer.querySelector('.jodit-toolbar');
              const statusbar = editorContainer.querySelector('.jodit-statusbar');
              const workplace = editorContainer.querySelector('.jodit-workplace');
              
              if (editorArea) {
                editorArea.style.height = '';
                editorArea.style.minHeight = '';
                editorArea.style.maxHeight = '';
                editorArea.style.backgroundColor = '';
                editorArea.style.color = '';
                editorArea.style.overflow = '';
                editorArea.style.display = '';
                editorArea.style.visibility = '';
                editorArea.style.opacity = '';
                editorArea.style.margin = '';
                editorArea.style.padding = '';
                editorArea.style.boxSizing = '';
              }
              
              if (toolbar) {
                toolbar.style.backgroundColor = '';
                toolbar.style.borderBottom = '';
                toolbar.style.display = '';
                toolbar.style.visibility = '';
              }
              
              if (statusbar) {
                statusbar.style.display = '';
                statusbar.style.visibility = '';
                statusbar.style.backgroundColor = '';
              }
              
              if (workplace) {
                workplace.style.height = '';
                workplace.style.backgroundColor = '';
                workplace.style.margin = '';
                workplace.style.padding = '';
                workplace.style.display = '';
                workplace.style.flexDirection = '';
              }
              
              exitBtn.remove();
            };
            
            editorContainer.appendChild(exitBtn);
            
            // Also listen for Escape key
            const handleEscape = (e) => {
              if (e.key === 'Escape') {
                exitBtn.click();
                document.removeEventListener('keydown', handleEscape);
              }
            };
            document.addEventListener('keydown', handleEscape);
            
          } else {
            // Exit if already in fullscreen
            const exitBtn = editorContainer.querySelector('.fullscreen-exit-btn');
            if (exitBtn) {
              exitBtn.click();
            }
          }
        } catch (error) {
          console.error('Full screen error:', error);
          alert('Unable to enter fullscreen mode. This may be due to browser restrictions or editor not being ready.');
        }
      },
    },
  ],
  help: [
    {
      label: "Support",
      icon: FileText,
      action: () => {
        // Open official Belto website in new tab
        window.open("https://belto.world", "_blank");
      },
    },
    {
      label: "Keyboard Shortcuts",
      icon: Type,
      action: () => alert("Keyboard shortcuts coming soon!"),
    },
    {
      label: "About",
      icon: HelpCircle,
      action: () => {
        // Open Belto website in a new tab
        window.open("https://website-five-brown-57.vercel.app/", "_blank");
      },
    },
  ],
  versions: [
    {
      label: "Save current version",
      icon: FileText,
      action: handleSaveVersion,
    },
    {
      label: "Show old versions",
      icon: FileText,
      action: handleShowOldVersions,
    },
  ],
  collaboration: [
    {
      label: "Create Collaboration",
      icon: Users,
      action: handleShowCollaboration,
    },
    {
      label: "Your Collaborations",
      icon: UsersRound,
      action: handleShowYourCollaborations,
    }
  ]
});

export default getMenuItems;
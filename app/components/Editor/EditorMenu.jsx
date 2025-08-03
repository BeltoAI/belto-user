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
          alert('Editor is still loading. Please wait a moment and try again.');
          return;
        }
        try {
          // First try direct Jodit API if available
          if (joditInstance.options && joditInstance.options.fontSize) {
            const currentSize = parseInt(joditInstance.options.fontSize) || 14;
            const newSize = Math.min(currentSize + 2, 32); // Cap at 32px
            joditInstance.options.fontSize = newSize;
            joditInstance.setEditorValue(joditInstance.getEditorValue());
            return;
          }

          // Try accessing the wysiwyg area
          const editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          if (editorElement) {
            const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize) || 14;
            const newSize = Math.min(currentSize + 2, 32); // Cap at 32px
            editorElement.style.fontSize = `${newSize}px`;
            // Also apply to all paragraphs and content within
            const allElements = editorElement.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.style.fontSize === '' || !el.style.fontSize) {
                el.style.fontSize = `${newSize}px`;
              }
            });
          } else {
            // Fallback: try iframe access
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              const body = iframe.contentDocument.body;
              const currentSize = parseInt(window.getComputedStyle(body).fontSize) || 14;
              const newSize = Math.min(currentSize + 2, 32); // Cap at 32px
              body.style.fontSize = `${newSize}px`;
            }
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
          alert('Editor is still loading. Please wait a moment and try again.');
          return;
        }
        try {
          // First try direct Jodit API if available
          if (joditInstance.options && joditInstance.options.fontSize) {
            const currentSize = parseInt(joditInstance.options.fontSize) || 14;
            const newSize = Math.max(currentSize - 2, 8); // Minimum 8px
            joditInstance.options.fontSize = newSize;
            joditInstance.setEditorValue(joditInstance.getEditorValue());
            return;
          }

          // Try accessing the wysiwyg area
          const editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          if (editorElement) {
            const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize) || 14;
            const newSize = Math.max(currentSize - 2, 8); // Minimum 8px
            editorElement.style.fontSize = `${newSize}px`;
            // Also apply to all paragraphs and content within
            const allElements = editorElement.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.style.fontSize === '' || !el.style.fontSize) {
                el.style.fontSize = `${newSize}px`;
              }
            });
          } else {
            // Fallback: try iframe access
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              const body = iframe.contentDocument.body;
              const currentSize = parseInt(window.getComputedStyle(body).fontSize) || 14;
              const newSize = Math.max(currentSize - 2, 8); // Minimum 8px
              body.style.fontSize = `${newSize}px`;
            }
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
      label: "Full Screen",
      icon: Maximize2,
      action: () => {
        if (!joditInstance) {
          console.warn('Editor not ready yet, fullscreen unavailable');
          alert('Editor is still loading. Please wait a moment and try again.');
          return;
        }
        try {
          // Primary method: Use Jodit's built-in fullscreen toggle
          if (typeof joditInstance.toggleFullSize === 'function') {
            joditInstance.toggleFullSize();
            return;
          }
          
          // Alternative method: Use execCommand
          if (typeof joditInstance.execCommand === 'function') {
            joditInstance.execCommand('fullsize');
            return;
          }
          
          // Fallback method: Manual fullscreen implementation
          const editorContainer = joditInstance.container;
          if (editorContainer) {
            if (!document.fullscreenElement) {
              // Enter fullscreen
              if (editorContainer.requestFullscreen) {
                editorContainer.requestFullscreen().catch(err => {
                  console.warn('Fullscreen request failed:', err);
                  // Alternative: Add fullscreen class for CSS-based fullscreen
                  editorContainer.classList.add('jodit-fullscreen');
                  editorContainer.style.position = 'fixed';
                  editorContainer.style.top = '0';
                  editorContainer.style.left = '0';
                  editorContainer.style.width = '100vw';
                  editorContainer.style.height = '100vh';
                  editorContainer.style.zIndex = '9999';
                  editorContainer.style.backgroundColor = '#1a1a1a';
                });
              } else if (editorContainer.webkitRequestFullscreen) {
                editorContainer.webkitRequestFullscreen();
              } else if (editorContainer.mozRequestFullScreen) {
                editorContainer.mozRequestFullScreen();
              } else if (editorContainer.msRequestFullscreen) {
                editorContainer.msRequestFullscreen();
              } else {
                // CSS-based fullscreen fallback
                editorContainer.classList.add('jodit-fullscreen');
                editorContainer.style.position = 'fixed';
                editorContainer.style.top = '0';
                editorContainer.style.left = '0';
                editorContainer.style.width = '100vw';
                editorContainer.style.height = '100vh';
                editorContainer.style.zIndex = '9999';
                editorContainer.style.backgroundColor = '#1a1a1a';
                
                // Add exit button for CSS fullscreen
                const exitBtn = document.createElement('button');
                exitBtn.innerHTML = '✕ Exit Fullscreen';
                exitBtn.style.position = 'absolute';
                exitBtn.style.top = '10px';
                exitBtn.style.right = '10px';
                exitBtn.style.zIndex = '10000';
                exitBtn.style.padding = '8px 12px';
                exitBtn.style.backgroundColor = '#262626';
                exitBtn.style.color = 'white';
                exitBtn.style.border = 'none';
                exitBtn.style.borderRadius = '4px';
                exitBtn.style.cursor = 'pointer';
                exitBtn.onclick = () => {
                  editorContainer.classList.remove('jodit-fullscreen');
                  editorContainer.style.position = '';
                  editorContainer.style.top = '';
                  editorContainer.style.left = '';
                  editorContainer.style.width = '';
                  editorContainer.style.height = '';
                  editorContainer.style.zIndex = '';
                  editorContainer.style.backgroundColor = '';
                  exitBtn.remove();
                };
                editorContainer.appendChild(exitBtn);
              }
            } else {
              // Exit fullscreen
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
              }
              
              // Also handle CSS-based fullscreen
              editorContainer.classList.remove('jodit-fullscreen');
              editorContainer.style.position = '';
              editorContainer.style.top = '';
              editorContainer.style.left = '';
              editorContainer.style.width = '';
              editorContainer.style.height = '';
              editorContainer.style.zIndex = '';
              editorContainer.style.backgroundColor = '';
              const exitBtn = editorContainer.querySelector('button[onclick]');
              if (exitBtn) exitBtn.remove();
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
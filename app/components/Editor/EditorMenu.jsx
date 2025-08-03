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
          // Use Jodit's built-in fullscreen if available
          if (typeof joditInstance.toggleFullSize === 'function') {
            joditInstance.toggleFullSize();
            return;
          }
          
          // Alternative: Use Jodit's execCommand for fullsize
          if (typeof joditInstance.execCommand === 'function') {
            joditInstance.execCommand('fullsize');
            return;
          }
          
          // Custom fullscreen implementation
          const editorContainer = joditInstance.container;
          const isAlreadyFullscreen = editorContainer.classList.contains('custom-fullscreen');
          
          if (!isAlreadyFullscreen) {
            // Enter custom fullscreen
            editorContainer.classList.add('custom-fullscreen');
            
            // Apply fullscreen styles
            editorContainer.style.position = 'fixed';
            editorContainer.style.top = '0';
            editorContainer.style.left = '0';
            editorContainer.style.width = '100vw';
            editorContainer.style.height = '100vh';
            editorContainer.style.zIndex = '9999';
            editorContainer.style.backgroundColor = '#1a1a1a';
            
            // Ensure editor content is visible and properly sized
            const editorArea = editorContainer.querySelector('.jodit-wysiwyg, .jodit-source');
            const toolbar = editorContainer.querySelector('.jodit-toolbar');
            
            if (editorArea) {
              // Calculate proper height considering toolbar
              const toolbarHeight = toolbar ? toolbar.offsetHeight : 60;
              editorArea.style.height = `calc(100vh - ${toolbarHeight + 20}px)`;
              editorArea.style.backgroundColor = 'white';
              editorArea.style.color = 'black';
              editorArea.style.overflow = 'auto';
            }
            
            // Ensure toolbar is visible
            if (toolbar) {
              toolbar.style.backgroundColor = '#2a2a2a';
              toolbar.style.borderBottom = '1px solid #444';
            }
            
            // Add exit button
            const exitBtn = document.createElement('button');
            exitBtn.innerHTML = '✕ Exit Fullscreen';
            exitBtn.className = 'fullscreen-exit-btn';
            exitBtn.style.cssText = `
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 10000;
              padding: 8px 12px;
              background-color: #262626;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            `;
            
            exitBtn.onclick = () => {
              // Exit custom fullscreen
              editorContainer.classList.remove('custom-fullscreen');
              editorContainer.style.position = '';
              editorContainer.style.top = '';
              editorContainer.style.left = '';
              editorContainer.style.width = '';
              editorContainer.style.height = '';
              editorContainer.style.zIndex = '';
              editorContainer.style.backgroundColor = '';
              
              // Reset editor area
              const editorArea = editorContainer.querySelector('.jodit-wysiwyg, .jodit-source');
              const toolbar = editorContainer.querySelector('.jodit-toolbar');
              
              if (editorArea) {
                editorArea.style.height = '';
                editorArea.style.backgroundColor = '';
                editorArea.style.color = '';
                editorArea.style.overflow = '';
              }
              
              if (toolbar) {
                toolbar.style.backgroundColor = '';
                toolbar.style.borderBottom = '';
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
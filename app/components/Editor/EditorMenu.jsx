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
        console.log('Zoom In clicked, joditInstance:', joditInstance);
        if (!joditInstance) {
          console.log('Editor not ready yet, zoom in unavailable');
          return;
        }
        try {
          // Access the editor's wysiwyg area correctly
          const editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          console.log('editorElement found:', editorElement);
          if (editorElement) {
            const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize) || 14;
            console.log('Current font size:', currentSize);
            const newSize = currentSize + 2;
            editorElement.style.fontSize = `${newSize}px`;
            console.log('New font size set:', `${newSize}px`);
          } else {
            // Fallback: try direct iframe access
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              const body = iframe.contentDocument.body;
              const currentSize = parseInt(window.getComputedStyle(body).fontSize) || 14;
              body.style.fontSize = `${currentSize + 2}px`;
            }
          }
        } catch (error) {
          console.log('Zoom in error:', error);
        }
      },
    },
    {
      label: "Zoom Out",
      icon: Minus,
      action: () => {
        console.log('Zoom Out clicked, joditInstance:', joditInstance);
        if (!joditInstance) {
          console.log('Editor not ready yet, zoom out unavailable');
          return;
        }
        try {
          // Access the editor's wysiwyg area correctly
          const editorElement = joditInstance.container.querySelector('.jodit-wysiwyg');
          console.log('editorElement found:', editorElement);
          if (editorElement) {
            const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize) || 14;
            console.log('Current font size:', currentSize);
            const newSize = Math.max(currentSize - 2, 8);
            editorElement.style.fontSize = `${newSize}px`;
            console.log('New font size set:', `${newSize}px`);
          } else {
            // Fallback: try direct iframe access
            const iframe = joditInstance.container.querySelector('.jodit-wysiwyg_iframe');
            if (iframe && iframe.contentDocument) {
              const body = iframe.contentDocument.body;
              const currentSize = parseInt(window.getComputedStyle(body).fontSize) || 14;
              body.style.fontSize = `${Math.max(currentSize - 2, 8)}px`;
            }
          }
        } catch (error) {
          console.log('Zoom out error:', error);
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
        console.log('Full Screen clicked, joditInstance:', joditInstance);
        if (!joditInstance) {
          console.log('Editor not ready yet, fullscreen unavailable');
          return;
        }
        try {
          // Use Jodit's built-in fullscreen toggle
          if (typeof joditInstance.toggleFullSize === 'function') {
            console.log('Using toggleFullSize method');
            joditInstance.toggleFullSize();
          } else if (typeof joditInstance.execCommand === 'function') {
            console.log('Using execCommand fullsize');
            joditInstance.execCommand('fullsize');
          } else {
            console.log('Using manual fullscreen via container');
            // Fallback: manual fullscreen on the container
            const editorContainer = joditInstance.container;
            if (editorContainer) {
              if (!document.fullscreenElement) {
                // Enter fullscreen
                if (editorContainer.requestFullscreen) {
                  editorContainer.requestFullscreen();
                } else if (editorContainer.webkitRequestFullscreen) {
                  editorContainer.webkitRequestFullscreen();
                } else if (editorContainer.mozRequestFullScreen) {
                  editorContainer.mozRequestFullScreen();
                } else if (editorContainer.msRequestFullscreen) {
                  editorContainer.msRequestFullscreen();
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
              }
            }
          }
        } catch (error) {
          console.log('Full screen error:', error);
        }
      },
    },
  ],
  help: [
    {
      label: "Documentation",
      icon: FileText,
      action: () => alert("Documentation coming soon!"),
    },
    {
      label: "Keyboard Shortcuts",
      icon: Type,
      action: () => alert("Keyboard shortcuts coming soon!"),
    },
    {
      label: "About",
      icon: HelpCircle,
      action: () => alert("Belto Doc Editor v1.0"),
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
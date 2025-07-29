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
        if (joditInstance) {
          try {
            // Try to access the editor content area
            const editorBody = joditInstance.editor?.body || joditInstance.element?.querySelector('.jodit-wysiwyg');
            if (editorBody) {
              const currentSize = parseInt(window.getComputedStyle(editorBody).fontSize) || 14;
              editorBody.style.fontSize = `${currentSize + 2}px`;
            } else {
              // Fallback: use Jodit's built-in zoom if available
              joditInstance.execCommand('fontSize', false, '18px');
            }
          } catch (error) {
            console.log('Zoom in error:', error);
          }
        }
      },
    },
    {
      label: "Zoom Out",
      icon: Minus,
      action: () => {
        if (joditInstance) {
          try {
            // Try to access the editor content area
            const editorBody = joditInstance.editor?.body || joditInstance.element?.querySelector('.jodit-wysiwyg');
            if (editorBody) {
              const currentSize = parseInt(window.getComputedStyle(editorBody).fontSize) || 14;
              editorBody.style.fontSize = `${Math.max(currentSize - 2, 8)}px`;
            } else {
              // Fallback: use Jodit's built-in zoom if available
              joditInstance.execCommand('fontSize', false, '12px');
            }
          } catch (error) {
            console.log('Zoom out error:', error);
          }
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
        if (joditInstance) {
          try {
            // Try Jodit's built-in fullscreen command
            if (joditInstance.toggleFullSize) {
              joditInstance.toggleFullSize();
            } else if (joditInstance.execCommand) {
              joditInstance.execCommand('fullsize');
            } else {
              // Fallback: manual fullscreen
              const editorContainer = joditInstance.container || joditInstance.element?.closest('.jodit-container');
              if (editorContainer) {
                if (editorContainer.requestFullscreen) {
                  editorContainer.requestFullscreen();
                } else if (editorContainer.webkitRequestFullscreen) {
                  editorContainer.webkitRequestFullscreen();
                } else if (editorContainer.mozRequestFullScreen) {
                  editorContainer.mozRequestFullScreen();
                }
              }
            }
          } catch (error) {
            console.log('Full screen error:', error);
          }
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
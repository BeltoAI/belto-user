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
          const editorElement = joditInstance.editor;
          const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize);
          editorElement.style.fontSize = `${currentSize + 2}px`;
        }
      },
    },
    {
      label: "Zoom Out",
      icon: Minus,
      action: () => {
        if (joditInstance) {
          const editorElement = joditInstance.editor;
          const currentSize = parseInt(window.getComputedStyle(editorElement).fontSize);
          editorElement.style.fontSize = `${Math.max(currentSize - 2, 8)}px`;
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
      action: () => joditInstance?.execCommand('toggleFullSize'),
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
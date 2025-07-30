"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/app/components/Sidebar";
import EditorSidebar from "@/app/components/EditorSidebar";
import useEditorStore from "@/store/editorStore";
import EditorToolbar from "@/app/components/Editor/EditorToolbar";
import LoadingOverlay from "@/app/components/Editor/LoadingOverlay";
import getMenuItems from "@/app/components/Editor/EditorMenu";
import VersionHistory from "../components/VersionHistory";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CollaborationPopup from '../components/Editor/CollaborationPopup';
import CollaborationsList from '../components/Editor/CollaborationsList';
import CollaborativeDocumentStatus from '../components/Editor/CollaborativeDocumentStatus';
import CursorOverlay from '../components/Editor/CursorOverlay';
import { Copy } from 'lucide-react';

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
const mammoth = typeof window !== "undefined" ? require("mammoth") : null;

const useEditorUpdate = (editor, editorContent, setEditorContent) => {
  const isUpdatingRef = useRef(false);

  const updateContent = useCallback((newContent, preserveCursor = true) => {
    if (isUpdatingRef.current) return;
    if (!editor.current?.editor) {
      setEditorContent(newContent);
      return;
    }

    isUpdatingRef.current = true;

    try {
      const jodit = editor.current.editor;
      let selection = null;

      if (preserveCursor) {
        // Use Jodit's native selection method
        selection = jodit.selection.save();
      }

      // Set content directly to Jodit AND update React state
      jodit.value = newContent;
      setEditorContent(newContent);

      if (preserveCursor && selection) {
        // Restore cursor after a slight delay to ensure content is updated
        setTimeout(() => {
          try {
            jodit.selection.restore(selection);
          } catch (e) {
            console.error('Error restoring cursor position:', e);
          }
        }, 50); // Increased delay for more reliability
      }
    } finally {
      // Ensure the lock is released after a delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100); // Increased from 50ms
    }
  }, [editor, setEditorContent]);

  return updateContent;
};

const JoditTextEditor = ({ isWideView = false, isMobile = false, onToggleSidebar }) => {
  const editor = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showCollaborationsList, setShowCollaborationsList] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showEditorSidebar, setShowEditorSidebar] = useState(false);
  const { editorContent, setEditorContent, addVersion } = useEditorStore();
  const [eventSource, setEventSource] = useState(null);
  const lastUpdateTime = useRef(Date.now());
  const debounceTimerRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [userColors, setUserColors] = useState({});
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const cursorUpdateTimerRef = useRef(null);

  // Add copy-paste restriction state
  const [allowCopyPaste, setAllowCopyPaste] = useState(true);
  const [copyPasteWarningVisible, setCopyPasteWarningVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const updateEditorContent = useEditorUpdate(editor, editorContent, setEditorContent);

  // Fetch user ID and professor settings on component mount
  useEffect(() => {
    const fetchUserAndSettings = async () => {
      try {
        // First get current user info
        const userResponse = await fetch('/api/auth/user');
        if (!userResponse.ok) {
          console.error("Failed to fetch user info");
          return;
        }
        
        const userData = await userResponse.json();
        setCurrentUserEmail(userData.email);
        setCurrentUserId(userData._id);
        
        // Then fetch joined classes for this user
        const joinedClassesResponse = await fetch(`/api/classes/joined?studentId=${userData._id}`);
        if (!joinedClassesResponse.ok) {
          console.error("Failed to fetch joined classes");
          return;
        }
        
        const joinedClasses = await joinedClassesResponse.json();
        
        if (!joinedClasses || joinedClasses.length === 0) {
          console.error("No joined classes found");
          return;
        }
        
        // Get the first class from the response
        const firstClass = joinedClasses[0];
        const professorId = firstClass.professorId;
        
        if (!professorId) {
          console.error("No professor ID found in class data");
          return;
        }
        
        // Fetch professor settings
        const settingsResponse = await fetch(`/api/classes/professor-settings?classId=${firstClass._id}`);
        if (!settingsResponse.ok) {
          console.error("Failed to fetch professor settings");
          return;
        }
        
        const settingsData = await settingsResponse.json();
        
        if (settingsData) {
          // Set the copy-paste restriction based on professor settings
          setAllowCopyPaste(settingsData.allowCopyPaste);
          console.log("Copy-paste allowed:", settingsData.allowCopyPaste);
        }
      } catch (error) {
        console.error("Error fetching user and settings:", error);
      }
    };
    
    fetchUserAndSettings();
  }, []);

  // Handle copy-paste events globally for the editor
  useEffect(() => {
    if (!editor.current || !editor.current.editor) return;
    
    const handleDisabledCopyPaste = (e) => {
      if (!allowCopyPaste) {
        e.preventDefault();
        e.stopPropagation();
        
        setCopyPasteWarningVisible(true);
        
        // Show toast notification
        toast.error('Copy/Paste is disabled by the professor for this class', {
          position: "top-center",
          autoClose: 3000,
        });
        
        // Hide warning after a delay
        setTimeout(() => {
          setCopyPasteWarningVisible(false);
        }, 3000);
        
        return false;
      }
    };
    
    // Add listeners once editor is ready
    const initTimer = setTimeout(() => {
      if (editor.current && editor.current.editor) {
        const joditElement = editor.current.editor.container;
        
        // Prevent copy/paste through context menu
        joditElement.addEventListener('copy', handleDisabledCopyPaste);
        joditElement.addEventListener('paste', handleDisabledCopyPaste);
        joditElement.addEventListener('cut', handleDisabledCopyPaste);
        
        // Also disable keyboard shortcuts
        joditElement.addEventListener('keydown', (e) => {
          // Check for Ctrl+C, Ctrl+V, Ctrl+X
          if (!allowCopyPaste && (e.ctrlKey || e.metaKey)) {
            if (e.key === 'c' || e.key === 'v' || e.key === 'x') {
              handleDisabledCopyPaste(e);
            }
          }
        });
      }
    }, 1000);
    
    return () => {
      clearTimeout(initTimer);
      
      // Clean up event listeners when component unmounts
      if (editor.current && editor.current.editor) {
        const joditElement = editor.current.editor.container;
        joditElement.removeEventListener('copy', handleDisabledCopyPaste);
        joditElement.removeEventListener('paste', handleDisabledCopyPaste);
        joditElement.removeEventListener('cut', handleDisabledCopyPaste);
      }
    };
  }, [allowCopyPaste, editor.current?.editor]);

  const handleVersionClick = (content) => {
    updateEditorContent(content);
  };

  const handleFileOpen = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (["doc", "docx"].includes(fileExtension)) {
        if (!mammoth) throw new Error("Document conversion library not loaded");

        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });

        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (result.value) {
          const formattedContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              ${result.value}
            </div>
          `;
          updateEditorContent(formattedContent);
        } else {
          throw new Error("Document conversion produced no content");
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            const bodyContent = doc.body.innerHTML;
            updateEditorContent(bodyContent);
          } catch (error) {
            updateEditorContent(`<p>${content}</p>`);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Detailed error:", error);
      alert(`Error reading file: ${error.message || "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      const printWindow = window.open("", "_blank");
      const watermarkStyle = `
        <style>
          @media print {
            body::after {
              content: "BELTO DOC";
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px;
              color: rgba(0, 0, 0, 0.1);
              z-index: 1000;
              pointer-events: none;
            }
            body::after span {
              color: gold;
            }
            .content {
              position: relative;
              z-index: 1;
            }
          }
          body {
            padding: 20px;
            font-family: Arial, sans-serif;
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            ${watermarkStyle}
          </head>
          <body>
            <div class="content">
              ${editorContent}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.print();
        printWindow.onafterprint = function () {
          printWindow.close();
        };
      };
    }
  };

  const handleSaveVersion = () => {
    const newVersion = {
      id: Date.now(),
      date: new Date(),
      content: editorContent,
    };
    addVersion(newVersion);
    alert("Current version saved!");
  };

  const handleShowOldVersions = () => {
    setShowVersionHistory(!showVersionHistory);
  };

  const handleCloseVersionHistory = () => {
    setShowVersionHistory(false);
  };

  const handleShowCollaboration = () => {
    setShowCollaboration(true);
  };

  const handleShowYourCollaborations = () => {
    setShowCollaborationsList(true);
  };

  const handleDocumentSelect = async (document) => {
    updateEditorContent(document.content);
    setShowCollaborationsList(false);

    // Save document ID for future updates
    editor.current.documentId = document._id;
  };

  useEffect(() => {
    // Clean up previous connection if it exists
    if (eventSource) {
      eventSource.close();
    }

    // First fetch current user info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const userData = await response.json();
        setCurrentUserEmail(userData.email);

        // Now set up SSE connection if we have both document ID and user email
        if (editor.current?.documentId && userData.email) {
          const newEventSource = new EventSource(
            `/api/sse?documentId=${editor.current.documentId}&userEmail=${userData.email}`
          );

          newEventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              // Handle different event types
              switch (data.type) {
                case 'connected':
                case 'userJoined':
                case 'userLeft':
                  // Update active users list
                  setActiveUsers(data.activeUsers || []);
                  break;

                case 'update':
                  // Ignore updates if they're too close to our own update time
                  if (Date.now() - lastUpdateTime.current > 1000) {
                    if (editor.current && editor.current.editor) {
                      // Use a more reliable approach to preserve cursor
                      const jodit = editor.current.editor;

                      // Get cursor position info BEFORE updating content
                      const cursorInfo = {
                        startOffset: jodit.selection.current && jodit.selection.current.startOffset,
                        startContainer: jodit.selection.current && jodit.selection.current.startContainer
                      };

                      // Set content directly without relying on your custom function for remote updates
                      jodit.setEditorValue(data.content);
                      setEditorContent(data.content);

                      // Only try to restore cursor if we had a valid position
                      if (cursorInfo.startContainer) {
                        setTimeout(() => {
                          try {
                            // Try to restore to same container if it still exists
                            const range = jodit.editorDocument.createRange();
                            range.setStart(cursorInfo.startContainer, cursorInfo.startOffset || 0);
                            range.collapse(true);

                            const selection = jodit.editorWindow.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                          } catch (e) {
                            console.log("Couldn't restore cursor after remote update");
                          }
                        }, 50);
                      }
                    } else {
                      // If editor not ready, just update content state
                      setEditorContent(data.content);
                    }
                  }
                  break;

                case 'cursorPosition':
                  // Update remote cursors
                  setRemoteCursors(prev => ({
                    ...prev,
                    [data.user]: data.position
                  }));
                  break;
              }
            } catch (error) {
              console.error('Error processing SSE message:', error);
            }
          };

          newEventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            newEventSource.close();
          };

          setEventSource(newEventSource);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    if (editor.current?.documentId) {
      fetchUserInfo();
    }

    // Clean up on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [editor.current?.documentId]);

  useEffect(() => {
    // First check if editor.current exists and has a valid editor property
    if (!editor.current || !editor.current.documentId || !currentUserEmail) return;

    // Add a small delay to ensure editor is fully initialized
    const initTimer = setTimeout(() => {
      // Double check the editor exists before adding event listeners
      if (editor.current && editor.current.editor) {
        const handleMouseMove = (e) => {
          // Clear any pending timer
          if (cursorUpdateTimerRef.current) {
            clearTimeout(cursorUpdateTimerRef.current);
          }

          // Debounce cursor updates to reduce server load
          cursorUpdateTimerRef.current = setTimeout(async () => {
            const editorRect = editor.current.editor.getBoundingClientRect();
            const position = {
              x: e.clientX - editorRect.left,
              y: e.clientY - editorRect.top
            };

            try {
              await fetch('/api/cursor-position', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  documentId: editor.current.documentId,
                  userEmail: currentUserEmail,
                  position
                }),
              });
            } catch (error) {
              console.error('Error updating cursor position:', error);
            }
          }, 100); // 100ms debounce for cursor updates
        };

        // Add event listener to track cursor position
        editor.current.editor.addEventListener('mousemove', handleMouseMove);

        // Clean up
        return () => {
          if (editor.current && editor.current.editor) {
            editor.current.editor.removeEventListener('mousemove', handleMouseMove);
          }
          if (cursorUpdateTimerRef.current) {
            clearTimeout(cursorUpdateTimerRef.current);
          }
        };
      }
    }, 500); // Add a delay to ensure editor is initialized

    return () => clearTimeout(initTimer);
  }, [editor.current?.documentId, currentUserEmail]);

  // Add this useEffect for better editor initialization
  useEffect(() => {
    if (editor.current && editor.current.editor) {
      // Store the Jodit instance reference directly for easier access
      const jodit = editor.current.editor;

      // Add custom event handling if needed
      jodit.events.on('change', () => {
        // This captures all changes including programmatic ones
        // Can be used for additional handling if needed
      });

      // Fix selection issues with a custom handler
      jodit.events.on('selectionchange', () => {
        // Update selection state if needed
      });
    }
  }, [editor.current?.editor]);

  const handleEditorBlur = async (newContent) => {
    // Don't set content here directly as it causes cursor jumps
    // Just handle the collaborative update part
    if (editor.current?.documentId) {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to avoid too frequent updates
      debounceTimerRef.current = setTimeout(async () => {
        try {
          lastUpdateTime.current = Date.now();

          const userResponse = await fetch('/api/auth/user');
          const userData = await userResponse.json();

          const response = await fetch('/api/collaborative-documents', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId: editor.current.documentId,
              content: newContent,
              userEmail: userData.email
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update document');
          }
        } catch (error) {
          toast.error(error.message);
        }
      }, 500);
    }
  };

  const getColorForUser = (email) => {
    if (!userColors[email]) {
      const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33A8',
        '#33A8FF', '#A833FF', '#FF8C33', '#8CFF33'
      ];
      const newColors = { ...userColors };
      newColors[email] = colors[Object.keys(newColors).length % colors.length];
      setUserColors(newColors);
      return newColors[email];
    }
    return userColors[email];
  };

  const menuItems = useMemo(() => {
    // Only create menu items if the editor is fully initialized
    if (isEditorReady && editor.current?.editor) {
      return getMenuItems(editor.current.editor, setIsEditorVisible, handleFileOpen, handlePrint, handleSaveVersion, handleShowOldVersions, handleShowCollaboration, handleShowYourCollaborations);
    }
    // Return menu items with null joditInstance if editor not ready
    return getMenuItems(null, setIsEditorVisible, handleFileOpen, handlePrint, handleSaveVersion, handleShowOldVersions, handleShowCollaboration, handleShowYourCollaborations);
  }, [isEditorReady, editor.current?.editor, setIsEditorVisible, handleFileOpen, handlePrint, handleSaveVersion, handleShowOldVersions, handleShowCollaboration, handleShowYourCollaborations]);

  // Modify config to disable copy/paste buttons if not allowed
  const config = useMemo(() => ({
    readonly: false,
    toolbar: true,
    toolbarAdaptive: !isMobile,
    buttons: [
      "source",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "font",
      "fontsize",
      "brush",
      "paragraph",
      "|",
      "|",
      "align",
      "|",
      "link",
      "image",
      "table",
      "|",
      "undo",
      "redo",
      "|",
      "fullsize",
      // Only include copy/paste buttons if allowed
      ...(allowCopyPaste ? ["copy", "cut", "paste"] : []),
      "selectall",
      "left",
      "center",
      "right",
      "justify",
      "superscript",
      "subscript",
      "indent",
      "outdent",
      "hr",
      "eraser",
      ...(allowCopyPaste ? ["copyformat"] : []),
      "ul",
      "ol",
      "video",
      "file",
      "find",
      "symbols",
      "|"
    ],
    height: "calc(100vh - 100px)",
    width: "100%",
    placeholder: "Start typing...",
    enableDragAndDropFileToEditor: true,
    uploader: {
      insertImageAsBase64URI: true,
    },
    theme: "light",
    defaultMode: "1",
    saveInterval: 0, // Disable automatic saving
    observer: {
      timeout: 100 // Increase observer timeout
    },
    // Disable paste-related features if not allowed
    askBeforePasteHTML: allowCopyPaste,
    askBeforePasteFromWord: allowCopyPaste,
    defaultActionOnPaste: allowCopyPaste ? 'insert_clear_html' : 'deny',
    // Add custom event handlers for copy/paste
    events: {
      beforePaste: (event) => {
        if (!allowCopyPaste) {
          toast.error('Pasting is disabled by the professor for this class', {
            position: "top-center",
            autoClose: 3000,
          });
          return false;
        }
      },
      beforeCopy: (event) => {
        if (!allowCopyPaste) {
          toast.error('Copying is disabled by the professor for this class', {
            position: "top-center",
            autoClose: 3000,
          });
          return false; 
        }
      },
      beforeCut: (event) => {
        if (!allowCopyPaste) {
          toast.error('Cutting is disabled by the professor for this class', {
            position: "top-center",
            autoClose: 3000,
          });
          return false;
        }
      },
      afterInit: (jodit) => {
        // Set editor as ready when fully initialized
        console.log('Jodit editor initialized:', jodit);
        setIsEditorReady(true);
      }
    }
  }), [isMobile, allowCopyPaste]);

  // Render copy-paste warning banner
  const renderCopyPasteWarning = () => {
    if (!copyPasteWarningVisible) return null;
    
    return (
      <div className="flex items-center gap-2 p-3 rounded-md mb-3 text-sm bg-red-900/30 border border-red-700 text-red-200 absolute top-2 right-2 z-50 max-w-sm">
        <Copy className="h-4 w-4" />
        <span>Copy & paste is disabled by the professor for this class</span>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-[#1A1A1A] text-black relative">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {isLoading && <LoadingOverlay />}
      {renderCopyPasteWarning()}
      <EditorToolbar activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} menuItems={menuItems} />
      {isEditorVisible && (
        <div className="flex flex-1 h-full">
          <Sidebar />
          {showEditorSidebar && <EditorSidebar />}
          <div className="flex-1 overflow-y-auto mt-1 mx-2 relative">
            <style>
              {`
                /* Ensure list symbols are visible */
                .jodit-wysiwyg ul,
                .jodit-wysiwyg ol {
                  padding-left: 4px;
                  list-style-position: inside; /* Ensure bullets/numbers are inside the padding */
                }

                .jodit-wysiwyg ul {
                  list-style-type: disc; /* Bullet points */
                }

                .jodit-wysiwyg ol {
                  list-style-type: decimal; /* Numbered list */
                }

                .jodit-wysiwyg ul ul,
                .jodit-wysiwyg ol ul {
                  list-style-type: circle; /* Nested bullet points */
                }

                .jodit-wysiwyg ol ol,
                .jodit-wysiwyg ul ol {
                  list-style-type: lower-roman; /* Nested numbered list */
                }

                /* Ensure headings are styled */
                .jodit-wysiwyg h1,
                .jodit-wysiwyg h2,
                .jodit-wysiwyg h3,
                .jodit-wysiwyg h4,
                .jodit-wysiwyg h5,
                .jodit-wysiwyg h6 {
                  margin: 0.5em 0;
                  font-weight: bold;
                }

                .jodit-wysiwyg h1 {
                  font-size: 2em;
                }

                .jodit-wysiwyg h2 {
                  font-size: 1.5em;
                }

                .jodit-wysiwyg h3 {
                  font-size: 1.17em;
                }

                .jodit-wysiwyg h4 {
                  font-size: 1em;
                }

                .jodit-wysiwyg h5 {
                  font-size: 0.83em;
                }

                .jodit-wysiwyg h6 {
                  font-size: 0.67em;
                }

                /* Styles for remote cursors */
                .jodit-container {
                  position: relative;
                }
                
                .remote-cursor {
                  position: absolute;
                  pointer-events: none;
                  z-index: 1000;
                  transition: all 0.1s ease-in-out;
                }
                
                .cursor-flag {
                  opacity: 1;
                  transition: opacity 0.3s;
                }
                
                .remote-cursor:hover .cursor-flag {
                  opacity: 1;
                }
                
                /* Style for disabled copy/paste buttons */
                .jodit-toolbar-button.jodit-disabled {
                  opacity: 0.4;
                  cursor: not-allowed;
                }
              `}
            </style>
            <JoditEditor
              ref={editor}
              value={editorContent}
              config={config}
              onBlur={handleEditorBlur}
              onChange={(newContent) => {
                // Only send updates for collaborative documents with debouncing
                if (editor.current?.documentId) {
                  // Clear any pending timer
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }

                  // Don't update state immediately (Jodit handles this internally)
                  // Only debounce the server update
                  debounceTimerRef.current = setTimeout(async () => {
                    try {
                      lastUpdateTime.current = Date.now();

                      const userResponse = await fetch('/api/auth/user');
                      const userData = await userResponse.json();

                      // Get content safely with error handling
                      let currentContent;
                      try {
                        // Check if editor exists and has correct methods
                        if (editor.current?.editor?.getEditorValue) {
                          // Use Jodit's getEditorValue method - more reliable than .value
                          currentContent = editor.current.editor.getEditorValue();
                        } else {
                          // Fall back to newContent parameter if editor not fully initialized
                          currentContent = newContent;
                        }
                      } catch (error) {
                        console.log("Couldn't get editor value, using provided content instead");
                        currentContent = newContent;
                      }

                      // Update React state to keep in sync
                      setEditorContent(currentContent);

                      await fetch('/api/collaborative-documents', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          documentId: editor.current.documentId,
                          content: currentContent,
                          userEmail: userData.email
                        }),
                      });
                    } catch (error) {
                      console.error('Error updating document:', error);
                    }
                  }, 1000); // Increased to 1000ms (1 second) for better debouncing
                } else {
                  // For non-collaborative documents, update state after a delay
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
                  debounceTimerRef.current = setTimeout(() => {
                    setEditorContent(newContent);
                  }, 1000);
                }
              }}
              className="jodit-container"
            />

            <CursorOverlay
              editorRef={editor}
              cursors={remoteCursors}
              userColors={userColors}
            />

            {editor.current?.documentId &&
              <CollaborativeDocumentStatus
                documentId={editor.current?.documentId}
                activeUsers={activeUsers}
              />
            }

            {showVersionHistory && (
              <div className="w-80 border-l border-[#363636] overflow-y-auto absolute top-0 right-0 h-full bg-[#262626] z-50">
                <VersionHistory
                  onVersionClick={handleVersionClick}
                  onClose={handleCloseVersionHistory}
                />
              </div>
            )}
            
            {showCollaboration && (
              <CollaborationPopup
                onClose={() => setShowCollaboration(false)}
              />
            )}

            {showCollaborationsList && (
              <CollaborationsList
                onSelectDocument={handleDocumentSelect}
                onClose={() => setShowCollaborationsList(false)}
              />
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default JoditTextEditor;
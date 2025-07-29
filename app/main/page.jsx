"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '@/app/components/Sidebar';
import Loading from '@/app/components/Loading';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useChatStore from '@/store/chatStore';
import axios from 'axios';

// Import our new components
import ToolSelector from './components/ToolSelector';
import FileUploader from './components/FileUploader';
import MessageInput from './components/MessageInput';
import LoadingOverlay from './components/LoadingOverlay';

// Import utilities
import { readFileContent, getFileIcon } from './utils/fileHelpers';
import { sendUserMessage, sendBotMessage } from './utils/apiHelpers';

const BeltoMainPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Doc');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputText, setInputText] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);

  const router = useRouter();
  const processingTimeoutRef = useRef(null);
  const { currentSessionId, isMessageSending, setMessageSending, setNavigating } = useChatStore();

  // Tools data
  const tools = [
    {
      category: "TOOLS - FOR EVERYONE",
      items: [
        {
          title: "BELTO - Form",
          description: "Efficiently fill out forms with Belto Form's easy-to-use tool",
          acceptedFiles: ".pdf,.doc,.docx,.xls,.xlsx",
          icon: "📝"
        },
        {
          title: "BELTO - Doc",
          description: "Get comprehensive framework solutions instantly with Belto Doc",
          acceptedFiles: ".doc,.docx,.pdf,.txt",
          icon: "📄"
        }
      ]
    },
    {
      category: "TOOLS - FOR ENTERPRISE",
      items: [
        {
          title: "BELTO - ESG",
          description: "Get detailed ESG reports instantly to track sustainability efforts",
          acceptedFiles: ".csv,.xlsx,.xls",
          icon: "📊"
        },
        {
          title: "BELTO - CRM",
          description: "Improve operations with automated processes",
          acceptedFiles: ".csv,.json,.xml",
          icon: "🔄"
        },
        {
          title: "BELTO - ERP",
          description: "Automate tasks and gain insights for enhanced customer satisfaction",
          acceptedFiles: ".csv,.xlsx,.json",
          icon: "⚙️"
        }
      ]
    }
  ];

  // Get the current tool configuration
  const getCurrentToolConfig = () => {
    for (const section of tools) {
      const tool = section.items.find(item => item.title.split(' - ')[1] === selectedTool);
      if (tool) return tool;
    }
    return null;
  };

  // File handling functions
  const removeFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleFileSelect = async () => {
    const toolConfig = getCurrentToolConfig();
    if (!toolConfig) {
      toast.error('Please select a tool first');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = toolConfig.acceptedFiles;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const processedFiles = [];

      for (const file of files) {
        try {
          const fileData = await readFileContent(file);
          processedFiles.push(fileData);
        } catch (error) {
          toast.error(`Error reading file ${file.name}`);
          console.error(`Error reading file ${file.name}:`, error);
        }
      }

      if (processedFiles.length > 0) {
        setSelectedFiles([...selectedFiles, ...processedFiles]);
        toast.success('Files uploaded successfully');
      }
    };
    input.click();
  };

  // Message handling
  const handleSendMessage = async () => {
    if (!currentSessionId) {
      setShowLectureModal(true);
      return;
    }

    if (!inputText.trim() && selectedFiles.length === 0) {
      toast.error('Please enter a message or select files');
      return;
    }

    try {
      setIsProcessing(true);
      setMessageSending(true);

      // Create the message object
      const messagePayload = {
        isBot: false,
        avatar: user.profileImage || '/user.png',
        name: user.username,
        message: inputText.trim(),
        suggestions: [],
        attachments: selectedFiles.map(file => ({
          name: file.name,
          content: file.content || ''
        })),
        timestamp: new Date().toISOString()
      };

      // Send user message
      await sendUserMessage(user._id, currentSessionId, messagePayload);

      // Generate AI response
      const { data } = await axios.post('/api/ai-proxy', {
        prompt: inputText,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant named BELTO.' },
          { role: 'user', content: inputText }
        ],
        history: [],
        preferences: {
          model: 'llama-3',
          temperature: 0.7,
          maxTokens: 500
        }
      });

      // Create bot message payload
      const botMessagePayload = {
        isBot: true,
        avatar: '/logo.png',
        name: 'BELTO',
        message: data?.response || "I couldn't generate a response. Please try again.",
        suggestions: [],
        attachments: [],
        timestamp: new Date().toISOString()
      };

      // Send bot message
      await sendBotMessage(user._id, currentSessionId, botMessagePayload);

      // Save session stats before navigation to preserve token/prompt counts
      if (currentSessionId) {
        const existingStats = localStorage.getItem(`sessionStats_${currentSessionId}`);
        const stats = existingStats ? JSON.parse(existingStats) : {
          totalTokenUsage: 0,
          totalPrompts: 0,
          startTime: new Date().toISOString()
        };
        
        // Update with new token usage if available
        if (data?.tokenUsage?.total_tokens) {
          stats.totalTokenUsage += data.tokenUsage.total_tokens;
        }
        
        // Increment prompt count (user just sent a message)
        stats.totalPrompts += 1;
        
        localStorage.setItem(`sessionStats_${currentSessionId}`, JSON.stringify(stats));
      }

      // Clear inputs and navigate
      setInputText('');
      setSelectedFiles([]);
      setNavigating(true);
      await router.push(`/mainsection?sessionId=${currentSessionId}`);
      toast.success('Message sent successfully');

    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsProcessing(false);
      setMessageSending(false);
      setNavigating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSendMessage();
    }
  };

  const handleJoinClass = () => {
    router.push('/join-class');
  };

  // Fetch user data and settings
  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user data
        const userResponse = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!userResponse.ok) {
          toast.error('Not authenticated');
        }

        const userData = await userResponse.json();
        if (!isSubscribed) return;
        setUser(userData);
      } catch (error) {
        console.error('Data fetch error:', error);
        if (!isSubscribed) return;

        if (error.message === 'Not authenticated') {
          toast.error('Authentication failed. Please login again.');
          router.push('/login');
        } else {
          toast.error('Failed to load data');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [router]);

  // Add this in your useEffect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) {
          router.replace('/');
        }
      } catch (error) {
        router.replace('/');
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch user's classes
  useEffect(() => {
    const fetchUserClasses = async () => {
      if (user?._id) {
        try {
          const response = await fetch(`/api/classes/joined?studentId=${user._id}`);
          if (response.ok) {
            const classData = await response.json();
            setClasses(classData);
            if (classData.length === 1) {
              setSelectedClass(classData[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };

    fetchUserClasses();
  }, [user]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-start pt-20 px-4">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleJoinClass}
            className="bg-[#FFD700] text-black px-4 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
          >
            Join Class
          </button>
        </div>

        {user && (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="text-white mb-4">Welcome, {user.username}!</div>
          </div>
        )}

        <Sidebar />
        <div className="w-full max-w-2xl">
          <div className="flex flex-col items-center mb-8 md:mb-6">
            <div className="mb-2">
              <Image
                width={292}
                height={292}
                src="/logo.png"
                alt="Belto Logo"
                priority={true}
                className="w-32 h-32 md:w-48 md:h-48 lg:w-80 lg:h-80 object-contain"
              />
            </div>

            <ToolSelector
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              tools={tools}
              setSelectedFiles={setSelectedFiles}
            />
          </div>

          <FileUploader
            selectedFiles={selectedFiles}
            removeFile={removeFile}
            getFileIcon={getFileIcon}
          />

          <MessageInput
            currentSessionId={currentSessionId}
            inputText={inputText}
            setInputText={setInputText}
            handleFileSelect={handleFileSelect}
            handleSendMessage={handleSendMessage}
            handleKeyDown={handleKeyDown}
            isProcessing={isProcessing}
            isMessageSending={isMessageSending}
            selectedFiles={selectedFiles}
            lectureId={currentLecture?.id}
          />
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        <LoadingOverlay
          isVisible={isMessageSending || isProcessing}
          message={isMessageSending ? 'Generating response...' : 'Processing...'}
        />
      </div>
    </>
  );
}

export default BeltoMainPage;
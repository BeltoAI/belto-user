"use client";

import React, { useState, useEffect, Suspense, useReducer } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Maximize2, Minimize2, MessageCircle,
  X, Brain, ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Loading from './loading';
import ErrorBoundary from '../components/ErrorBoundary';
import SafeLoading from '../components/SafeLoading';
// Initial state
const initialState = {
  layout: {
    isWideView: false,
    isChatOpen: false,
    isEditorVisible: true,
  },
  componentsReady: {
    chat: false,
    editor: false
  },
  ui: {
    isMobile: false,
    isLoading: true
  },
  userData: {
    user: null,
    joinedClasses: [],
    selectedClass: null
  },
  content: {
    editorContent: `<h1>Marketing Plan 2024</h1>...`, // Your default content
    selectedModel: "Llama 3",
    processedFiles: []
  }
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LAYOUT':
      return { ...state, layout: { ...state.layout, ...action.payload } };
    case 'SET_COMPONENT_READY':
      return {
        ...state,
        componentsReady: { ...state.componentsReady, ...action.payload }
      };
    case 'SET_UI':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'SET_USER_DATA':
      return { ...state, userData: { ...state.userData, ...action.payload } };
    case 'SET_CONTENT':
      return { ...state, content: { ...state.content, ...action.payload } };
    default:
      return state;
  }
}

// Chat fallback component
const ChatFallback = () => (
  <div className="flex items-center justify-center h-full bg-[#111111] text-white p-4">
    <div className="text-center">
      <p className="text-red-400 mb-2">Failed to load Chat component</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

// Editor fallback component
const EditorFallback = () => (
  <div className="flex items-center justify-center h-full bg-[#1A1A1A] text-white p-4">
    <div className="text-center">
      <p className="text-red-400 mb-2">Failed to load Editor component</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

// Dynamic imports with enhanced error handling
const DynamicChatSection = dynamic(() => import('../chat/page').catch(err => {
  console.error('Failed to load Chat component:', err);
  return ChatFallback;
}), {
  ssr: false,
  loading: () => <SafeLoading componentName="Chat" />
});

const DynamicJoditTextEditor = dynamic(() => import('../slateeditor/page').catch(err => {
  console.error('Failed to load Editor component:', err);
  return EditorFallback;
}), {
  ssr: false,
  loading: () => <SafeLoading componentName="Editor" />
});

const LayoutContent = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const searchParams = useSearchParams();
  const [initialRender, setInitialRender] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleInitialLoad = async () => {
      if (!initialRender) return;

      const inputText = searchParams.get('inputText');
      const selectedFilesStr = searchParams.get('selectedFiles');
      const sessionId = searchParams.get('sessionId');

      if (inputText || selectedFilesStr) {
        try {
          const files = selectedFilesStr ? JSON.parse(selectedFilesStr) : [];
          
          // Update state with the URL parameters
          dispatch({
            type: 'SET_CONTENT',
            payload: {
              inputText,
              selectedFiles: files,
              currentSessionId: sessionId
            }
          });

          // Don't clear URL parameters immediately to allow chat component to process them
          setTimeout(() => {
            router.replace('/mainsection', undefined, { shallow: true });
          }, 1000);
        } catch (error) {
          console.error('Error processing URL parameters:', error);
        }
      }

      setInitialRender(false);
    };

    handleInitialLoad();
  }, [searchParams, initialRender, router]);

  const Header = () => (
    <div className="flex items-center justify-between h-12 hover:bg-[#111111] border-b border-[#262626] px-4">
      <div className="ml-24 flex items-center justify-around gap-4">
        <div>
          <h1 className="text-lg font-semibold">
            <span className="text-[#FFB800]">B</span>
            <span className="text-white">ELTO DOC</span>
          </h1>
        </div>
      </div>

      {!state.ui.isMobile && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              dispatch({
                type: 'SET_LAYOUT',
                payload: {
                  isWideView: !state.layout.isWideView,
                  isChatOpen: false
                }
              });
            }}
            className="bg-[#262626] text-white px-3 py-1 rounded-md flex items-center gap-2 hover:bg-[#363636] transition-colors"
          >
            {state.layout.isWideView ? (
              <>
                Narrow Look
                <Minimize2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Wide Look
                <Maximize2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const ChatPopup = () => (
    <div className="fixed right-4 bottom-4 z-50 bg-[#111111] rounded-lg shadow-xl border border-[#262626] w-96 h-[600px] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-[#262626]">
        <h3 className="text-white font-semibold">Chat</h3>
        <button
          onClick={() => dispatch({
            type: 'SET_LAYOUT',
            payload: { isChatOpen: false }
          })}
          className="p-1 hover:bg-[#262626] rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary componentName="Chat">
          <DynamicChatSection
            key={searchParams.get('sessionId')}
            inputText={searchParams.get('inputText')}
            selectedFiles={state.content.processedFiles}
            isWideView={true}
            selectedModel={state.content.selectedModel}
            initialSessionId={searchParams.get('sessionId')}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  const NarrowLayout = () => (
    <div className="flex h-[calc(100vh-48px)] transition-all duration-300 ease-in-out">
      <div className={`h-full bg-[#111111] overflow-hidden border-r border-[#262626] transition-all duration-300 ease-in-out ${
        state.layout.isEditorVisible ? 'w-[40%]' : 'w-[90%]'
      }`}>
        <ErrorBoundary componentName="Chat">
          <DynamicChatSection
            key={searchParams.get('sessionId')}
            inputText={searchParams.get('inputText')}
            selectedFiles={state.content.processedFiles}
            isWideView={state.layout.isWideView}
            selectedModel={state.content.selectedModel}
            initialSessionId={searchParams.get('sessionId')}
          />
        </ErrorBoundary>
      </div>

      <div 
        className={`h-full bg-[#1A1A1A] relative transition-all duration-300 ease-in-out ${
          state.layout.isEditorVisible ? 'w-[60%]' : 'w-[10%]'
        }`}
      >
        <button
          onClick={() => dispatch({
            type: 'SET_LAYOUT',
            payload: { isEditorVisible: !state.layout.isEditorVisible }
          })}
          className="absolute top-2 right-2 z-[500] p-2 bg-[#262626] text-white rounded-full hover:bg-[#363636] transition-colors"
        >
          <ChevronRight 
            className={`w-4 h-4 transition-transform duration-300 ${
              state.layout.isEditorVisible ? '' : 'rotate-180'
            }`} 
          />
        </button>
        {state.layout.isEditorVisible && (
          <ErrorBoundary componentName="Editor">
            <DynamicJoditTextEditor
              isWideView={false}
              isMobile={false}
              content={state.content.editorContent}
              setContent={(content) => dispatch({
                type: 'SET_CONTENT',
                payload: { editorContent: content }
              })}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );

  const WideLayout = () => (
    <div className="h-[calc(100vh-48px)]">
      <div className="w-full h-full bg-[#1A1A1A]">
        <ErrorBoundary componentName="Editor">
          <DynamicJoditTextEditor
            isWideView={true}
            isMobile={false}
            content={state.content.editorContent}
            setContent={(content) => dispatch({
              type: 'SET_CONTENT',
              payload: { editorContent: content }
            })}
          />
        </ErrorBoundary>
      </div>
      {state.layout.isChatOpen ? (
        <ChatPopup />
      ) : (
        <button
          onClick={() => dispatch({
            type: 'SET_LAYOUT',
            payload: { isChatOpen: true }
          })}
          className="fixed right-4 bottom-4 z-50 bg-[#FFB800] p-3 rounded-full shadow-lg hover:bg-[#E6A600] transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-black" />
        </button>
      )}
    </div>
  );

  const MobileLayout = () => (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="h-1/2 min-h-[300px] bg-[#1A1A1A] overflow-y-auto">
        <ErrorBoundary componentName="Editor">
          <DynamicJoditTextEditor
            isWideView={false}
            isMobile={true}
            content={state.content.editorContent}
            setContent={(content) => dispatch({
              type: 'SET_CONTENT',
              payload: { editorContent: content }
            })}
          />
        </ErrorBoundary>
      </div>
      <div className="h-1/2 min-h-[300px] bg-[#111111] overflow-y-auto">
        <ErrorBoundary componentName="Chat">
          <DynamicChatSection
            key={searchParams.get('sessionId')}
            inputText={searchParams.get('inputText')}
            selectedFiles={state.content.processedFiles}
            isWideView={false}
            selectedModel={state.content.selectedModel}
            initialSessionId={searchParams.get('sessionId')}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#111111] overflow-hidden">
      <Header />
      <div className="flex-grow relative">
        {state.ui.isMobile ? (
          <MobileLayout />
        ) : state.layout.isWideView ? (
          <WideLayout />
        ) : (
          <NarrowLayout />
        )}
      </div>
      <Sidebar />
    </div>
  );
};

// Main component with loading state
const MainLayoutSection = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <LayoutContent />
    </Suspense>
  );
};

export default MainLayoutSection;
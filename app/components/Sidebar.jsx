"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare // Import icon for Feedback
} from 'lucide-react'; // Added MessageSquare
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { toast } from 'react-toastify';
import { deleteAllCookies } from '@/utils/auth';
import { useUser } from '@/contexts/UserContext';

// Custom scrollbar styles
const customScrollbarStyles = `
  .simplebar-scrollbar::before {
    background-color: #FFB800;
  }
  .simplebar-track.simplebar-vertical {
    width: 7px;
  }
`;

const Sidebar = () => {
  // Get user from context instead of local state
  const { user } = useUser();
  
  // UI and data states
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [error, setError] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [lectureSessions, setLectureSessions] = useState({});
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  // This flag ensures sessions are only initialized once (per component lifetime)
  const [sessionsInitialized, setSessionsInitialized] = useState(false);

  // Add new state for tracking session creation
  const [sessionCreationStatus, setSessionCreationStatus] = useState({
    loading: false,
    error: null
  });

  const [lectureDetails, setLectureDetails] = useState({});

  const router = useRouter();
  const {
    currentSessionId,
    loadSession,
    createSessionForLecture,
    fetchUserSessions
  } = useChatStore();

  // Update header visibility on scroll.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY === 0);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Modified useEffect for fetching classes - user data now comes from context
  useEffect(() => {
    const fetchClasses = async () => {
      // Skip if sessions already initialized or user is not available
      if (sessionsInitialized || !user) return;

      try {
        setClassesLoading(true);
        
        // Fetch joined classes using the user ID from context
        const classesResponse = await fetch(`/api/classes/joined?studentId=${user._id}`);
        if (!classesResponse.ok) throw new Error('Failed to fetch joined classes');
        const classes = await classesResponse.json();

        // Filter active classes
        const activeClasses = classes.filter(class_ => class_.status === 'active');
        setJoinedClasses(classes); // Keep all classes in state but filter in render

        // Fetch lecture details only for active classes
        const lectureDetailsMap = {};
        for (const cls of activeClasses) {
          const lecturesResponse = await fetch(`/api/classes/${cls._id}/lectures`);
          if (lecturesResponse.ok) {
            const { lectures } = await lecturesResponse.json();
            lectures.forEach(lecture => {
              // Store with both possible key formats to handle ObjectId inconsistencies
              const lectureId = String(lecture._id);
              lectureDetailsMap[lectureId] = lecture;
              lectureDetailsMap[lecture._id] = lecture;
            });
          }
        }
        setLectureDetails(lectureDetailsMap);

        // Extract all lectures from active joined classes (ensure string format)
        const allLectures = activeClasses.reduce((acc, cls) => {
          const lectureIds = cls.lectures.map(lectureId => String(lectureId));
          return [...acc, ...lectureIds];
        }, []);
        setLectures(allLectures);

        // Initialize sessions with lecture titles
        await initializeSessions(user._id, allLectures, lectureDetailsMap);

        // Mark sessions as initialized after successful initialization
        setSessionsInitialized(true);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(error.message);
        // If there's an authentication error, the UserContext will handle it
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsInitialized, user]); // Changed from router to user


  // Fixed initialize sessions function
  const initializeSessions = async (userId, lecturesList, lectureDetailsMap) => {
    try {
      setSessionsLoading(true);

      // Get existing sessions first
      const existingSessions = await fetchUserSessions(userId);
      console.log('Existing sessions:', existingSessions);

      const sessionsMap = {};

      // First, map existing sessions to their lectures
      lecturesList.forEach((lectureId) => {
        // Find existing session for this lecture
        const session = existingSessions.find(s => s.lectureId === lectureId);

        sessionsMap[lectureId] = {
          session: session || null,
          loading: false,
          error: null
        };
      });

      // Then, create sessions only for lectures that don't have one
      const lecturesToCreate = lecturesList.filter(lectureId => !sessionsMap[lectureId]?.session);
      console.log('Lectures needing new sessions:', lecturesToCreate);

      if (lecturesToCreate.length > 0) {
        const sessionPromises = lecturesToCreate.map(async (lectureId) => {
          try {
            const lectureTitle = lectureDetailsMap[lectureId]?.title || `Lecture ${lectureId}`;
            const session = await createSessionForLecture(userId, lectureId, lectureTitle);
            return {
              lectureId,
              session,
              error: null
            };
          } catch (error) {
            console.error(`Failed to create session for lecture ${lectureId}:`, error);
            return {
              lectureId,
              session: null,
              error: error.message
            };
          }
        });

        const results = await Promise.allSettled(sessionPromises);

        results.forEach((result, index) => {
          const lectureId = lecturesToCreate[index];
          if (result.status === 'fulfilled') {
            const { session, error } = result.value;
            sessionsMap[lectureId] = {
              session,
              loading: false,
              error
            };
          } else {
            sessionsMap[lectureId] = {
              session: null,
              loading: false,
              error: result.reason.message
            };
          }
        });
      }

      setLectureSessions(sessionsMap);
    } catch (error) {
      console.error('Session initialization error:', error);
      toast.error('Failed to initialize chat sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  // When a lecture is selected, load its session.
  const handleSelectLecture = async (lectureId) => {
    // User should already be fetched and set in state by the useEffect
    if (!user?._id) {
        toast.error('User data not loaded. Please wait or refresh.');
        return;
    }

    const lectureSession = lectureSessions[lectureId];
    if (!lectureSession?.session?._id) {
      console.error('No valid session found for lecture:', lectureId, lectureSession);
      toast.error('Creating new session for this lecture...');
      
      try {
        // Create a new session if one doesn't exist
        const lectureTitle = lectureDetails[lectureId]?.title || 
                            lectureDetails[String(lectureId)]?.title || 
                            `Lecture ${lectureId}`;
        const newSession = await createSessionForLecture(user._id, lectureId, lectureTitle);
        
        // Update the lectureSessions state
        setLectureSessions(prev => ({
          ...prev,
          [lectureId]: {
            session: newSession,
            loading: false,
            error: null
          }
        }));
        
        // Load the new session
        await loadSession(newSession._id);
        setIsOpen(false);
        toast.success(`Switched to ${lectureTitle}`);
        return;
      } catch (error) {
        console.error('Failed to create new session:', error);
        toast.error('Failed to create session for this lecture');
        return;
      }
    }

    try {
      console.log('Switching to lecture:', lectureId, 'with session:', lectureSession.session._id);
      
      // Show a loading state for this lecture's button.
      setLectureSessions(prev => ({
        ...prev,
        [lectureId]: { ...prev[lectureId], loading: true }
      }));

      // Load the session using the store action
      await loadSession(lectureSession.session._id);
      
      // Get lecture title for confirmation
      const lectureTitle = lectureDetails[lectureId]?.title || 
                          lectureDetails[String(lectureId)]?.title || 
                          `Lecture ${lectureId}`;
      
      setIsOpen(false); // Close sidebar on selection
      toast.success(`Switched to ${lectureTitle}`);
    } catch (err) {
      console.error('Failed to load session:', err);
      toast.error('Failed to load chat session');
    } finally {
      // Ensure loading state is reset even if there's an error
      setLectureSessions(prev => ({
        ...prev,
        [lectureId]: { ...prev[lectureId], loading: false }
      }));
    }
  };

  const handleLogout = async () => {
    try {
      // First, sign out from NextAuth (this is important!)
      const signOutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Clear browser storage
      if (typeof window !== 'undefined') {
        // Clear localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear all NextAuth items from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('nextauth') || key.includes('session')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
      }
      
      // Add this to handle NextAuth signout
      try {
        // This import is dynamic to avoid server-side issues
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
      } catch (error) {
        console.log('NextAuth signout error:', error);
        // Continue with logout even if NextAuth has an issue
      }
      
      // Force a hard refresh to the home page
      window.location.href = '/';
      
      // Success message won't be seen due to the redirect
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      
      // If all else fails, force redirect and reload
      window.location.href = '/';
      window.location.reload();
    }
  };

  const handleFeedbackClick = () => {
    router.push('/feedback-survey');
    setIsOpen(false); // Close sidebar when navigating
  };

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <button
        onClick={() => setIsOpen(true)}
        className="z-50 p-2 hover:bg-[#262626] rounded-md fixed top-1 left-4"
        style={{ display: isVisible ? 'block' : 'none' }}
      >
        <Menu className="w-6 h-6 text-[#FFD700]" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`h-full w-64 bg-[#1A1A1A] transform transition-transform duration-300 ease-in-out fixed top-0 left-0 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* --- Top Section --- */}
          <div className="p-4 space-y-3"> {/* Added space-y-3 for spacing */}
            {/* Join Class and Close Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/join-class')}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#262626] rounded-md hover:bg-[#333333] text-[#FFD700] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Join Class
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-[#262626] rounded-md hover:bg-[#333333] transition-colors"
              >
                <X className="w-5 h-5 text-[#FFD700]" />
              </button>
            </div>

            {/* --- Feedback & Survey Button (Moved Here) --- */}
            <button
              onClick={handleFeedbackClick}
              className="flex items-center w-full px-4 py-2 text-[#FFD700] bg-[#262626] hover:bg-[#333333] rounded-md transition-colors text-sm" // Added background
            >
              <MessageSquare className="w-5 h-5 mr-2" /> {/* Feedback Icon */}
              Feedback & Survey
            </button>
            {/* --- End Feedback & Survey Button --- */}
          </div>
          {/* --- End Top Section --- */}


          {/* Adjusted SimpleBar height - Account for moved button */}
          <SimpleBar style={{ height: 'calc(100vh - 220px)' }} className="flex-grow px-4"> {/* Adjusted height */}
            <div className="mb-6">
              <h3 className="text-[#FFD700] font-medium mb-2">Joined Classes & Sessions</h3>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              {classesLoading ? (
                <p className="text-gray-400 text-sm">Loading classes...</p>
              ) : joinedClasses.filter(class_ => class_.status === 'active').length > 0 ? (
                <div className="space-y-2">
                  {joinedClasses
                    .filter(class_ => class_.status === 'active')
                    .map((class_) => (
                      <div key={class_._id} className="bg-[#262626] p-2 rounded-md">
                        <button
                          onClick={() => setExpandedClass(expandedClass === class_._id ? null : class_._id)}
                          className="w-full text-left flex justify-between items-center"
                        >
                          <h4 className="text-white text-sm font-medium">{class_.name}</h4>
                          {expandedClass === class_._id ? (
                            <ChevronUp className="w-4 h-4 text-white" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <p className="text-gray-400 text-xs mb-2">{class_.enrollmentCode}</p>
                        {expandedClass === class_._id && (
                          <div className="mt-2 ml-2 space-y-1">
                            {sessionsLoading ? (
                              <p className="text-xs text-gray-400">Loading sessions...</p>
                            ) : (
                              class_.lectures.map((lecture) => {
                                const sessionInfo = lectureSessions[lecture];
                                // Handle ObjectId format inconsistencies between class.lectures and lectureDetails keys
                                const lectureInfo = lectureDetails[lecture] || 
                                                  lectureDetails[String(lecture)];
                                const displayTitle = lectureInfo?.title || 'Untitled Lecture';

                                return (
                                  <div key={`lecture-${class_._id}-${lecture}`}>
                                    <button
                                      onClick={() => handleSelectLecture(lecture)}
                                      disabled={sessionsLoading || !sessionInfo?.session}
                                      className={`w-full text-left p-2 text-sm bg-[#333333] border border-[#444444] rounded-md transition-colors
                                        ${currentSessionId === sessionInfo?.session?._id
                                          ? "text-[#FFD700] border-[#FFD700]" // Highlight active session
                                          : "text-gray-300"
                                        }
                                        ${(sessionsLoading || !sessionInfo?.session)
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:text-[#FFD700] hover:bg-[#444444]" // Hover effect
                                        }`}
                                    >
                                      {sessionInfo?.loading
                                        ? 'Loading...' // Shortened loading text
                                        : displayTitle}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No active classes found</p>
              )}
            </div>
          </SimpleBar>

          {/* Bottom section */}
          <div className="border-t border-[#262626] p-4 mt-auto bg-[#1A1A1A]">
            {user && (
              <button
                onClick={() => {
                  router.push('/account');
                  setIsOpen(false); // Close sidebar when navigating
                }}
                className="flex items-center w-full mb-3 px-2 py-2 hover:bg-[#262626] rounded-md transition-colors group" 
              >
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-[#FFD700] group-hover:border-[#FFE44D] bg-[#2a2a2a] flex items-center justify-center">
                  {user.profileImage && user.profileImage.trim() !== '' ? (
                    <Image 
                      src={user.profileImage} 
                      alt="Profile" 
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Profile image failed to load, using fallback');
                        // Hide the image and show the parent container with User icon
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<svg class="w-5 h-5 text-[#FFD700] group-hover:text-[#FFE44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                      }}
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#FFD700] group-hover:text-[#FFE44D]" />
                  )}
                </div>
                <span className="text-white truncate text-sm group-hover:text-[#FFE44D]">{user.username}</span>
              </button>
            )}

            {/* Feedback button removed from here */}

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-[#FFD700] hover:bg-[#262626] rounded-md transition-colors text-sm"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
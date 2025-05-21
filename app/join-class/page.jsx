"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { X, Loader2 } from 'lucide-react'; // Removed LogOut

const JoinClassPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingClass, setLeavingClass] = useState(null); // State for confirmation modal

  useEffect(() => {
    const fetchUserAndClasses = async () => {
      try {
        setIsLoading(true);
        const userResponse = await fetch('/api/auth/user');
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            toast.error('Session expired. Please login again.');
            router.replace('/'); // Use replace to avoid adding to history
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        setUser(userData);

        const classesResponse = await fetch(`/api/classes/joined?studentId=${userData._id}`);
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setJoinedClasses(classesData);
        } else {
          const errorData = await classesResponse.json();
          toast.error(errorData.error || 'Failed to fetch classes');
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Avoid redirecting if it's just a class fetch error, only on auth failure
        if (error.message.includes('Not authenticated') || error.message.includes('Failed to fetch user data')) {
           toast.error('Authentication failed. Please login again.');
           router.replace('/'); // Use replace here as well
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndClasses();
    // Intentionally not including router in dependencies if its methods don't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }
    if (!user?._id) {
        toast.error('User information not available. Please refresh.');
        return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user._id,
          classCode: classCode.trim(), // Preserving original case here
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      toast.success(data.message || 'Successfully joined the class!');
      // Ensure the new class has an _id before adding
      if (data.class?._id) {
         setJoinedClasses(prev => {
            // Avoid adding duplicates if server response is slow/user clicks multiple times
            if (prev.some(cls => cls._id === data.class._id)) {
                return prev;
            }
            return [...prev, data.class];
         });
      } else {
         // Fetch classes again if ID is missing in response (fallback)
         const classesResponse = await fetch(`/api/classes/joined?studentId=${user._id}`);
         if (classesResponse.ok) setJoinedClasses(await classesResponse.json());
      }
      setClassCode('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClass = async (classId) => {
    if (!user?._id || !classId) {
        toast.error('Cannot leave class. Missing user or class information.');
        return;
    }
    // Keep the modal open while processing
    // setLeavingClass(null); // Don't close modal immediately

    try {
      const response = await fetch(`/api/classes/leave?classId=${classId}&studentId=${user._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave class');
      }

      setJoinedClasses(prev => prev.filter(cls => cls._id !== classId));
      toast.success('Successfully left the class');
      setLeavingClass(null); // Close modal on success
    } catch (error) {
      toast.error(error.message);
      // Optionally close modal on error too, or keep it open for retry
      // setLeavingClass(null);
    }
    // No finally block needed here if we handle closing modal in try/catch
  };

  // Function to open the confirmation modal
  const confirmLeaveClass = (cls) => {
    setLeavingClass(cls);
  };

  // Function to handle closing the page
  const handleClosePage = () => {
    // Navigate to a specific page like dashboard instead of just 'back'
    // This prevents the loop if the previous page was the feedback page.
    router.push('/main'); // Adjust '/dashboard' to your main student area route
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#FFD700] animate-spin" />
          <p className="text-gray-300 text-lg">Loading your details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1F1F1F] p-6 sm:p-8 rounded-xl shadow-lg max-w-lg mx-auto border border-[#333333]">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#333333]">
            <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Join a New Class</h2>
            <button
              onClick={handleClosePage} // Use the new handler
              className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-[#333333]"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Details Section (Optional but good for context) */}
          {user && (
            <div className="bg-[#2a2a2a] p-4 rounded-lg mb-8 border border-[#444444]">
              <h3 className="text-[#FFD700] text-base font-semibold mb-3">Logged in as:</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300 flex">
                  <span className="text-gray-500 w-20 shrink-0">Username:</span>
                  <span className="truncate">{user.username}</span>
                </p>
                <p className="text-gray-300 flex">
                  <span className="text-gray-500 w-20 shrink-0">Email:</span>
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
            </div>
          )}

          {/* Join Class Form */}
          <div className="space-y-6 mb-10">
            <div>
              <label htmlFor="classCode" className="text-sm font-medium text-gray-300 block mb-2">
                Enter Class Code
              </label>
              <input
                id="classCode"
                type="text"
                placeholder="e.g., MATH101"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)} // Removed toUpperCase() to preserve case
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg border border-[#444444] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent placeholder-gray-500"
                style={{ textTransform: 'none' }} // Ensure no text transformation occurs
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleJoinClass();
                  }
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                Note: Class codes are case-sensitive. Please enter exactly as provided.
              </p>
            </div>
            <button
              onClick={handleJoinClass}
              disabled={loading || !classCode.trim()}
              className={`w-full flex justify-center items-center bg-[#FFD700] text-black py-3 px-4 rounded-lg font-semibold transition-all duration-200 ease-in-out ${
                loading || !classCode.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#FFE44D] hover:shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Class'
              )}
            </button>
          </div>

          {/* Joined Classes List */}
          {joinedClasses.filter(cls => cls.status === 'active').length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#333333]">
              <h3 className="text-white text-xl font-semibold mb-5">Your Active Classes</h3>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {joinedClasses
                  .filter(cls => cls.status === 'active')
                  .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)) // Show newest first
                  .map((cls) => (
                  <div
                    key={cls._id}
                    className="bg-[#2a2a2a] p-4 rounded-lg border border-[#444444] transition-shadow hover:shadow-lg"
                  >
                    {/* Class Details - Not clickable */}
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-white">{cls.name}</p>
                      <p className="text-sm text-gray-400">Code: {cls.enrollmentCode}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {new Date(cls.startDate).toLocaleDateString()} {/* Simplified date */}
                      </p>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-[#444444]">
                       <button
                        onClick={() => router.push(`/feedback/${cls._id}`)}
                        className="flex-1 sm:flex-none text-center bg-[#FFD700] text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                      >
                        Give Feedback
                      </button>
                      <button
                        onClick={() => confirmLeaveClass(cls)} // Open confirmation modal
                        className="flex-1 sm:flex-none text-center bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Leave Class
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
           {joinedClasses.filter(cls => cls.status === 'active').length === 0 && !isLoading && (
             <p className="text-center text-gray-500 mt-8">You haven&apos;t joined any active classes yet.</p>
           )}
        </div>

        {/* Confirmation Modal */}
        {leavingClass && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-[#1F1F1F] p-6 rounded-lg max-w-md w-full mx-auto border border-[#444444] shadow-xl">
              <h3 className="text-white text-xl font-semibold mb-4">Confirm Leave Class</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to leave the class <strong className="text-[#FFD700]">{leavingClass.name}</strong>?
                You will need to rejoin using the class code if you change your mind.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setLeavingClass(null)} // Close modal
                  className="px-5 py-2 text-gray-300 hover:text-white rounded-md hover:bg-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLeaveClass(leavingClass._id)}
                  className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Leave Class
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications Container */}
        <ToastContainer
          position="bottom-right" // Changed position
          autoClose={4000} // Slightly longer duration
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark" // Dark theme matches the UI
          className="z-[100]" // Ensure toast is above modal backdrop
        />
      </div>
    </>
  );
};

export default JoinClassPage;
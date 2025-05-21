"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // <-- Import useParams
import { Star, StarHalf, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ClassDetailsPage = () => {
  const router = useRouter();
  const { classId } = useParams(); // <-- Get the classId using useParams
  const [classData, setClassData] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [submittedFeedback, setSubmittedFeedback] = useState(null); // New state to hold user's feedback
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    review: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user data
        const userRes = await fetch('/api/auth/user');
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        setUser(userData);

        // Fetch class details using classId from useParams
        const classRes = await fetch(`/api/classes/${classId}`);
        if (!classRes.ok) throw new Error('Class not found');
        const classData = await classRes.json();
        setClassData(classData);

        // Fetch feedbacks
        const feedbackRes = await fetch(`/api/feedback?classId=${classId}`);
        if (!feedbackRes.ok) throw new Error('Failed to fetch feedbacks');
        const { feedbacks } = await feedbackRes.json();
        setFeedbacks(feedbacks);

        // Check if the user has already submitted feedback
        if (userData) {
          const userFeedback = feedbacks.find(feedback => feedback.studentId._id === userData._id);
          if (userFeedback) {
            setSubmittedFeedback(userFeedback);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchData();
    }
  }, [classId]); // <-- Use classId here

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate feedback submission
    if (submittedFeedback) {
      toast.error('You have already submitted feedback.');
      return;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user._id,
          classId, // <-- Use classId here
          ...newFeedback
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFeedbacks([data.feedback, ...feedbacks]);
      setSubmittedFeedback(data.feedback); // Set submitted feedback state
      setNewFeedback({ rating: 5, review: '' });
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error: {error}</p>
          <button 
            onClick={() => router.back()} 
            className="bg-[#FFD700] text-black px-6 py-2 rounded-lg hover:bg-[#FFE44D]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          <p className="text-white">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-white">Class not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Go Back Button */}
        <button
          onClick={() => router.push('/join-class')}
          className="mb-6 flex items-center gap-2 text-[#FFD700] hover:text-[#FFE44D] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to Join Class
        </button>

        {/* Class Details Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-8">
          <h1 className="text-2xl text-white font-bold mb-4">{classData.name}</h1>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-[#FFD700]">Enrollment Code</p>
              <p>{classData.enrollmentCode}</p>
            </div>
            <div>
              <p className="text-[#FFD700]">Start Date</p>
              <p>{new Date(classData.startDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Feedback Form or Submitted Feedback */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-8">
          {submittedFeedback ? (
            <>
              <h2 className="text-xl text-white font-bold mb-4">Your Submitted Feedback</h2>
              <div className="flex items-center mb-4">
                <div className="flex text-[#FFD700]">
                  {[...Array(submittedFeedback.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6" />
                  ))}
                </div>
                <span className="text-gray-400 ml-2">({submittedFeedback.rating} stars)</span>
              </div>
              <p className="text-white">{submittedFeedback.review}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl text-white font-bold mb-4">Share Your Feedback</h2>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-[#FFD700] mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                        className={`focus:outline-none ${star <= newFeedback.rating ? 'text-[#FFD700]' : 'text-gray-400'}`}
                      >
                        <Star className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#FFD700] mb-2">Review</label>
                  <textarea
                    value={newFeedback.review}
                    onChange={(e) => setNewFeedback({ ...newFeedback, review: e.target.value })}
                    className="w-full bg-[#262626] text-white p-3 rounded-lg border border-[#333333] focus:outline-none focus:border-[#FFD700]"
                    rows="4"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#FFD700] text-black px-6 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
                >
                  Submit Feedback
                </button>
              </form>
            </>
          )}
        </div>

        {/* Feedbacks List */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl text-white font-bold mb-4">Class Feedbacks</h2>
          {feedbacks.length === 0 ? (
            <p className="text-gray-400">No feedbacks yet</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border-b border-[#262626] pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex text-[#FFD700]">
                        {[...Array(feedback.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4" />
                        ))}
                      </div>
                      <span className="text-gray-400 ml-2">
                        {feedback.studentId.username}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white">{feedback.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer theme="dark" />
    </div>
  );
};

export default ClassDetailsPage;

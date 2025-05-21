"use client";

import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Send, ExternalLink, Loader2 } from 'lucide-react';

const FeedbackSurveyPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    q1_helpfulness: '',
    q2_frustrations: '',
    q3_improvement: '',
  });
  const [userEmail, setUserEmail] = useState(''); // State to store user email
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true); // State for user fetch loading

  const surveyLink = "https://docs.google.com/forms/d/e/1FAIpQLSdyPt-OXrTht5AAK3hRnqKnaNbMirl9UU4dL7Kcx8CZ3LDCqQ/viewform";

  // Fetch user email on component mount
  useEffect(() => {
    const fetchUser = async () => {
      setIsFetchingUser(true);
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Please log in to submit feedback.');
            router.push('/'); // Redirect to login if not authenticated
          } else {
            throw new Error('Failed to fetch user data');
          }
          return; // Stop execution if fetch failed
        }
        const userData = await response.json();
        if (userData && userData.email) {
          setUserEmail(userData.email);
        } else {
          throw new Error('Email not found in user data');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error(error.message || 'Could not load user details.');
        // Optionally redirect or disable form if user fetch fails critically
        // router.push('/');
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Added router to dependency array

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure user email is loaded before submitting
    if (!userEmail) {
      toast.error('User email not loaded. Please wait or try refreshing.');
      return;
    }

    setIsLoading(true);

    // Basic validation
    if (!formData.q1_helpfulness.trim() || !formData.q2_frustrations.trim() || !formData.q3_improvement.trim()) {
      toast.error('Please answer all feedback questions before submitting.');
      setIsLoading(false);
      return;
    }

    try {
      // Include email in the payload
      const payload = {
        ...formData,
        email: userEmail,
      };

      const response = await fetch('/api/feedback/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Send payload with email
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      toast.success('Feedback submitted successfully! Thank you.');
      // Optionally clear form or redirect
      setFormData({ q1_helpfulness: '', q2_frustrations: '', q3_improvement: '' });
      // Consider redirecting after a short delay
      // setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading state while fetching user
  if (isFetchingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#FFD700] animate-spin" />
          <p className="text-gray-300 text-lg">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] py-10 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl mx-auto bg-[#1F1F1F] p-6 sm:p-8 rounded-xl shadow-lg border border-[#333333]">

          {/* Header */}
          <div className="flex items-center mb-8 pb-4 border-b border-[#333333]">
            <button
              onClick={() => router.back()} // Go back to the previous page
              className="mr-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#333333]"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FFD700]">
              Feedback & Survey
            </h1>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-8 mb-10">
            {/* Question 1 */}
            <div>
              <label htmlFor="q1_helpfulness" className="block text-lg font-medium text-gray-300 mb-3">
                1. Did Belto’s AI responses genuinely help you learn or better understand your coursework? Why or why not?
              </label>
              <textarea
                id="q1_helpfulness"
                name="q1_helpfulness"
                rows={4}
                value={formData.q1_helpfulness}
                onChange={handleChange}
                required
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg border border-[#444444] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent placeholder-gray-500"
                placeholder="Your thoughts on helpfulness..."
              />
            </div>

            {/* Question 2 */}
            <div>
              <label htmlFor="q2_frustrations" className="block text-lg font-medium text-gray-300 mb-3">
                2. Was there anything that felt confusing, frustrating, or missing while using Belto? What would have made the experience smoother or more valuable?
              </label>
              <textarea
                id="q2_frustrations"
                name="q2_frustrations"
                rows={4}
                value={formData.q2_frustrations}
                onChange={handleChange}
                required
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg border border-[#444444] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent placeholder-gray-500"
                placeholder="Any challenges or suggestions for improvement..."
              />
            </div>

            {/* Question 3 */}
            <div>
              <label htmlFor="q3_improvement" className="block text-lg font-medium text-gray-300 mb-3">
                3. If you could change one thing about Belto to make it more useful or engaging for students like you, what would it be?
              </label>
              <textarea
                id="q3_improvement"
                name="q3_improvement"
                rows={4}
                value={formData.q3_improvement}
                onChange={handleChange}
                required
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg border border-[#444444] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent placeholder-gray-500"
                placeholder="Your top suggestion..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isFetchingUser || !userEmail} // Disable if loading or email not fetched
              className={`w-full flex justify-center items-center bg-[#FFD700] text-black py-3 px-4 rounded-lg font-semibold transition-all duration-200 ease-in-out ${
                isLoading || isFetchingUser || !userEmail
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#FFE44D] hover:shadow-md'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>

          {/* Survey Link Section */}
          <div className="mt-10 pt-6 border-t border-[#333333] text-center">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Optional Survey</h2>
            <p className="text-gray-400 mb-5">
              For more detailed feedback, please consider filling out our short survey.
            </p>
            <a
              href={surveyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              Take the Survey
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>

        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

export default FeedbackSurveyPage;
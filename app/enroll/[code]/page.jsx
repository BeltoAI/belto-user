"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const EnrollmentRedirect = () => {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking, validating, redirecting
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEnrollment = async () => {
      try {
        const enrollmentCode = params.code;
        console.log('Processing enrollment for code:', enrollmentCode);
        
        if (!enrollmentCode) {
          setError('Invalid enrollment link');
          return;
        }

        // First, validate that the enrollment code exists
        setStatus('validating');
        try {
          const validateResponse = await fetch('/api/classes/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classUrl: `/enroll/${enrollmentCode}` }),
          });

          if (!validateResponse.ok) {
            console.log('Enrollment code validation failed:', validateResponse.status);
            setError('Invalid or expired enrollment code');
            return;
          }
          console.log('Enrollment code validation successful');
        } catch (validateError) {
          console.error('Error validating enrollment code:', validateError);
          setError('Unable to validate enrollment code');
          return;
        }

        // Check if user is authenticated
        const userResponse = await fetch('/api/auth/user');
        
        if (userResponse.ok) {
          // User is authenticated, redirect to join-class page with the code
          console.log('User authenticated, redirecting to join-class');
          setStatus('redirecting');
          const joinClassUrl = `/join-class?code=${encodeURIComponent(enrollmentCode)}`;
          router.replace(joinClassUrl);
        } else {
          // User is not authenticated, redirect to login with return URL
          console.log('User not authenticated, redirecting to login');
          setStatus('redirecting');
          const loginUrl = `/login?returnUrl=${encodeURIComponent(`/enroll/${enrollmentCode}`)}`;
          router.replace(loginUrl);
        }
      } catch (error) {
        console.error('Error handling enrollment:', error);
        setError('Failed to process enrollment link');
      }
    };

    handleEnrollment();
  }, [params.code, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#1F1F1F] p-8 rounded-xl shadow-lg max-w-md mx-auto border border-[#333333] text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-2">Enrollment Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#FFD700] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#FFE44D] transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-6">
        <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-2">
            {status === 'checking' && 'Processing enrollment link...'}
            {status === 'validating' && 'Validating enrollment code...'}
            {status === 'redirecting' && 'Redirecting...'}
          </h2>
          <p className="text-gray-300">
            {status === 'checking' && 'Checking your authentication status'}
            {status === 'validating' && 'Verifying the enrollment code is valid'}
            {status === 'redirecting' && 'Taking you to the right place'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentRedirect;

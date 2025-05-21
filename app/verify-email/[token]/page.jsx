// app/verify-email/[token]/page.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function VerifyEmailPage({ params }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify-email?token=${params.token}`);
                const data = await response.json();

                if (response.ok) {
                    setMessage('Email verified successfully');
                    toast.success('Email verified successfully');
                    setTimeout(() => {
                        router.push('/');
                    }, 3000);
                } else {
                    setMessage(data.error);
                    toast.error(data.error);
                }
            } catch (error) {
                console.error('Email verification error:', error);
                setMessage('An error occurred during verification');
                toast.error('An error occurred during verification');
            } finally {
                setLoading(false);
            }
        };

        if (params.token) {
            verifyEmail();
        }
    }, [params.token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="max-w-md w-full text-center">
                {loading ? (
                    <p>Verifying your email...</p>
                ) : (
                    <>
                        <p>{message}</p>
                        {message === 'Email verified successfully' && (
                            <p className="text-gray-400 mt-4">Redirecting to login page...</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
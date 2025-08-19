"use client";

import { Mail, Eye, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc'; 
import { signIn, useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [step, setStep] = useState(1); // Step 1: Email, Step 2: Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [processingAuth, setProcessingAuth] = useState(false);

    // Handle NextAuth session changes
    useEffect(() => {
        // Only execute when status changes to authenticated and we're not already processing
        if (status === "authenticated" && session && !processingAuth) {
            console.log("NextAuth session authenticated, redirecting");
            setProcessingAuth(true);
            
            // Sync with backend by creating a session for this Google user
            syncGoogleUser(session.user).then(() => {
                router.push('/main');
            }).catch(err => {
                console.error("Error syncing Google user:", err);
                toast.error("Authentication error. Please try again.");
                setProcessingAuth(false);
            });
        }
    }, [session, status, router, processingAuth]);

    // Function to sync Google-authenticated user with our backend
    const syncGoogleUser = async (user) => {
        if (!user?.email) {
            throw new Error("No user email from Google auth");
        }
        
        try {
            const response = await fetch('/api/auth/google-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: user.email,
                    name: user.name,
                    image: user.image
                }),
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to sync Google account");
            }
            
            return await response.json();
        } catch (error) {
            console.error("Google sync error:", error);
            throw error;
        }
    };

    // Check for email verification and auth errors
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check for verification success message
            if (urlParams.get('verified') === 'true') {
                toast.success('Email verified successfully! Please log in.');
            }
            
            // Check for auth error from NextAuth
            const errorType = urlParams.get('error');
            if (errorType) {
                let errorMessage = 'Authentication failed';
                
                // Map common NextAuth error codes to user-friendly messages
                if (errorType === 'OAuthSignin') errorMessage = 'Error starting Google sign in. Please check your network connection.';
                if (errorType === 'OAuthCallback') errorMessage = 'Google authentication callback failed. Please try again.';
                if (errorType === 'OAuthAccountNotLinked') errorMessage = 'This email is already used with a different sign-in method. Please use the original method or contact support.';
                if (errorType === 'Callback') errorMessage = 'Authentication callback error. This might be due to configuration issues.';
                if (errorType === 'AccessDenied') errorMessage = 'Access denied by Google. You may have declined permission or your account is restricted.';
                if (errorType === 'Configuration') errorMessage = 'Authentication configuration error. Please contact support.';
                if (errorType === 'Signin') errorMessage = 'Sign in error occurred. Please try again or contact support.';
                
                toast.error(`Authentication error: ${errorMessage}`);
                setError(errorMessage);
                
                // Log for debugging in development
                if (process.env.NODE_ENV === 'development') {
                    console.error('NextAuth Error:', errorType, errorMessage);
                }
            }
            
            // Clear URL parameters after processing
            if ((urlParams.get('error') || urlParams.get('verified')) && window.history.replaceState) {
                const newUrl = window.location.pathname;
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, []);

    const handleContinue = async (e) => {
        e.preventDefault();

        if (step === 1) {
            if (!email) {
                toast.error('Email is required');
                return;
            }
            setStep(2); // Move to the password step
        } else if (step === 2) {
            if (!password) {
                toast.error('Password is required');
                return;
            }
            try {
                setLoading(true);
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Protection': '1', // Add CSRF protection header
                    },
                    credentials: 'include', // Important for cookie handling
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success('Login successful');
                    setProcessingAuth(true);
                    router.push('/main');
                } else {
                    setError(data.error || 'Login failed. Please try again.');
                    toast.error(data.error || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                setError('An error occurred. Please try again.');
                toast.error('An error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            setGoogleLoading(true);
            setError('');
            console.log(`Starting ${provider} authentication...`);
            
            // Clear any previous errors from the URL
            if (typeof window !== 'undefined' && window.history.replaceState) {
                const newUrl = window.location.pathname;
                window.history.replaceState(null, '', newUrl);
            }
            
            // Using signIn with specific configuration
            const result = await signIn(provider, {
                callbackUrl: '/login', // Changed to /login to handle sync properly
                redirect: true
            });
            
            // If there's an error in the result (shouldn't happen with redirect: true)
            if (result?.error) {
                console.error('SignIn result error:', result.error);
                toast.error('Authentication failed. Please try again.');
                setGoogleLoading(false);
                setError('Authentication failed. Please try again.');
            }
            
        } catch (error) {
            console.error(`${provider} login error:`, error);
            toast.error('An error occurred during login. Please check your internet connection and try again.');
            setGoogleLoading(false);
            setError('Login failed. Please try again.');
        }
    };

    // Determine if we're in a loading state
    const isLoading = status === 'loading';

    // Don't render the form until we know the session status
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
            <ToastContainer position="top-right" theme="dark" />
            <div className="max-w-sm w-full space-y-2">
                {/* Logo */}
                <div className="flex justify-center">
                    <Image
                        width={400}
                        height={400}
                        src="/logo.png"
                        alt="Logo"
                        className="rounded-full md:w-24 md:h-24 lg:w-40 lg:h-40"
                    />
                </div>

                {/* Title */}
                <h2 className="text-2xl text-center font-medium">
                    Welcome Back
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleContinue} className="space-y-6">
                    {step === 1 && (
                        <>
                            {/* Email Field */}
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm peer"
                                    placeholder=" "
                                />
                                <label
                                    htmlFor="email"
                                    className={`absolute left-3 text-sm transition-all duration-200 transform 
                                        ${emailFocused || email ? '-translate-y-2 text-xs text-yellow-500 bg-black px-1' : 'translate-y-2 text-gray-500'}
                                        pointer-events-none
                                    `}
                                >
                                    Email address
                                </label>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Continue Button */}
                            <button
                                type="submit"
                                className="flex justify-center w-full py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-500 text-sm"
                            >
                                Continue
                                <ArrowRight className="h-5 w-5 ml-2 text-black" />
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-black text-gray-500">OR</span>
                                </div>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleSocialLogin('google')}
                                    disabled={googleLoading || processingAuth}
                                    className="w-full px-3 py-2 border border-gray-800 rounded-md flex items-center justify-center space-x-4 hover:bg-gray-900 text-sm disabled:opacity-70"
                                >
                                    {googleLoading ? (
                                        <span>Connecting...</span>
                                    ) : (
                                        <>
                                            <FcGoogle className="w-5 h-5" />
                                            <span>Continue with Google</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Email Display */}
                            <div className="space-y-1 border border-yellow-600 p-4 rounded-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs text-yellow-500 hover:text-yellow-400"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm peer"
                                    placeholder=" "
                                    autoComplete="current-password"
                                />
                                <label
                                    htmlFor="password"
                                    className={`absolute left-3 text-sm transition-all duration-200 transform 
                                        ${passwordFocused || password ? '-translate-y-2 text-xs text-yellow-500 bg-black px-1' : 'translate-y-2 text-gray-500'}
                                        pointer-events-none
                                    `}
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    <Eye className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <Link
                                    href="/reset-password"
                                    className="text-yellow-500 hover:text-yellow-400 text-sm"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Continue Button */}
                            <button
                                type="submit"
                                className="flex justify-center w-full py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-500 text-sm"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                                <ArrowRight className="h-5 w-5 ml-2 text-black" />
                            </button>
                        </>
                    )}
                </form>

                {/* Registration Link */}
                <div className="flex items-center justify-center space-x-1 text-sm mt-12">
                    <span className="text-gray-400 ">Don&apos;t have an account?</span>
                    <Link href="/register" className="text-yellow-500 hover:text-yellow-400">
                        Register
                    </Link>
                </div>

                {/* Terms and Privacy Links */}
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <a 
                        href="https://belto.world/terms.html" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-gray-400"
                    >
                        Terms of Use
                    </a>
                    <a 
                        href="https://belto.world/privacy.html" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-gray-400"
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>
        </div>
    );
}
"use client";

import { Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; 
import { RiMicrosoftFill } from "react-icons/ri";
import { FaApple } from 'react-icons/fa';
import { Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const router = useRouter();

    const handleContinue = async (e) => {
        e.preventDefault();

        if (step === 1) {
            if (!username || !email) {
                toast.error('Username and email are required');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            if (!password) {
                toast.error('Password is required');
                return;
            }
            try {
                setLoading(true);
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    setRegistrationSuccess(true);
                } else {
                    toast.error(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                toast.error('An error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    const validatePassword = (password) => {
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return { hasMinLength, hasUppercase, hasNumber };
    };

    const { hasMinLength, hasUppercase, hasNumber } = validatePassword(password);

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="max-w-md w-full text-center space-y-4">
                    <h2 className="text-2xl font-medium">Check Your Email</h2>
                    <p className="text-gray-400">
                        We&apos;ve sent a verification link to <strong>{email}</strong>. Please click the link to verify your account.
                    </p>
                    <p className="text-gray-400">
                        Once verified, you&apos;ll be automatically redirected to the login page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-sm w-full space-y-8">
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
                    Create an account
                </h2>

                <form onSubmit={handleContinue} className="space-y-6">
                    {step === 1 && (
                        <>
                            {/* Username Field */}
                            <div className="relative">
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => setUsernameFocused(true)}
                                    onBlur={() => setUsernameFocused(false)}
                                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm peer"
                                    placeholder=" "
                                />
                                <label
                                    htmlFor="username"
                                    className={`absolute left-3 text-sm transition-all duration-200 transform 
                                        ${usernameFocused || username ? '-translate-y-2 text-xs text-yellow-500 bg-black px-1' : 'translate-y-2 text-gray-500'}
                                        pointer-events-none
                                    `}
                                >
                                    Username
                                </label>
                            </div>

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
                            </div>

                            <button
                                type="submit"
                                className="flex justify-center w-full py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-yellow-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-gray-200 text-sm"
                            >
                                Continue
                                <ArrowRight className="h-5 w-5 ml-2 text-gray-800 hover:text-black" />
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-black text-gray-500">OR</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 border border-gray-800 rounded-md flex items-left justify-left space-x-4 hover:bg-gray-900 text-sm"
                                >
                                    <FcGoogle className="w-5 h-5" />
                                    <span>Continue with Google</span>
                                </button>

                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
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

                            <button
                                type="submit"
                                className="flex justify-center w-full py-4 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-500 text-sm"
                            >
                                Continue
                                <ArrowRight className="h-5 w-5 ml-2 text-black" />
                            </button>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between text-sm border border-yellow-500 p-4 rounded">
                                    <span className="text-gray-400">{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-yellow-500 hover:text-yellow-400 text-xs"
                                    >
                                        Edit
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        className="w-full px-3 py-3 bg-black border border-yellow-500 p-4 rounded rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                                        placeholder=" "
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

                                <div className="p-4 border border-2 border-[#1a1f37] rounded-md space-y-3">
                                    <div className="text-sm text-gray-300">Your password must contain:</div>
                                    <div className="flex items-center space-x-3">
                                        {hasMinLength ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm text-gray-300">At least 8 characters</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {hasUppercase ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm text-gray-300">At least 1 uppercase</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {hasNumber ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm text-gray-300">At least 1 number</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!hasMinLength || !hasUppercase || !hasNumber}
                                className="w-full flex justify-center py-3 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mt-4"
                            >
                                Continue
                                <ArrowRight className="h-5 w-5 ml-2 text-black" />
                            </button>
                        </>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                </form>

                <div className="flex items-center justify-center space-x-1 text-sm">
                    <span className="text-gray-400">Already have an account?</span>
                    <Link href="/login" className="text-yellow-500 hover:text-yellow-400">
                        Log in
                    </Link>
                </div>
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
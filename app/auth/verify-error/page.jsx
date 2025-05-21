export default function VerifyError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="max-w-md w-full space-y-8 p-8 rounded-lg border border-gray-700">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-red-500">Verification Failed</h2>
                    <p className="mt-2 text-gray-400">
                        The verification link is invalid or has expired. Please request a new verification email.
                    </p>
                    <div className="mt-6 space-y-4">
                        <a 
                            href="/login" 
                            className="block w-full px-6 py-3 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition-colors"
                        >
                            Go to Login
                        </a>
                        <a 
                            href="/register" 
                            className="block w-full px-6 py-3 border border-gray-600 text-white rounded hover:bg-gray-800 transition-colors"
                        >
                            Register Again
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

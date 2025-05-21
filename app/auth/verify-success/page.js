export default function VerifySuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-green-600">Email Verified!</h2>
                    <p className="mt-2">Your email has been successfully verified. You can now log in to your account.</p>
                    <a 
                        href="/auth/login" 
                        className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        </div>
    );
}

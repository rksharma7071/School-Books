import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [resendMessage, setResendMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Missing token or email.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API}/api/auth/verify-email`,
          { email, token },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data.success) {
          setStatus("success");
          setMessage(
            response.data.message || "Email verified successfully!"
          );
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(
            response.data.message || "Email verification failed."
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
          "Email verification failed. The link may be invalid or expired."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  const resendVerification = async () => {
    if (!email) {
      setResendStatus("error");
      setResendMessage("We don't have your email address. Please go back to login and sign up again.");
      return;
    }

    setResending(true);
    setResendStatus(null);
    setResendMessage("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/auth/resend-verification`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      setResendStatus("success");
      setResendMessage(response.data?.message || "A new verification email has been sent. Please check your inbox.");
    } catch (error) {
      setResendStatus("error");
      setResendMessage(error.response?.data?.message || "Failed to resend verification email. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center py-24 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6">
              {loading ? (
                <svg
                  className="animate-spin h-10 w-10 text-blue-600"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : status === "success" ? (
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {loading ? "Verifying Email" : status === "success" ? "Email Verified!" : "Verification Failed"}
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              {message || (loading ? "Please wait while we verify your email address..." : "")}
            </p>

            {!loading && status === "error" && resendMessage && (
              <div
                className={`mb-4 text-sm rounded-md px-3 py-2 ${resendStatus === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {resendMessage}
              </div>
            )}

            {!loading && (
              <div className="space-y-3">
                {status === "success" && (
                  <>
                    <p className="text-xs text-gray-500">Redirecting to login page...</p>
                    <Link
                      to="/login"
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Go to Login
                    </Link>
                  </>
                )}

                {status === "error" && (
                  <>
                    <Link
                      to="/login"
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back to Login
                    </Link>
                    <button
                      onClick={resendVerification}
                      disabled={resending || resendStatus === "success"}
                      className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${resending ||
                        resendStatus === "success"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {resending ? "Sending..." : resendStatus === "success" ? "Email Sent ✓" : "Resend Verification Email"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
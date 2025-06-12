"use client";

import { faceLogin } from "@/lib/authvisage";

const LoginPage = () => {
  const handleLogin = async () => {
    try {
      await faceLogin();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1>Login</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Login with Face Recognition
      </button>
    </div>
  );
};

export default LoginPage;

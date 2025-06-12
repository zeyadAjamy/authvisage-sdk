"use client";

import { useUserContext } from "@/contexts/user";
import { logout } from "@/lib/authvisage";

const DashboardPage = () => {
  const { user } = useUserContext();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg">Welcome to your dashboard!</p>
      {user ? (
        <div className="mt-4">
          <p className="text-lg">Hello, {user.email}!</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      ) : (
        <p className="text-red-500 mt-4">You are not logged in.</p>
      )}
    </div>
  );
};

export default DashboardPage;

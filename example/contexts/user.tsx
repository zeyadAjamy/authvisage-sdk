"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange } from "@/lib/authvisage";
import type { User } from "authvisage-sdk";

interface ContextType {
  user: User | null | undefined;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<ContextType | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<ProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>();
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }

  return context;
};

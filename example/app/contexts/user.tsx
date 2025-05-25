import { createContext, useContext, useEffect, useState } from "react";
import { authStateObserver } from "../lib/authvisage";
import { User } from "authvisage-sdk";

interface UserContextType {
  user: User | null | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const unsubscribe = authStateObserver(setUser);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

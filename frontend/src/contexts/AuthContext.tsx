import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  studentId: string | null;
  isAuthenticated: boolean;
  login: (studentId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored student ID on app load
    const storedStudentId = localStorage.getItem('studentId');
    if (storedStudentId) {
      setStudentId(storedStudentId);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (studentId: string) => {
    const trimmedStudentId = studentId.trim().toUpperCase();
    setStudentId(trimmedStudentId);
    setIsAuthenticated(true);
    localStorage.setItem('studentId', trimmedStudentId);
  };

  const logout = () => {
    setStudentId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('studentId');
  };

  const value = {
    studentId,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
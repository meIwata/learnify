import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  studentId: string | null;
  isAuthenticated: boolean;
  login: (studentId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load authentication state from localStorage on mount
  useEffect(() => {
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
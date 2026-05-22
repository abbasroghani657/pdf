import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Try to load from localStorage to persist mock auth state
  const [isPro, setIsPro] = useState(() => {
    const saved = localStorage.getItem('pdfmaster_isPro');
    return saved === 'true';
  });

  const upgradeToPro = () => {
    setIsPro(true);
    localStorage.setItem('pdfmaster_isPro', 'true');
    toast.success('Successfully upgraded to PDFMaster Pro!', {
      duration: 4000,
      icon: '👑',
    });
  };

  const downgradeToFree = () => {
    setIsPro(false);
    localStorage.setItem('pdfmaster_isPro', 'false');
  };

  return (
    <AuthContext.Provider value={{ isPro, upgradeToPro, downgradeToFree }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

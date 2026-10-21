import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
interface AuthContextType {
  user: User | null; token: string | null; role: UserRole; isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>; logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user,setUser]=useState<User|null>(null);
  const [token,setToken]=useState<string|null>(localStorage.getItem('zcoer_token'));
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{let active=true;(async()=>{try{if(token){const res=await api.getMe();if(active)setUser(res.user);}}catch{localStorage.removeItem('zcoer_token');if(active){setToken(null);setUser(null);}}finally{if(active)setIsLoading(false);}})();return()=>{active=false;};},[]);
  const login=async(email:string,password:string)=>{const res=await api.login(email,password);localStorage.setItem('zcoer_token',res.token);setToken(res.token);setUser(res.user);};
  const logout=()=>{localStorage.removeItem('zcoer_token');setToken(null);setUser(null);};
  const switchRole=async(_role:UserRole)=>{logout();};
  return <AuthContext.Provider value={{user,token,role:user?.role||'STUDENT',isLoading,login,switchRole,logout}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const context=useContext(AuthContext);if(!context)throw new Error('useAuth requires AuthProvider');return context;};

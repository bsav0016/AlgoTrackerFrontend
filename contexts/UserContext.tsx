import React, { createContext, ReactNode, useEffect, useRef } from 'react';
import { User } from '@/features/auth/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/features/auth/AuthService';

interface UserContextType {
    userRef: React.MutableRefObject<User | null>;
    setUser: (user: User | null) => void;
    updateUserData: (token: string) => void;
    updateAccountFunds: (accountFunds: number, monthlyFunds: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const userRef = useRef<User | null>(null);
    const setUser = async (newUser: User | null) => {
      userRef.current = newUser
      if (!userRef.current) {
        await AsyncStorage.removeItem('user')
      } else {
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
      }
    }

    useEffect(() => {
      const getStoredUser = async () => {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const plainUser = JSON.parse(storedUser) as User;
          const currentUser = new User (
              plainUser.username,
              plainUser.firstName,
              plainUser.lastName,
              plainUser.email,
              plainUser.accountCreated,
              plainUser.strategies,
              plainUser.accountFunds,
              plainUser.monthlyFunds,
              plainUser.resetMonthlyFunds
          );
          setUser(currentUser);
        }
      };
  
      getStoredUser();
    }, []);

    const updateUserData = async (token: string) => {
      try {
        const updatedUserData = await AuthService.refreshUserData(token);
        setUser(updatedUserData);
      } catch (error) {
        throw error;
      }
    }

    const updateAccountFunds = (accountFunds: number, monthlyFunds: number) => {
      if (!userRef.current) return;

      const updatedUser = new User(
        userRef.current.username,
        userRef.current.firstName,
        userRef.current.lastName,
        userRef.current.email,
        userRef.current.accountCreated,
        userRef.current.strategies,
        accountFunds,
        monthlyFunds,
        userRef.current.resetMonthlyFunds
      );

      setUser(updatedUser);
    }

    return (
        <UserContext.Provider value={{ userRef, setUser, updateUserData, updateAccountFunds }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = (): UserContextType => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
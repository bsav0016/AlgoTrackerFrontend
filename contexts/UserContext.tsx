import React, { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import { User } from '@/features/auth/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/features/auth/AuthService';

interface UserContextType {
    // What to show: state, so a screen that renders the user updates when the user changes.
    user: User | null;
    // The latest value for event handlers and async code, which can run after a render and need the newest user.
    userRef: React.MutableRefObject<User | null>;
    setUser: (user: User | null) => void;
    updateUserData: (token: string) => Promise<void>;
    updateAccountCredits: (accountCredits: number, monthlyCredits: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | null>(null);
    const userRef = useRef<User | null>(null);
    const setUser = async (newUser: User | null) => {
      userRef.current = newUser
      setUserState(newUser)
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
          try {
            setUser(User.fromStored(JSON.parse(storedUser)));
          } catch (error) {
            // An unreadable copy (e.g. written by an older version) is dropped; the next login or refresh rewrites it.
            console.log("Could not restore the stored user", error);
            await AsyncStorage.removeItem('user');
          }
        }
      };
  
      getStoredUser();
    }, []);

    const updateUserData = async (token: string): Promise<void> => {
      try {
        const updatedUserData = await AuthService.refreshUserData(token);
        setUser(updatedUserData);
      } catch (error) {
        throw error;
      }
    }

    const updateAccountCredits = (accountCredits: number, monthlyCredits: number) => {
      if (!userRef.current) return;

      const updatedUser = new User(
        userRef.current.username,
        userRef.current.firstName,
        userRef.current.lastName,
        userRef.current.email,
        userRef.current.accountCreated,
        userRef.current.strategies,
        accountCredits,
        monthlyCredits,
        userRef.current.resetMonthlyCredits
      );

      setUser(updatedUser);
    }

    return (
        <UserContext.Provider value={{ user, userRef, setUser, updateUserData, updateAccountCredits }}>
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
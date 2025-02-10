import React, { createContext, ReactNode, useEffect, useRef } from 'react';
import { User } from '@/features/auth/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
    userRef: React.MutableRefObject<User | null>;
    setUser: (user: User | null) => void;
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
        const setStoredUser = async () => {
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
                plainUser.freeBacktests
            );
            setUser(currentUser);
          }
        };
    
        setStoredUser();
      }, []);

    return (
        <UserContext.Provider value={{ userRef, setUser }}>
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
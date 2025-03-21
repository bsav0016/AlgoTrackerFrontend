import React, { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Routes } from '@/app/Routes';

const RouteContext = createContext({
  routeTo: (route: Routes, props?: Record<string, any>) => {},
  routeReplace: (route: Routes, props?: Record<string, any>) => {},
  routeBack: () => {}
});

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();

  const routeTo = (route: Routes, props?: Record<string, any>) => {
    let routeString = `/${route}`;
    if (props) {
      const queryString = new URLSearchParams(props).toString();
      routeString += `?${queryString}`;
    }
    if (router) {
      router.push(routeString as import('expo-router').RelativePathString);
    }
  };

  const routeReplace = (route: Routes, props?: Record<string, any>) => {
    let routeString = `/${route}`;
    if (props) {
      const queryString = new URLSearchParams(props).toString();
      routeString += `?${queryString}`;
    }
    if (router) {
      router.replace(routeString as import('expo-router').RelativePathString);
    }
  };

  const routeBack = () => {
    if (router) {
      router.back()
    }
  }

  return (
    <RouteContext.Provider value={{ routeTo, routeReplace, routeBack }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteTo = () => useContext(RouteContext);

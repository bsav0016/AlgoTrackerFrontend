import React, { createContext, useState, useCallback, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { Radius, Spacing, useTheme } from "@/constants/Theme";


export interface ToastAction {
  label: string;
  callback: () => void;
}

interface Toast {
  id: number;
  message: string;
  actions: ToastAction[];
}

interface ToastContextType {
  addToast: (message: string, actions?: ToastAction[]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const theme = useTheme();

  const addToast = useCallback(
    (
      message: string,
      actions: ToastAction[] = []
    ) => {
      const id = Date.now();
      setToasts((prevToasts) => [...prevToasts, { id, message, actions }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && <View style={styles.toastOverlay} />}
      {toasts.map((toast) => (
        <View key={toast.id} style={styles.toastWrapper} pointerEvents="box-none">
          <View
            accessibilityRole="alert"
            style={[styles.toastContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <ThemedText style={styles.toastContainerLabel}>{toast.message}</ThemedText>
            <View style={[styles.buttonContainer, toast.actions.length > 1 && styles.buttonContainerColumn]}>
              <View style={styles.buttonItem}>
                <GeneralButton
                  title={toast.actions.length > 0 ? "Cancel" : "Dismiss"}
                  variant={toast.actions.length > 0 ? "secondary" : "primary"}
                  autoWidth={false}
                  onPress={() => removeToast(toast.id)}
                />
              </View>
              {toast.actions.map((action, index) => (
                <View key={index} style={styles.buttonItem}>
                  <GeneralButton
                    title={action.label}
                    autoWidth={false}
                    onPress={() => {
                      action.callback();
                      removeToast(toast.id);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 9998,
  },
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    zIndex: 9999,
  },
  toastContainer: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  toastContainerLabel: {
    fontSize: 17,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonContainerColumn: {
    flexDirection: 'column',
  },
  buttonItem: {
    flex: 1,
  },
});

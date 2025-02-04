import React from "react";
import { notification } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";

// Create a context for the notification API
export const NotificationContext =
  React.createContext<NotificationInstance | null>(null);

// Create a provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [api, contextHolder] = notification.useNotification();

  return (
    <NotificationContext.Provider value={api}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotification = () => {
  const notificationApi = React.useContext(NotificationContext);
  if (!notificationApi) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return notificationApi;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_ORIGIN } from '../api/client';
import { getNotifications, markAllNotificationsRead } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    if (!token || !API_ORIGIN) {
      setNotifications([]);
      setUnreadCount(0);
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      return;
    }

    let isActive = true;

    async function loadNotifications() {
      try {
        const data = await getNotifications();
        if (!isActive) return;

        const items = data.map((item) => ({
          id: item.notificationID,
          message: item.message || item.title,
          time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
          read: item.isRead,
        }));

        setNotifications(items);
        setUnreadCount(items.filter((item) => !item.read).length);
      } catch (error) {
        console.error('Notification load error: ', error);
      }
    }

    loadNotifications();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hub/notifications`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log('Connected to SignalR NotificationHub');
        if (isActive) {
          setConnection(newConnection);
        }
        
        newConnection.on('ReceiveNotification', (message) => {
          if (!isActive) return;
          const newNotif = {
            id: Date.now(),
            message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    return () => {
      isActive = false;
      newConnection.stop();
    };
  }, [token]);

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('Notification mark-read error: ', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

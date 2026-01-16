import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Socket ulanishini yaratish
  const connect = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('Token mavjud emas, socket ulanmaydi');
      return;
    }

    // Agar allaqachon ulangan bo'lsa
    if (socket?.connected) {
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000
    });

    newSocket.on('connect', () => {
      console.log('Socket ulandi:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket uzildi:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket ulanish xatosi:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);
  }, [socket]);

  // Socket ulanishini uzish
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Token o'zgarganda qayta ulanish
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token && !socket?.connected) {
        connect();
      } else if (!token && socket) {
        disconnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [socket, connect, disconnect]);

  // Component unmount bo'lganda
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Random tanlash funksiyasi
  const selectRandomWinner = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket ulanmagan'));
        return;
      }

      // Event listenerni tozalash funksiyasi
      const cleanup = () => {
        socket.off('random:completed');
        socket.off('random:error');
      };

      // Muvaffaqiyatli natija
      socket.once('random:completed', (data) => {
        cleanup();
        resolve(data);
      });

      // Xato
      socket.once('random:error', (data) => {
        cleanup();
        reject(new Error(data.message));
      });

      // So'rov yuborish
      socket.emit('random:select', {
        excludePreviousWinners: options.excludePreviousWinners !== false
      });
    });
  }, [socket]);

  // Progress listener qo'shish
  const onProgress = useCallback((callback) => {
    if (!socket) return () => {};

    socket.on('random:progress', callback);
    return () => socket.off('random:progress', callback);
  }, [socket]);

  // Started listener qo'shish
  const onStarted = useCallback((callback) => {
    if (!socket) return () => {};

    socket.on('random:started', callback);
    return () => socket.off('random:started', callback);
  }, [socket]);

  // New winner listener (barcha foydalanuvchilar uchun)
  const onNewWinner = useCallback((callback) => {
    if (!socket) return () => {};

    socket.on('random:newWinner', callback);
    return () => socket.off('random:newWinner', callback);
  }, [socket]);

  const value = {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    selectRandomWinner,
    onProgress,
    onStarted,
    onNewWinner
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

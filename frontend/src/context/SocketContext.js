import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const socketRef = useRef(null);

  // Socket ulanishini yaratish
  const connect = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('Token mavjud emas, socket ulanmaydi');
      return;
    }

    // Agar allaqachon ulangan bo'lsa
    if (socketRef.current?.connected) {
      console.log('Socket allaqachon ulangan');
      return;
    }

    // Agar socket yaratilgan lekin ulanmagan bo'lsa, uni ulab ko'ramiz
    if (socketRef.current) {
      socketRef.current.connect();
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    console.log('Socket ulanmoqda:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
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
      // Xato turini aniqlash
      let errorMessage = error.message;
      if (error.message.includes('xhr poll error') || error.message.includes('websocket error')) {
        errorMessage = 'Server bilan bog\'lanib bo\'lmadi. Server ishlab turganini tekshiring.';
      } else if (error.message.includes('Avtorizatsiya')) {
        errorMessage = 'Avtorizatsiya xatosi. Qayta kiring.';
      }
      setConnectionError(errorMessage);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  // Socket ulanishini uzish
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Avtomatik ulanish - token bor bo'lsa
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketRef.current) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Token o'zgarganda qayta ulanish
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token && !socketRef.current?.connected) {
        connect();
      } else if (!token && socketRef.current) {
        disconnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connect, disconnect]);

  // Random tanlash funksiyasi
  const selectRandomWinner = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketRef.current;
      if (!currentSocket?.connected) {
        reject(new Error('Socket ulanmagan'));
        return;
      }

      // Event listenerni tozalash funksiyasi
      const cleanup = () => {
        currentSocket.off('random:completed');
        currentSocket.off('random:error');
      };

      // Muvaffaqiyatli natija
      currentSocket.once('random:completed', (data) => {
        cleanup();
        resolve(data);
      });

      // Xato
      currentSocket.once('random:error', (data) => {
        cleanup();
        reject(new Error(data.message));
      });

      // So'rov yuborish
      currentSocket.emit('random:select', {
        excludePreviousWinners: options.excludePreviousWinners !== false
      });
    });
  }, []);

  // Progress listener qo'shish
  const onProgress = useCallback((callback) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return () => {};

    currentSocket.on('random:progress', callback);
    return () => currentSocket.off('random:progress', callback);
  }, [socket]);

  // Started listener qo'shish
  const onStarted = useCallback((callback) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return () => {};

    currentSocket.on('random:started', callback);
    return () => currentSocket.off('random:started', callback);
  }, [socket]);

  // New winner listener (barcha foydalanuvchilar uchun)
  const onNewWinner = useCallback((callback) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return () => {};

    currentSocket.on('random:newWinner', callback);
    return () => currentSocket.off('random:newWinner', callback);
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

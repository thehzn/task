import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket;
export const getSocket = () => {
  if (!socket) socket = io(SOCKET_URL, { withCredentials: true, auth: { token: localStorage.getItem('token') } });
  return socket;
};
export const closeSocket = () => { socket?.disconnect(); socket = null; };

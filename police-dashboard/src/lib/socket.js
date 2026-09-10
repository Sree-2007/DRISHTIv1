import { io } from 'socket.io-client';

export const socket = io('/police', { autoConnect: false, transports: ['websocket', 'polling'] });

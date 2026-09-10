module.exports = (io) => {
  const namespaces = ['/driver', '/police', '/citizen', '/signal'];

  namespaces.forEach(ns => {
    io.of(ns).on('connection', (socket) => {
      console.log(`[socket] ${ns} connected: ${socket.id}`);

      socket.on('location:share', (data) => {
        // Throttle handled client-side; rebroadcast to police
        io.of('/police').emit('officer:location', { socketId: socket.id, ...data });
      });

      socket.on('disconnect', () => {
        console.log(`[socket] ${ns} disconnected: ${socket.id}`);
      });
    });
  });
};

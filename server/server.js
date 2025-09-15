// Simple Socket.IO mediator server (no client IP exposure to other clients)
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: '*'}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*'},
});

// Very simple queue-based matcher: pairs first two waiting sockets
let waiting = null; // { socket, prefs }

function pairSockets(a, b) {
  a.partner = b.id;
  b.partner = a.id;
  a.emit('matched');
  b.emit('matched');
}

io.on('connection', (socket) => {
  socket.partner = null;

  socket.on('find_partner', (prefs) => {
    if (waiting && waiting.socket.connected) {
      const other = waiting.socket;
      waiting = null;
      pairSockets(socket, other);
    } else {
      waiting = { socket, prefs };
    }
  });

  socket.on('message', (payload) => {
    if (!socket.partner) return;
    io.to(socket.partner).emit('message', payload);
  });

  socket.on('next', () => {
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
      socket.partner = null;
    }
    socket.emit('matched');
  });

  socket.on('end', () => {
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
      socket.partner = null;
    }
  });

  socket.on('disconnect', () => {
    if (waiting && waiting.socket.id === socket.id) waiting = null;
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Mediator server running on port', PORT);
});



const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});


let players = {};
let gameState = {
  calledNumbers: [],
  currentPlayer: null,
  
};

io.on('connection', (socket) => {
  const currentTime = new Date();
  console.log(`A user connected at ${currentTime}`);
  players[socket.id] = socket;

  if (!gameState.currentPlayer) {
    gameState.currentPlayer = socket.id;
  }

  socket.emit('gameState', gameState);

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    delete players[socket.id];

    if (gameState.currentPlayer === socket.id) {
      gameState.currentPlayer = Object.keys(players)[0];
    }
  });

  socket.on('numberCalled', (number) => {
    if (gameState.currentPlayer === socket.id) {
      gameState.calledNumbers.push(number);
      gameState.currentPlayer = Object.keys(players)[(Object.keys(players).indexOf(socket.id) + 1) % Object.keys(players).length];

      for (const id in players) {
        players[id].emit('gameState', gameState);
      }
    }
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




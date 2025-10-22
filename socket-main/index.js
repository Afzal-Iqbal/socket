
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const messages = [];
let users = [];

const addUser = (userName, socketId) => {
  users.push({
    userName,
    id: socketId,
    createdAt: Date.now()
  })
}

const removeUser = (socketId) => {
  const filterUser = users?.filter(({ id }) => id !== socketId);
  users = filterUser
}

const getUsers = () => users;


const addMessage = (message) => {
  messages.push({
    ...message,
    timeStamp: Date.now()
  })
}

// on Listening Event
// emit Sends to only that specific clients
// socket.broadcast.emit() → Sends to all except the sender

io.on('connection', (socket) => {

  socket.on('join', (data) => {
    const { username } = data;

    if (!username) {
      socket.emit('error', { message: 'Username is required' });
      return;
    }

    addUser(username.trim(), socket.id);

    socket.emit('joined', {
      message: `Welcome to the chat, ${username}!`,
      users: getUsers(),
      recentMessages: messages,
      username
    });

    socket.broadcast.emit('userJoined', {
      message: `${username} joined the chat`,
      users: getUsers()
    });
  });

  socket.on('sendMessage', (data) => {
    const user = users.find(u => u.id === socket.id);

    if (!user) {
      socket.emit('error', { message: 'You must join first' });
      return;
    }

    const { message } = data;

    if (!message || message.trim() === '') {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    const newMessage = {
      username: user.username,
      message: message.trim(),
      socketId: socket.id
    };

    addMessage(newMessage);

    socket.emit('newMessage', {
      ...newMessage,
      timeStamp: Date.now()
    })


  });

  socket.on('disconnect', () => {
    removeUser(socket.id)
  })

});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
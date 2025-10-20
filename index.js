import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        methods: ['POST', 'GET'],
        url: 'http://localhost:5173',
        credentials: true
    }
})

let users = [];
const messages = [];

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
//on listen event (connection) 
//emit send to only that specific client
//broadcast send to all other clients except the sender
//io.emit send to all clients including the sender
// socket.

io.on('connection',(socket) => {
    socket.on('join',({data}) => {// when user joins the chat
        const {userName} = data;
        if(!userName) return 'User not found';

        // check for duplicate users
        const findUser = users?.find((obj) => obj.userName === userName);
        if(findUser) return 'Duplicate User is not allowed';
        addUser(userName, socket.id);
    });
    socket.emit('joined',{
        message:`welcome to the chat ${userName}`,
        users:getUsers(),
    })

    socket.broadcast.emit('userJoined',{ // name can be anything
        message:`${userName} has joined the chat`,
        users:getUsers(),
    })
    socket.on('sendMessage',(data) =>{
        const {userName} = data;
        const findUser = users?.find((obj) =>obj.userName = userName);
        if(!findUser) return 'please add yourself first';

        const obj = {
            ...messages,
            userName: userName,
            socketId: socket.id
        }
        addMessage(obj);

        socket.broadcast('messagetoalluser', (data)=>{
            const message = {
                ...data,
                userName: userName,
                socketId: socket.id
            }
            socket.broadcast.emit('messagetoalluser', message);
        })
    })
    
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is Listening on PORT ${PORT}`);
})
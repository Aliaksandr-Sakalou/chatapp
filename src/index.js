const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages.js');
const { getUser, removeUser, addUser, getUsersInRoom } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000;
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {

    socket.on('userJoin', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Server', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('messageFromUser', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity not allowed');
        }
        console.log(user.username);
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Server' + user.username + ' has left the room!'));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('message-geolocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('geolocation-message-from-server', generateMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback('Location shared!');
    })
})

server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})
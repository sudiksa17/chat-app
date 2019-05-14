const path = require('path')
const http = require('http')
const express =  require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage}= require('./utils/message')
const {addUser,getUser,getUsersInRoom,removeUser} = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port =process.env.PORT||3000

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))


io.on('connection',(socket)=>{
    console.log('webSocket Connection is done..')
    
    // socket.emit('message',generateMessage('Welcome'))
    // socket.broadcast.emit('message',generateMessage('A new user have joined'))

    socket.on('join',({username,room},callback)=>{
        const {error,user} = addUser({id:socket.id,username,room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined.`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(string,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(string)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,string))
        callback()
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        // ${coords.latitude}, ${coords.langitude}
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
     
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left.`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })
})

server.listen(port,()=>{
    console.log(`Server is  up on port ${port}`)
})
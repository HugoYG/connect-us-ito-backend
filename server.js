const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

dotenv.config();
const PORT = process.env.PORT || 5000;

const users = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("me", socket.id);

  socket.emit("users-list", users);

  socket.on("new-user", (data) => {
    users.push({ id: socket.id, name: data.name, photo: data.photo });

    io.emit("users-list", users);
  });

  socket.on("call-user", (data) => {
    console.log("Calling user:", data.userToCall);
    io.to(data.userToCall).emit("call-user", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
      type: data.type,
      nickname: data.nickname,
      photo: data.photo,
    });
  });

  socket.on("answer-call", (data) => {
    console.log("Answering call from:", data.to);
    io.to(data.to).emit("call-accepted", data.signal);
  });

  socket.on("send-private-message", (data) => {
    const room = getPrivateRoom(data.from, data.to);
    io.to(room).emit("receive-private-message", data);
  });

  socket.on("join-private-room", (data) => {
    const room = getPrivateRoom(data.from, data.to);
    socket.join(room);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const index = users.findIndex((user) => user.id === socket.id);
    if (index !== -1) {
      users.splice(index, 1);
      io.emit("users-list", users);
    }
  });
});

function getPrivateRoom(user1, user2) {
  return [user1, user2].sort().join("-");
}

server.listen(PORT, () => console.log("Server is running on port 5000"));

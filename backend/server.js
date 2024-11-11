import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import visitorRoutes from "./routes/visitorRoutes.js";
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use("/api", visitorRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

// Initialize HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://visit-mn0xh2mq8-itzz-aryan-121s-projects.vercel.app/", // Replace with your frontend domain
    methods: ["GET", "POST"]
  }
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Make io instance available in other modules if needed
export { io };

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

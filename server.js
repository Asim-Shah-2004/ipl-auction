import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import errorHandler from "./middlewares/errorMiddleWare.js";
import Players from "./models/player.js";
import User from "./models/user.js";

dotenv.config();
const ONE_CR = 1e7;

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH'],
    },
});

const PORT = process.env.PORT || 3000;
const CONNECTION_URL = `mongodb+srv://IPL_AUCTION_24:${process.env.PASSWORD}@cluster0.ilknu4v.mongodb.net/IPL?retryWrites=true&w=majority`;

mongoose.connect(CONNECTION_URL)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.log(`No connection to MongoDB\nError:\n${err}`));

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

function emitChanges(endpoint, payload) {
    io.emit(endpoint, { payload });
}

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("<h1>Hello from the IPL Server 👋</h1>");
});

// Route for user login
app.post("/login", async (req, res, next) => {
    try {
        const { username, password, slot } = req.body;

        const user = await User.findOne({ username, slot });

        if (!user)
            return res.send({ message: "user not found" });

        if (password === user.password)
            res.send({ message: "login successful", user });
        else
            res.send({ message: "password does not match" });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

// Route to add a player
app.post("/adminAddPlayer", async (req, res, next) => {
    try {
        const { playerName, teamName, slot, price } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found!" });

        const player = await Players.findOne({ playerName });

        if (!player)
            return res.send({ message: "Player not found!" });

        // Check if the player is already sold in the given slot
        const isAlreadySold = player.isSold.some(item => item.slot === slot);
        if (isAlreadySold)
            return res.send({ message: `Player is already sold in slot number ${slot}` });

        const newbudget = user.budget - (price * ONE_CR);

        if (newbudget < 0)
            return res.send({ message: "Not enough budget" });

        // Sell the player
        player.isSold.push({ slot: slot, budget: price * ONE_CR });
        user.budget = newbudget;
        user.players.push(player._id);
        await Promise.all([user.save(), player.save()]);

        const endpoint = `playerAdded${teamName}${slot}`;
        const payload = { playerID: player._id, budget: user.budget };
        emitChanges(endpoint, payload);

        res.send({ message: "New player added successfully", player });
    } catch (err) {
        console.error(err);
        next(err);
    }
});


// Route to delete a Player


app.post("/adminDeletePlayer", async (req, res, next) => {
    try {
        const { playerName, teamName, slot } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found" });

        const player = await Players.findOne({ playerName });

        if (!player)
            return res.send({ message: "Player not found" });

        const playerIndex = user.players.findIndex(playerId => playerId.equals(player._id));

        if (playerIndex === -1)
            return res.send({ message: "Player does not exist with this user" });

        // Remove player
        const soldIndex = player.isSold.findIndex(item => item.slot === slot);
        if (soldIndex === -1)
            return res.send({ message: "Player was not sold with this slot" });

        // Add the price back in which the player was sold 
        const price = player.isSold[soldIndex].budget;
        player.isSold.splice(soldIndex, 1);
        user.budget = user.budget + price;
        user.players.splice(playerIndex, 1);
        await Promise.all([user.save(), player.save()]);

        const endpoint = `playerDeleted${teamName}${slot}`;
        const payload = { playerID: player._id, budget: user.budget };
        emitChanges(endpoint, payload);

        res.send({ message: "Player deleted successfully", player, user });
    } catch (err) {
        next(err);
    }
});

// Route to get Player Info
app.post("/getPlayer", async (req, res, next) => {
    try {
        const { _id } = req.body;
        const player = await Players.findOne({ _id });

        if (!player)
            return res.send({ message: "Player not found" });

        res.send(player);
    } catch (err) {
        next(err);
    }
});

// Route to add a Powercard
app.post("/adminAddPowerCard", async (req, res, next) => {
    try {
        const { teamName, slot, powercard } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found" });

        const result = user.powercards.find(pc => pc.name === powercard);

        if (result)
            return res.send({ message: "Power card already present" });

        // Add the powercard
        user.powercards.push({ name: powercard, isUsed: false });
        await user.save();

        const endpoint = `powercardAdded${teamName}${slot}`;
        const payload = user.powercards;
        emitChanges(endpoint, payload);

        res.send({ message: "Power card added successfully", user });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

// Route to use a Powercard
app.patch("/adminUsePowerCard", async (req, res, next) => {
    try {
        const { teamName, slot, powercard } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found" });

        const result = user.powercards.find(pc => pc.name === powercard);

        if (!result)
            return res.send({ message: "User does not have this powercard" });

        // Use the Powercard
        result.isUsed = true;
        await user.save();

        const endpoint = `usePowerCard${teamName}${slot}`;
        const payload = user.powercards;
        emitChanges(endpoint, payload);

        res.send({ message: "Power card used successfully", user });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

// Route to store Score
app.post("/calculator", async (req, res, next) => {
    try {
        const { teamName, slot, score } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found" });

        // Save the score
        user.score = score;
        await user.save();

        const endpoint = `scoreUpdate${slot}`;
        const payload = {
            teamName: teamName,
            score: score
        };
        emitChanges(endpoint, payload);

        res.send({ message: "Score updated successfully", user });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

// Route to Allocate team
app.patch("/adminAllocateTeam", async (req, res, next) => {
    try {
        const { teamName, username, slot, price } = req.body;

        const user = await User.findOne({ username, slot });

        if (!user)
            return res.send({ message: "User not found" });

        const newbudget = user.budget - (price * ONE_CR);

        if (newbudget < 0)
            return res.send({ message: "Not enough budget" });

        // Allocate Team
        user.teamName = teamName;
        user.budget = newbudget
        await user.save();

        const endpoint = `teamAllocate${username}${slot}`;
        const payload = {
            teamName: teamName,
            budget: newbudget
        };
        emitChanges(endpoint, payload);

        res.send({ message: "Team allocated successfully", user });
    } catch (err) {
        next(err);
    }
});

// Route to Spectate
app.get("/spectate/:teamName/:slot", async (req, res, next) => {
    try {
        const teamName = req.params.teamName;
        const slot = req.params.slot;

        const user = await User.findOne({ teamName, slot });

        if (!user)
            return res.send({ message: "User not found" });

        const newUser = {
            slot: user.slot,
            teamName: user.teamName,
            budget: user.budget,
            score: user.score,
            players: user.players,
            powercards: user.powercards
        };

        res.send({ newUser: newUser });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

app.use(errorHandler);

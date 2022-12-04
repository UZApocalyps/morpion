import express from 'express';
import {WebSocketServer} from "ws";
import {v4} from "uuid";

const webPort = 3000;
const wsPort = 5000;

const app = express();

app.use(express.static('public'));

const sockets = {};

const rooms = {};

const deletePlayerFromRoom = (uuid) => {
    for(let key in rooms) {
        const current = rooms[key];
        if(current.players.includes(uuid)) {
            current.players = current.players.filter(player => player !== uuid);
            if(current.players.length === 0) {
                delete rooms[key];
            }
            return;
        }
    }
}

const getOtherPlayerFromRoom = (uuid) => {
    console.log("Searching in room for uuid ", uuid);
    console.log("Rooms :", rooms);
    for(let key in rooms) {
        if(rooms[key].players.includes(uuid)) {
            let otherPlayer = rooms[key].players.find(player => player !== uuid);
            return getWs(otherPlayer);
        }
    }
    return undefined;
}

const getWs = (uuid) => {
    return sockets[uuid];
}

const gotMessage = (message, uuid) => {
    if(message.channel) {
        console.log("Got message on channel ", message.channel);
        if(message.channel === "/room/create") {
            if(!rooms.hasOwnProperty(message.data.id)) {
                rooms[message.data.id] = {
                    players: [uuid]
                };
            } else {
                getWs(uuid).send(JSON.stringify({
                    channel: "/room/create/error",
                    data: "Room already exists"
                }));
            }
        } else if (message.channel === "/room/join") {
            if(rooms.hasOwnProperty(message.data.id)) {
                rooms[message.data.id].players.push(uuid);
            } else {
                getWs(uuid).send(JSON.stringify({
                    channel: "/room/join/error",
                    data: "Room doesn't exist"
                }));
            }
        } else if (message.channel === "/move") {
            let other = getOtherPlayerFromRoom(uuid);
            if(other !== undefined) {
                console.log("Found other player, sending move");
                let data = JSON.stringify(message.data);
                console.log("Sending : ", data);
                other.send(JSON.stringify({
                    channel: "/moved",
                    data: data
                }));
            } else {
                console.log("Couldn't find other player in the room");
            }
        }
    } else {
        console.log("Console ")
    }
}

const wss = new WebSocketServer({
    port: wsPort
});
console.log("Websocket server started on port : ", wsPort);

wss.on("connection", (ws) => {
    console.log("New connection on websocket server");
    let uuid = v4();
    sockets[uuid] = ws;
    ws.on("close", () => {
        console.log("Connection closed");
        deletePlayerFromRoom(uuid);
        delete sockets[uuid];
    });
    ws.on("message", (data) => {
        let raw = data.toString();
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            console.error("Error while trying to parse data from client");
            return;
        }
        console.log("Message from client: ", parsed);
        if(parsed.channel && parsed.channel === "/echo") {
            console.log("Echoing message");
            ws.send(JSON.stringify({
                channel: "/echo",
                data: parsed.data
            }));
        } else {
            gotMessage(parsed, uuid);
        }
    });
});

app.listen(webPort, '0.0.0.0',  () => {
    console.log("App started on port : ", webPort);
});
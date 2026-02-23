# Silence backend

## Table of Contents
- [Silence backend](#silence-backend)
  - [Table of Contents](#table-of-contents)
- [Run](#run)
  - [On host](#on-host)
  - [Via docker](#via-docker)
- [API doc](#api-doc)
  - [Games](#games)
    - [`POST /games`](#post-games)
    - [`GET /games`](#get-games)
    - [`GET /games/:gameId`](#get-gamesgameid)
    - [`POST /games/:gameId/start`](#post-gamesgameidstart)
    - [`POST /games/:gameId/finish`](#post-gamesgameidfinish)
    - [`POST /games/:gameId/pause`](#post-gamesgameidpause)
  - [Players](#players)
    - [`POST /games/:gameId/players`](#post-gamesgameidplayers)
    - [`GET /games/:gameId/players/:playerId`](#get-gamesgameidplayersplayerid)
    - [`POST /games/:gameId/players/:playerId/balance/topup`](#post-gamesgameidplayersplayeridbalancetopup)
    - [`POST /games/:gameId/players/:playerId/balance/deduct`](#post-gamesgameidplayersplayeridbalancededuct)
    - [`POST /games/:gameId/players/:playerId/kick`](#post-gamesgameidplayersplayeridkick)
    - [`POST /games/:gameId/players/:playerId/restore`](#post-gamesgameidplayersplayeridrestore)
  - [WebSocket (`ws://host/game/:gameId`)](#websocket-wshostgamegameid)
    - [Message Format](#message-format)
    - [Client → Server](#client--server)
    - [Server → Client](#server--client)
    - [Payloads](#payloads)

# Run

Apply migrations to DB:
```
npm run migrate:prod
```

## On host

Configure `.env` file, then
```
npm i
```

```
npm run start
```

or (watch mode)

```
npm run dev
```

## Via docker

Configure `.env.production` file, then
```
docker compose up -d --build
```

# API doc

## Games

### `POST /games`
Create a new game.

**Body**
```json
{
  "isDotEnabled": "boolean"
}
```
**Response**
```json
{
  "gameId": 1,
  "createdAt": "date",
  "finishedAt": null,
  "status": "WAITING",
  "players": []
}
```

---

### `GET /games`
Retrieve all games (not finished).

**Response**
```json
{
  "total": 1,
  "items": [
    {
      "gameId": 1,
      "createdAt": "date",
      "finishedAt": null,
      "status": "WAITING",
      "players": []
    }
  ]
}
```

---

### `GET /games/:gameId`
Get specific game details.

**Params**
- `gameId` (number)

**Response**
```json
{
  "gameId": 1,
  "createdAt": "date",
  "finishedAt": null,
  "status": "WAITING",
  "players": []
}
```

**Errors**
- 404 if game not found

---

### `POST /games/:gameId/start`
Start a game.

**Params**
- `gameId` (number)

---

### `POST /games/:gameId/finish`
Finish a game.

**Params**
- `gameId` (number)

---

### `POST /games/:gameId/pause`
Pause a game.

**Params**
- `gameId` (number)

## Players

### `POST /games/:gameId/players`
Create a player in game.

**Params**
- `gameId` (number)

**Body**
```json
{
  "micId": 1,
  "name": "Player"
}
```

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 0,
  "balance": 0
}
```

---

### `GET /games/:gameId/players/:playerId`
Get player details.

**Params**
- `gameId` (number)
- `playerId` (number)

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 0,
  "balance": 0
}
```

**Errors**
- 404 if player not found

---

### `POST /games/:gameId/players/:playerId/balance/topup`
Add funds to player balance.

**Params**
- `gameId` (number)
- `playerId` (number)

**Body**
```json
{
  "amount": 1
}
```

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 0,
  "balance": 1
}
```

---

### `POST /games/:gameId/players/:playerId/balance/deduct`
Deduct funds from player balance.

**Params**
- `gameId` (number)
- `playerId` (number)

**Body**
```json
{
  "amount": 1
}
```

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 0,
  "balance": 0
}
```

---

### `POST /games/:gameId/players/:playerId/kick`
Remove player from game.

**Params**
- `gameId` (number)
- `playerId` (number)

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "KICKED",
  "name": "Player",
  "strikes": 0,
  "balance": 0
}
```

---

### `POST /games/:gameId/players/:playerId/restore`
Restore kicked player.

**Params**
- `gameId` (number)
- `playerId` (number)

**Response**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 0,
  "balance": 0
}
```

## WebSocket (`ws://host/game/:gameId`)
Connect to game room using `gameId` in URL path.

### Message Format
All WebSocket messages follow this structure:
```json
{
  "event": "string",
  "payload": {}
}
```

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `game:start` | - | Request game start |
| `game:pause` | - | Request game pause |
| `game:finish` | - | Request game finish |
| `game:state` | `GameStatePayload` | Send game state |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `game:started` | `GameResponse` | Game started confirmation |
| `game:paused` | `GameResponse` | Game paused confirmation |
| `game:finished` | `GameResponse` | Game finished confirmation |
| `player:strike` | `PlayerResponse` | Player breaking through threshold |

### Payloads
**GameStatePayload**
```json
{
  "players": [
    {
      "id": 1,
      "micState": 200
    }
  ]
}
```

**GameResponse**
```json
{
  "gameId": 1,
  "createdAt": "date",
  "finishedAt": null,
  "status": "WAITING",
  "players": []
}
```

**PlayerResponse**
```json
{
  "id": 1,
  "micId": 1,
  "gameId": 1,
  "status": "ACTIVE",
  "name": "Player",
  "strikes": 1,
  "balance": 0
}
```

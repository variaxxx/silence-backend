# Silence backend

## Run

Apply migrations to DB:
```
npm run migrate:prod
```

### On host

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

### Via docker

Configure `.env.production` file, then
```
docker compose up -d --build
```

## HTTP API

| Endpoint | Description |
| :------- | ----------- |
| GET /health | Healthcheck |
| GET /settings | Get all config variables |
| POST /settings | Change several config variables |

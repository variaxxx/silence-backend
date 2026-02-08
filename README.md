# Silence backend

```
npm i
npx prisma db push
npm run start
```

## HTTP API

| Endpoint | Description |
| :------- | ----------- |
| GET /health | Healthcheck |
| GET /settings | Get all config variables |
| POST /settings | Change several config variables |

# Database schema

- <https://prisma.io/>

## Development

```shell
cd backend/lib/models
```

### Pull changes from DB

```shell
yarn prisma db pull --schema ./src/prisma/schema.prisma
```

### Create migration

```shell
yarn prisma migrate dev --schema ./src/prisma/schema.prisma <name-of-migration>
```

### Reset database

:warning: **Destructive action**

```shell
yarn prisma migrate reset --schema ./src/prisma/schema.prisma
```

### Deploy database

```shell
yarn prisma migrate deploy --schema ./src/prisma/schema.prisma
```

### Generate `PrismaClient`

```shell
yarn prisma generate --schema ./src/prisma/schema.prisma
yarn prisma generate --schema ./src/prisma/schema.prisma --watch
```

### Run Prisma Studio

```shell
yarn prisma studio --schema ./src/prisma/schema.prisma
```

Then visit <http://localhost:5555/>

## Running unit tests

Run `nx test models` to execute the unit tests via [Jest](https://jestjs.io).

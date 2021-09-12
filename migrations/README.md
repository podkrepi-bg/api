# Database schema

- <https://prisma.io/>

## Development

```shell
cd backend
export SCHEMA="--schema=schema.prisma"
```

### Pull changes from DB

```shell
yarn prisma db pull $SCHEMA
```

### Create migration

- <https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/enable-native-database-functions>

```shell
yarn prisma migrate dev $SCHEMA <name-of-migration>
yarn prisma migrate dev $SCHEMA <name-of-migration> --create-only
```

### Reset database

:warning: **Destructive action**

```shell
yarn prisma migrate reset $SCHEMA
```

### Deploy database

```shell
yarn prisma migrate deploy $SCHEMA
```

### Generate `PrismaClient`

```shell
yarn prisma generate $SCHEMA
yarn prisma generate $SCHEMA --watch
```

### Run Prisma Studio

```shell
yarn prisma studio $SCHEMA
```

Then visit <http://localhost:5555/>

## Running unit tests

Run `nx test models` to execute the unit tests via [Jest](https://jestjs.io).

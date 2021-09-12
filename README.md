# PodkrepiBg API

- Database
  - <https://www.postgresql.org/>
  - <https://hub.docker.com/r/bitnami/postgresql/>
  - <https://prisma.io/>
  - [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- API
  - <https://nestjs.com/>
  - <https://www.prisma.io/nestjs>
  - <https://docs.nestjs.com/recipes/prisma>
- Workspace
  - <https://nx.dev/>

## Install dependencies

```shell
yarn
```

## Development server (docker)

```shell
docker-compose up -d
```

After starting your dev server visit:

- <http://localhost:5010/api> (API)

To shut down the dev server use:

```shell
docker-compose down
```

## Development server (local)

If you don't want to develop inside docker using mounted volumes or your setup is limited you can start the app on your local machine via:

This setup runs only the Postgres DB inside docker, and uses localhost setup to access it

```shell
docker-compose up -d pg-db

yarn dev
```

- <http://localhost:3310/api> (API)

To shut down the db instance use:

```shell
docker-compose down
```

## Code scaffolding

Using NX we can scaffold different components in generic way

<https://nx.dev/latest/node/nest/overview>

Run `nx g @nrwl/nest:controller --project=api` to generate a new controller.

You can also add the arg `--dry-run` to preview the changes without writing them.

You can generate the following components automatically:

- [application](https://nx.dev/latest/node/nest/application)
- [class](https://nx.dev/latest/node/nest/class)
- [controller](https://nx.dev/latest/node/nest/controller)
- [decorator](https://nx.dev/latest/node/nest/decorator)
- [filter](https://nx.dev/latest/node/nest/filter)
- [gateway](https://nx.dev/latest/node/nest/gateway)
- [guard](https://nx.dev/latest/node/nest/guard)
- [interceptor](https://nx.dev/latest/node/nest/interceptor)
- [interface](https://nx.dev/latest/node/nest/interface)
- [library](https://nx.dev/latest/node/nest/library)
- [middleware](https://nx.dev/latest/node/nest/middleware)
- [module](https://nx.dev/latest/node/nest/module)
- [pipe](https://nx.dev/latest/node/nest/pipe)
- [provider](https://nx.dev/latest/node/nest/provider)
- [resolver](https://nx.dev/latest/node/nest/resolver)
- [service](https://nx.dev/latest/node/nest/service)

## Build

Run `yarn build-all` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Database

For the database layer we're using [Prisma](https://prisma.io). In order to get familiar with the concept please read [What is Prisma?](https://www.prisma.io/docs/concepts/overview/what-is-prisma) and watch some intro videos on [YouTube](https://www.youtube.com/watch?v=EEDGwLB55bI&ab_channel=Prisma).

### Pull changes from local db via introspection

You can use `yarn prisma db pull` to transform you local db updates to your [schema file](https://www.prisma.io/docs/concepts/components/prisma-schema).

Read more for [db introspection here](https://www.prisma.io/docs/concepts/components/introspection)

![](https://res.cloudinary.com/prismaio/image/upload/v1628761155/docs/f7itiYw.png)

![](https://res.cloudinary.com/prismaio/image/upload/v1628761155/docs/ToNkpb2.png)

### Rebuild Prisma Schema

```shell
# run it locally via
yarn generate-schema

# or run it inside docker container via
docker-compose exec api yarn generate-schema
```

### Iterate on database versions

```shell
yarn prisma migrate dev
```

```shell
#yarn prisma migrate reset
```

### Deploy database version

```shell
yarn prisma migrate deploy
```

Notes:

- Prisma works only on single schema
- Prisma Migrate tries to deploy your database in [shadow database schema](https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database) to verify it is in a good state
- Prisma

## Data

Analyze your data via Prisma Studio

```shell
yarn prisma studio
```

## Test

The following command will run all tests in all your apps.

```shell
yarn test
```

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.

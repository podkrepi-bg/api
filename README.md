# PodkrepiBg API Dependencies and References

- API
  - <https://nestjs.com/>
  - <https://www.prisma.io/nestjs>
  - <https://docs.nestjs.com/recipes/prisma>
  - <https://github.com/juliandavidmr/awesome-nestjs#awesome-nest>
- Database
  - <https://www.postgresql.org/>
  - <https://hub.docker.com/r/bitnami/postgresql/>
  - <https://prisma.io/>
  - [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
  - <https://github.com/catalinmiron/awesome-prisma>
- Workspace
  - <https://nx.dev/>

# Setup Development Environment

## Install dependencies

```shell
git clone git@github.com:podkrepi-bg/api.git
cd api

yarn
```

## Create the Database Instance in Docker

```shell
docker-compose up --build -d pg-db
```

## Initialize the Database with Prisma Migration scripts

This is needed first time only. We use [Prisma](https://www.prisma.io/) as Database management and versioning tool the following migration command will init the dataabase from the schema.prisma file. See Database Development Guidelines below for further details.

```shell
# Create db schema
yarn prisma migrate deploy

# Add initial data
yarn prisma db seed
```

## Run the tests

Testing the initialization is done correctly.

```shell
yarn test
```

## Run the Local API Server in Development Mode

```shell
yarn dev
```

and it will listen on <http://localhost:5010/api>

# Setup Development Environment To Run inside Docker

First build the images locally and start the containers. Then iterate on the code and changes will be picked up through the mounted folders.

```shell
docker-compose up --build -d
```

After starting your dev server visit:

- <http://localhost:5010/api> (API)

To shut down the dev server use:

```shell
docker-compose down
```

# Development Guidelines

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

## Using Nest CLI

In order to use the default cli for Nestjs you need to install it globally

```shell
npm i -g @nestjs/cli

cd apps/api
nest generate resource --help
```

Read more at <https://docs.nestjs.com/cli/overview>

## Build

Run `yarn build-all` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Database

For the database layer we're using [Prisma](https://prisma.io). In order to get familiar with the concept please read [What is Prisma?](https://www.prisma.io/docs/concepts/overview/what-is-prisma) and watch some intro videos on [YouTube](https://www.youtube.com/watch?v=EEDGwLB55bI&ab_channel=Prisma).

### Pull changes from local db via introspection

You can use `yarn prisma db pull` to transform you local db updates to your [schema file](https://www.prisma.io/docs/concepts/components/prisma-schema).

Read more for [db introspection here](https://www.prisma.io/docs/concepts/components/introspection)

DB Introspection|How it works|Evolve DB
---|---|---
![schema](https://res.cloudinary.com/prismaio/image/upload/v1628761155/docs/f7itiYw.png)|![schema](https://www.prisma.io/blog/posts/2021-03-migrate-source-of-truth.png)|![schema](https://res.cloudinary.com/prismaio/image/upload/v1628761155/docs/ToNkpb2.png)

### Running raw sql queries

Read more at: <https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access>

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
yarn prisma migrate dev --create-only
yarn prisma migrate dev --skip-generate
yarn prisma migrate dev --skip-seed
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
- Prisma can pull structure from the db to regenerate the schema file

### Seed initial data in db

```shell
yarn prisma db seed
```

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

## API Docs via Swagger

Available at:

- <http://localhost:5010/docs/>

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.

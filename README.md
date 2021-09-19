# Дарителска Платформа Подкрепи.бг Backend API

## Dependencies and References

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

# Setup Development Environment (recommended)

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
yarn prisma migrate dev

# Add initial data
yarn prisma db seed
```

### Run the tests

Testing the initialization is done correctly.

```shell
yarn test
```

### Run the Local API Server in Development Mode

```shell
yarn dev
```

and it will listen on <http://localhost:5010/api>

## (Alternative)  Development Environment To Run Inside Docker

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
## API Docs via Swagger

Available at <http://localhost:5010/docs/>

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.


## NestJS Code Generaators

We recommend using [Nestjs generators](https://docs.nestjs.com/cli/usages#nest-generate) to create different nestsj components in generic way. 

```shell
yarn nest #will print all generators
```

Use the [Nest resource generator](https://docs.nestjs.com/recipes/crud-generator) to create all interfaces for CRUD operations around a new entity/resource
```shell
yarn nest generate resource [name]
```

## Building

Run `yarn build-all` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

# Database Guidelines

For the database layer we're using [Prisma](https://prisma.io). In order to get familiar with the concept please read [What is Prisma?](https://www.prisma.io/docs/concepts/overview/what-is-prisma) and watch some intro videos on [YouTube](https://www.youtube.com/watch?v=EEDGwLB55bI&ab_channel=Prisma).

## Database Development Workflow

The project already contains the database shema in shema.prisma file and initialization "seed" scripts for inital data are in db/seed folder.

## On an empty database
Initialize the database using these commands. It will initialize the database using the schema.prisma, the migration scripts and the db/seed scripts to insert data records for the API to work.
```shell
yarn prisma migrate deploy
yarn prisma seed
```

Prisma offers a nice Web Client to review and edit the database:
```shell
yarn prisma studio
```

## Making DB Schema Changes

There are two ways to work with the database:
* schema first - make changes in schema.prisma and update the database
* db first - make changes directly in the database and introspect to update the schema.prisma

### 1. Workflow for Schema First approach (recommended)
After initializing the database, feel free to edit the schema.prisma file in the main folder. When done with changes execute to update the database:

```shell
yarn prisma migrate dev
```

The command will ask you to name your changes and will generate a migration script that will be saved in ./migrations folder. 

Run the tests again `yarn test` to ensure all ok.

If you don't want to generate small migrations for every change, after finishing the work on your branch, delete the migration files manually and run again `yarn prisma migrate dev` to create one single feature level migration.

Read more about [Team development with Prisma Migrate here.](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/team-development/)

### 2. Workflow for Databased First approach
After initializing the database, open prisma stidio or your favorite DB Management IDE and feel free to make db changes. When done with changes, execute:

```shell 
yarn prisma db pull
```
This will read all changed from you db instance and will update the schema.prisma file with nessary translations.

Now that the schema file is updated, we need to update the prismajs client which is used by our app by running:
```shell
yarn prisma generate
```

This process is called [Prisma DB Introspection](https://www.prisma.io/docs/concepts/components/introspection).

## Resetting to master
If things go bad, there is a way to reset your database to the original state. This will delete the database and will create it from the schema, executing also the seeding.

```shell
yarn prisma migrate reset
```

# Production environment

## Environment variables

| Setting                | Description                               | Default value                                                               |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| PORT                   | The address on which the module binds.    | 5010                                                                        |
| APP_ENV                | Application runtime environment           | development                                                                 |
| NODE_ENV               | Node build environment                    | development                                                                 |
| TARGET_ENV             | Docker multi-stage target                 | development                                                                 |
| TARGET_APP             | Run specific application from the image.  | api                                                                         |
| DATABASE_URL           | Database connection string.               | postgres://postgres:postgrespass@localhost:5432/postgres?schema=api         |
| KEYCLOAK_URL           | Keycloak authentication url               | <https://keycloak.podkrepi.bg/auth>                                         |
| KEYCLOAK_REALM         | Keycloak Realm name                       | webapp                                                                      |
| KEYCLOAK_CLIENT_ID     | Keycloak Client name                      | jwt-headless                                                                |
| KEYCLOAK_SECRET        | Secret to reach Keycloak in headless mode | \*\*\*\*\*\*                                                                |
| SENTRY_DSN             | Sentry Data Source Name                   | <https://58b71cdea21f45c0bcbe5c1b49317973@o540074.ingest.sentry.io/5707518> |
| SENTRY_ORG             | Sentry organization                       | podkrepibg                                                                  |
| SENTRY_PROJECT         | Sentry project                            | rest-api                                                                    |
| SENTRY_AUTH_TOKEN      | Sentry build auth token                   | \*\*\*\*\*\*                                                                |
| SENTRY_SERVER_ROOT_DIR | App directory inside the docker image     | /app                                                                        |

## Deployment

```sql
CREATE SCHEMA api;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgrespass';
GRANT ALL PRIVILEGES ON SCHEMA api TO postgres;
```

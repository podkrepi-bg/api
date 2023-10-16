<h1><p align="center">
  Дарителска Платформа Подкрепи.бг <br/>
  REST API
</p></h1>

<p align="center">
  <a href="https://podkrepi.bg/" target="blank"><img src="https://podkrepi.bg/podkrepi-bg-logo-en.svg" width="320" alt="Podkrepi.bg logo" /></a>
</p>

<p align="center">
<a href="https://github.com/podkrepi-bg/api/actions/workflows/tests.yml"><img src="https://github.com/podkrepi-bg/api/actions/workflows/tests.yml/badge.svg" alt="API tests" style="max-width: 100%;"></a>
<a href="https://github.com/podkrepi-bg/api/actions/workflows/release.yml"><img src="https://github.com/podkrepi-bg/api/actions/workflows/release.yml/badge.svg" alt="Deployment" style="max-width: 100%;"></a>
</p>

## Links

| Service  | Development                      | Staging                           | Production                    |
| -------- | -------------------------------- | --------------------------------- | ----------------------------- |
| Website  | <https://localhost:3040>         | <https://dev.podkrepi.bg>         | <https://podkrepi.bg>         |
| Rest API | <https://localhost:5010/api/v1>  | <https://dev.podkrepi.bg/api/v1>  | <https://podkrepi.bg/api/v1>  |
| Swagger  | <https://localhost:5010/swagger> | <https://dev.podkrepi.bg/swagger> | <https://podkrepi.bg/swagger> |

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

To run and develop the module NodeJS 16 is required. In this section 2 ways of configuring a development environment are described.

## Installing the prerequisites

The following prerequisites are required in order to be able to run the project:

- [Node.js 16 LTS](https://nodejs.org/en/download/)
- [Yarn v3.x](https://yarnpkg.com/getting-started/install)
- [Docker](https://www.docker.com/get-started) with [Docker Compose](https://docs.docker.com/compose/) (to easily run a local database instance)

## Development container

If you wish to keep your host clean, it is also possible to develop the module in a Docker container. You can do that by using the [Visual Studio Code](https://code.visualstudio.com/download)'s [Remote Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) and read [how to initialize your dev container](https://code.visualstudio.com/docs/remote/containers).

- Make sure you have the extension installed
- Open the folder of the module in VS Code
- Hit `Ctrl`/`Cmd` + `Shift` + `P` -> Remote-Containers: Reopen Folder in Container

## Clone the code and install dependencies

```shell
git clone git@github.com:podkrepi-bg/api.git
cd api

yarn set version berry
yarn
```

## Create Docker containers for the Dev Database(postgres) and the Identity Server(Keycloak)

Run the below command in your terminal:

```shell
docker compose up -d pg-db keycloak
```

This will start the following services in your local docker:

- Local Postgres DB on default port 5432 for your personal development
- Local Keycloak Identity server Admin UI on <http://localhost:8180> with config coming from `./manifests/keycloak/config`:
  - Keycloak Local Admin User: `admin` with pass: `admin`
  - Podkrepi Local Admin users:
    - coordinator@podkrepi.bg, reviewer@podkrepi.bg, admin@podkrepi.bg,
    - all with pass: `$ecurePa33`

## Initialize the Database with Prisma Migration scripts

This is needed first time only. We use [Prisma](https://www.prisma.io/) as Database management and versioning tool the following migration command will init the database from the schema.prisma file. See Database Development Guidelines below for further details.

```shell
# Create db schema
yarn prisma migrate deploy

# Generate the prisma clients
yarn prisma generate

# Seed initial test data
yarn prisma db seed
```

## Setup local environment

Copy the provided `.env.example` to `.env`

```shell
cp .env.example .env
```

**Note:** _To avoid modifying the original file, you can create `.env.local` and add overrides for the variables that are specific to your local environment. This approach allows you to keep your customizations separate from the default values._

### Run the tests

Testing the initialization is done correctly.

```shell
yarn test
```

### Run the Local API Server in Development Mode

```shell
yarn dev
```

and the backend API server will listen on <http://localhost:5010/api/v1>

## (Alternative) Development Environment To Run Inside Docker

First build the images locally and start the containers. Then iterate on the code and changes will be picked up through the mounted folders.

```shell
docker-compose up --build -d
```

After starting your dev server visit:

- <http://localhost:5010/api/v1> (API)

To shut down the dev server use:

```shell
docker-compose down
```

# Development Guidelines

## API Docs via Swagger

Available at <http://localhost:5010/swagger/>

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.

## NestJS Code Generaators

We recommend using [Nestjs generators](https://docs.nestjs.com/cli/usages#nest-generate) to create different nestsj components in generic way.

```shell
yarn nest # will print all generators
```

Use the [Nest resource generator](https://docs.nestjs.com/recipes/crud-generator) to create all interfaces for CRUD operations around a new entity/resource

```shell
yarn nest generate resource [name]
```

## Building

Run `yarn build-all` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Formatting

Make sure you run auto-formatting before you commit your changes.

```shell
yarn format
```

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

- schema first - make changes in schema.prisma and update the database
- db first - make changes directly in the database and introspect to update the schema.prisma

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

# File Upload to S3

We use S3 for storing the uploaded files in buckets. The code expects the buckets to be created on prod or dev environment. We are hosting S3 ourselves using ceph https://ceph.io/en/discover/technology/.

The creation of the buckets can happen using s3cmd client https://s3tools.org/s3cmd or any other S3 client and using the S3 secrets for the respective environment.

To configure S3cmd run 
```shell
s3cmd --configure
```

All settings are self descriptive, however pay attention to these:
- The default region is not a Country code but "object-store-dev" for development and "object-store" for prod
- S3 endpoint: cdn-dev.podkrepi.bg
- When asked for DNS-style bucket use: cdn-dev.podkrepi.bg
- When asked for encryption password just press 'Enter' for leaving it empty

Then bucket creation is like this:

```shell
s3cmd ls
s3cmd mb s3://bucket-name
s3cmd ls
```

# Configuring Google Sign-in with Keycloak

For enabling sign-in with existing gmail account we use the token-exchange feature of Keycloak as per the great description in: https://medium.com/@souringhosh/keycloak-token-exchange-usage-with-google-sign-in-cd9127ebc96d

The logic is the following:

1. The frontend acquires a token from Google Sign-in
2. The frontend sends the token to the backend API requesting a login with external provider (see: auth.service.ts issueTokenFromProvider)
3. The backend sends the token-exchange request to Keycloak passing the Google Token for Permission to Login
4. Keycloak server grants permission and returns the access token
5. Backend creates the new user in the database and returns the access token for use from Frontend

# Production environment

## Environment variables

| Setting                   | Description                                           | Default value                                                               |
| ------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `PORT`                    | The address on which the module binds.                | 5010                                                                        |
| `GLOBAL_PREFIX`           | Registers a prefix for every HTTP route path          | api/v1                                                                      |
| `APP_VERSION`             | The version of the application                        | "unknown"                                                                   |
| `APP_ENV`                 | Application runtime environment                       | development                                                                 |
| `NODE_ENV`                | Node build environment                                | development                                                                 |
| `TARGET_ENV`              | Docker multi-stage target                             | development                                                                 |
| `TARGET_APP`              | Run specific application from the image.              | api                                                                         |
| `DATABASE_URL`            | Database connection string.                           | postgres://postgres:postgrespass@localhost:5432/postgres?schema=api         |
| `S3_ENDPOINT`             | Endpoint for S3 interface.                            | <https://cdn-dev.podkrepi.bg>                                               |
| `S3_REGION`               | The S3 region                                         | us-east-1                                                                   |
| `S3_ACCESS_KEY`           | The S3 access key.                                    | \*\*\*\*\*\*                                                                |
| `S3_SECRET_ACCESS_KEY`    | The S3 secret access key.                             | \*\*\*\*\*\*                                                                |
| `KEYCLOAK_URL`            | Keycloak authentication url                           | <http://localhost:8180>                                                     |
| `KEYCLOAK_REALM`          | Keycloak Realm name                                   | webapp                                                                      |
| `KEYCLOAK_CLIENT_ID`      | Keycloak Client name                                  | jwt-headless                                                                |
| `KEYCLOAK_SECRET`         | Secret to reach Keycloak in headless mode             | DEV-KEYCLOAK-SECRET                                                         |
| `KEYCLOAK_USER`           | Master user for Keycloak Server                       | admin                                                                       |
| `KEYCLOAK_PASSWORD`       | Master user's password for Keycloak Server            | admin                                                                       |
| `STRIPE_SECRET_KEY`       | Stripe secret key                                     | \*\*\*\*\*\*                                                                |
| `STRIPE_WEBHOOK_SECRET`   | Stripe webhook secret key                             | \*\*\*\*\*\*                                                                |
| `SENTRY_DSN`              | Sentry Data Source Name                               | <https://58b71cdea21f45c0bcbe5c1b49317973@o540074.ingest.sentry.io/5707518> |
| `SENTRY_ORG`              | Sentry organization                                   | podkrepibg                                                                  |
| `SENTRY_PROJECT`          | Sentry project                                        | rest-api                                                                    |
| `SENTRY_AUTH_TOKEN`       | Sentry build auth token                               | \*\*\*\*\*\*                                                                |
| `SENTRY_SERVER_ROOT_DIR`  | App directory inside the docker image                 | /app                                                                        |
| `SENDGRID_API_KEY`        | SendGrid API key                                      | `""` - emails disabled if not set                                           |
| `SENDGRID_SENDER_EMAIL`   | SendGrid sender email                                 | info@podkrepi.bg                                                            |
| `SENDGRID_INTERNAL_EMAIL` | Internal notification email from contact form request | info@podkrepi.bg (Prod), qa@podkrepi.bg (Dev), dev@podkrepi.bg (localhost)  |
| `SENDGRID_CONTACTS_URL`   | Endpoint to receive newsletter subscriptions          | /v3/marketing/contacts                                                      |

## Deployment

```sql
CREATE SCHEMA api;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgrespass';
GRANT ALL PRIVILEGES ON SCHEMA api TO postgres;
```

## Migrations deployment

```shell
docker build -f Dockerfile.migrations .
docker run  --env-file .env --network host <image-id>
```

## Manual resolution of failed db migrations

Overall procedure:

1. Ensure a local connection to the k8s cluster
2. Start a new `migrate-database` container manually in the proper namespace (`podkrepibg-dev` or `podkrepibg`).

```shell
kubectl run manual-migrate-db \
    -it --rm \
    -n podkrepibg-dev \
    --image=ghcr.io/podkrepi-bg/api/migrations:master \
    -- /bin/sh
```

3. Check migration status with `yarn prisma migrate status`

```shell
Following migration have failed: 20220605165716_rename_bank_hash_to_payment_reference
```

4. Rollback or apply migrations (suggested commands are printed from the status)

```shell
The failed migration(s) can be marked as rolled back or applied:

- If you rolled back the migration(s) manually:
yarn prisma migrate resolve --rolled-back "20220605165716_rename_bank_hash_to_payment_reference"

- If you fixed the database manually (hotfix):
yarn prisma migrate resolve --applied "20220605165716_rename_bank_hash_to_payment_reference"
```

5. Run migration deployment

```shell
yarn prisma migrate deploy
```

6. At this point you can re-deploy the `api-headless` deployment to trigger the standard flow of operation

# PodkrepiBg API

- <https://nestjs.com/>
- <https://prisma.io/>
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
- <http://localhost:5020/api> (Campaigns)
- <http://localhost:5030/api> (Contact)
- <http://localhost:5040/api> (Payment)

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
- <http://localhost:3320/api> (Campaigns)
- <http://localhost:3330/api> (Contact)
- <http://localhost:3340/api> (Payment)

To shut down the db instance use:

```shell
docker-compose down
```

## Code scaffolding

Using NX we can scaffold different components in generic way

Run `nx g @nrwl/react:component my-component --project=my-app` to generate a new component.

## Build

Run `yarn build-all` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Database

Rebuild Prisma Schema

```shell
yarn generate-schema
```

## Data

Analyze your data via Prisma Studio

```shell
yarn studio
```

## Test

The following command will run all tests in all your apps.

```shell
yarn test
```

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.

#!/bin/bash

set -e
set -u

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -e -c "CREATE USER keycloak WITH PASSWORD 'keycloak'"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -e -c "CREATE DATABASE keycloak"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -e -c "GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak"
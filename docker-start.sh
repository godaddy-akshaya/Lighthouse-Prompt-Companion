#!/bin/sh
if [[ "$THE_ENV" = "development" ]]; then
    npm run start:dev
else
    npm run start
fi
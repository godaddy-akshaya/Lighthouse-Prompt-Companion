#!/bin/sh
# add argument to specify environment
THE_ENV=$1

if [ "$THE_ENV" = "development" ]; then
    echo "Starting development server"
    npm run start:dev
else
    echo "Starting production server"
    npm run start
fi
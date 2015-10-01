#!/bin/bash

APP_PORT=8123
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
docker run --dns 8.8.8.8 -it --rm --name nodeTimesheetApp -v "$DIR/app":/data --link mongo:mongo -w /data -p $APP_PORT:$APP_PORT node  bash



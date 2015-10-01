#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
docker run --name mongo -v "$DIR":/data -d mongo mongod --smallfiles



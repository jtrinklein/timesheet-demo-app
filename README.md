# Setup

## Prerequisites

zshell is recommended. The fish shell has been problematic.

1. `cd app; npm install`
1. Install Virtualbox (tested on 5.0.6)
1. Install Docker (this is the hard part)
    1. `brew install docker` OR download standalone installer
    1. `sudo chown -R [youruser]:staff ~/.docker`
    1. `docker-machine create --driver virtualbox dev`
    1. `eval $(docker-machine env dev)` // Why is this run?
1. `docker-machine env dev`
1. `docker-machine ip dev`
1. Add [hosts](/etc/hosts) entry `<ip address from previous command> docker-dev` 

## Running

1. if docker machine is not running: `docker-machine up dev`
1. `docker-machine-set dev`
1. `docker-compose up`
1. Open site: http://docker-dev:8123/

## Routes
- [ts/\<username\>](http://docker-dev:8123/ts/johndoe) 
    - Displays a list of items for a user with that name

- [__tsdump__](http://docker-dev:8123/ts/johndoe)
    - Dumps all data from mongo
    
- [__messenger__](http://docker-dev:8123/ts/johndoe)
    - Publish messages to RabbitMQ
    
- [__ts/\<username\>/items__](http://docker-dev:8123/ts/johndoe) Add items via:

    POST
    ```json
    {
        "title": "Items Galore",
        "allocatedWork": 30,
        "scheduledWork": 80,
        "project": "This is project name",
        "actualWork": 20,
        "startDate": "2015-09-28T20:28:33.568Z",
        "endDate": "2015-09-30T20:28:33.568Z",
        "description": "this is the description of the work item"
    }
    ```

## Utility Scripts

Sets env and echos the ip of the new container
```sh
docker-machine-set() {
    local env=$1
    eval $(docker-machine env $env)
    echo $DOCKER_HOST
}
```
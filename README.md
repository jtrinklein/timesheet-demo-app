# Setup

install docker. This is the hard part.

## prerequisites

- Virtualbox - this could probably change
- helpful script (drop in your bashrc). sets env and echos the ip of the new container
```sh
docker-machine-set() {
    local env=$1
    eval $(docker-machine env $env)
    echo $DOCKER_HOST
```
- host entry: if $DOCKER_HOST is 192.168.1.24 `192.168.1.24 docker-dev`


## steps

- `brew install docker`
- `sudo chown -R [youruser]:staff ~/.docker`
- `docker-machine create --driver virtualbox dev`
- `eval $(docker-machine env dev)`

## running

if docker machine is not running: `docker-machine up dev`

- `docker-machine-set dev`
- `docker-compose up`
- site is available at: http://docker-dev:8123/


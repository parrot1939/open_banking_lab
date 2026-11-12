#!/bin/sh
set -eu
base=${1:-http://127.0.0.1:8080}
expect() {
    actual=$(curl --max-time 5 --silent --output /dev/null --write-out '%{http_code}' "$base$1")
    [ "$actual" = "$2" ] || { echo "$1: oczekiwano $2, otrzymano $actual"; return 1; }
}
wait_ready() {
    for i in $(seq 1 30); do
        if expect /health/ready 200; then return 0; fi
        sleep 1
    done
    return 1
}
wait_ready
expect /health/live 200
expect /api/balances 200
docker compose stop db
trap 'docker compose start db' EXIT
expect /health/live 200
expect /health/ready 503
expect /api/balances 503
docker compose start db
trap - EXIT
wait_ready
expect /api/balances 200

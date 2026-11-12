FROM postgres:16-alpine
COPY ops/init.sql /docker-entrypoint-initdb.d/01-demo.sql

FROM nginx:alpine
COPY ops/nginx.conf /etc/nginx/conf.d/default.conf

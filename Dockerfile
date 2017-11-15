FROM nginx:1-alpine

COPY nginx.conf /etc/nginx/nginx.conf.orig
COPY dist       /usr/share/nginx/html

# should be override by docker run -e

CMD envsubst \$API_HOST \
    < /etc/nginx/nginx.conf.orig  \
    > /etc/nginx/nginx.conf && \
    nginx -g 'daemon off;'

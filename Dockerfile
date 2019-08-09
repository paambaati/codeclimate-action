FROM alpine:3.10.1

LABEL "com.github.actions.name"="Code Climate Action"
LABEL "com.github.actions.description"="Sends the coverage to Code Climate"
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="blue"

LABEL "repository"="http://github.com/paambaati/codeclimate-action"
LABEL "homepage"="http://github.com/paambaati/codeclimate-action"
LABEL "maintainer"="GP <me@httgp/com>"

RUN apk add --no-cache curl bash git

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]

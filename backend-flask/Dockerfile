# pin base image to a minor version for stability
FROM python:3.10-slim-bullseye

# create user "python"
RUN set -eux; \
	groupadd -r python -g 999; \
    useradd -r -g python -u 999 --home-dir=/usr/app --shell=/bin/bash python; \
	mkdir -p /usr/app; \
	chown -R python:python /usr/app

# set working directory
WORKDIR /usr/app

# copy requirements.txt separate from the source code
# this separates things into different layers and helps with layer caching
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# use non-root user
USER python

COPY --chown=python:python . .

ENV FLASK_ENV=development

EXPOSE ${PORT}
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=4567"]

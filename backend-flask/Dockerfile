# pin base image to a minor version for stability
FROM python:3.10-slim-bullseye

# create user "python"
RUN set -eux; \
	groupadd -r python -g 999; \
    useradd -r -g python -u 999 --home-dir=/usr/app --shell=/bin/bash python; \
	mkdir -p /usr/app; \
	chown -R python:python /usr/app

# install extra packages
RUN apt-get update; \
    apt-get install -y --no-install-recommends curl; \
	rm -rf /var/lib/apt/lists/*

# set working directory
WORKDIR /usr/app

# copy requirements.txt separate from the source code
# this separates things into different layers and helps with layer caching
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# use non-root user
USER python

COPY --chown=python:python . .

ENV PYTHONUNBUFFERED=1
ENV FLASK_DEBUG=1
ENV PORT=4567

EXPOSE ${PORT}
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=4567"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4567/api/health-check || exit 1
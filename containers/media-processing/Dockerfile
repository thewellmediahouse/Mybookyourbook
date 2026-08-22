FROM python:3.12-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server.py /app/server.py

EXPOSE 8080
USER nobody
CMD ["python", "-u", "/app/server.py"]

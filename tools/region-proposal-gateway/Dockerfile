FROM python:3.13-slim

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 gateway \
    && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /nonexistent gateway

WORKDIR /app
COPY --chown=10001:10001 gateway.py /app/gateway.py

USER 10001:10001
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8787/healthz', timeout=3).read()"]

CMD ["python", "/app/gateway.py"]

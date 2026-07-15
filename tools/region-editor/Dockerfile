FROM python:3.12-alpine3.21

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MCC_EDITOR_BIND=0.0.0.0 \
    MCC_EDITOR_PORT=8080 \
    MCC_REGION_ASSET_DIR=/data/regions \
    MCC_REGION_CELL_DIR=/data/editor-cells \
    MCC_EDITOR_AUTH_FILE=/run/secrets/region-editor-auth.json

RUN addgroup -S -g 1000 editor && adduser -S -u 1000 -G editor -h /app editor
WORKDIR /app

COPY --chown=editor:editor server.py ./
COPY --chown=editor:editor templates ./templates
COPY --chown=editor:editor static ./static
COPY --chown=editor:editor vendor ./vendor

USER editor
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=2).read()"]

ENTRYPOINT ["python", "/app/server.py"]

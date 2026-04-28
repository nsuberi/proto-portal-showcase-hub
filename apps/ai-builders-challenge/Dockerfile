FROM python:3.11-slim

WORKDIR /app

COPY tests/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY fixtures ./fixtures
COPY cli ./cli
COPY scripts ./scripts

ENV PORT=5100
EXPOSE 5100

# Compute the code hash at build time if git metadata is available;
# docker-compose may also inject CODE_HASH from the host.
CMD ["python", "-m", "app.server"]

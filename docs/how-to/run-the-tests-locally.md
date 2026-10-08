# Run the tests locally

Goal: run the unit and end to end tests against a real RabbitMQ broker,
the same way CI does.

## Prerequisites

* Node 24 (or 22).
* Docker with the Compose plugin.

## Steps

1. Install dependencies:

   ```sh
   npm install
   ```

   The repository has an `.npmrc` with `legacy-peer-deps=true`, because
   published dependencies (seneca-transport) declare `peer seneca >=3`,
   which excludes the Seneca 4 prerelease.

2. Start RabbitMQ:

   ```sh
   npm run services:up
   ```

   This runs `docker compose up -d --wait` with
   [docker-compose.yml](../../docker-compose.yml): image
   `rabbitmq:4.3-alpine`, container `seneca-amqp-transport-rabbitmq`,
   AMQP port 5672 published on host port **15673**. `--wait` returns when
   the health check (`rabbitmq-diagnostics -q check_port_connectivity`)
   passes.

3. Run the tests:

   ```sh
   npm test
   ```

   `npm test` runs `test:unit` (`node --test 'test/**/*.test.js'`, no
   broker needed) and then `test:e2e` (`node --test 'e2e/**/*.e2e.js'`,
   needs the broker). `npm run coverage` runs the unit tests with
   `--experimental-test-coverage`.

4. Stop RabbitMQ and remove its volumes:

   ```sh
   npm run services:down
   ```

## Environment variables

| Variable | Default | Used by |
| -------- | ------- | ------- |
| `AMQP_URL` | `amqp://guest:guest@127.0.0.1:15673` | e2e tests and [docs/examples](../examples/) |
| `NODE_ENV` | `test` (set by the scripts) | test scripts |

To use another broker, set `AMQP_URL`, for example
`AMQP_URL=amqp://user:pass@rabbit.internal:5672/vhost npm run test:e2e`.

## Test against the unreleased Seneca 4.0.0

```sh
npm install --no-save /path/to/seneca-4.0.0.tgz
npm test
npm install   # back to the devDependency (4.0.0-rc5)
```

## CI

The GitHub Actions workflow runs the same RabbitMQ image as a service
container on the same host port with the same `AMQP_URL`. It is delivered
as a patch: see [.patches/README.md](../../.patches/README.md).

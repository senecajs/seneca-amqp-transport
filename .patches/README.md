# Patches

Changes to `.github/workflows/` cannot be pushed from the session that
prepared this branch, so they are delivered as patches. Apply them with:

```sh
git am .patches/*.patch
```

| Patch | Adds |
| ----- | ---- |
| `0001-ci-rabbitmq-build.patch` | `.github/workflows/build.yml`: Node 24.x and 22.x on ubuntu-latest, RabbitMQ `rabbitmq:4.3-alpine` as a service container on host port 15673 with a `rabbitmq-diagnostics -q check_port_connectivity` health check, `AMQP_URL=amqp://guest:guest@127.0.0.1:15673`, triggers on `master`, `main` and `develop`. |

After applying, the `.patches/` folder can be deleted.

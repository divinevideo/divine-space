# Fastly Deployment

## Production Topology

- `divine.space` is served through Fastly, not GitHub Pages.
- The Fastly Compute service in this repo is `divine-space`.
- Fastly service ID: `COuE4goKNdS56m7ZBbxgNn`
- Fastly domains on that service:
  - `divine.space`
  - `*.divine.space`

Evidence gathered locally on 2026-04-05:

- `compute-js/fastly.toml` points at `service_id = "COuE4goKNdS56m7ZBbxgNn"`
- `fastly domain list --service-id COuE4goKNdS56m7ZBbxgNn` returns both `divine.space` and `*.divine.space`
- live `https://divine.space` responses include `x-served-by: cache-...`, which is Fastly edge infrastructure

## Repo Deploy Paths

There are currently two deploy paths in the repo:

1. GitHub Pages
   - Triggered by pushes to `main`
   - Publishes to `https://divinevideo.github.io/divine-space/`
   - Useful as a repo-hosted build target
   - Not the primary production path for `divine.space`

2. Fastly Compute
   - Lives under [`compute-js/`](/Users/rabble/code/divine/divine-space/compute-js)
   - This is the production path for `divine.space`
   - Publishes static app assets to Fastly KV and then publishes the Compute service
   - GitHub Actions deploy workflow lives in [deploy.yml](/Users/rabble/code/divine/divine-space/.worktrees/fastly-gh-action/.github/workflows/deploy.yml)

## Fastly Deploy Steps

1. Build the app from the repo root:

```bash
npm run build
```

2. Export a Fastly API token into the environment before running the Compute deploy:

```bash
export FASTLY_API_TOKEN="$(fastly profile token user)"
```

3. Publish from [`compute-js/`](/Users/rabble/code/divine/divine-space/compute-js):

```bash
npm run deploy
```

## GitHub Actions Deploy

Production deploys should happen through GitHub Actions, not GitHub Pages.

The deploy workflow should:

1. wait for the `Test` workflow to succeed on `main`
2. check out the exact tested commit
3. build the root app bundle into `dist/`
4. install `compute-js` dependencies
5. run `compute-js` deploy using `FASTLY_API_TOKEN`

Repository secret required:

- `FASTLY_API_TOKEN`
  Must have permission to read and write the `divine-space-content` KV store and publish the `divine-space` Compute service.

## Important Gotcha

`compute-js-static-publish` does not rely on the stored Fastly CLI profile alone. It requires `FASTLY_API_TOKEN` in the environment when publishing content to the KV store.

Without that variable, deploy fails with:

```text
Fastly API Token not provided.
Set the FASTLY_API_TOKEN environment variable to an API token that has write access to the KV Store.
```

If the token is present but does not have sufficient KV Store permissions, the static publisher fails during content upload with `401` responses such as:

```text
Listing KV Stores failed: 401
```

## Notes

- `fastly whoami` can succeed even when `npm run deploy` fails, because the publisher step checks `FASTLY_API_TOKEN` explicitly.
- The token used for production deploys must be able to read and write the `divine-space-content` KV store, not only publish the Compute service itself.
- If `divine.space` and GitHub Pages drift, treat Fastly as the production source of truth until the hosting model is intentionally changed.

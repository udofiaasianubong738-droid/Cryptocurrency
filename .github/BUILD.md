# Build instructions

The previous `.github/workflows` file contained these commands:

```sh
npm ci
npm run build
```

The repository now uses a GitHub Actions workflow under `.github/workflows/` for automated build and optional Cloudflare deployment.

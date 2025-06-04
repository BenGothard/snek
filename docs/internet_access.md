# Internet Access Configuration

Snek can fetch assets and configuration from the internet when the following
variables are defined as environment variables or `window` globals:

- **REMOTE_CONFIG_URL** – URL to a JSON configuration file.
- **ASSET_BASE_URL** – Base URL for asset downloads when files are missing.
- **HIGH_SCORE_API_URL** – REST endpoint for online high scores.

Example configuration:

```json
{
  "ASSET_BASE_URL": "https://cdn.example.com/snek/assets",
  "HIGH_SCORE_API_URL": "https://api.example.com/snek/scores"
}
```

If these variables are not set, Snek will run entirely with local defaults and
store scores locally.

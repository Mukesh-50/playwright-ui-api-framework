# Playwright Test Framework

JavaScript test automation for the Freelance Learn Automation web app and the Restful Booker API. UI tests use Playwright's Page Object Model and run on Chromium, Firefox, and WebKit; API tests use service objects and run without a browser.

See [FRAMEWORK.md](FRAMEWORK.md) for a detailed explanation of the architecture and how to extend it.

## Requirements

- Node.js (the GitHub Actions workflows use the current LTS release)
- npm

## Getting started

Install dependencies and the browser binaries:

```sh
npm ci
npx playwright install
```

UI tests use the public demo app by default and do not require environment variables. API tests require Restful Booker credentials. Add the following to a local `.env` file in the repository root, or export the variables in your shell:

```dotenv
API_ADMIN_USERNAME=your_username
API_ADMIN_PASSWORD=your_password
```

The API base URL defaults to `https://restful-booker.herokuapp.com`; the UI base URL defaults to `https://freelance-learn-automation.vercel.app`. Override either with `API_BASE_URL` or `UI_BASE_URL`. The local `.env` file is gitignored.

## Running tests

| Command | Description |
| --- | --- |
| `npm test` | Run UI tests on Chromium, Firefox, and WebKit, plus API tests |
| `npm run test:ui` | Run UI tests on Chromium, Firefox, and WebKit |
| `npm run test:api` | Run API tests only |
| `npm run test:list` | Run tests with the list reporter |
| `npm run test:debug` | Open Playwright Inspector for debugging |
| `npm run report` | Open the most recent Playwright HTML report |

To run one spec or project, use Playwright directly. For example:

```sh
npx playwright test tests/smoke/login-test.spec.js --project=chromium
npx playwright test tests/api/booking.spec.js --project=api
```

## Project layout

| Path | Purpose |
| --- | --- |
| `tests/smoke/` | Critical-path UI checks |
| `tests/e2e/` | End-to-end UI workflows |
| `tests/regression/` | Broader UI regression coverage |
| `tests/api/` | Restful Booker API specs |
| `pages/` | UI page objects and shared page actions |
| `api/services/` | API service objects and endpoint paths |
| `fixture/` | Shared Playwright fixtures for pages and API services |
| `data/` | JSON, Excel, and image test data |
| `config/env.js` | Environment variable access and base URL defaults |
| `playwright.config.js` | Projects, browser settings, reporters, and test behavior |

## Reports and CI

Playwright writes its HTML report to `playwright-report/`, raw Allure results to `allure-results/`, and failure artifacts such as traces, screenshots, and videos to `test-results/`. These are generated when tests run.

GitHub Actions workflows in `.github/workflows/` install dependencies and browsers, run the test suite, and upload reports as workflow artifacts. The Playwright workflow expects API credentials from repository secrets or its configured demo fallback values.
# How This Framework Works

This is a test automation framework built with **Playwright** and **JavaScript**. It has two layers that share one config, one report and one CI pipeline:

Below is a plain-language walkthrough of every folder and how they work together. 
- **UI layer** — tests the web app at `https://freelance-learn-automation.vercel.app` (login, category management, course management) using the Page Object Model.
- **API layer** — tests the [restful-booker](https://restful-booker.herokuapp.com/apidoc/index.html) REST API (auth, create/update/delete booking) using the Service Object pattern. See [section 3](#3-the-api-layer).

Below is a plain-language walkthrough of every folder and how they work together. Sections 1–2 describe the UI layer.

---

## 1. The big idea: Page Object Model (POM)

Instead of writing raw Playwright code (`page.click(...)`, `page.fill(...)`) directly inside every test, we describe each **page of the app** as a class. Each class knows:
- Where things are on that page (the locators)
- What actions a user can do on that page (login, add a category, save a course, etc.)

Tests then just call these actions in plain English, e.g. `loginPage.loginToApplication(user, pass)`. This keeps tests short and readable, and if the UI changes, you fix the locator in **one place** (the page class) instead of in every test that uses it.

```
Test file  --uses-->  Page object (e.g. LoginPage)  --uses-->  BasePage (shared helpers)  --drives-->  Playwright
```

---

## 2. Folder-by-folder

### `pages/` — the Page Object Model
- **`basepage.js`** — the parent class every page object extends. It holds generic, reusable actions: `click`, `fill`, `goto`, `selectOptions`, `uploadFile`, `acceptDialogAndClick` (for JS `confirm`/`prompt` dialogs), and `clickAndWaitForNewPage` (for actions that open a new tab/window). Nothing app-specific lives here.
- **`loginpage.js`**, **`dashboardpage.js`**, **`categorypage.js`**, **`coursepage.js`** — one class per screen. Each defines locators in its constructor and exposes methods like `loginToApplication()`, `clickOnManageCategory()`, `enterCourseName()`. They all `extends BasePage`, so they inherit `click`/`fill`/etc. instead of re-implementing them.

### `fixture/fixture.js` — wiring pages and API services into tests
Playwright's `test.extend()` is used to create custom "fixtures" — reusable pieces of test setup that Playwright automatically prepares before a test runs and cleans up after. Instead of every test doing `new LoginPage(page)` manually, a test just asks for the fixture by name and Playwright hands it over already created.

Fixtures defined here:
- `loginPage`, `dashboardPage`, `coursePage` — plain page objects, ready to use.
- `loggedInUser` — goes further: it navigates to `/login`, logs in as an admin **before** the test body runs, hands control to the test, and after the test finishes it **automatically logs out**. Good for tests where you don't want to repeat login/logout boilerplate.
- `loggedInOnce` — logs in but does **not** auto-logout afterward.
- `bookingApi`, `authApi` — the API service objects (see [section 3](#3-the-api-layer)). They are built from Playwright's `request`, so a test that only asks for these never opens a browser.

Playwright only sets up the fixtures a test actually asks for, so UI and API fixtures can safely live side by side. One thing to know: `bookingApi` and `authApi` use Playwright's `request`, which follows the **project's** base URL. Use them in tests under `tests/api/` (the `api` project). If a test in a UI project asked for them, they would call the UI app's URL instead of restful-booker.

This file re-exports a custom `test` and `expect` — that's why every spec file, UI or API, imports from `../../fixture/fixture.js` instead of `@playwright/test` directly.

The `@typedef` block at the top of the file only tells the editor which fixtures exist (autocomplete and `// @ts-check`); it has no effect at runtime. When you add a fixture, add a matching `@property` line there too.

### `tests/` — the actual test cases, grouped by type
- `tests/smoke/` — quick, critical-path checks (e.g. `login-test.spec.js`: valid login + a data-driven loop over invalid credentials).
- `tests/e2e/` — full user journeys (e.g. `manage-category-test.spec.js`: create → verify → update → verify → delete a category).
- `tests/regression/` — broader, more detailed suites (e.g. `manage-course.spec.js`: fill out and save a whole course form, once with JSON data and once with Excel data).
- `tests/api/` — API tests (see [section 3](#3-the-api-layer)). These run only under the `api` project, never in the browsers.

Each spec file:
1. Imports `test`/`expect` from the fixture file (not directly from Playwright).
2. Imports test data (from `data/json/*.json` or via `readExcel()`).
3. Asks for whichever fixtures it needs in the test function's parameter object, e.g. `({ page, loggedInUser, dashboardPage, coursePage }) => {...}`.
4. Calls page-object methods to perform steps and `expect(...)` to assert results.

### `data/` — test data, separated from test logic
- `data/json/` — credentials, course details, the API booking payload (`booking.json`), etc. as `.json` files, imported directly into tests.
- `data/excel/` — the same kind of data but in a spreadsheet (`course.xlsx`), read at runtime.
- `data/images/` — sample files used for upload tests (e.g. a course thumbnail).
- `data/csv/` — reserved for CSV-based data (currently empty).

Keeping data out of the test file means the same test logic can run against many different inputs, and non-developers can update data without touching code.

### `utils/readexcel.js`
A small helper that opens an Excel file (using the `xlsx` package) and converts a named sheet into an array of JSON objects — so Excel data can be used exactly like JSON data in tests.

### `config/`
- **`env.js`** — the single place that reads environment variables (from `.env` or the shell) and exposes them as an `env` object. Both `playwright.config.js` and the API tests use it, so nothing else touches `process.env` directly. See [Environment variables](#environment-variables).
- `prod.env`, `qa.env`, `stag.env` — placeholders for environment-specific values per environment (currently empty and not used yet).

### `playwright.config.js` — global settings
- `testDir: './tests'` — where Playwright looks for spec files.
- `fullyParallel: true` — tests run in parallel by default.
- `baseURL` — so tests can call `page.goto("/login")` instead of the full URL. It comes from `env.uiBaseURL`; the `api` project overrides it with `env.apiBaseURL`.
- `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` — debugging artifacts are only captured when something goes wrong, keeping runs fast.
- `reporter` — `list` (console output), `html` and `allure-playwright` (see below). On CI (`CI` env var set) it also writes `test-results/junit.xml` and adds GitHub annotations.
- `projects` — the UI tests run against Chromium, Firefox, and WebKit (Safari engine), so cross-browser coverage is automatic. Those three projects ignore `tests/api/`. A fourth project, `api`, runs only `tests/api/` with no browser, its own base URL and JSON headers.

### Reports & results (generated, not hand-written)
- `playwright-report/` — Playwright's built-in HTML report.
- `allure-results/` + `reports/` — raw data and generated report for **Allure**, a richer, more detailed test report (steps, attachments, history, trends).
- `test-results/` — temporary artifacts (traces, screenshots, videos) from the last run.

These folders are all regenerated every time you run the tests — they're outputs, not source code.

---

## 3. The API layer

API tests call the REST API directly (no browser). They use the **Service Object pattern** — the API equivalent of the Page Object Model: each API resource is a class, and tests call methods like `bookingApi.createBooking(payload)` instead of building raw HTTP requests.

```
Test file  --uses-->  Service object (e.g. BookingApi)  --uses-->  Endpoints  --calls-->  Playwright `request`
```

### `api/` — everything API-specific
- **`services/`** — the service objects, one class per resource (`auth.api.js`, `booking.api.js`), plus `endpoints.js` which holds every URL path in one place.
- **`data/booking.data.js`** — `buildBookingPayload()` returns a default valid request body; tests override only the fields they care about.

### `tests/api/`
The same serial **POST → PUT → DELETE** booking flow exists in two versions, so you can compare the two ways of supplying test data. The auth token is fetched once in `beforeAll` and reused by the update and delete tests.

| Spec | Where the booking data comes from |
| --- | --- |
| `booking.spec.js` | JS file: `buildBookingPayload()` from `api/data/booking.data.js` |
| `booking-json.spec.js` | JSON file: `data/json/booking.json`, imported like the UI specs import their JSON |

Both files hold identical values. Run one version with `npx playwright test tests/api/booking-json.spec.js` (or `-g "JSON file"` / `-g "JS file"`). `booking-json.spec.js` has no `// @ts-check` line, because VS Code flags JSON imports under it unless the project has a `jsconfig.json`.

### Environment variables
Set them in `.env` (copy `.env.example`; `.env` is gitignored) or in the shell. They are read only through `config/env.js`.

| Variable | Used by | Default |
| --- | --- | --- |
| `UI_BASE_URL` | UI projects | `https://freelance-learn-automation.vercel.app` |
| `API_BASE_URL` | `api` project | `https://restful-booker.herokuapp.com` |
| `API_ADMIN_USERNAME` | API tests | none — required |
| `API_ADMIN_PASSWORD` | API tests | none — required |

UI tests need no `.env` at all. The API credentials are checked only when an API test uses them, and a missing one fails immediately with a clear message. On GitHub Actions, set repo secrets with the same names to override; if unset, the workflow falls back to the public demo values.

### Running tests
| Command | What it does |
| --- | --- |
| `npm test` | Run everything (UI on 3 browsers + API) |
| `npm run test:ui` | UI tests only (Chromium, Firefox, WebKit) |
| `npm run test:api` | API tests only |
| `npm run test:list` | Force the list reporter only |
| `npm run test:debug` | Open the Playwright Inspector |
| `npm run report` | Open the last HTML report |

### Adding a new endpoint
1. Add the path to `api/services/endpoints.js`.
2. Add a method to the matching service class in `api/services/` (or create a new class).
3. If it is a new class, register it in `fixture/fixture.js` (and add it to the `@typedef` block there). API specs import `test`/`expect` from that same file.
4. Write the spec under `tests/api/`, using the fixture.

---

## 4. Putting it together: how a test actually runs

Take `tests/e2e/manage-category-test.spec.js` as an example:

1. Playwright starts, sees the test needs `page`, `loggedInUser`, and `dashboardPage`.
2. The `loggedInUser` fixture runs first: opens `/login`, logs in as admin, then hands control to the test.
3. Inside the test, `dashboardPage.clickOnManageButton()` and `dashboardPage.clickOnManageCategory()` are called — these are just methods on the `DashBoardPage` class, which internally call `this.click(locator)` from `BasePage`.
4. A `CategoryPage` object is created for the new tab that opens, and its methods (`clickOnAddNewCategory`, `clickOnUpdateCategory`, `clickOnDeleteCategory`) drive the create/update/delete flow.
5. `expect(...)` assertions verify the UI reflects each change.
6. After the test body finishes, the `loggedInUser` fixture's cleanup code runs and logs the user out automatically.
7. Results are written out as an HTML report and Allure results.

---

## 5. Why it's structured this way (the benefits)

- **One framework for UI and API** — a single config, one HTML/Allure report and one CI pipeline cover both layers.
- **Readable tests** — a test reads like a set of business steps, not low-level browser commands.
- **One place to fix UI changes** — locators live in page objects, not scattered across tests.
- **Reusable setup** — fixtures remove repeated login/logout code from every test.
- **Data-driven** — swapping JSON/Excel data doesn't require touching test logic.
- **Cross-browser by default** — the same tests run on Chromium, Firefox, and WebKit via `projects` in the config.
- **Traceable failures** — screenshots, video, and traces are captured automatically only when a test fails.

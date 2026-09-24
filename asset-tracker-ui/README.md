# Asset Register — front end

Front end for the AWS Smart Asset Lifecycle Tracker. Runs entirely on sample
data right now. No AWS account, no backend, no network calls.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173.

## What works today

- Sign in as any of the five roles and watch what you're allowed to see change.
- Browse equipment split into **assigned to you** and **other equipment you can view**.
- Search and filter, open any asset for its full record.
- **Add asset**: drop in a photo, watch a simulated analysis, review and correct
  what the AI "read", then fill in the accounting details with a live
  depreciation preview. The prototype selector on the upload step lets you force
  a successful read, an unidentifiable image, or a service failure — all three
  demo paths the brief asks for.
- Approve a pending maintenance recommendation (as Technician or Administrator)
  and see the next service date recalculate.
- Log out.

## How the backend plugs in

Everything is behind one seam. Components never call `fetch`, never read
`import.meta.env`, and never know which mode they're in.

```
src/services/
  contract.js   The interface + wire shapes. Read this first.
  mockApi.js    In-memory data with artificial latency.
  httpApi.js    Real client. Already written — presigned upload, analyse,
                CRUD, error mapping. Just needs a URL.
  auth.js       Mock sign-in now; Cognito block is written and commented out.
  index.js      Picks one and exports it as `api`.
```

To switch over, copy `.env.example` to `.env.local` and set:

```
VITE_USE_MOCK=false
VITE_USE_MOCK_AUTH=false
VITE_API_BASE_URL=https://xxxx.execute-api.eu-west-2.amazonaws.com/prod
```

Then `npm install aws-amplify`, uncomment the `cognitoAuth` block in
`services/auth.js`, and change the last line to export it. Nothing else changes.

Make your Lambda responses match the shapes in `contract.js` and the UI works
unchanged.

## How to restyle it

`src/styles/tokens.css` is the whole design system — colour, type, spacing,
radius. Components only reference variables, never raw values. Change the tokens
and the entire app follows, including the dark variant.

`src/styles/app.css` holds semantic classes (`.row`, `.summary`, `.calc`). Swap
that file for a different layout without touching any component logic.

## Things deliberately built in

These map to specific requirements in the brief, so they're worth knowing about
before you demo:

- **`lib/depreciation.js`** is a faithful port of the reference Python, including
  the completed-monthly-anniversary convention and full internal precision with
  rounding only on output. Values are computed in integer cents, never floats.
- **`lib/permissions.js`** mirrors the Cognito group matrix, with a comment
  saying plainly that it decides rendering only and the Lambda must enforce it
  again. That file is the answer to "where is authorisation handled?".
- **The brass "suggested" state.** Any field holding unedited machine output gets
  a brass edge and a *Suggested* tag. Touch the field and the marking clears.
  Nothing saves until a person confirms, and the saved record carries
  `reviewStatus: 'UserConfirmed'`.
- **Serial number and model are never pre-filled from a photo**, with helper text
  explaining why. `contract.js` exports `stripForbidden()` which removes any
  financial or identity field if a model ever returns one.
- **Every AI failure path lands on manual entry** with the form intact — timeout,
  malformed response, unclear image.

## Not built yet

Record-maintenance and edit-asset buttons are visible but disabled — they need
the backend. Image display uses a local object URL; the real app stores only the
S3 object key and asks the API for a short-lived presigned GET after it has
checked permissions.

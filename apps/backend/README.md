### local setup
Video instructions: https://youtu.be/PPxenu7IjGM

- `cd /backend`
- `pnpm install` or `npm i`
- Rename `.env.template` ->  `.env`
- To connect to your online database from your local machine, copy the `DATABASE_URL` value auto-generated on Railway and add it to your `.env` file.
  - If connecting to a new database, for example a local one, run `pnpm ib` or `npm run ib` to seed the database.
- `pnpm dev` or `npm run dev`

### requirements
- **postgres database** (Automatic setup when using the Railway template)
- **redis** (Automatic setup when using the Railway template) - fallback to simulated redis.
- **MinIO storage** (Automatic setup when using the Railway template) - fallback to local storage.
- **Meilisearch** (Automatic setup when using the Railway template)

### commands

`cd backend/`
`npm run ib` or `pnpm ib` will initialize the backend by running migrations and seed the database with required system data.
`npm run dev` or `pnpm dev` will start the backend (and admin dashboard frontend on `localhost:9000/app`) in development mode.
`pnpm build && pnpm start` will compile the project and run from compiled source. This can be useful for reproducing issues on your cloud instance.

### Click payment (redirect + pay-by-card)

Backend implements Click callbacks (Prepare/Complete) and two payment providers:
- `pp_click_click` (redirect to `my.click.uz/services/pay`)
- `pp_click_pay_by_card_click_pay_by_card` (widget via `checkout.js`)

**Required env vars** (backend):
- `CLICK_MERCHANT_ID`
- `CLICK_SERVICE_ID`
- `CLICK_SECRET_KEY`
- `CLICK_PAY_URL` (optional, default `https://my.click.uz/services/pay`)
- `CLICK_MERCHANT_USER_ID` (optional)
- `CLICK_CARD_TYPE` (optional: `uzcard` or `humo`)

**Merchant cabinet URLs** (merchant.click.uz → Сервисы → редактировать):
- **Prepare URL**: `<BACKEND_PUBLIC_URL>/click/prepare`
- **Complete URL**: `<BACKEND_PUBLIC_URL>/click/complete`

# Institutional Terminal Verification & Smoke Test Suite — xauusdtracker.com

This document details the end-to-end verification and quality-assurance procedure for validating the **xauusdtracker.com** intelligence terminal, covering user registration, real-time WebSocket pricing, server-enforced paywall security, Stripe Checkout, and administrator VIP overrides.

---

## Pre-requisites & Local Environment
Ensure the Next.js server and database are running:
* **Local Web Server**: `http://localhost:3000`
* **Admin Account**: `admin@xauusdtracker.com` / `AdminPass123!` (Role: `ADMIN`)
* **Standard Test Account**: `qa-terminal@xauusdtracker.com` / `Password123!` (Role: `USER`)

---

## Step 1: User Registration & Bloomberg Monospace Theme Test

### Objective:
Verify that new operator registration creates a user in PostgreSQL with salt rounds 10, creates an `INACTIVE` subscription row, and renders the Bloomberg dark terminal theme.

### Procedure:
1. Navigate to `http://localhost:3000/register`.
2. Enter:
   * **Email**: `operator-qa@xauusdtracker.com`
   * **Password**: `Password123!`
   * **Confirm Password**: `Password123!`
3. Click **REGISTER OPERATOR CLEARANCE**.
4. You should see a green success banner: *"Operator account created successfully. Redirecting to login..."*.
5. Sign in at `http://localhost:3000/login` with the registered credentials.

### Verification Checklist:
- [x] Background color is deep Bloomberg black (`#0B0E14`).
- [x] Typography uses monospace fonts (`'JetBrains Mono'`, `'Fira Code'`).
- [x] Top header ticker displays live XAU/USD gold metrics, session email, and green blinking `LIVE RADAR` indicator.
- [x] Direct navigation to `/terminal` succeeds and mounts user session.

---

## Step 2: WebSocket Tick & Live Candlestick Verification

### Objective:
Verify that the client-side streaming engine connects to live gold pricing (PAXG/USDT 1:1 physical troy ounce gold) without long-lived serverless sockets, and calculates real-time candlestick bars and buyer/seller ratios.

### Procedure:
1. Navigate to `http://localhost:3000/terminal`.
2. Inspect the **ASSET / XAU/USD** card in the upper left header.
3. Observe the badge:
   * `WS LIVE` (indicates Binance 24/7 WebSocket feed is active).
   * Notice green/red live tick transitions on the primary price counter.
4. Inspect the **TradingView Candlestick Chart**:
   * Candlestick chart streams 1-minute gold bars with real-time Open, High, Low, Close (OHLC) readouts.
   * Crosshair reveals historical timestamps and precision pricing.
5. Inspect the **RETAIL POSITIONING SPLIT** progress bar:
   * Dynamic split between BUYERS and SELLERS updates on incoming ticks.

### Verification Checklist:
- [x] Live price fluctuates continuously with zero page reloads.
- [x] Current candlestick wick/body recalculates dynamically per incoming tick.
- [x] Failover engine falls back seamlessly to REST polling if WebSocket is interrupted.

---

## Step 3: Server-Enforced Paywall Security Test

### Objective:
Verify that an unsubscribed user cannot inspect proprietary Stop-Loss & Take-Profit concentration numbers or order book depth in the browser DevTools or Network tab.

### Procedure:
1. Log in with a standard non-subscribed account (e.g., `qa-terminal@xauusdtracker.com`).
2. Navigate to `http://localhost:3000/terminal`.
3. Observe the **Concentration Depth** panel on the right:
   * The **PaywallModal** is mounted with `backdrop-blur-md` overlay.
   * Lock icon and gold border badge: `INSTITUTIONAL CLEARANCE REQUIRED`.
   * Title text:
     > *"Unlock Full Institutional Terminal Access — Real-time XAU/USD Stop-Loss & Take-Profit Concentration Pools"*
   * "SUBSCRIBE NOW — UNLOCK TERMINAL ACCESS" button is rendered.
4. Inspect the **Position Breakdown** table at the bottom:
   * Stop-Loss, Take-Profit, and Notional columns display `••••••••` or asterisks.
   * Overlaid banner: `PROPRIETARY LIQUIDATION ZONES LOCKED`.
5. Open Chrome DevTools (`F12` or `Ctrl + Shift + I`):
   * Inspect the React component state or DOM elements.
   * Check Network tab for any raw API response carrying stop-loss prices.
   * **Result**: Values are completely `null` in memory because sanitization occurred server-side in `deriveTerminalModel` before reaching the client!

### Verification Checklist:
- [x] Paywall modal renders over concentration depth with backdrop blur.
- [x] Candlestick chart still displays public live price action, but proprietary Fibonacci price lines are hidden.
- [x] Proprietary quantitative levels cannot be inspected via DevTools.

---

## Step 4: Stripe Checkout & Webhook Pipeline Test

### Objective:
Verify Stripe Checkout session initialization and raw-buffer webhook processing.

### Procedure:
1. On `http://localhost:3000/terminal` as an unsubscribed user, click **SUBSCRIBE NOW — UNLOCK TERMINAL ACCESS**.
2. The button transitions to:
   * `CONNECTING TO STRIPE SECURE GATEWAY...` (spinner active).
3. The browser redirects to Stripe's secure Checkout page (`checkout.stripe.com`) with the configured `STRIPE_PRICE_ID`.
4. Enter test card details:
   * **Card Number**: `4242 4242 4242 4242`
   * **Exp**: `12/28`
   * **CVC**: `123`
   * **Zip**: `90210`
5. Click **Subscribe**.
6. Stripe redirects back to:
   * `http://localhost:3000/terminal?session=success`
7. Stripe emits the `checkout.session.completed` event to `/api/webhooks/stripe`:
   * Webhook reads raw text body via `await req.text()`.
   * Signature verified using `STRIPE_WEBHOOK_SECRET`.
   * Prisma `Subscription` updated: `status = 'ACTIVE'`, `currentPeriodEnd = 30 days ahead`.

### Testing via Stripe CLI:
```bash
# Listen to local webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger mock checkout completion
stripe trigger checkout.session.completed
```

### Verification Checklist:
- [x] Stripe Checkout session generates valid hosted checkout URL.
- [x] Raw-buffer webhook handler verifies signature without JSON parse failure.
- [x] Database records `stripeSubscriptionId` and updates status to `ACTIVE`.

---

## Step 5: Admin Back-Office & VIP Override Test

### Objective:
Verify administrative security controls, system KPI cards, and instant manual VIP access grants.

### Procedure:
1. **RBAC Protection Check**:
   * Log in as a standard user (`role: 'USER'`).
   * Attempt to open `http://localhost:3000/admin`.
   * Server redirects user back to `/terminal` immediately.
2. **Access Admin Portal**:
   * Sign in as an administrator (`role: 'ADMIN'`).
   * Open `http://localhost:3000/admin`.
3. **Verify System KPIs Row**:
   * **Total Registered Users**: Accurate count from `prisma.user.count()`.
   * **Active Paying Subscribers**: Count of active subscriptions.
   * **Estimated MRR**: Calculated as `Active Subscribers * $99`.
   * **Data Feed Health**: Pulsing green badge `NOMINAL // PAXG WebSocket 1:1 Live Engine`.
4. **Grant Manual VIP Pass**:
   * Find the test account `qa-terminal@xauusdtracker.com` in the **Operator Directory & VIP Access Controls** table.
   * Click **GRANT 30-DAY VIP**.
   * Status updates instantly to `ACTIVE` with a 30-day future expiry date.
5. **Verify Instant Paywall Unlock**:
   * Open a new incognito window or switch to the test user's tab.
   * Refresh `http://localhost:3000/terminal`.
   * **Result**:
     * PaywallModal is **unmounted**.
     * Real-time concentration depth bars (Buyers SL, Buyers TP, Sellers SL, Sellers TP) are fully visible with trader headcounts and percentages.
     * Candlestick chart renders live **BUYER TP** and **SELLER TP** price lines.
     * Position table renders complete open trader numbers, entry zones, and billions in notional USD.
6. **Revoke VIP**:
   * In `/admin`, click **REVOKE** on the user row.
   * Refresh the terminal tab; the paywall immediately locks again.

### Verification Checklist:
- [x] Non-admin accounts cannot access `/admin`.
- [x] System KPIs accurately reflect PostgreSQL state.
- [x] "Grant 30-Day VIP" enables immediate terminal access without Stripe checkout.
- [x] "Revoke" immediately relocks paywall and clears active subscription.

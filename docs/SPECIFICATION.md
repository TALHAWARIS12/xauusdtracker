XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

# **XAUUSD INTELLIGENCE** 

Product Requirements, User Workflows 

& Developer Implementation Guide 

#### **Prepared for: talvixgames** 

Product: XAUUSD Gold Market Positioning & Liquidity Intelligence Platform Document version: 1.0  |  Status: Implementation specification 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

## **1. Executive Summary** 

XAUUSD Intelligence is a responsive web platform for gold traders. It brings market price context, buying-versus-selling pressure estimates, volume analysis, estimated liquidity areas, possible stop-loss/take-profit concentration zones, rulebased trade setup analysis, and a subscription-protected dashboard into one interface. The first release should be a credible launch-ready MVP that can be demonstrated to prospective customers and expanded as the business grows. 

The product must clearly distinguish verified market data from calculations, estimates, and illustrative visualizations. It must never imply that the platform can see every trader's private positions or exact stop-loss/take-profit orders unless a licensed data source explicitly provides that information. 

## **2. Product Goals** 

- Give XAUUSD traders a clear, modern overview of current gold-market conditions. 

- Present estimated buying and selling pressure, volume context, and price zones in a visual dashboard. 

- Generate transparent, rule-based bullish/bearish setup ideas with entry, stop-loss, take-profit, and risk/reward estimates. 

- Provide a useful free preview that encourages visitors to register and subscribe. 

- Allow the owner to monitor users, subscription/access status, and payment records from an admin area. 

- Create a modular foundation for future alerts, news sentiment, richer liquidity analysis, and additional premium features. 

## **3. Primary Users & Permissions** 

|**Role**|**Capabilities**|
|---|---|
|Public visitor|View landing page, product explanation, disclaimer, selected<br>preview content, and subscription information.|
|Registered user|Manage basic account details and view content permitted by their<br>access status.|
|Premium member|Access protected dashboard, analysis cards, estimated zones, setup<br>history, and risk/reward tools while subscription is active.|
|Administrator / owner|View users, subscription status, payment status/reference, activate<br>or revoke access, and manage basic plan/content settings.|



## **4. Functional Scope** 

### **4.1 Public Website & Conversion Pages** 

- Landing page with clear XAUUSD Intelligence branding, product value proposition, feature highlights, dashboard preview, and calls to action. 

- Pricing/access page with one initial premium plan; price, billing interval, included features, and cancellation/access terms must be editable or configurable. 

- Sign-up, sign-in, sign-out, password reset, and basic account/profile view. 

- Public preview that shows selected non-premium information while keeping premium analysis protected. 

- Risk disclaimer and links to privacy policy and terms pages. Legal copy should be approved by the owner. 

### **4.2 Main Intelligence Dashboard** 

- Responsive dark trading interface inspired by the client's reference image, with clear typography, compact metric cards, and a chart-first layout. 

- XAUUSD current/latest available price, selected timeframe, source label, last-updated timestamp, and data-status indicator. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

- Top summary cards for estimated buyers/buy-side pressure, estimated sellers/sell-side pressure, volume/notional context when supported, and current market bias. 

- Interactive candlestick chart with selected timeframe and overlays for the calculated entry zone, stop-loss/invalidation, take-profit, and estimated liquidity zones. 

- Separate buy-side and sell-side panels showing the strongest available zones and their estimated intensity or score. 

- A market context panel explaining trend, momentum, volatility, session context, and which conditions are currently met. 

- If no valid setup exists, show “No setup currently” rather than forcing a signal. 

- Visible labels that identify whether values are live, delayed, calculated, estimated, or illustrative. 

### **4.3 Buying vs. Selling Pressure & Volume** 

- Calculate an approximate buy/sell pressure indicator using the agreed price/candle/volume data and a documented method. 

- Display the relative pressure as percentages or a normalized score only when the underlying method supports it. 

- Show volume information provided by the chosen feed. If the source provides only tick volume or broker-specific volume, label it accurately. 

- Where the client wants large headline figures such as '180,000 buyers' or '$100B buy-side notional', do not fabricate these as real counts or real market-wide notional. Display them only if a licensed, documented data provider supplies the required metrics; otherwise use clearly labelled estimates/index values or omit the metric. 

- Keep calculations and source metadata separate from UI components so the methodology can be updated without rebuilding the dashboard. 

### **4.4 Estimated Liquidity & SL/TP Concentration** 

- Identify potential liquidity areas from available price history and configurable heuristics such as recent swing highs/lows, repeated highs/lows, session highs/lows, and volatility-based distance bands. 

- Show estimated buy-side and sell-side liquidity zones on the chart and in ranked side panels. 

- Display potential stop-loss and take-profit concentration areas as modelled estimates inferred from price structure— not as observed counts of actual broker orders. 

- Use labels such as 'Estimated liquidity zone', 'Potential SL concentration', and 'Modelled TP area'. Include a short explanation of the basis for each zone. 

- Provide a configurable strength score derived from the implemented rules. Do not call it a probability of success unless statistically validated and calibrated. 

### **4.5 Rule-Based Trade Setup Engine** 

- Use a transparent baseline of technical rules, initially based on EMA trend direction, RSI momentum, and ATR-based volatility; final parameters must be configurable and approved before release. 

- Generate a possible bullish or bearish setup only when the required conditions are satisfied. 

- Each setup card should include direction, timeframe, estimated entry zone, stop-loss/invalidation level, take-profit level(s), reward-to-risk ratio, timestamp, setup score, and a plain-language 'Why this setup?' explanation. 

- Allow the dashboard to show 'No setup currently' when conditions do not align. 

- Store recent generated setups with creation time, direction, values, and current status for a basic history view. 

- Do not claim guaranteed returns, a guaranteed win rate, or financial advice. No broker orders are placed by this MVP. 

### **4.6 Risk / Reward Calculator** 

- Allow users to enter or edit entry, stop-loss, and take-profit values. 

- Calculate stop distance, target distance, and reward-to-risk ratio, with input validation. 

- Optionally calculate estimated position size when account balance, chosen risk percentage, and verified XAUUSD contract/tick specifications are available. 

- If instrument specifications are unavailable or uncertain, do not show a potentially misleading position-size result; explain what information is missing. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

### **4.7 Subscription, Payment & Premium Access** 

- Create one initial subscription plan with configurable price and billing interval, plus a clear description of premium features. 

- Use a payment provider that supports the owner's country, business/account type, currency, and payout method. Provider selection must be confirmed before implementation. 

- Integrate hosted checkout or the provider's approved checkout flow. Do not store raw card details on the platform. 

- On successful payment, activate premium access for the correct user and record provider reference, payment status, plan, start date, and renewal/expiry date where available. 

- Use verified server-side payment webhooks/events for automatic activation and status updates when the chosen provider supports them. Verify webhook signatures and handle duplicate events safely. 

- Support payment pending, successful, failed, cancelled, refunded, and subscription expired states as applicable to the selected provider. 

- If recurring billing is supported and configured, process renewals and update access based on confirmed provider events. If only one-time payment links are supported, clearly implement the corresponding manual or limited workflow. 

- Provide a manual admin override to activate, extend, suspend, or revoke premium access, with a reason and timestamp. 

- If provider credentials or account approval are not available during development, keep the integration configurable and use a clearly identified test/sandbox mode until live credentials are supplied. Do not represent test payments as real payments. 

### **4.8 Admin Dashboard & Subscription Monitoring** 

- Admin-only route protected by role-based authorization; ordinary users must never access admin data. 

- Searchable user list with user ID, name/email, registration date, role, access status, and last activity if collected. 

- Subscription list showing plan, status (active/pending/expired/cancelled), start date, renewal/expiry date, and linked payment reference/status where available. 

- Payment overview with transaction reference, amount/currency, status, date, and provider. Do not store full card numbers or sensitive payment credentials. 

- Actions to grant/revoke/extend access and view a simple history of administrative changes. 

- Basic summary cards: registered users, active premium members, pending payments, and expired/inactive access. 

- The admin view must distinguish provider-confirmed payment state from manually granted access. 

## **5. Core User Workflows** 

### **Workflow A — Visitor to Premium Member** 

1. Visitor lands on the website and reviews the product, preview dashboard, features, and risk disclaimer. 

2. Visitor registers or signs in, then opens the subscription page. 

3. Visitor selects the initial plan and proceeds to the configured payment provider. 

4. Provider confirms payment through a verified event/webhook or the agreed provider-supported confirmation flow. 

5. The application links the payment to the correct account, records the result, and grants premium access. 

6. The user opens the protected dashboard. If payment is pending or access is inactive, the user sees a clear status and next step instead of premium content. 

### **Workflow B — Owner Monitors Subscribers** 

7. Owner signs in to the protected admin area. 

8. Owner opens Users or Subscriptions and filters by active, pending, expired, cancelled, or manually granted access. 

9. Owner opens a record to review account, plan, payment reference/status, and access dates. 

10. When needed, owner activates or revokes access manually and records a reason. 

11. Provider-confirmed events update payment/subscription state automatically when webhook integration is active. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

### **Workflow C — Market Data to Dashboard** 

12. Backend requests the latest available XAUUSD price/candle data from the agreed source. 

13. System validates response structure, timestamp, instrument, timeframe, and freshness. 

14. If data is missing or stale, the dashboard displays a visible warning and does not present stale outputs as current. 

15. Analysis module calculates the agreed indicators and market-structure heuristics. 

16. Rule engine decides whether conditions support a setup; if not, it returns 'No setup currently'. 

17. Dashboard displays chart overlays, estimates, setup explanation, and source/update status. 

18. A setup snapshot is stored in recent history for review. 

### **Workflow D — User Reviews a Setup** 

19. Premium member opens a setup card and reviews the rationale, entry, stop-loss, target, and reward-to-risk. 

20. Member adjusts values in the risk calculator if desired. 

21. Calculator validates inputs and updates the result immediately. 

22. Member independently decides whether to act. The MVP does not execute trades or connect to a broker. 

## **6. Required Screens** 

|**Screen**|**Required content**|
|---|---|
|Landing page|Brand, value proposition, XAUUSD focus, key features, dashboard<br>preview, CTA, risk disclaimer.|
|Register / sign in|Account creation, login, logout, password reset, validation and error<br>states.|
|Pricing / subscription|One initial plan, billing details, premium feature list, checkout CTA,<br>access/cancellation explanation.|
|Checkout result|Success, pending, failed, cancelled, or retry state based on provider<br>confirmation.|
|Member dashboard|Market overview, chart, buy/sell pressure, estimated zones, setup<br>cards, data timestamp/source, recent history.|
|Setup detail / calculator|Setup rationale, entry/SL/TP, risk/reward and optional supported<br>position-size estimate.<br>i|
|Account page|Basic profile and current access/subscription status.|
|Admin overview|User/subscriber metrics, recent payment status, pending/expired<br>access.|
|Admin users/subscriptions|Search/filter, payment references, status and manual access<br>controls.|
|Legal/information pages|Risk disclaimer, privacy policy, terms; owner-approved wording.|



## **7. Data & Integration Dependencies** 

|**Dependency**|**Required decision / implementation note**|
|---|---|
|XAUUSD market data|Agree on one provider/API and verify price/candle availability, update<br>frequency, historical depth, rate limits, licensing, and whether data is<br>live or delayed.|
|Market-wide trader counts / notional|Requires a source that explicitly supplies this coverage. If<br>unavailable, show a clearly labelled proxy/estimate or leave the<br>metric out.|
|Actual stop-loss / take-profit order distribution|Generally not visible across the entire market. Use price-structure-<br>based estimated zones unless a licensed source provides actual<br>aggregated order data.|
||Owner must supply a supported, verified account and credentials.|
|Payment provider|i<br>Confirm country eligibility, payout destination, supported currencies,<br>recurring billing and webhook capabilities.|
|Domain & hosting|Owner and developer agree on deployment target and domain.<br>Domain, hosting upgrades, API subscriptions and provider fees are<br>external service dependencies.|
|Brand assets|Use the client-provided reference dashboard as visual direction;<br>confirm final logo/name/colors and any assets supplied by the client.|



Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

## **8. Suggested Technical Architecture** 

Use the team's most reliable supported stack. A practical implementation is a responsive React frontend, a small Python/Flask API (or equivalent existing backend), and a relational database such as PostgreSQL. Keep the UI, marketdata adapter, analysis/rule engine, authentication/access control, and payment integration as separate modules. 

- Frontend: responsive dashboard, chart presentation, setup cards, pricing, account pages, admin UI. 

- Backend API: authenticated endpoints, market data normalization, analysis outputs, setup history, account/access checks. 

- Market-data adapter: one agreed provider initially; normalize timestamps and instrument/timeframe data. 

- Analysis engine: configurable indicators, setup rules, liquidity heuristics, scoring, and explanatory text. 

- Database: users, roles, plans, subscriptions/access grants, payment records/references, setup history, and admin audit events. 

- Payment module: hosted checkout initiation, signed webhook endpoint, idempotent event processing, and accessstate synchronization. 

- Security: environment variables for secrets, password hashing, server-side authorization, input validation, rate limiting on sensitive endpoints, HTTPS, and least-privilege admin access. 

## **9. Suggested Core Data Entities** 

|**Entity**|**Key fields (illustrative)**|
|---|---|
|User|id, email, password_hash, role, created_at, status|
|Plan|id, name, price, currency, billing_interval, features, active|
|Subscription / AccessGrant|id, user_id, plan_id, status, source, started_at, expires_at,<br>provider_subscription_id|
|Payment|id, user_id, provider, provider_reference, amount, currency, status,<br>created_at, confirmed_at|
|MarketSnapshot|id, symbol, timeframe, price/candle data reference, source,<br>timestamp, freshness status|
|TradeSetup|id, symbol, timeframe, direction, entry_low/high, stop_loss,<br>take_profit, score, rationale, created_at, status|
|ZoneEstimate|id, symbol, timeframe, zone_type, low/high, strength_score,<br>method_version, created_at|
|AdminAuditEvent|id, admin_user_id, target_user_id, action, reason, timestamp|



## **10. Security, Privacy & Reliability** 

- All premium endpoints must check access on the server; hiding a button in the frontend is not sufficient. 

- Only authorized admins can view user/payment administration screens or change access status. 

- Never store raw card details. Store only provider identifiers and the minimum payment metadata needed for account reconciliation. 

- Verify payment webhooks, process events idempotently, and log failed processing for investigation. 

- Keep API keys, database credentials, and payment secrets in environment configuration, not source code. 

- Validate all user inputs and protect authentication, checkout, and admin endpoints against common abuse. 

- Show data-source status and timestamp. If the source fails or data becomes stale, show a warning and suppress misleading 'current' outputs. 

- Collect only necessary user data and publish owner-approved privacy and terms content. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

## **11. Non-Functional Requirements** 

- Responsive layout for mobile, tablet, and desktop. 

- Clear loading, empty, error, and stale-data states. 

- Readable dashboard at common mobile widths without horizontal overflow. 

- Maintainable modules with documented setup rules and environment variables. 

- Basic logs for API/data errors and payment event processing. 

- Reasonable performance for a small initial audience; avoid expensive repeated market-data requests by using appropriate caching where permitted by the provider. 

## **12. Testing & Acceptance Criteria** 

- ☐ A visitor can access the public landing page and preview. 

- ☐ A user can register, sign in, sign out, and recover access through the implemented flow. 

- ☐ A non-premium user cannot access protected premium API responses or admin routes. 

- ☐ A premium member can access the dashboard while their access status is active. 

- ☐ The owner can search users and identify active, pending, expired, cancelled, and manually granted access. 

- ☐ Payment status is displayed consistently with verified provider events; duplicate webhook events do not create duplicate grants or records. 

- ☐ The owner can manually activate or revoke access and the change is reflected in the user's next protected request. 

- ☐ The dashboard displays the selected XAUUSD source and last-updated timestamp. 

- ☐ Missing, malformed, or stale data produces a warning rather than a false live reading. 

- ☐ The setup engine returns a valid setup only when the approved rule conditions are met; otherwise it returns 'No setup currently'. 

- ☐ Entry/SL/TP, reward-to-risk, and supported position-size calculations pass documented test cases. 

- ☐ Estimated liquidity/SL/TP zones are visibly labelled as estimates and have a traceable calculation method. 

- ☐ The layout works on desktop and mobile; main user flows are tested end-to-end. 

- ☐ Deployment link, environment configuration guidance, and a concise handover guide are delivered. 

## **13. Delivery Plan & Work Sequence** 

|**Workstream**|**Tasks**<br>i|**Exit condition**|
|---|---|---|
|1. Requirements lock|Confirm data provider, billing<br>model/provider, plan details, brand<br>reference, hosting, and setup-rule baseline.|Dependencies and MVP decisions<br>documented.|
|2. UX & foundation|Build responsive layout, landing/pricing<br>pages, authentication, database and role<br>model.|Public and authenticated routes work.|
|3. Market data & analysis|Integrate source, validate freshness,<br>implement baseline indicators, setup cards,<br>estimates, chart overlays and history.<br>l|Dashboard outputs are traceable and<br>correctly labelled.|
|4. Subscription & admin|Implement checkout flow, payment-state<br>handling, access control, user/subscription<br>admin and manual override.<br>l|Test payments/access lifecycle passes in<br>sandbox or configured provider flow.|
|5. QA & deployment|Test core workflows, responsive behavior,<br>stale-data handling, security/access checks,<br>deploy and hand over.|Acceptance checklist completed and client<br>demonstration delivered.|



## **14. Assumptions & Decisions Required Before Build** 

- Client confirms the exact market-data provider or authorizes the developer to recommend a suitable source. 

- Client confirms the initial plan price, billing interval, cancellation policy, and which features are premium. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 

XAUUSD INTELLIGENCE  |  PRODUCT SPECIFICATION 

- Client creates/provides the payment-provider account and completes any identity/business verification required by the provider. 

- Client confirms the payout country, currency, and bank/account destination supported by the selected provider. 

- Client supplies the desired brand assets or approves a simple visual direction based on the reference screenshot. 

- Client approves the baseline analysis rules and understands that setup scores and liquidity/SL/TP zones are estimates, not guarantees. 

- Client provides domain/hosting access or approves the agreed deployment environment. 

- Payment provider live credentials and any market-data API keys are supplied securely through environment configuration, not chat or source code. 

## **15. Explicit Limitations & Future Enhancements** 

The initial release focuses on a single instrument, XAUUSD, and a practical set of data-driven indicators and estimates. Exact global buyer/seller headcounts, real aggregate order notional, and the precise stop-loss/take-profit orders of all market participants cannot be inferred from ordinary price candles alone. These metrics must not be presented as verified facts without an appropriate licensed source. 

Potential later enhancements, subject to data availability and a separately agreed scope: 

- Richer liquidity modelling, more timeframes, session levels and configurable zone rules. 

- Economic calendar, news summaries, and sourced market-sentiment indicators. 

- Email or Telegram alerts for setup conditions. 

- More detailed setup outcome analytics and transparent historical evaluation. 

- Additional subscription tiers, automated cancellation/renewal management, coupons and referral tracking. 

- Broker/MT5 connectivity or trade execution, only after separate requirements, security controls, and risk limits are defined. 

## **16. Risk & Product Disclaimer** 

XAUUSD Intelligence provides market information, calculations, and estimated analysis for informational purposes only. It does not guarantee profitability, the accuracy of a setup, or any market outcome. Market data may be delayed or incomplete depending on the source. Liquidity and stop-loss/take-profit concentration areas are estimates unless explicitly backed by a verified data provider. Users remain responsible for their own trading decisions. The owner should review and approve the platform's legal disclaimers before public launch. 

## **17. Definition of Done** 

The MVP is ready for handover when the agreed screens and workflows are deployed; users and premium access are protected server-side; the owner can monitor users and subscription/payment status; the dashboard shows sourced and timestamped XAUUSD context; estimates and trade setups are transparently labelled; core calculations and access/payment workflows pass the acceptance checklist; and the client receives the deployment link plus concise operating instructions. 

Product Requirements & Developer Implementation Guide  •  Version 1.0 


# DNS Configuration Guide — xauusdtracker.com

This document specifies the exact DNS record configuration required to route your production domain **xauusdtracker.com** to the Vercel edge deployment network with automated SSL/TLS termination.

---

## 1. Required DNS Records Table

Log in to your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy, Google Domains / Squarespace, Porkbun) and enter the following DNS resource records in your DNS Management console:

| Record Type | Name / Host | Target / Value | TTL | Proxy Status (Cloudflare) | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or leave blank/root) | `76.76.21.21` | Auto / 3600 | DNS Only (Gray Cloud) | Apex domain routing to Vercel Anycast IP |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 | DNS Only (Gray Cloud) | Subdomain routing with automatic redirect |

> [!IMPORTANT]
> If you are using Cloudflare, set the Proxy status to **DNS only** (gray cloud) during initial SSL certificate issuance by Vercel. Once Vercel issues the Let's Encrypt certificate and confirms verification, you can optionally enable the Cloudflare proxy (orange cloud) with SSL mode set to **Full (Strict)**.

---

## 2. Vercel Dashboard Domain Setup

1. Open your project on the [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings** > **Domains**.
3. Add **`xauusdtracker.com`**.
4. Vercel will prompt you to automatically add `www.xauusdtracker.com` as a redirect to `xauusdtracker.com` (recommended).
5. Vercel will perform verification against the A record `76.76.21.21` and CNAME record `cname.vercel-dns.com`.
6. Once verified, a green checkmark **"Valid Configuration"** will appear, and Vercel will automatically provision a free, auto-renewing wildcard SSL/TLS certificate.

---

## 3. Propagation Verification Commands

To verify that your DNS records have successfully propagated worldwide, execute the following commands in your terminal or use [whatsmydns.net](https://www.whatsmydns.net/):

### Check Apex A Record:
```bash
# Windows PowerShell
Resolve-DnsName -Name xauusdtracker.com -Type A

# Linux / macOS
dig +short A xauusdtracker.com
# Expected output: 76.76.21.21
```

### Check WWW CNAME Record:
```bash
# Windows PowerShell
Resolve-DnsName -Name www.xauusdtracker.com -Type CNAME

# Linux / macOS
dig +short CNAME www.xauusdtracker.com
# Expected output: cname.vercel-dns.com.
```

---

## 4. Production Environment Variables Checklist

Before routing live traffic, ensure the following production environment variables are configured in **Vercel Settings > Environment Variables**:

| Variable Key | Value Example | Required For |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...sslmode=require` | Neon / Supabase PostgreSQL Prisma connection |
| `AUTH_SECRET` | `openssl rand -base64 32` | NextAuth v5 JWT session encryption |
| `NEXTAUTH_URL` | `https://xauusdtracker.com` | NextAuth callback and Stripe checkout return URL |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe API checkout creation & subscription queries |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Raw text signature verification for webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Client-side Stripe SDK integration |
| `STRIPE_PRICE_ID` | `price_...` | Recurring institutional subscription price ID |

---

## 5. Stripe Webhook Endpoint Configuration

After DNS is active, configure your Stripe webhook listener:
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint**.
3. Set **Endpoint URL** to:
   ```
   https://xauusdtracker.com/api/webhooks/stripe
   ```
4. Select the following events to listen to:
   * `checkout.session.completed`
   * `customer.subscription.updated`
   * `customer.subscription.deleted`
5. Reveal your **Signing secret** (`whsec_...`) and paste it into Vercel's `STRIPE_WEBHOOK_SECRET` environment variable.

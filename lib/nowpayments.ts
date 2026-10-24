import crypto from "crypto";

export interface CreateInvoiceInput {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
}

export interface NowPaymentsInvoiceResponse {
  id: string;
  order_id: string;
  order_description: string;
  price_amount: number | string;
  price_currency: string;
  pay_currency?: string | null;
  ipn_callback_url?: string;
  invoice_url: string;
  success_url?: string;
  cancel_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NowPaymentsIpnPayload {
  actually_paid?: number;
  actually_paid_at_fiat?: number;
  invoice_id?: number | string | null;
  order_description?: string;
  order_id: string;
  parent_payment_id?: number | string | null;
  pay_address?: string;
  pay_amount?: number;
  pay_currency?: string;
  payment_id: number | string;
  payment_status: string;
  payin_extra_id?: string | null;
  price_amount?: number;
  price_currency?: string;
  purchase_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Returns the configured base URL of the application.
 * Priority: NEXT_PUBLIC_APP_URL > request headers > NEXTAUTH_URL > localhost
 */
export function getAppBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

/**
 * Creates a hosted payment invoice through NOWPayments REST API.
 * Communicates with `${NOWPAYMENTS_API_URL}/invoice` using `x-api-key` header.
 */
export async function createInvoice(
  params: CreateInvoiceInput
): Promise<NowPaymentsInvoiceResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NOWPayments API Key is missing. Ensure NOWPAYMENTS_API_KEY is configured in server environment."
    );
  }

  const apiUrl = (
    process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1"
  ).replace(/\/+$/, "");

  const payload = {
    price_amount: Number(params.price_amount),
    price_currency: params.price_currency.toLowerCase(),
    order_id: String(params.order_id),
    order_description: params.order_description,
    ipn_callback_url: params.ipn_callback_url,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  };

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError: any) {
    throw new Error(
      `NOWPayments Network Error: Failed to reach ${apiUrl}/invoice. ${networkError?.message || ""}`
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail =
        errJson?.message || errJson?.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    throw new Error(
      `NOWPayments API responded with status ${response.status}: ${errorDetail}`
    );
  }

  const data = await response.json();

  if (!data || (!data.invoice_url && !data.id)) {
    throw new Error(
      "Invalid response payload received from NOWPayments: missing 'invoice_url' or 'id'."
    );
  }

  return {
    id: String(data.id),
    order_id: String(data.order_id || params.order_id),
    order_description: String(data.order_description || params.order_description),
    price_amount: data.price_amount,
    price_currency: String(data.price_currency || params.price_currency),
    pay_currency: data.pay_currency ?? null,
    ipn_callback_url: data.ipn_callback_url,
    invoice_url: String(data.invoice_url),
    success_url: data.success_url,
    cancel_url: data.cancel_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Recursively sort keys of an object or array in alphabetical order.
 * Essential requirement for NOWPayments IPN HMAC-SHA512 verification.
 */
export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, any> = {};

  for (const key of sortedKeys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }

  return sorted;
}

/**
 * Computes HMAC-SHA512 hexadecimal signature for NOWPayments IPN payload.
 * Sorts object keys alphabetically before stringifying.
 */
export function computeIpnSignature(payload: any, secretKey: string): string {
  const sorted = sortObjectKeys(payload);
  const jsonString = JSON.stringify(sorted);
  return crypto.createHmac("sha512", secretKey).update(jsonString).digest("hex");
}

/**
 * Verifies NOWPayments IPN signature against the incoming `x-nowpayments-sig` header.
 * Uses timing-safe byte equality comparison to mitigate timing attacks.
 */
export function verifyIpnSignature(
  rawPayload: any,
  receivedSignature: string | null | undefined,
  secretKey?: string
): boolean {
  if (!receivedSignature || typeof receivedSignature !== "string") {
    return false;
  }

  const secret = secretKey || process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error(
      "NOWPAYMENTS_IPN_SECRET is not configured in server environment."
    );
    return false;
  }

  try {
    const payloadObj =
      typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;

    const calculatedSig = computeIpnSignature(payloadObj, secret);

    const calcBuf = Buffer.from(calculatedSig, "hex");
    const recvBuf = Buffer.from(receivedSignature.trim(), "hex");

    if (calcBuf.length !== recvBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(calcBuf, recvBuf);
  } catch (err) {
    console.error("NOWPayments signature verification exception:", err);
    return false;
  }
}

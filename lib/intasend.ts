/**
 * IntaSend Payment Gateway Integration
 * Supports M-Pesa (STK Push & Mobile Money), Visa & Mastercard card payments, and PesaLink.
 * Docs: https://intasend.com / https://payment.intasend.com
 */

export interface IntaSendCheckoutParams {
  amountUsd: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  apiRef: string; // Our internal payment record ID
  redirectUrl: string;
}

export interface IntaSendCheckoutResponse {
  id: string;
  url: string;
  signature?: string;
  methods?: string[];
  amount?: number;
  currency?: string;
  api_ref?: string;
  [key: string]: any;
}

export interface IntaSendPaymentStatusResponse {
  invoice_id?: string;
  state?: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED" | "CANCELED" | "RETRY" | "PARTIAL";
  provider?: string;
  value?: string | number;
  currency?: string;
  account?: string;
  api_ref?: string;
  clearing_status?: string;
  mpesa_reference?: string;
  failed_reason?: string | null;
  [key: string]: any;
}

function getPublishableKey(): string {
  return (
    process.env.INTASEND_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY ||
    ""
  );
}

function getSecretKey(): string {
  return process.env.INTASEND_SECRET_KEY || "";
}

function getBaseUrl(): string {
  const pubKey = getPublishableKey();
  if (pubKey.includes("_test_")) {
    return "https://sandbox.intasend.com";
  }
  return "https://payment.intasend.com";
}

/**
 * Format a phone number to standard international format (e.g., 2547XXXXXXXX for Kenya).
 */
export function formatIntaSendPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  // If Kenyan local number e.g. 0712345678 or 0112345678
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return `254${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Initialize an IntaSend Express Checkout session.
 * Returns checkout URL that displays M-Pesa STK push and Card payment tabs.
 */
export async function createIntaSendCheckoutSession(
  params: IntaSendCheckoutParams
): Promise<IntaSendCheckoutResponse> {
  const pubKey = getPublishableKey();
  if (!pubKey) {
    throw new Error("INTASEND_PUBLISHABLE_KEY is not configured.");
  }

  const baseUrl = getBaseUrl();
  const formattedPhone = params.phoneNumber
    ? formatIntaSendPhoneNumber(params.phoneNumber)
    : undefined;

  const payload: Record<string, any> = {
    public_key: pubKey,
    amount: params.amountUsd,
    currency: "USD",
    email: params.email,
    first_name: params.firstName || "Customer",
    last_name: params.lastName || "Subscriber",
    redirect_url: params.redirectUrl,
    api_ref: params.apiRef,
  };

  if (formattedPhone) {
    payload.phone_number = formattedPhone;
  }

  const response = await fetch(`${baseUrl}/api/v1/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-IntaSend-Public-API-Key": pubKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("IntaSend checkout session initialization error:", response.status, errorText);
    throw new Error(`IntaSend API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Verify payment status with IntaSend using invoice_id or checkout_id.
 */
export async function verifyIntaSendPayment(params: {
  invoice_id?: string;
  checkout_id?: string;
  signature?: string;
}): Promise<IntaSendPaymentStatusResponse> {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error("INTASEND_SECRET_KEY is not configured.");
  }

  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/v1/payment/status/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_id: params.invoice_id,
      checkout_id: params.checkout_id,
      signature: params.signature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IntaSend status verification error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Validates the IntaSend webhook challenge if configured.
 */
export function verifyIntaSendWebhookChallenge(
  payloadChallenge?: string | null
): boolean {
  const expectedChallenge = process.env.INTASEND_CHALLENGE;
  // If no challenge is configured in env, allow through
  if (!expectedChallenge) return true;
  return payloadChallenge === expectedChallenge;
}

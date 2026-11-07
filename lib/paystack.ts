/**
 * Paystack Payment Gateway Integration
 * Server-side helpers for creating payment sessions and verifying webhooks.
 * Paystack uses HTTPS API endpoints and HMAC-SHA512 webhook signatures.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    status: "success" | "failed" | "abandoned" | "pending";
    amount: number; // in kobo (smallest currency unit) for NGN, or cents for USD
    currency: string;
    paid_at: string | null;
    metadata?: {
      userId?: string;
      planId?: string;
      orderId?: string;
      [key: string]: any;
    };
    customer: {
      email: string;
    };
  };
}

/**
 * Initialize a Paystack transaction (card payment).
 * Returns authorization_url to redirect user to hosted payment page.
 */
export async function initializePaystackTransaction(params: {
  email: string;
  amountUsd: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitResponse> {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  // Paystack works in the smallest currency unit.
  // For USD transactions: amount in cents (multiply by 100)
  const amountInCents = Math.round(params.amountUsd * 100);

  const body = {
    email: params.email,
    amount: amountInCents,
    currency: "USD",
    reference: params.reference,
    callback_url: params.callback_url,
    metadata: params.metadata || {},
  };

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Paystack initialize error:", response.status, errorBody);
    throw new Error(`Paystack API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Verify a Paystack transaction by reference.
 * Used in webhook handler and optionally in the success callback.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Paystack verify error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Verifies the HMAC-SHA512 signature on incoming Paystack webhook events.
 * Paystack signs the raw request body with your secret key.
 */
export function verifyPaystackWebhook(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  const secretKey = getSecretKey();
  if (!secretKey || !signature) return false;

  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}


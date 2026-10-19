"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(72, "Password must not exceed 72 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function registerUser(
  _prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");

  const validationResult = registerSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!validationResult.success) {
    const flattened = validationResult.error.flatten();
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: flattened.fieldErrors,
    };
  }

  const { email, password } = validationResult.data;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email address is already registered.",
      };
    }

    // Salt rounds 10 as strictly specified
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        subscription: {
          create: {
            status: "INACTIVE",
          },
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Internal server error. Failed to create terminal account.",
    };
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}

export type LoginState = {
  error?: string;
};

export async function loginUser(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Both terminal email and password are required." };
  }

  try {
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (typeof result === "string" && result.includes("error=")) {
      return {
        error: "Invalid access credentials. Terminal clearance rejected.",
      };
    }
  } catch (error) {
    // Next.js redirection works by throwing a NEXT_REDIRECT error
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return {
      error: "Invalid access credentials. Terminal clearance rejected.",
    };
  }

  // Issue relative redirect to keep the operator session on the current active domain
  redirect("/terminal");
}




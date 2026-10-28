import "server-only";
import { z } from "zod";
import { createDodoProvider } from "./dodo";
import type { PaymentProvider } from "./provider";

/**
 * Where payments are wired up: the only module that knows the provider is Dodo, and the only one
 * that reads payment settings from the environment. Everything else receives a PaymentProvider.
 * See docs/payments.md for the variables.
 */

const required = z.string().trim().min(1);
/** A variable left blank in .env counts as unset. */
const unsetIfBlank = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const settingsSchema = z.object({
  DODO_PRODUCT_ID: required,
  /** Minor units: 4900 is 49.00 GEL. Must equal the Dodo product's price. */
  PRICE_AMOUNT_MINOR: z.coerce.number().int().positive(),
  PRICE_CURRENCY: z.preprocess(unsetIfBlank, z.string().regex(/^[A-Z]{3}$/).default("GEL")),
});

const providerSchema = z.object({
  DODO_PAYMENTS_API_KEY: required,
  DODO_PAYMENTS_WEBHOOK_KEY: required,
  DODO_PAYMENTS_ENVIRONMENT: z.preprocess(unsetIfBlank, z.enum(["test_mode", "live_mode"]).default("test_mode")),
  DODO_BRAND_ID: z.preprocess(unsetIfBlank, z.string().trim().min(1).optional()),
});

export type PaymentSettings = {
  productId: string;
  /** What every order costs. Comes from here, never from the client. */
  price: { amount: number; currency: string };
};

export function paymentSettings(): PaymentSettings {
  const env = parseEnv(settingsSchema);
  return { productId: env.DODO_PRODUCT_ID, price: { amount: env.PRICE_AMOUNT_MINOR, currency: env.PRICE_CURRENCY } };
}

export function paymentProvider(): PaymentProvider {
  const env = parseEnv(providerSchema);
  return createDodoProvider({
    apiKey: env.DODO_PAYMENTS_API_KEY,
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    brandId: env.DODO_BRAND_ID,
  });
}

function parseEnv<T extends z.ZodObject>(schema: T): z.output<T> {
  const result = schema.safeParse(process.env);
  if (result.success) return result.data;
  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))].join(", ");
  throw new Error(`Missing or invalid payment environment variables: ${names}. See docs/payments.md.`);
}

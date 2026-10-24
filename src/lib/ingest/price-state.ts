/**
 * Stored-price contract for source-derived listings.
 *
 * An amount without a trustworthy currency is not a displayable price.
 * Missing/invalid amounts never become a claimed zero/free price. The legacy
 * numeric column keeps a zero placeholder, while price_known carries the
 * truth state and XXX makes the no-currency condition explicit.
 */
export interface SourcePriceInput {
  cost?: number | null;
  currency?: string | null;
}

export interface StoredSourcePrice {
  cost: number;
  currency: string;
  price_known: boolean;
}

export function storedSourcePrice(input: SourcePriceInput): StoredSourcePrice {
  const amountKnown =
    typeof input.cost === "number" && Number.isFinite(input.cost) && input.cost >= 0;
  const normalizedCurrency =
    typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  const currencyKnown = /^[A-Z]{3}$/.test(normalizedCurrency) && normalizedCurrency !== "XXX";
  const priceKnown = amountKnown && currencyKnown;

  return {
    cost: amountKnown ? input.cost : 0,
    currency: priceKnown ? normalizedCurrency : "XXX",
    price_known: priceKnown,
  };
}

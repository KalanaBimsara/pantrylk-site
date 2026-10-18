import type { PriceMode } from "./types";

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });

export function priceLabel(mode: PriceMode, price: number | null): string {
  if (mode === "fixed" && price != null) return `LKR ${lkr.format(price)}`;
  if (mode === "starting" && price != null) return `From LKR ${lkr.format(price)}`;
  if (mode === "on_request") return "Price on request";
  return "Request a Quote";
}

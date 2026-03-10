// Exchange rate: 1 USD = ~83 INR (approximate)
const USD_TO_INR = 83;

export const formatDualPrice = (usd: number) => ({
  usd: `$${usd}`,
  inr: `₹${Math.round(usd * USD_TO_INR).toLocaleString("en-IN")}`,
});

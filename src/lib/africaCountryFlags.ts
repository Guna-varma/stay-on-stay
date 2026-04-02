/**
 * African Union–style coverage for the “For Africa” trust band on /med-tourism.
 * ISO 3166-1 alpha-2 codes for https://flagcdn.com
 */
export type AfricaCountryFlag = {
  code: string;
  /** English display name (shown as `tx(label)`; falls back to this string for all locales). */
  label: string;
};

export const AFRICA_COUNTRY_FLAGS: AfricaCountryFlag[] = [
  { code: "DZ", label: "Algeria" },
  { code: "AO", label: "Angola" },
  { code: "BJ", label: "Benin" },
  { code: "BW", label: "Botswana" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BI", label: "Burundi" },
  { code: "CV", label: "Cabo Verde" },
  { code: "CM", label: "Cameroon" },
  { code: "CF", label: "Central African Republic" },
  { code: "TD", label: "Chad" },
  { code: "KM", label: "Comoros" },
  { code: "CD", label: "Democratic Republic of the Congo" },
  { code: "CG", label: "Republic of the Congo" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "DJ", label: "Djibouti" },
  { code: "EG", label: "Egypt" },
  { code: "GQ", label: "Equatorial Guinea" },
  { code: "ER", label: "Eritrea" },
  { code: "SZ", label: "Eswatini" },
  { code: "ET", label: "Ethiopia" },
  { code: "GA", label: "Gabon" },
  { code: "GM", label: "Gambia" },
  { code: "GH", label: "Ghana" },
  { code: "GN", label: "Guinea" },
  { code: "GW", label: "Guinea-Bissau" },
  { code: "KE", label: "Kenya" },
  { code: "LS", label: "Lesotho" },
  { code: "LR", label: "Liberia" },
  { code: "LY", label: "Libya" },
  { code: "MG", label: "Madagascar" },
  { code: "MW", label: "Malawi" },
  { code: "ML", label: "Mali" },
  { code: "MR", label: "Mauritania" },
  { code: "MU", label: "Mauritius" },
  { code: "MA", label: "Morocco" },
  { code: "MZ", label: "Mozambique" },
  { code: "NA", label: "Namibia" },
  { code: "NE", label: "Niger" },
  { code: "NG", label: "Nigeria" },
  { code: "RW", label: "Rwanda" },
  { code: "ST", label: "São Tomé and Príncipe" },
  { code: "SN", label: "Senegal" },
  { code: "SC", label: "Seychelles" },
  { code: "SL", label: "Sierra Leone" },
  { code: "SO", label: "Somalia" },
  { code: "ZA", label: "South Africa" },
  { code: "SS", label: "South Sudan" },
  { code: "SD", label: "Sudan" },
  { code: "TZ", label: "Tanzania" },
  { code: "TG", label: "Togo" },
  { code: "TN", label: "Tunisia" },
  { code: "UG", label: "Uganda" },
  { code: "ZM", label: "Zambia" },
  { code: "ZW", label: "Zimbabwe" },
];

export function africaFlagUrl(code: string, width: 40 | 20 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

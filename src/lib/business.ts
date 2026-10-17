// Single source of truth for who runs the site. Fill in the empty fields; anything left empty is
// not shown publicly, so nothing is invented. Legal pages and the footer read from here.
export const BUSINESS = {
  siteName: "Seto Durbar",
  legalName: "", // registered name of the person or company operating the site
  registrationNo: "", // company / PAN / VAT registration number, if any
  address: "", // postal address
  email: "", // public contact email, also used for privacy requests
  phone: "",
  hours: "",
  country: "Nepal",
};

export const LEGAL_UPDATED = "15 October 2026";

export const businessRows = (): [string, string][] =>
  ([
    ["Operated by", BUSINESS.legalName],
    ["Registration no.", BUSINESS.registrationNo],
    ["Address", BUSINESS.address],
    ["Email", BUSINESS.email],
    ["Phone", BUSINESS.phone],
    ["Support hours", BUSINESS.hours],
  ] as [string, string][]).filter(([, v]) => v);

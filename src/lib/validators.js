/**
 * Fingoh Master Validation Library
 * ---------------------------------
 * Single source of truth for all field validation across the app.
 * Import and use in any component — never write inline validation again.
 *
 * Usage:
 *   import { V, validate, validateForm } from './lib/validators.js'
 *
 *   // Single field
 *   const err = V.email("hello@world.com")  // null = valid, string = error message
 *
 *   // Full form
 *   const errors = validateForm({ name: "John", email: "bad" }, ["name", "email"])
 *   // { email: "Enter a valid email address" }
 */

// ── Core validators — each returns null (valid) or an error string ─────────────

export const V = {

  // ── Identity ───────────────────────────────────────────────────────────────

  /** Full name: 2-80 chars, letters/spaces/hyphens/apostrophes only */
  name: (v) => {
    if (!v || !v.trim()) return "Name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 80) return "Name must be under 80 characters";
    if (/\d/.test(v)) return "Name should not contain numbers";
    if (!/^[a-zA-Z\s'\-\.]+$/.test(v.trim()))
      return "Name should only contain letters, spaces, hyphens or apostrophes";
    return null;
  },

  /** Email address: standard format with @ and domain */
  email: (v) => {
    if (!v || !v.trim()) return "Email is required";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(v.trim())) return "Enter a valid email address (e.g. name@company.com)";
    if (v.trim().length > 254) return "Email address is too long";
    return null;
  },

  /** Optional email — only validates format if a value is provided */
  emailOptional: (v) => {
    if (!v || !v.trim()) return null;
    return V.email(v);
  },

  /** Phone: digits, spaces, +, -, (), 7-15 digits total */
  phone: (v) => {
    if (!v || !v.trim()) return null; // phone is optional
    const digits = v.replace(/\D/g, "");
    if (digits.length < 7) return "Phone number is too short (min 7 digits)";
    if (digits.length > 15) return "Phone number is too long (max 15 digits)";
    if (!/^[\d\s\+\-\(\)\.]+$/.test(v.trim()))
      return "Phone should only contain digits, spaces, +, -, or ()";
    return null;
  },

  // ── Professional ───────────────────────────────────────────────────────────

  /** Job title: 2-100 chars, no pure numbers or symbols */
  jobTitle: (v) => {
    if (!v || !v.trim()) return "Job title is required";
    if (v.trim().length < 2) return "Job title must be at least 2 characters";
    if (v.trim().length > 100) return "Job title must be under 100 characters";
    if (/^\d+$/.test(v.trim())) return "Job title cannot be just numbers";
    if (!/^[a-zA-Z0-9\s\-\&\/\,\.\(\)\']+$/.test(v.trim()))
      return "Job title contains invalid characters";
    return null;
  },

  /** Company name: 2-120 chars, no pure symbols */
  companyName: (v) => {
    if (!v || !v.trim()) return "Company name is required";
    if (v.trim().length < 2) return "Company name must be at least 2 characters";
    if (v.trim().length > 120) return "Company name must be under 120 characters";
    if (/^\d+$/.test(v.trim())) return "Company name cannot be just numbers";
    if (!/^[a-zA-Z0-9\s\-\&\/\,\.\(\)\'\"]+$/.test(v.trim()))
      return "Company name contains invalid characters";
    return null;
  },

  /** LinkedIn URL: must contain linkedin.com */
  linkedin: (v) => {
    if (!v || !v.trim()) return null; // optional
    const url = v.trim().toLowerCase();
    if (!url.includes("linkedin.com"))
      return "Enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname)";
    if (url.length > 200) return "LinkedIn URL is too long";
    return null;
  },

  // ── Event fields ───────────────────────────────────────────────────────────

  /** Event name: 3-120 chars */
  eventName: (v) => {
    if (!v || !v.trim()) return "Event name is required";
    if (v.trim().length < 3) return "Event name must be at least 3 characters";
    if (v.trim().length > 120) return "Event name must be under 120 characters";
    if (/^\d+$/.test(v.trim())) return "Event name cannot be just numbers";
    return null;
  },

  /** Venue: 3-150 chars */
  venue: (v) => {
    if (!v || !v.trim()) return "Venue is required";
    if (v.trim().length < 3) return "Venue must be at least 3 characters";
    if (v.trim().length > 150) return "Venue must be under 150 characters";
    return null;
  },

  /** Website URL: must start with http/https or www */
  website: (v) => {
    if (!v || !v.trim()) return null; // optional
    const url = v.trim().toLowerCase();
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("www."))
      return "Website must start with https://, http://, or www.";
    if (!/\.[a-z]{2,}/.test(url))
      return "Enter a valid website URL (e.g. https://www.company.com)";
    if (url.length > 200) return "Website URL is too long";
    return null;
  },

  /** Date: must be a valid date string */
  date: (v) => {
    if (!v || !v.trim()) return "Date is required";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "Enter a valid date";
    return null;
  },

  /** Date range: end must be after start */
  dateRange: (from, to) => {
    const errFrom = V.date(from);
    if (errFrom) return { from: errFrom };
    const errTo = V.date(to);
    if (errTo) return { to: errTo };
    if (new Date(to) < new Date(from))
      return { to: "End date must be after start date" };
    return null;
  },

  // ── General ────────────────────────────────────────────────────────────────

  /** Required text: not empty, not junk (all same char or pure symbols) */
  required: (v, label = "This field") => {
    if (!v || !v.trim()) return `${label} is required`;
    if (v.trim().length < 2) return `${label} is too short`;
    if (/^(.)\1+$/.test(v.trim())) return `${label} looks like invalid input`;
    return null;
  },

  /** Free text with min length — for descriptions, notes etc */
  text: (v, { min = 0, max = 500, label = "This field", required = false } = {}) => {
    if (!v || !v.trim()) {
      if (required) return `${label} is required`;
      return null;
    }
    if (v.trim().length < min) return `${label} must be at least ${min} characters`;
    if (v.trim().length > max) return `${label} must be under ${max} characters`;
    return null;
  },

  /** Industry / designation — no pure numbers, reasonable length */
  designation: (v) => {
    if (!v || !v.trim()) return null; // often optional
    if (v.trim().length > 120) return "Designation is too long (max 120 chars)";
    if (/^\d+$/.test(v.trim())) return "Designation cannot be just numbers";
    return null;
  },
};


// ── Form-level validation helper ──────────────────────────────────────────────

/**
 * Validate a form object against a set of field rules.
 *
 * @param {Object} values   - form values { name, email, ... }
 * @param {Object} rules    - field rules { name: V.name, email: V.email, ... }
 * @returns {Object}        - errors object { field: errorString } — empty = valid
 *
 * Example:
 *   const errors = validateForm(
 *     { name: "John123", email: "bad" },
 *     { name: V.name, email: V.email }
 *   )
 *   // { name: "Name should not contain numbers", email: "Enter a valid email address" }
 */
export function validateForm(values, rules) {
  const errors = {};
  for (const [field, validator] of Object.entries(rules)) {
    const err = validator(values[field]);
    if (err) errors[field] = err;
  }
  return errors;
}


// ── Pre-defined form schemas ───────────────────────────────────────────────────
// Use these directly for common forms to avoid re-defining rules each time.

export const SCHEMAS = {

  /** Login form */
  login: {
    email: V.email,
  },

  /** Add/edit staff member */
  staff: {
    name:  V.name,
    email: V.email,
    title: V.jobTitle,
  },

  /** Create event (step 1) */
  eventBasic: {
    name:  (v) => V.eventName(v),
    venue: V.venue,
  },

  /** Create event (step 2) */
  eventCompany: {
    company: V.companyName,
    website: V.website,
  },

  /** Manual visitor entry */
  manualVisitor: {
    name:    V.name,
    company: V.companyName,
    title:   V.jobTitle,
    email:   V.emailOptional,
    phone:   V.phone,
    linkedIn: V.linkedin,
  },

  /** Profile settings */
  profile: {
    name: V.name,
  },
};


// ── CSV row validation ─────────────────────────────────────────────────────────

/**
 * Validate a single CSV row (audience contact upload).
 * Returns array of error strings — empty array = valid.
 *
 * @param {Object} row    - { name, email, company, designation, phone, ... }
 * @param {number} rowNum - 1-indexed row number for error messages
 * @returns {string[]}    - array of error messages
 */
export function validateCSVRow(row, rowNum) {
  const errors = [];
  const prefix = `Row ${rowNum}`;

  // Name — required
  const nameErr = V.name(row.name);
  if (nameErr) errors.push(`${prefix} (${row.name || "empty"}): ${nameErr}`);

  // Email — optional but must be valid if provided
  const emailErr = V.emailOptional(row.email);
  if (emailErr) errors.push(`${prefix}: ${emailErr}`);

  // Company — required
  const companyErr = V.companyName(row.company);
  if (companyErr) errors.push(`${prefix}: ${companyErr}`);

  // Designation — optional
  const designationErr = V.designation(row.designation);
  if (designationErr) errors.push(`${prefix}: ${designationErr}`);

  // Phone — optional
  const phoneErr = V.phone(row.phone);
  if (phoneErr) errors.push(`${prefix}: ${phoneErr}`);

  return errors;
}


// ── React hook for real-time field validation ─────────────────────────────────

/**
 * useFieldValidation — hook for real-time validation with touch tracking.
 *
 * Usage:
 *   const { errors, touched, touch, validateAll } = useFieldValidation(
 *     { name: "John", email: "" },
 *     { name: V.name, email: V.email }
 *   )
 *
 *   // In JSX:
 *   <input onBlur={() => touch("email")} ... />
 *   {touched.email && errors.email && <p style={{color:"red"}}>{errors.email}</p>}
 */
export function useFieldValidation(values, rules) {
  const [touched, setTouched] = window.React
    ? window.React.useState({})
    : { useState: () => [{}, () => {}] }.useState();

  const errors = validateForm(values, rules);

  const touch = (field) => setTouched(p => ({ ...p, [field]: true }));
  const touchAll = () => {
    const all = {};
    Object.keys(rules).forEach(k => { all[k] = true; });
    setTouched(all);
  };
  const validateAll = () => {
    touchAll();
    return Object.keys(errors).length === 0;
  };

  return { errors, touched, touch, validateAll, isValid: Object.keys(errors).length === 0 };
}

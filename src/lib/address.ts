export interface ParsedAddress {
  type: string;       // "Home" | "Office" | "Other" | ""
  name: string;
  phone: string;
  addressLine: string;
  cityState: string;
  pincode: string;
  raw: string;
}

/**
 * Validates an Indian mobile number.
 * 10 digits, must start with 6, 7, 8, or 9.
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validates an Indian PIN code.
 * Exactly 6 digits.
 */
export function validatePincode(pincode: string): boolean {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pincode.trim());
}

/**
 * Serializes structured address details into a unified formatted multi-line string.
 * This format is easy to read, display with pre-wrap, and parse back.
 */
export function formatAddress(data: {
  type: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}): string {
  const parts: string[] = [];
  if (data.type) parts.push(`[${data.type.trim()}]`);
  if (data.name) parts.push(`Name: ${data.name.trim()}`);
  if (data.phone) parts.push(`Phone: ${data.phone.trim()}`);
  parts.push(data.addressLine.trim());
  parts.push(`${data.city.trim()}, ${data.state.trim()}`);
  parts.push(`Pincode: ${data.pincode.trim()}`);
  return parts.join("\n");
}

/**
 * Parses a serialized address string back into structured fields.
 * Safe fallback for legacy unstructured strings is included.
 */
export function parseAddressString(addressStr: string): ParsedAddress {
  const result: ParsedAddress = {
    type: "",
    name: "",
    phone: "",
    addressLine: "",
    cityState: "",
    pincode: "",
    raw: addressStr || "",
  };

  if (!addressStr) return result;

  const lines = addressStr.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Match Type (Home, Office, Other) in brackets
  const typeMatch = addressStr.match(/^\[(Home|Office|Other)\]/i) || addressStr.match(/\[(Home|Office|Other)\]/i);
  if (typeMatch) {
    result.type = typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1).toLowerCase();
  }

  // 2. Identify explicit structured lines
  for (const line of lines) {
    if (/^name:\s*/i.test(line)) {
      result.name = line.replace(/^name:\s*/i, "").trim();
    } else if (/^phone:\s*/i.test(line)) {
      result.phone = line.replace(/^phone:\s*/i, "").trim();
    } else if (/^(pincode|pin):\s*/i.test(line)) {
      result.pincode = line.replace(/^(pincode|pin):\s*/i, "").trim();
    }
  }

  // 3. Fallback for pincode: look for any 6 consecutive digits in the raw string
  if (!result.pincode) {
    const pinMatch = addressStr.match(/\b\d{6}\b/);
    if (pinMatch) {
      result.pincode = pinMatch[0];
    }
  }

  // 4. Extract remaining address text (excluding lines containing Type brackets or Name/Phone/Pincode keys)
  const remainingLines = lines.filter((line) => {
    if (line.startsWith("[") && line.endsWith("]")) return false;
    if (/^(name|phone|pincode|pin):\s*/i.test(line)) return false;
    return true;
  });

  if (remainingLines.length > 0) {
    if (remainingLines.length === 1) {
      result.addressLine = remainingLines[0];
    } else {
      // The last line before pincode/structured keys is usually City, State
      result.cityState = remainingLines[remainingLines.length - 1];
      result.addressLine = remainingLines.slice(0, -1).join(", ");
    }
  }

  return result;
}

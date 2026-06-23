/**
 * IP Address and CIDR validation utilities
 */

/**
 * Validates a single IPv4 address
 * @param ip - IP address to validate
 * @returns true if valid IPv4
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validates a CIDR notation (e.g., 192.168.1.0/24)
 * @param cidr - CIDR notation to validate
 * @returns true if valid CIDR
 */
export function isValidCIDR(cidr: string): boolean {
  const parts = cidr.split("/");
  if (parts.length !== 2) return false;

  const [ip, mask] = parts;
  const maskNum = parseInt(mask, 10);

  if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;
  return isValidIPv4(ip);
}

/**
 * Validates an IP address or CIDR notation
 * @param input - IP address or CIDR notation
 * @returns object with isValid boolean and type ("ipv4" | "cidr" | "invalid")
 */
export function validateIPInput(
  input: string
): {
  isValid: boolean;
  type: "ipv4" | "cidr" | "invalid";
  error?: string;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, type: "invalid", error: "IP address cannot be empty" };
  }

  if (isValidIPv4(trimmed)) {
    return { isValid: true, type: "ipv4" };
  }

  if (isValidCIDR(trimmed)) {
    return { isValid: true, type: "cidr" };
  }

  return {
    isValid: false,
    type: "invalid",
    error: "Invalid IP address or CIDR notation (e.g., 192.168.1.1 or 192.168.1.0/24)",
  };
}

/**
 * Validates a list of IPs or CIDR notations
 * @param ips - Array of IP addresses or CIDR notations
 * @returns object with validation results
 */
export function validateIPList(ips: string[]): {
  valid: string[];
  invalid: { ip: string; error: string }[];
} {
  const valid: string[] = [];
  const invalid: { ip: string; error: string }[] = [];

  for (const ip of ips) {
    const result = validateIPInput(ip);
    if (result.isValid) {
      valid.push(ip.trim());
    } else {
      invalid.push({
        ip: ip.trim(),
        error: result.error || "Invalid IP address",
      });
    }
  }

  return { valid, invalid };
}

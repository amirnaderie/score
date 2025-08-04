export const handleInput = (e: any, maxLength: number) => {
  const inputValue = e.target.value;
  // Only allow digits
  // const sanitizedValue = inputValue.replace(/[^0-9\b\x7f\r\x03\x16]/g, "");
  // return sanitizedValue;
  if (inputValue.length > maxLength)
    e.target.value = inputValue.slice(0, maxLength);
};

export const generateToken = (length: number): string => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const validateIranianNationalCode = (nationalCode: number) => {
  // Check if input is provided
  if (!nationalCode) {
    return false;
  }

  // Convert to string and remove any spaces or dashes
  const code = nationalCode.toString().replace(/[\s-]/g, "").padStart(10, "0");

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(code)) {
    return false;
  }

  // Check for invalid patterns (all same digits)
  const invalidCodes = [
    "0000000000",
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
    "5555555555",
    "6666666666",
    "7777777777",
    "8888888888",
    "9999999999",
  ];

  if (invalidCodes.includes(code)) {
    return false;
  }

  // Calculate checksum using the standard algorithm
  const digits = code.split("").map(Number);
  let sum = 0;

  // Calculate weighted sum of first 9 digits
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = digits[9];

  // Validation rules based on remainder
  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
};

// Format number with thousands separator
export const formatNumber = (value: string) => {
  if (!value) return "";
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const hasAccess = (roles: string[], requiredRoles: string[]) => {
  return roles.some((role) => requiredRoles.includes(role));
};

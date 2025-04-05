import bcrypt from 'bcryptjs';

/**
 * Hashes a plain text password
 * @param password The plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password
 * @param plainPassword The plain text password to check
 * @param hashedPassword The hashed password to compare against
 * @returns Promise resolving to boolean indicating whether passwords match
 */
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
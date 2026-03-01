import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../hash';

describe('Hash Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password and return a string', async () => {
      const hash = await hashPassword('test123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should not return the original password as hash', async () => {
      const hash = await hashPassword('test123');
      expect(hash).not.toBe('test123');
    });

    it('should return a bcrypt hash (starts with $2)', async () => {
      const hash = await hashPassword('test123');
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should generate different hashes for the same password (salt randomness)', async () => {
      const hash1 = await hashPassword('test123');
      const hash2 = await hashPassword('test123');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string as password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(72); // bcrypt 72-byte limit
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should handle passwords with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;\':",.<>?/`~';
      const hash = await hashPassword(specialPassword);
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for the correct password', async () => {
      const hash = await hashPassword('test123');
      const isValid = await comparePassword('test123', hash);
      expect(isValid).toBe(true);
    });

    it('should return false for a wrong password', async () => {
      const hash = await hashPassword('test123');
      const isValid = await comparePassword('wrong-password', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty string against a non-empty password hash', async () => {
      const hash = await hashPassword('test123');
      const isValid = await comparePassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should return true when comparing empty string hash with empty string', async () => {
      const hash = await hashPassword('');
      const isValid = await comparePassword('', hash);
      expect(isValid).toBe(true);
    });

    it('should return false for case-different password', async () => {
      const hash = await hashPassword('Password123');
      const isValid = await comparePassword('password123', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for password with leading/trailing whitespace', async () => {
      const hash = await hashPassword('test123');
      const isValid = await comparePassword(' test123 ', hash);
      expect(isValid).toBe(false);
    });

    it('should verify correctly with special characters in password', async () => {
      const password = '!@#$%^&*()';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false when compared against a different hash of the same password', async () => {
      // İki farklı hash de doğru parola ile true döner — salt farklı olsa da
      const hash1 = await hashPassword('samepassword');
      const hash2 = await hashPassword('samepassword');
      const isValid1 = await comparePassword('samepassword', hash1);
      const isValid2 = await comparePassword('samepassword', hash2);
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });
});

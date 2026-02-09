import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateRitual, validateGoal } from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password with 6+ characters', () => {
      expect(validatePassword('password123').valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('validateRitual', () => {
    it('should validate correct ritual', () => {
      const result = validateRitual({
        title: 'Test Ritual',
        description: 'Test description',
        difficulty: 'novice',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject ritual without title', () => {
      const result = validateRitual({
        title: '',
        description: 'Test',
        difficulty: 'novice',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGoal', () => {
    it('should validate correct goal', () => {
      const result = validateGoal('Learn to code');
      expect(result.valid).toBe(true);
    });

    it('should reject empty goal', () => {
      const result = validateGoal('');
      expect(result.valid).toBe(false);
    });
  });
});

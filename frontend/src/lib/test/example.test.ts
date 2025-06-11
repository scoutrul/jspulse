import { describe, it, expect, vi } from 'vitest';

describe('Testing Infrastructure', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to vitest globals', () => {
    expect(vi).toBeDefined();
  });

  it('should have jsdom environment', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });
}); 
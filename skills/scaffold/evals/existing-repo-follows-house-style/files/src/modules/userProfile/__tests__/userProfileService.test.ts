import { describe, expect, it } from 'vitest';
import { UserProfileService } from '../userProfileService';

describe('UserProfileService', () => {
  it('returns a saved record', () => {
    const service = new UserProfileService();
    const record = { id: '1', userId: 'u1', updatedAt: new Date() };
    service.save(record);
    expect(service.get('1')).toEqual(record);
  });
});

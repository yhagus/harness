import { describe, expect, it } from 'vitest';
import { OrderHistoryService } from '../orderHistoryService';

describe('OrderHistoryService', () => {
  it('returns a saved record', () => {
    const service = new OrderHistoryService();
    const record = { id: '1', userId: 'u1', updatedAt: new Date() };
    service.save(record);
    expect(service.get('1')).toEqual(record);
  });
});

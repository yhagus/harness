import type { OrderHistoryRecord } from './orderHistoryTypes';

export class OrderHistoryService {
  private records = new Map<string, OrderHistoryRecord>();

  get(id: string): OrderHistoryRecord | undefined {
    return this.records.get(id);
  }

  save(record: OrderHistoryRecord): void {
    this.records.set(record.id, record);
  }
}

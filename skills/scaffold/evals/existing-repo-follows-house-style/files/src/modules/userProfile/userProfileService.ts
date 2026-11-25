import type { UserProfileRecord } from './userProfileTypes';

export class UserProfileService {
  private records = new Map<string, UserProfileRecord>();

  get(id: string): UserProfileRecord | undefined {
    return this.records.get(id);
  }

  save(record: UserProfileRecord): void {
    this.records.set(record.id, record);
  }
}

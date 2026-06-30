import Dexie, { Table } from 'dexie';

export interface OfflineEvent {
  id?: number;
  qrToken: string;
  gateId: string;
  type: 'check_in' | 'check_out';
  checkInTime: string;
  offlineClientId: string;
  synced: boolean;
}

export interface GateCache {
  id: string;
  syncedAt: string;
  data: unknown;
}

class GateDatabase extends Dexie {
  offlineQueue!: Table<OfflineEvent>;
  cache!: Table<GateCache>;

  constructor() {
    super('IIMLVMSGate');
    this.version(1).stores({
      offlineQueue: '++id, synced',
      cache: 'id',
    });
  }
}

export const db = new GateDatabase();

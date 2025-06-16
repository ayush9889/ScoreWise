import { Match, Player } from '../types/cricket';

const DB_NAME = 'CricketScorerDB';
const DB_VERSION = 1;

class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create players store
        if (!db.objectStoreNames.contains('players')) {
          const playersStore = db.createObjectStore('players', { keyPath: 'id' });
          playersStore.createIndex('name', 'name', { unique: false });
        }

        // Create matches store
        if (!db.objectStoreNames.contains('matches')) {
          const matchesStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchesStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async savePlayer(player: Player): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readwrite');
      const store = transaction.objectStore('players');
      const request = store.put(player);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPlayer(id: string): Promise<Player | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readonly');
      const store = transaction.objectStore('players');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllPlayers(): Promise<Player[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readonly');
      const store = transaction.objectStore('players');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async saveMatch(match: Match): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['matches'], 'readwrite');
      const store = transaction.objectStore('matches');
      const request = store.put(match);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMatch(id: string): Promise<Match | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['matches'], 'readonly');
      const store = transaction.objectStore('matches');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllMatches(): Promise<Match[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['matches'], 'readonly');
      const store = transaction.objectStore('matches');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async exportData(): Promise<string> {
    const players = await this.getAllPlayers();
    const matches = await this.getAllMatches();
    
    return JSON.stringify({
      players,
      matches,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.players) {
        for (const player of data.players) {
          await this.savePlayer(player);
        }
      }
      
      if (data.matches) {
        for (const match of data.matches) {
          await this.saveMatch(match);
        }
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }
}

export const storageService = new StorageService();
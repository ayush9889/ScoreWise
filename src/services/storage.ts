import { Match, Player } from '../types/cricket';
import { User, Group, Invitation } from '../types/auth';

const DB_NAME = 'CricketScorerDB';
const DB_VERSION = 2;

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
          playersStore.createIndex('isGroupMember', 'isGroupMember', { unique: false });
        }

        // Create matches store
        if (!db.objectStoreNames.contains('matches')) {
          const matchesStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchesStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
        }

        // Create groups store
        if (!db.objectStoreNames.contains('groups')) {
          const groupsStore = db.createObjectStore('groups', { keyPath: 'id' });
          groupsStore.createIndex('inviteCode', 'inviteCode', { unique: true });
          groupsStore.createIndex('createdBy', 'createdBy', { unique: false });
        }

        // Create invitations store
        if (!db.objectStoreNames.contains('invitations')) {
          const invitationsStore = db.createObjectStore('invitations', { keyPath: 'id' });
          invitationsStore.createIndex('groupId', 'groupId', { unique: false });
          invitationsStore.createIndex('invitedEmail', 'invitedEmail', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Player methods
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

  async searchPlayers(query: string): Promise<Player[]> {
    const allPlayers = await this.getAllPlayers();
    return allPlayers.filter(player => 
      player.name.toLowerCase().includes(query.toLowerCase()) ||
      (player.shortId && player.shortId.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Match methods
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

  // User methods
  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Group methods
  async saveGroup(group: Group): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readwrite');
      const store = transaction.objectStore('groups');
      const request = store.put(group);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getGroup(id: string): Promise<Group | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readonly');
      const store = transaction.objectStore('groups');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readonly');
      const store = transaction.objectStore('groups');
      const index = store.index('inviteCode');
      const request = index.get(inviteCode);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Invitation methods
  async saveInvitation(invitation: Invitation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['invitations'], 'readwrite');
      const store = transaction.objectStore('invitations');
      const request = store.put(invitation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getInvitation(id: string): Promise<Invitation | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['invitations'], 'readonly');
      const store = transaction.objectStore('invitations');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Export/Import methods
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
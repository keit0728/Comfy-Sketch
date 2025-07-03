import { DrawingData, StorageData } from "./types";

const DB_NAME = "ComfySketch";
const DB_VERSION = 1;
const STORE_NAME = "drawings";
const DATA_KEY = "currentDrawing";

export class DrawingStorage {
  private db: IDBDatabase | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async save(data: DrawingData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const storageData: StorageData = {
        ...data,
        timestamp: Date.now(),
      };

      const request = store.put(storageData, DATA_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(): Promise<DrawingData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DATA_KEY);

      request.onsuccess = () => {
        const data = request.result as StorageData | undefined;
        if (data) {
          // Extract only the drawing data, excluding toolSettings
          const drawingData: DrawingData = {
            lines: data.lines,
            layers: data.layers,
            currentLayerId: data.currentLayerId,
            version: data.version,
            timestamp: data.timestamp,
          };
          resolve(drawingData);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(DATA_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  setupAutoSave(callback: () => DrawingData, interval: number): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        const data = callback();
        await this.save(data);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, interval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

export const drawingStorage = new DrawingStorage();

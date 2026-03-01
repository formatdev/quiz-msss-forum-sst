import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getEnv } from '../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }
  const env = getEnv();
  const resolvedPath = path.resolve(env.DB_PATH);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  dbInstance = new DatabaseSync(resolvedPath);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  return dbInstance;
}

export function resetDbForTests(): void {
  if (dbInstance && typeof (dbInstance as unknown as { close?: () => void }).close === 'function') {
    (dbInstance as unknown as { close: () => void }).close();
  }
  dbInstance = null;
}

import { MongoClient } from 'mongodb';

let cached = global._amayaMongo;
if (!cached) {
  cached = global._amayaMongo = { client: null, promise: null };
}

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  if (!cached.client) {
    if (!cached.promise) {
      cached.promise = new MongoClient(uri).connect();
    }
    cached.client = await cached.promise;
  }
  return cached.client.db(process.env.MONGODB_DB || 'amaya');
}

export async function getRegistrations() {
  const db = await getDb();
  return db.collection('registrations');
}

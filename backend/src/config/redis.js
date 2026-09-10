// Simple in-memory substitute for Redis (refresh tokens + rate state)
const store = new Map();
const expires = new Map();

module.exports = {
  set(key, value, ttlSeconds) {
    store.set(key, value);
    if (ttlSeconds) expires.set(key, Date.now() + ttlSeconds * 1000);
  },
  get(key) {
    const exp = expires.get(key);
    if (exp && exp < Date.now()) { store.delete(key); expires.delete(key); return null; }
    return store.get(key) || null;
  },
  del(key) { store.delete(key); expires.delete(key); }
};

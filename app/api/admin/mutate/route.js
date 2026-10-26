// Re-export unified RESTful route handlers (POST, PATCH, DELETE, GET) for admin record mutations.
// Supports both REST verbs and legacy { action: 'insert' | 'update' | 'delete' } POST envelopes.
export { POST, PATCH, DELETE, GET } from '../records/route.js';

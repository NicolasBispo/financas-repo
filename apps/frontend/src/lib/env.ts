// Base URL of the Rails API. Override with VITE_API_BASE_URL in a .env file.
// The backend serves everything under /api/v1.
// Empty VITE_API_BASE_URL uses same-origin relative paths (VPS behind nginx /api).
const rawBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export const API_BASE_URL = rawBase.replace(/\/$/, '')
export const API_V1_URL = API_BASE_URL ? `${API_BASE_URL}/api/v1` : '/api/v1'

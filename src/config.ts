export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
export const IS_DOCKER = !!import.meta.env.VITE_API_URL || import.meta.env.PROD;

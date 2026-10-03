import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

// Base URLs default to the public demo apps so UI-only runs work without a .env file.
// Credentials are read through getters, so they are validated only when an API test uses them.
export const env = {
  uiBaseURL: process.env.UI_BASE_URL || 'https://freelance-learn-automation.vercel.app',
  apiBaseURL: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',
  get apiAdminUsername() {
    return required('API_ADMIN_USERNAME');
  },
  get apiAdminPassword() {
    return required('API_ADMIN_PASSWORD');
  },
};

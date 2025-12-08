export interface User {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export type Variables = {
  user: User;
};

export type Bindings = {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  PORT: string;
  NODE_ENV: string;
};

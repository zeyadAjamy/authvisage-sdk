import { AuthVisageClient, type User } from "authvisage-sdk";

const client = new AuthVisageClient({
  projectId: "03296b21-5185-49d3-9d9e-dd2caa717f67",
  backendUrl: "http://localhost:9000/api/v1",
  platformUrl: "http://localhost:3000",
  redirectUrl: "http://localhost:5173",
});

export const signInWithFaceAuth = async () => {
  await client.faceLogin();
};

export const signOut = async () => {
  await client.auth.logout();
};

export const getAccessToken = async () => {
  const token = await client.auth.getAccessToken();
  return token;
};

export const authStateObserver = (callback: (user: User | null) => void) => {
  return client.auth.onAuthStateChange((user) => {
    callback(user);
  });
};

import { AuthVisageClient, User } from "authvisage-sdk";

export const authVisage = new AuthVisageClient({
  projectId: "90771601-6481-4083-9bf3-2d99fffc54de",
  backendUrl: "http://localhost:8000/api/v1/",
  platformUrl: "http://localhost:3000",
  redirectUrl: "http://localhost:8080",
});

export const getAccessToken = async () => {
  const accessToken = await authVisage.auth.getAccessToken();
  if (!accessToken) {
    throw new Error("No access token found");
  }
  return accessToken;
};

export const logout = async () => {
  await authVisage.auth.logout();
};

export const onAuthStateChange = (callback: (state: User | null) => void) => {
  return authVisage.auth.onAuthStateChange((user) => {
    callback(user);
  });
};

export const faceLogin = async () => {
  try {
    await authVisage.faceLogin();
  } catch (error) {
    console.error("Face login failed:", error);
    throw error;
  }
};

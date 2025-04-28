# AuthVisageClient SDK Documentation

## Overview

The AuthVisageClient SDK simplifies the integration of face authentication into your applications. It provides tools for token management, PKCE handling, OAuth state management, and authentication state change notifications.

## Features

- **Face Login**: Redirect users to the AuthVisage platform for face authentication.
- **Token Management**: Handles token refresh and expiration.
- **PKCE Support**: Includes Proof Key for Code Exchange (PKCE) utilities.
- **OAuth State Management**: Ensures secure state validation during the OAuth flow.
- **Authentication State Notifications**: Subscribe to auth state changes and react to user updates.

## Installation

Install the SDK via npm:

```bash
npm install authvisage-sdk
```

## Configuration

The SDK requires the following configuration options:

| Option          | Type   | Description                              |
| --------------- | ------ | ---------------------------------------- |
| `platformUrl` | string | The base URL of the AuthVisage platform. |
| `projectId`   | string | Your project ID.                         |
| `backendUrl`  | string | The URL of your backend server.          |
| `redirectUrl` | string | The URL to redirect to after login.      |

### Example Configuration

```typescript
import { AuthVisageClient } from "authvisage-sdk";

const client = new AuthVisageClient({
  platformUrl: "https://authvisage.com",
  projectId: "your-project-id",
  backendUrl: "https://your-backend.com",
  redirectUrl: "https://your-app.com/callback",
});
```

## API Reference

### `faceLogin()`

Redirects the user to the AuthVisage platform for face authentication.

```typescript
await client.faceLogin();
```

### `client.auth.getAccessToken()`

Fetches a new access token using the refresh token stored in cookies.

```typescript
const accessToken = await client.auth.getAccessToken();
```

### `client.auth.logout()`

Logs the user out and clears the session.

```typescript
await client.auth.logout();
```

### `client.auth.onAuthStateChange(callback)`

Subscribes to authentication state changes. The callback receives the user object or `null` if the user is logged out.

```typescript
const unsubscribe = client.auth.onAuthStateChange((user) => {
  if (user) {
    console.log("User logged in:", user);
  } else {
    console.log("User logged out");
  }
});

// To unsubscribe
unsubscribe();
```

## Token Management

The SDK automatically handles token expiration and refresh. It uses the `TokenManager` class to:

- Refresh tokens when they expire.
- Notify subscribers about user updates or expiration.

### Example

```typescript
const accessToken = await client.auth.getAccessToken();
console.log("Access Token:", accessToken);

const unsubscribe = client.auth.onAuthStateChange((user) => {
  if (user) {
    console.log("User logged in:", user);
  } else {
    console.log("User logged out");
  }
});

// Unsubscribe when no longer needed
unsubscribe();
```

## PKCE Handling

The SDK includes a `PKCEHandler` class to manage PKCE challenges. It:

- Generates a code verifier and challenge.
- Stores the code verifier securely in local storage.

### Example

```typescript
const pkcePair = await PKCEHandler.generate();
console.log("Code Verifier:", pkcePair.codeVerifier);
console.log("Code Challenge:", pkcePair.codeChallenge);
```

## OAuth State Management

The `OAuthStateHandler` class ensures secure state validation during the OAuth flow. It:

- Generates a unique state value.
- Validates the returned state against the stored one.

### Example

```typescript
const state = OAuthStateHandler.generate();
console.log("Generated State:", state);

const isValid = OAuthStateHandler.validate(returnedState);
console.log("State is valid:", isValid);
```

## Error Handling

All methods throw errors if something goes wrong. Use `try-catch` blocks to handle errors gracefully.

### Example

```typescript
try {
  const accessToken = await client.auth.getAccessToken();
  console.log("Access Token:", accessToken);
} catch (error) {
  console.error("Error fetching access token:", error);
}
```

## Example Usage

```typescript
import { AuthVisageClient } from "authvisage-sdk";

const client = new AuthVisageClient({
  platformUrl: "https://authvisage.com",
  projectId: "your-project-id",
  backendUrl: "https://your-backend.com",
  redirectUrl: "https://your-app.com/callback",
});

// Login
await client.faceLogin();

// Get Access Token
const accessToken = await client.auth.getAccessToken();
console.log("Access Token:", accessToken);

// Subscribe to Auth State Changes
const unsubscribe = client.auth.onAuthStateChange((user) => {
  if (user) {
    console.log("User logged in:", user);
  } else {
    console.log("User logged out");
  }
});

// Logout
await client.auth.logout();

// Unsubscribe from Auth State Changes
unsubscribe();
```

## License

MIT License

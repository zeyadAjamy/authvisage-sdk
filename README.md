# AuthVisageClient SDK Documentation

[![codecov](https://codecov.io/gh/zeyadAjamy/authvisage-sdk/graph/badge.svg?token=V7R70ZTF4F)](https://codecov.io/gh/zeyadAjamy/authvisage-sdk)

## Overview

The `AuthVisageClient` is a custom authentication client built for OAuth and PKCE-based authentication. It integrates with AuthVisage's platform for secure face authentication.

## Installation

Install the AuthVisage SDK:

```sh
npm install authvisage-sdk
```

Import the client into your application:

```ts
import { AuthVisageClient } from "authvisage-sdk";
```

## Configuration Options

The `AuthVisageClient` requires the following configuration options:

| Option          | Type       | Description                                    |
| --------------- | ---------- | ---------------------------------------------- |
| `platformUrl` | `string` | The URL of the AuthVisage platform.            |
| `backendUrl`  | `string` | The backend service URL for token exchange.    |
| `projectId`   | `string` | The unique identifier for the project.         |
| `redirectUrl` | `string` | The redirect URI for handling OAuth callbacks. |

## Initialization

Create an instance of `AuthVisageClient` with the necessary options:

```ts
const authClient = new AuthVisageClient({
  platformUrl: "https://platform.authvisage.com",
  backendUrl: "https://api.authvisage.com",
  projectId: "your-project-id",
  redirectUrl: "https://yourapp.com/callback",
});
```

## Methods

### `faceLogin(): Promise<void>`

Initiates the face login process by redirecting the user to the AuthVisage authorization endpoint.

```ts
await authClient.faceLogin();
```

### `_constructAuthUrl(): Promise<string>` (Private)

Generates the OAuth authorization URL with PKCE and state parameters.

### `_handleOAuthCallback(): Promise<string | void>` (Private)

Handles the OAuth callback, validates the state, and exchanges the authorization code for an access token.

## Token Handling

The client expects the token exchange response to follow the `TokenResponse` interface:

```ts
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}
```

If a refresh token is provided, the session is updated in `GoTrueClient`.

## Error Handling

- If state validation fails, an error is thrown (`State validation failed! Possible CSRF attack.`).
- If the token exchange request fails, an error with the response status text is thrown.
- If the token response does not contain an access token, an error is raised.
- If `faceLogin()` fails to generate the authentication URL, an error is thrown.

## Example Usage

```ts
try {
  await authClient.faceLogin();
} catch (error) {
  console.error("Login error:", error);
}
```

## Limitations

- The client SDK only supports OAuth-based authentication with PKCE.
- Direct authentication methods such as email/password sign-in are not available.
- Users must be redirected to the AuthVisage platform for authentication.
- The SDK is designed specifically for face authentication workflows and does not support other login methods.

## License

This project is licensed under the MIT License.

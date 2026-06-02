/**
 * GitHub OAuth helper functions.
 *
 * exchangeCodeForToken — swap the one-time authorization code for an access token
 * fetchGitHubProfile   — retrieve the authenticated user's GitHub profile
 */

export interface GitHubProfile {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

/**
 * Exchange the authorization code (received on the callback) for a GitHub
 * access token using the server-to-server token endpoint.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not configured');
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`GitHub token exchange error: ${data.error_description ?? data.error}`);
  }

  return data.access_token as string;
}

/**
 * Fetch the authenticated user's GitHub profile using the access token.
 */
export async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub profile fetch failed: ${res.status}`);
  }

  return (await res.json()) as GitHubProfile;
}

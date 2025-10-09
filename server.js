const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

function buildBasicAuthHeader() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

function resolveRedirectUri(requestedRedirect) {
  const redirect = requestedRedirect || process.env.SPOTIFY_REDIRECT_URI;
  if (!redirect) {
    throw new Error('Missing redirect URI. Provide ?redirect_uri=… or set SPOTIFY_REDIRECT_URI.');
  }
  return redirect;
}

app.get('/api/spotify/login', (req, res) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: 'SPOTIFY_CLIENT_ID is not configured on the server.' });
      return;
    }

    const redirectUri = resolveRedirectUri(req.query.redirect_uri);
    const scope = req.query.scope || 'user-read-email playlist-read-private';
    const state = crypto.randomBytes(16).toString('hex');

    const authorizeUrl = new URL(SPOTIFY_AUTH_URL);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', scope);
    authorizeUrl.searchParams.set('state', state);

    res.json({ url: authorizeUrl.toString(), state });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/spotify/callback', async (req, res) => {
  try {
    const { code, redirect_uri: redirectOverride } = req.query;
    if (!code) {
      res.status(400).json({ error: 'Missing "code" query parameter from Spotify callback.' });
      return;
    }

    const redirectUri = resolveRedirectUri(redirectOverride);
    const authHeader = buildBasicAuthHeader();

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: body.toString(),
    });

    const payload = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: payload.error_description || payload.error || 'Spotify token exchange failed.' });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      scope: payload.scope,
      expiresIn: payload.expires_in,
      tokenType: payload.token_type,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/spotify/refresh', async (req, res) => {
  try {
    const refreshToken = req.query.refresh_token;
    if (!refreshToken) {
      res.status(400).json({ error: 'Missing "refresh_token" query parameter.' });
      return;
    }

    const authHeader = buildBasicAuthHeader();

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: body.toString(),
    });

    const payload = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: payload.error_description || payload.error || 'Spotify refresh failed.' });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token || refreshToken,
      scope: payload.scope,
      expiresIn: payload.expires_in,
      tokenType: payload.token_type,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Brand Vision Studio API listening on port ${PORT}`);
});

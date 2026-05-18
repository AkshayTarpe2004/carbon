# OAuth2 Login Setup (Google & GitHub)

**IMPORTANT**: Both Google and GitHub must have their callback/redirect URI set to the **BACKEND** URL (`http://localhost:8080/login/oauth2/code/{provider}`), NOT the frontend URL.

---

## Quick Setup

1. **Create `application-local.properties`** in the `backend` folder:
   ```bash
   copy application-local.properties.example application-local.properties
   ```

2. **Configure Google** (same steps as GitHub):
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - **Authorized redirect URI**: `http://localhost:8080/login/oauth2/code/google`
   - Copy Client ID and Client Secret to `application-local.properties`

3. **Configure GitHub** (mirror of Google):
   - Go to https://github.com/settings/developers → OAuth Apps → New OAuth App
   - **Authorization callback URL**: `http://localhost:8080/login/oauth2/code/github` ⚠️ **Must be backend URL, not frontend**
   - Copy Client ID, generate Client Secret, add both to `application-local.properties`

4. **Restart backend** after saving `application-local.properties`

---

## Detailed Steps

### Google OAuth Setup

1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. Select project → **Create credentials** → **OAuth client ID**
3. Configure OAuth consent screen (if first time):
   - User type: **External**
   - App name: `CarbonCalc`
   - User support email: your email
   - Add your email as a test user (for localhost testing)
4. Create OAuth client:
   - Application type: **Web application**
   - Name: `CarbonCalc Local`
   - **Authorized redirect URIs**: Add `http://localhost:8080/login/oauth2/code/google`
5. Copy **Client ID** and **Client Secret**

### GitHub OAuth Setup

1. **GitHub**: https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill form:
   - **Application name**: `CarbonCalc Local`
   - **Homepage URL**: `http://localhost:3000` (frontend)
   - **Authorization callback URL**: `http://localhost:8080/login/oauth2/code/github` ⚠️ **CRITICAL: Must be backend (8080), not frontend (3000)**
3. Click **Register application**
4. Copy **Client ID**
5. Click **Generate a new client secret** → copy the secret

### Update `application-local.properties`

```properties
# Google
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET_HERE

# GitHub
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_CLIENT_ID_HERE
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_CLIENT_SECRET_HERE
```

---

## Verification Checklist

| Item | Google | GitHub |
|------|--------|--------|
| ✅ Redirect/Callback URL in provider console | `http://localhost:8080/login/oauth2/code/google` | `http://localhost:8080/login/oauth2/code/github` |
| ✅ Credentials in `backend/application-local.properties` | ✅ Set | ✅ Set |
| ✅ Backend running on port 8080 | ✅ | ✅ |
| ✅ Frontend running on port 3000 | ✅ | ✅ |

---

## Expected Flow (Both Google & GitHub)

1. User clicks **"Login with Google"** or **"Login with GitHub"**
2. Browser redirects to backend: `http://localhost:8080/oauth2/authorization/{provider}`
3. Backend redirects to provider (Google/GitHub) with `prompt=select_account`
4. **User sees provider's page** (account chooser for Google, authorize screen for GitHub)
5. User selects account / authorizes app
6. Provider redirects back to backend: `http://localhost:8080/login/oauth2/code/{provider}?code=...`
7. Backend exchanges code for token, creates/updates user, generates JWT
8. Backend redirects to frontend: `http://localhost:3000/oauth2/redirect?token=...`
9. Frontend shows "Signing you in…" (1 second), then redirects to dashboard

---

## Troubleshooting

### GitHub goes directly to dashboard (no GitHub screen)

**Cause**: GitHub OAuth App callback URL is wrong (likely set to frontend `http://localhost:3000/...` instead of backend `http://localhost:8080/...`)

**Fix**:
1. Go to https://github.com/settings/developers → Your OAuth App
2. Edit **Authorization callback URL** to: `http://localhost:8080/login/oauth2/code/github`
3. Save changes
4. Restart backend
5. Try again (use incognito/private window to clear cached authorization)

### GitHub shows error "redirect_uri_mismatch"

**Cause**: Callback URL in GitHub doesn't match what Spring Boot sends

**Fix**: Ensure GitHub OAuth App has exactly: `http://localhost:8080/login/oauth2/code/github` (no trailing slash, correct port 8080)

### Both providers work but GitHub doesn't show authorize screen

**Normal behavior**: If you're already logged into GitHub and the app is already authorized, GitHub redirects immediately. To see the screen:
- Use a private/incognito window
- Or revoke app authorization: https://github.com/settings/applications → Authorized OAuth Apps → Revoke

---

## Testing

1. Start backend: `cd backend && mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm start`
3. Open http://localhost:3000
4. Click **Login with Google** → Should see Google account picker
5. Click **Login with GitHub** → Should see GitHub authorize screen (or login if not logged in)

Both should behave the same: show provider screen → authorize → redirect to app → dashboard.

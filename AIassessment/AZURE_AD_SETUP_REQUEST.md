# Azure AD App Registration — Configuration Request

> **Date:** March 28, 2026  
> **Requesting Team:** SecOps AI / AI Hub Assessment  
> **Azure App Name:** secopsai dev devops

---

## Purpose

We are integrating Single Sign-On (SSO) into the **AI Hub Assessment** web application using Azure Active Directory via the **OAuth 2.0 / OpenID Connect** protocol. The following configuration changes are required on the existing Azure App Registration.

---

## App Registration Details

| Field | Value |
|---|---|
| Application (Client) ID | `cd6b814b-614a-408f-9ada-9e7b84ec5ff8` |
| Object ID | `51ca2dc3-9531-40d4-a84b-14439c087030` |
| Directory (Tenant) ID | `f35a6974-607f-47d4-82d7-ff31d7dc53a5` |
| Domain | `novartis.net` |
| Group | `AAD_DYN_NVS_521_1` |

---

## Action Items Required

### 1. Generate a Client Secret

- Navigate to **App registrations** → **secopsai dev devops**
- Go to **Certificates & secrets** → **Client secrets**
- Click **+ New client secret**
- Description: `AI Hub Assessment SSO`
- Expiry: **24 months** (recommended)
- Click **Add**
- **Copy the secret Value** (not the Secret ID) and share it securely with the development team

> ⚠️ The secret value is only visible immediately after creation. It cannot be retrieved later.

---

### 2. Register Redirect URIs

- Navigate to **App registrations** → **secopsai dev devops**
- Go to **Authentication** → **Platform configurations**
- Under **Web** platform, add the following **Redirect URIs**:

| Environment | Redirect URI |
|---|---|
| Local Development | `http://localhost:3000/api/auth/callback/azure-ad` |
| Production | `https://<production-domain>/api/auth/callback/azure-ad` |

> Replace `<production-domain>` with the actual production URL when available.

- Ensure **ID tokens** checkbox is enabled under **Implicit grant and hybrid flows**
- Click **Save**

---

### 3. Verify API Permissions

Ensure the following **Microsoft Graph** delegated permissions are granted:

| Permission | Type | Status Required |
|---|---|---|
| `openid` | Delegated | Granted |
| `profile` | Delegated | Granted |
| `email` | Delegated | Granted |
| `User.Read` | Delegated | Granted |

- Navigate to **API permissions**
- Confirm all four permissions above are listed and have **admin consent granted**
- If any are missing, click **+ Add a permission** → **Microsoft Graph** → **Delegated permissions** → select and add
- Click **Grant admin consent for Novartis**

---

### 4. Token Configuration (Optional but Recommended)

To include additional user claims in the ID token:

- Navigate to **Token configuration**
- Click **+ Add optional claim**
- Token type: **ID**
- Select the following claims:
  - `email`
  - `given_name`
  - `family_name`
  - `upn` (User Principal Name)
- Click **Add**

---

## Summary of Changes

| # | Action | Location in Azure Portal |
|---|---|---|
| 1 | Create new client secret | Certificates & secrets |
| 2 | Add redirect URIs | Authentication |
| 3 | Verify/grant API permissions | API permissions |
| 4 | Add optional token claims | Token configuration |

---

## Information to Return to Dev Team

After completing the above, please securely share:

1. **Client Secret Value** (the generated secret string)
2. **Confirmation** that redirect URIs have been added
3. **Confirmation** that API permissions have admin consent

---

## Contact

For questions about this request, contact the AI Hub Assessment development team.

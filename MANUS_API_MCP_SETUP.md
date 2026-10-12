# Private Manus API v2 MCP Bridge

## Endpoint

Use this HTTPS MCP URL in ChatGPT:

`https://mzansicourier-nsebzqbt.manus.space/api/mcp`

The endpoint is protected by bearer authentication. It uses **token-scoped tool sets** so the earlier Mzansi read-only bridge is not weakened:

| Authentication / scope | Tools exposed |
|---|---|
| `MCP_MANUS_TOKEN` | `create_manus_task`, `get_manus_task`, `get_manus_task_results`, `send_manus_followup` |
| `MCP_READ_ONLY_TOKEN` | The existing read-only Mzansi project and operations tools |
| OAuth `mzansi:project.read` | The full Mzansi project read-only tool set: manifest, file listing, file reading, source search, operational summary, active deliveries, and safety incidents |

Use `MCP_MANUS_TOKEN` when connecting this Manus API bridge to ChatGPT. Do not use or share the `MANUS_API_KEY` with ChatGPT.

## Upstream authentication

The server calls the official Manus API v2 at `https://api.manus.ai` and sends the personal API key only in the server-side `x-manus-api-key` header. The key is stored as the project secret `MANUS_API_KEY`. It is not included in client JavaScript, MCP responses, error messages, source control, or logs.

## Tools

`create_manus_task` creates a private asynchronous task. It accepts the task instruction, optional project ID, locale, interaction mode, visibility, agent profile, title, connector and skill IDs, and an optional structured-output schema.

`get_manus_task` retrieves task status and metadata through the official `task.detail` endpoint.

`get_manus_task_results` retrieves task events and results through `task.listMessages`, including status updates, assistant messages, errors, pagination cursors, and optional structured output.

`send_manus_followup` sends a follow-up message through `task.sendMessage`. It accepts a task ID, message, optional agent profile, optional structured-output schema, and connector controls.

## ChatGPT connection

1. Open ChatGPT on the web and create a custom MCP connector/app in a workspace where developer mode and custom MCP apps are available.
2. Enter `https://mzansicourier-nsebzqbt.manus.space/api/mcp` as the remote MCP URL.
3. Select bearer-token authentication.
4. Enter the value of `MCP_MANUS_TOKEN` from the project’s secure secrets settings. Never enter `MANUS_API_KEY` into ChatGPT.
5. Scan the tools and confirm that the four Manus tools are shown.
6. Test with `get_manus_task` using a task ID you own, or create a small private task with `create_manus_task`.

Creating tasks and sending follow-ups can use Manus credits and can cause the Manus agent to take actions. Review prompts carefully before calling those tools. The bridge does not expose a confirmation tool; action confirmations requested by Manus remain visible in task status/results and should be handled deliberately.

## Validation

The official API credential check returned the expected `not_found` response for a synthetic task ID, proving the key was accepted without creating a task. TypeScript checking, production build, focused MCP tests, and the full test suite passed. OAuth tokens are issued only for an authenticated collaborator `openId` in the server-side allowlist.

## OAuth 2.1 ChatGPT linking

The bridge now supports MCP OAuth 2.1 with **PKCE S256** and verified collaborator sign-in. ChatGPT can discover the protected resource metadata at:

`https://mzansicourier-nsebzqbt.manus.space/.well-known/oauth-protected-resource`

The authorization-server metadata is published at:

`https://mzansicourier-nsebzqbt.manus.space/.well-known/oauth-authorization-server`

The flow supports durable dynamic client registration, authorization-code exchange, the `resource` parameter, issuer identification with `iss`, and public-client token exchange (`token_endpoint_auth_method: none`). Authorization requires the collaborator to sign in with their own Manus account. The server accepts the account only when its authenticated `openId` is present in the server-side approval record or emergency allowlist. Typed emails, owner-password sessions, and self-approval are not accepted. ChatGPT never receives `MANUS_API_KEY`.

The official Manus API currently exposes project listing but no collaborator-membership endpoint in the v2 schema. Therefore this bridge uses the server-side approval record, with the `MCP_COLLABORATOR_OPEN_IDS` project-secret allowlist retained as an emergency fallback. Do not enter an email address or an unverified ID.

### Collaborator approval sequence

1. The collaborator starts the ChatGPT connection and signs in through the normal Manus account flow.
2. The callback authenticates the account and obtains its `openId` from the verified Manus response. The collaborator cannot type an email or openId to self-authorize.
3. If the account is not already approved, the server stores a pending request and shows a waiting page. No MCP token is issued.
4. The project administrator opens **Admin Portal → ChatGPT Collaborators**, reviews the verified identity record, and approves or rejects the exact `openId`.
5. After approval, the collaborator repeats the ChatGPT connection. The server checks the approved record before issuing the PKCE token, and checks it again on every MCP request.

The scopes are intentionally narrow:

| Scope | Permitted tools |
|---|---|
| `manus:tasks.read` | `get_manus_task`, `get_manus_task_results` |
| `manus:tasks.write` | `create_manus_task`, `send_manus_followup` (requested together with read access) |
| `mzansi:project.read` | `project_manifest`, `list_project_files`, `read_project_file`, `search_project`, `operational_summary`, `active_deliveries`, `safety_incidents` |

Unauthenticated MCP calls receive HTTP 401 with a `WWW-Authenticate` challenge containing the protected-resource metadata URL and required scopes. Invalid tokens receive `error="invalid_token"`; valid tokens missing a required scope receive HTTP 403 with `error="insufficient_scope"`.

### Route preservation

The `/api/mcp` route still serves both integrations through separate authentication paths. An OAuth token with `mzansi:project.read` exposes only the seven Mzansi read-only tools; OAuth task scopes and `MCP_MANUS_TOKEN` expose the four Manus API tools; and the legacy `MCP_READ_ONLY_TOKEN` continues to expose the original Mzansi read-only project and operational tools. Therefore, the new collaborator OAuth path **did not replace** the Mzansi read-only MCP endpoint; it was added alongside it under the same URL with isolated token scopes.

### Official compatibility references

The implementation follows the [MCP Authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization), including RFC 9728 protected-resource metadata, RFC 8414 authorization-server metadata, OAuth 2.1 authorization code flow, resource indicators, issuer identification, and PKCE S256. ChatGPT-specific metadata and callback expectations were cross-checked against [OpenAI MCP authentication guidance](https://developers.openai.com/plugins/build/auth).

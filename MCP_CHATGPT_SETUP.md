# Mzansi Couriers — Read-only ChatGPT MCP

## Endpoint

The project exposes a remote MCP endpoint at:

`https://mzansicourier-nsebzqbt.manus.space/api/mcp`

The endpoint uses Streamable HTTP and requires a bearer token stored as the project secret `MCP_READ_ONLY_TOKEN`.

## Read-only tools

The MCP server exposes only these tools:

- `project_manifest` — project identity, versions, stack, and capabilities.
- `list_project_files` — readable source, schema, documentation, and configuration file names.
- `read_project_file` — read a text file inside the project.
- `search_project` — search readable project source and documentation.
- `operational_summary` — aggregate delivery and safety counts.
- `active_deliveries` — active in-transit delivery records with operational identifiers.
- `safety_incidents` — courier safety incident status records for operational review.

Every tool is marked read-only. No create, update, delete, assign, approve, payment, notification, or account-management tool is registered.

## Files and data deliberately excluded

The MCP cannot read secrets or credentials, including environment files, private keys, passwords, Paystack secrets, bank-account fields, or credential-bearing paths. It also excludes dependency folders and generated build output. Operational tools redact exact addresses, phone numbers, emergency numbers, GPS coordinates, parcel descriptions, proof media, bank data, and payment secrets.

These exclusions are intentional. They keep the MCP useful for project maintenance and operational questions without turning ChatGPT into an unrestricted credential or personal-data reader.

## Add it to ChatGPT

1. Open ChatGPT on the web; custom MCP apps are currently web-only.
2. Open **Settings → Apps** or your workspace’s **Workspace settings → Apps**.
3. Enable developer mode if your Business, Enterprise, or Edu workspace permits it.
4. Choose **Create** or **Create custom MCP connector**.
5. Enter the endpoint above.
6. Select bearer-token authentication if ChatGPT asks for an authentication method.
7. Enter the value of `MCP_READ_ONLY_TOKEN` from the project’s secure secrets settings. Never paste the token into a normal chat.
8. Choose **Scan Tools**.
9. Confirm that the seven tools listed above appear and that they are read-only.
10. Create or enable the private app, then test it in a new ChatGPT web conversation.

Example prompts:

- “Use the Mzansi Couriers read-only MCP to list the project files under `server/routers`.”
- “Search the project for `Paystack` and show the relevant file paths.”
- “Give me the current aggregate delivery and safety-incident summary.”
- “Show active in-transit deliveries using the read-only MCP.”

## Maintenance

If the token is rotated, update `MCP_READ_ONLY_TOKEN` in project secrets and update the bearer token in ChatGPT. Do not store the token in source control or the frontend. Any future MCP tool must remain read-only and must be added to the server’s read-only integration test before it is enabled.

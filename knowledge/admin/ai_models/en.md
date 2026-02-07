# AI Models Management ([/admin/ai_models](/admin/ai_models))

The **AI Models** module is the foundation of Omniflow's intelligence. It allows administrators to configure connections to various LLM (Large Language Model) providers such as OpenAI, Anthropic, or compatible local models.

## Quick Actions

| Action | How |
|--------|-----|
| **Add Model** | Click **Add New Model** → Fill details |
| **Edit Model** | Click **Edit** (Pencil Icon) on a row |
| **Toggle Status** | Click the **Status** switch (Active/Inactive) |
| **Delete Model** | Click **Delete** (Trash Icon) |

## Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Display name for internal reference | `GPT-4 Omni`, `Claude 3.5 Sonnet` |
| **Model Variant** | The exact API string required by the provider | `gpt-4o`, `claude-3-5-sonnet-20240620` |
| **API URL** | The endpoint for chat completions | `https://api.openai.com/v1/chat/completions` |
| **API Key** | Secret key (stored encrypted) | `sk-proj-123...` |
| **Is Active** | Controls availability in Use Cases | `True` / `False` |

## Supported Providers

Omniflow supports any provider compatible with the **OpenAI Chat Completion API** format.

### 1. OpenAI
- **URL**: `https://api.openai.com/v1` (or full path `/chat/completions`)
- **Models**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

### 2. DeepSeek (via Compatibility)
- **URL**: `https://api.deepseek.com`
- **Models**: `deepseek-chat`, `deepseek-coder`

### 3. Local Models (Ollama/vLLM)
- **URL**: `http://localhost:11434/v1`
- **Models**: `llama3`, `mistral`
- **Note**: Ensure the Omniflow server can reach the local network IP.

## Security & Encryption

- **Encryption**: API Keys are encrypted before storage in the database using AES-256.
- **Display**: Keys are never displayed in plain text after saving. You can only replace them.
- **Transmission**: Requests are made server-to-server; keys never touch the client browser.

## Common Scenarios

### Scenario 1: Rotating API Keys
If a key is compromised or expired:
1. Go to [/admin/ai_models](/admin/ai_models).
2. Edit the affected model.
3. Paste the new key in the **API Key** field.
4. Save. The old key is immediately replaced.

### Scenario 2: Adding a Cost-Effective Logic
1. Create a model named "Budget AI".
2. Use a cheaper variant like `gpt-4o-mini`.
3. Set it as **Active**.
4. Go to **Use Cases** and assign "Budget AI" to general/low-priority roles.

## Troubleshooting

| Issue | Check | Resolution |
|-------|-------|------------|
| **Connection Failed** | API URL | Ensure URL ends with `/v1` or `/chat/completions` as required by the library. |
| **401 Unauthorized** | API Key | The key might be invalid or expired. Update it. |
| **Model Not Found** | Model Variant | Check for typos in the model ID (e.g., `gpt-4` vs `gpt-4o`). |
| **Timeout** | Network | Check server firewall or proxy settings. |

> **Pro Tip**: Use the **"Test Connection"** feature (if available) or create a temporary "Test" Use Case to verify a new model before rolling it out to users.

# AI Analysis Settings

## What is AI Analysis Settings?

AI Analysis Settings is the global configuration for AI behavior across the entire Omniflow application. This setting determines:

- Which AI model to use
- Parameters such as max tokens and temperature
- Enabled context features

## Affected Features

These settings affect two main AI features:

1. **AI Assistant** - Context-aware sidebar chat at bottom right
2. **AI Copilot** - Floating button for screen analysis (magic sparkles icon)

## Configuration Parameters

### AI Model
Select the active AI model from the list of models configured in [AI Models](/admin/ai_models).

### Max Tokens
- **Default**: 4096
- **Function**: Maximum limit of tokens (words/characters) in AI response
- **Tips**: Increase for longer responses, decrease to save resources

### Temperature
- **Default**: 0.1
- **Range**: 0.0 - 2.0
- **Function**: Controls creativity/randomness of AI responses
  - **Low (0.0-0.3)**: Consistent, factual, predictable responses
  - **Medium (0.4-0.7)**: Balance between creativity and consistency
  - **High (0.8-2.0)**: Creative, varied, more human-like responses

### Context Features

#### Enable Context
Enable user context for personalized AI responses.

#### Enable Company Stats
Include company/system statistics in AI analysis context.

#### Enable Activity Tracking
Include user activity data in AI context.

## How to Change Settings

1. Click **AI Management** → **AI Analysis Settings** in the sidebar
2. Select AI model from dropdown
3. Adjust max tokens and temperature as needed
4. Enable/disable desired context features
5. Click **Save Settings**

## Usage Tips

### For Production
- Use temperature **0.1-0.3** for consistent responses
- Set max tokens according to needs (2048-4096 ideal)
- Enable all context features for optimal results

### For Development/Testing
- Temperature can be higher (0.5-0.7) for exploration
- Max tokens can be lowered to save cost

### Model Selection
- **GPT-4o**: Latest model, balanced speed & quality
- **GPT-4o-mini**: Faster & economical, suitable for simple tasks
- **GPT-4**: Highest quality, suitable for complex analysis

## Troubleshooting

### Model not available
Make sure the AI model is configured in [AI Models](/admin/ai_models) page and status is **Active**.

### Changes not applied
Setting changes take effect immediately without server restart. If not working:
1. Refresh page
2. Logout and login again
3. Clear browser cache

## Related Links

- [AI Models](/admin/ai_models) - AI model configuration
- [AI Use Cases](/admin/ai_use_cases) - Use case and knowledge base
- [AI Chat](/admin/chat) - AI conversation interface

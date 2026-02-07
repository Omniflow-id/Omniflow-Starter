# Omniflow AI Chat ([/admin/chat](/admin/chat))

Omniflow AI Chat is the central hub for interacting with your AI assistants.

## Key Features

1. **Context Awareness**: The AI knows *who you are* (Role, Name) and *where you are* (Current Page).
   - If you ask "What can I do here?", it reads the page context.
   2. **Streaming Responses**: Messages appear character-by-character for a smooth experience.
   3. **Markdown Support**: Code blocks, tables, bold/italic text, and lists are rendered beautifully.
   4. **History Management**: Your conversations are saved. Resume them anytime.

## How to Use

### Starting a Conversation
1. Navigate to `/admin/chat` (or open the Sidebar).
2. Click **New Chat** (Top Right or Sidebar "Plus").
3. (Optional) Select a **Use Case** if available (e.g., "General", "HR").
4. Type your message and hit Enter.

### Managing Messages
- **Edit**: Hover over your message → Click Pencil Icon. The AI will **regenerate** its response based on the new edit.
- **Delete**: Hover over a message → Click Trash Icon. This removes it from context.
- **Copy**: Select text or use code block "Copy" buttons.

### Sidebar vs Full Page
- **Sidebar**: Quick help while browsing other pages.
- **Full Page**: Dedicated workspace for complex tasks, coding, or long-form writing.

## Best Practices

- **Be Specific**: "Write a SQL query for active users" is better than "SQL users".
- **Use Context**: "Explain this error" works well if you paste an error code.
- **Iterate**: If the first answer isn't perfect, ask for refinement ("Make it shorter", "Add comments").

## Limits & Privacy

- **Data Privacy**: Do not share sensitive personal data (PII) unless authorized. Conversations are logged for audit.
- **Token Limits**: Long conversations may hit a token limit (e.g., 4000 tokens). Start a new chat if the AI forgets earlier context.
- **Model Usage**: Admins control which models are used. Some might be slower/smarter than others.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Streaming Stuck** | Refresh the page. Check network connection. |
| **"Error: 500"** | The AI service might be down or misconfigured. Contact Admin. |
| **Response Cut Off** | Type "Continue" to let the AI finish. |

# AI Assistant - Context-Aware Sidebar

AI Assistant is a sidebar AI assistant that provides help based on the page you are currently viewing.

## What is AI Assistant?

AI Assistant is a sliding chat panel that appears from the bottom right of the screen when you click the **blue** button with 🤖 robot icon.

Difference from AI Chat (full page):
- **AI Assistant**: Quick sidebar, context-aware, does not save history
- **AI Chat**: Full page, conversation-based, saves history

## How to Use

### 1. Open AI Assistant
Click the **blue** button with 🤖 icon at the bottom right of the screen.

### 2. See Context
AI Assistant automatically detects:
- **Active page**: e.g., "Users", "Dashboard", "Settings"
- **Your role**: Admin, Manager, etc.
- **Language**: Based on application language setting

### 3. Start Asking
Type questions related to the page you are currently viewing:

**Examples on Users page:**
- "How to add a new user?"
- "What's the difference between Admin and Manager roles?"
- "How to reset user password?"

**Examples on Dashboard page:**
- "Explain the displayed metrics"
- "What do active vs non-active users mean?"

**Examples on Settings page:**
- "What does this setting do?"
- "How to change X configuration?"

### 4. Real-time Response
- AI responds with streaming (character by character)
- Can scroll to see previous context
- Can expand panel with expand button (↔️)

## Key Features

### Context-Aware
AI knows which page you are currently viewing and adapts its answers.

### Voice Input (Microphone)
Click 🎤 microphone icon for voice input (if browser supports).

### Text-to-Speech
Click 🔊 speaker icon on AI message to read the answer aloud.

### Expand/Collapse
- **Small**: 400px (default)
- **Wide**: 50% screen (expand button)

### History Navigation
Press browser "Back" button to close panel (mobile-friendly).

## Usage Tips

### Ask Specifically
❌ "How is this?"
✅ "How to change Admin role permissions?"

### Use Page Context
Since AI knows your page, you can ask briefly:
- "Function of this button?" (while pointing at button on screen)
- "Explain this column" (while pointing at table)

### Multi-language
AI responds according to application language (Indonesian/English).

## Configuration

AI Assistant uses:
- [AI Analysis Settings](/admin/ai_analysis_settings) for model & parameters
- Knowledge base from `@knowledge/` folder for page context

## Difference from Other AI Features

| Feature | Location | Save History | Focus |
|---------|----------|--------------|-------|
| **AI Assistant** | Sidebar | ❌ No | Active page help |
| **AI Copilot** | Floating FAB | ❌ No | Screen analysis |
| **AI Chat** | Full page | ✅ Yes | Deep conversation |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Panel not opening | Refresh page, check JavaScript console |
| Irrelevant response | Check if knowledge is available for this page |
| Voice input not working | Ensure browser support & microphone permission granted |
| TTS not working | Ensure browser supports Web Speech API |
| Wrong context | Refresh page to reset context detection |

## Privacy Note

⚠️ AI Assistant does not store conversations. Every session is a fresh session.

⚠️ Page context is read client-side, not sent to server unless your message.

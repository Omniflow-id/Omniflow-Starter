# AI Copilot - Screen Analysis

AI Copilot is an AI-based screen analysis feature that helps you understand the data and content you are currently viewing.

## What is AI Copilot?

AI Copilot is a floating button (✨ magic sparkles icon) that appears at the bottom right of the screen (above AI Assistant). This feature analyzes the currently active screen content and provides intelligent insights.

## How to Use

### 1. Open AI Copilot
Click the **purple** button with ✨ icon at the bottom right of the screen.

### 2. Input Question (Optional)
You can:
- **Direct analysis**: Click "Analyze Screen" without a question
- **With specific question**: Type a question in the input field, then analyze

Example questions:
- "Explain the data trends visible"
- "What anomalies are in this data?"
- "Compare this month's vs last month's performance"
- "What are the recommendations based on this data?"

### 3. Wait for Analysis
AI will:
1. Read page structure (tables, forms, content)
2. Analyze visible data
3. Provide insights in markdown format
4. Display results with typing effect

### 4. Use Results
- **Scroll** to read full analysis
- **Copy** results with "Copy" button
- **Close** modal to return to work

## Key Features

### Real-time Analysis
AI reads page content live, including:
- Table data
- Form inputs
- Headings and titles
- Alerts and notifications

### Page Context
AI knows which page you are currently viewing, making analysis more relevant.

### Streaming Response
Analysis results appear character by character (typewriter effect) like chat.

### Stoppable
Click "Stop" button anytime if you want to stop the analysis.

## Usage Tips

### For Dashboard/Overview
Ask: "Summarize system performance based on visible data"

### For Data/Table Pages
Ask: 
- "Identify patterns and trends in this data"
- "What outliers or anomalies are visible?"

### For Forms/Input
Ask: "Explain the function of this form and how to fill it"

### For Error Pages
Ask: "Analyze this error and suggest fixes"

## Difference from AI Assistant

| AI Copilot | AI Assistant |
|------------|--------------|
| Analyzes active screen content | Interactive sidebar chat |
| One analysis per click | Back-and-forth conversation |
| Focus on visible data | Focus on general questions |
| Does not save history | Does not save history |

## Configuration

AI Copilot uses settings from [AI Analysis Settings](/admin/ai_analysis_settings):
- AI Model
- Temperature
- Max tokens
- Context features

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not appearing | Refresh page, ensure not on login page |
| Slow analysis | Check internet connection, or AI model may be busy |
| Irrelevant results | Clarify your question, or try without a question |
| Error during analysis | Contact admin, AI configuration may have issues |

## Important Notes

⚠️ **Screen Analysis**: AI reads the structure and text content visible on screen, not screenshot images.

⚠️ **Data Sensitivity**: Avoid analyzing pages with sensitive data unless necessary.

⚠️ **Not Real-time**: Data analyzed is a snapshot when the button is clicked, not real-time.

# AI Use Cases Configuration ([/admin/ai_use_cases](/admin/ai_use_cases))

AI Use Cases are the core way to segment and specialize your AI assistants across different departments and tasks.

## Concept
A **Use Case** combines:
1. **Who** (Roles: HR, Manager, Admin)
2. **What** (Knowledge: Contracts, FAQs, Databases)
3. **How** (Model: GPT-4, Llama 3)
4. **Behavior** (System Prompts)

This ensures that an HR Manager gets an assistant focused on employee data, while a Finance User gets one focused on accounting.

## Setting Up Use Cases

### 1. General Info
- **Name**: The display name for the chatbot (e.g., "HR Helper").
- **Description**: Internal note about its purpose.
- **Model**: Select an active model from [AI Models](/admin/ai_models).

### 2. Prompt Engineering
- **System Prompt**: The "persona" definition.
  - *Example*: "You are a helpful HR assistant. Be polite and professional."
- **Base Knowledge**: Use this for general facts relevant to all conversations in this use case.
  - *Example*: "The company policy states that leave requests take 3 days."
- **Temperature**: 
  - `0.2` = Strict (Good for data retrieval, SQL generation).
  - `0.7` = Balanced (Good for chat, email drafting).
  - `1.0` = Creative (Good for brainstorming).

### 3. Role Assignment
- **Select Roles**: Choose which user roles can access this use case.
- **Priority**: If a user has multiple roles, which use case is default? (Usually handled by logic or user selection).

> **Tip**: Assigning no roles might make it a "Global Fallback" or invisible. Check implementation details.

## Examples

### Scenario A: Coding Assistant (Internal Devs)
- **Role**: `Developer`
- **Model**: `Claude 3.5 Sonnet` (Good at code)
- **Prompt**: "You are an expert full-stack engineer. Write clean, modular code."
- **Temp**: `0.3` (Precise)

### Scenario B: Customer Support (CS Team)
- **Role**: `Support`
- **Model**: `GPT-4o` (Fast and empathetic)
- **Prompt**: "You are a support agent. Apologize for issues and offer solutions based on the FAQ."
- **Temp**: `0.6` (Conversational)

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| **Use Case Not Visible** | Role mismatch | Check if your current user role is selected in the Use Case. |
| **Model Error** | Inactive Model | The linked Model in `/admin/ai_models` might be inactive or deleted. |
| **Poor Responses** | Weak Prompt | Improve the System Prompt. Add examples of desired output. |

## Advanced: Context Injection
Omniflow automatically injects:
- **User Context**: Name, Role, Email.
- **Time/Date**: Current timestamp.
- **Page Context**: Where the user is currently navigating (e.g., viewing "User Profile").

You can reference these in your prompt: "Always address the user by their name."

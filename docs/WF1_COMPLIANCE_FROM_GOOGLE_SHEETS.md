# WF1 — Load Meta compliance rules from Google Sheets

This extends **WF1 (Prelaunch Compliance)** so **Call 2 (FastRouter Step 2)** uses rules text maintained in **Google Sheets** instead of (or in addition to) a hardcoded prompt.

---

## 1. High-level flow change

**Before (hardcoded):**  
`Parse Step 1` → `FastRouter Step 2` (system prompt fixed in node)

**After (Google Sheet):**  
`Parse Step 1` → **`Read Compliance Rules` (Google Sheets)** → **`Build Step 2 Prompt` (Code)** → `FastRouter Step 2` → `Parse Step 2` → …

Only **Step 2** needs the sheet. Step 1 (read URL / summarize) stays the same.

---

## 2. Google Sheet design

Create a spreadsheet, e.g. **“A360 Meta Compliance Rules”**.

### Option A — Single cell (simplest)

| Cell | Content |
|------|--------|
| `Rules!A1` | Full playbook as one cell (plain text or markdown). **Watch character limit** (~50k+ can hit token limits). |

**Pros:** One read, easy versioning.  
**Cons:** Large edits in one cell; token size.

### Option B — One rule per row (recommended for maintenance)

| Column A (`section`) | Column B (`rule_text`) |
|----------------------|-------------------------|
| `PART 1: Prohibitions` | `Child sexual exploitation...` |
| `PART 1: Prohibitions` | `Coordinating harm...` |
| … | … |

**Read range:** e.g. `Rules!A:B` (header row optional).

**Pros:** Ops can add/reorder rows; you concatenate in n8n.  
**Cons:** Slightly more Code to join rows.

### Option C — Version tab

- Tab `v2026_01` — frozen rules for audit  
- Tab `current` — what n8n reads (`current!A:B`)

Point n8n at **`current!A:B`** (or a named range).

---

## 3. n8n credentials

1. n8n → **Credentials** → **Google Sheets OAuth2 API**  
2. Connect the Google account that can **read** the spreadsheet  
3. Share the sheet with that account (Viewer is enough)

---

## 4. New node: **Google Sheets — Read Compliance Rules**

**Position:** Between **`Parse Step 1 JSON`** (success / Fallback branch) and **`FastRouter Step 2 - Compliance`**.

**Node:** **Google Sheets** (read)

| Setting | Example |
|---------|---------|
| **Credential** | Google Sheets OAuth2 |
| **Operation** | Read (Get row(s) / Read range — depends on n8n version) |
| **Document** | Spreadsheet ID from URL: `https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID`**`/edit` |
| **Sheet** | `current` or `Rules` |
| **Range** | `A:B` or `A1:A500` |

**Option A (single cell):** Read `Rules!A1` — one row returned.

**Option B (many rows):** Read all data rows; next node concatenates column B.

---

## 5. New node: **Code — Build Step 2 messages** (merge rules + article)

**Purpose:** Build the JSON body for FastRouter with:

- `system` = fixed intro + **full rules text from sheet**
- `user` = headline + summary from Parse Step 1

### Example (Option B — many rows)

```javascript
// Items from Google Sheets node (adjust node name to match canvas)
const sheetRows = $('Read Compliance Rules').all().map(i => i.json);

// Skip header if first row is "section" / "rule_text"
const dataRows = sheetRows[0]?.json?.section === 'section' ? sheetRows.slice(1) : sheetRows;

const rulesText = dataRows
  .map(r => r.json)
  .filter(r => r.rule_text || r['Column B'])
  .map(r => `## ${r.section || 'Rule'}\n${r.rule_text || r['Column B']}`)
  .join('\n\n');

const step1 = $('Parse Step 1 JSON').item.json;

const systemPrompt = `You are a Meta (Facebook/Instagram) advertising compliance reviewer.

You MUST evaluate the user's headline and summary against ALL rules below. Be conservative.

--- COMPLIANCE RULEBOOK (from policy sheet) ---

${rulesText}

--- END RULEBOOK ---

Respond with ONLY a valid JSON object (no markdown, no code fences). Exactly two keys:
- "compliance_status": one of "compliant", "non_compliant", "pending_review"
- "compliance_reason": brief string under 300 characters`;

const userPrompt = `Check this news article for Meta ad compliance.

Headline: ${step1.headline}
Summary: ${step1.summary}`;

return [{
  json: {
    article_id: step1.article_id,
    summary: step1.summary,
    location: step1.location,
    headline: step1.headline,
    fastrouter_body: {
      model: process.env.FASTROUTER_MODEL || 'openai/gpt-4o-search-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
    },
  },
}];
```

**Node names:** Replace `'Read Compliance Rules'` and `'Parse Step 1 JSON'` with your **exact** n8n node names.

**Token limit:** If `rulesText` is huge, truncate in Code:

```javascript
const MAX_CHARS = 80000; // tune down if FastRouter errors
const trimmed = rulesText.length > MAX_CHARS ? rulesText.slice(0, MAX_CHARS) + '\n\n[...truncated...]' : rulesText;
```

### Example (Option A — single cell `A1`)

```javascript
const rulesText = $('Read Compliance Rules').first().json['Column A'] || $('Read Compliance Rules').first().json['rules'] || '';
// ... same systemPrompt / userPrompt as above
```

Adjust field name to match what the Google Sheets node returns (inspect **Executions**).

---

## 6. Update **FastRouter Step 2 — HTTP Request**

Instead of hardcoding `messages` in the node body:

| Field | Value |
|-------|--------|
| **Body** | **Expression** → `={{ $json.fastrouter_body }}` |

Or set **Body** to JSON and map:

- `model` → `{{ $json.fastrouter_body.model }}`
- `messages` → `{{ $json.fastrouter_body.messages }}`
- `temperature` → `0`

Ensure **Parse Step 2** still reads from **this HTTP node’s output** (unchanged).

---

## 7. Wiring summary

```
… → Parse Step 1 JSON
        → (Switch Fallback / Continue path)
        → Read Compliance Rules (Google Sheets)
        → Build Step 2 Prompt (Code)
        → FastRouter Step 2 (HTTP)   ← body from Code output
        → Parse Step 2 JSON
        → …
```

**Do not** put the Google Sheets node on the **Terminal** or **Retry** branches of the Switch — only on the path that reaches Step 2.

---

## 8. Caching (optional, saves sheet quota + latency)

Add **IF** “rules cache fresh?” or use **n8n static data** / a small **Redis** / second sheet cell `last_updated`:

- If rules unchanged since last run, skip Google Sheets and use **workflow static data** copy.

For v1, **read every time** is OK if volume is low.

---

## 9. Security & governance

- Sheet: **view-only** for most ops; **edit** for policy owners.  
- **Do not** put API keys in the sheet.  
- Version: date in tab name or column `effective_from` if you need audit trail.

---

## 10. Checklist

- [ ] Sheet created + shared with n8n Google account  
- [ ] Google Sheets credential in n8n  
- [ ] Read node returns expected columns (verify in Executions)  
- [ ] Code node builds `fastrouter_body` with merged rules  
- [ ] Step 2 HTTP uses `{{ $json.fastrouter_body }}`  
- [ ] Token size tested (truncate if needed)  
- [ ] Parse Step 2 + callbacks unchanged  

---

## 11. Importable workflow

n8n workflows are JSON; this repo does not ship a `.json` export. Build by **inserting the two nodes** above into your existing WF1 and rewiring Step 2 as described.

If you export WF1 JSON and paste the **Google Sheets node output shape**, the Code snippet can be adjusted to match your exact field names.

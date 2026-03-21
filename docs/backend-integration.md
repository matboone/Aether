# Aether Backend Integration

## Environment
- `MONGODB_URI`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `BILL_PARSER_MODE=demo|textract` with `demo` as the default
- `UPLOAD_DIR` optional, defaults to `.demo/uploads`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` only when `BILL_PARSER_MODE=textract`

## Guided Flow
1. `POST /api/sessions`
   Returns a guided session with `sessionId`, `step`, `facts`, and `ui`.
2. `POST /api/chat/message`
   Request body:
   ```json
   {
     "sessionId": "string",
     "content": "I have a Cigna Healthcare bill and no insurance",
     "factPatch": {
       "incidentSummary": "ER visit last month"
     }
   }
   ```
3. `POST /api/bills/upload`
   Multipart fields:
   - `sessionId`
   - `file`
4. `POST /api/bills/{uploadedBillId}/process`
   Runs deterministic parse, classification, analysis, and hospital lookup.
5. If the backend returns `step: "AWAITING_INCOME"`, call `POST /api/chat/message` again with:
   ```json
   {
     "sessionId": "string",
     "content": "My household income is 42000",
     "incomeInput": {
       "incomeAmount": 42000,
       "householdSize": 2
     }
   }
   ```
6. Record the result with either:
   - `POST /api/chat/message` and `resolutionInput`
   - `POST /api/resolutions`

## Quick Scan
- `POST /api/analysis/quick-scan`
- Multipart field: `file`
- No persistence, no session, no Mongo records

Example response:
```json
{
  "parseResult": {
    "hospitalName": "Cigna Healthcare",
    "totalAmount": 862,
    "phoneNumber": "615-450-5591",
    "email": "Cigna@gmail.com",
    "sourceType": "itemized_statement",
    "lineItems": []
  },
  "analysisSummary": {
    "originalTotal": 862,
    "flaggedCount": 4,
    "estimatedOvercharge": 237
  },
  "flaggedItems": [],
  "allItems": [],
  "unmatchedItems": []
}
```

## Route Contracts
- `POST /api/sessions`
- `GET /api/sessions/{sessionId}`
- `POST /api/chat/message`
- `POST /api/bills/upload`
- `POST /api/bills/{uploadedBillId}/process`
- `GET /api/analysis/{analysisId}`
- `POST /api/analysis/quick-scan`
- `POST /api/assistance/qualify`
- `GET /api/hospitals/{hospitalId}/strategy`
- `POST /api/strategy/build`
- `POST /api/resolutions`

## UI Contract
Render from the backend-provided `ui` object:
- `canUploadBill`
- `canUploadItemizedStatement`
- `analysisSummary`
- `flaggedItems`
- `hospitalStrategy`
- `negotiationPlan`
- `resolutionSummary`

The backend remains the source of truth for state progression. The frontend should conditionally render sections from these flags and payloads rather than infer its own workflow.

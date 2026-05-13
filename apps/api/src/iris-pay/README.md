# Iris Pay Module

This module handles Iris Pay integration for the Podkrepi.bg platform.

## Endpoints

### POST /iris-pay/finish

Finishes the payment process by updating the donation status in the system.

#### Request Body

```typescript
{
  hookHash: string,           // Payment identifier from iris-pay
  status: string,             // Payment status ('CONFIRMED', 'FAILED', 'WAITTING')
  amount: number,             // Payment amount in smallest currency unit
  billingName?: string,       // Optional billing name
  billingEmail?: string,      // Optional billing email
  metadata: {
    campaignId: string,       // ID of the campaign receiving the donation
    personId: string | null,  // ID of the donor (null for anonymous)
    isAnonymous: 'true' | 'false', // Whether the donation is anonymous
    type: string              // Donation type (e.g., 'donation')
  }
}
```

#### Response

```typescript
{
  donationId?: string  // ID of the created/updated donation
}
```

#### Status Mapping

The endpoint maps iris-pay status strings to internal PaymentStatus enum values:

- `'CONFIRMED'` → `PaymentStatus.succeeded` (payment executed)
- `'FAILED'` → `PaymentStatus.declined` (payment rejected)
- `'WAITTING'` → `PaymentStatus.waiting` (waiting to be processed by ASPSP)
- `'WAITING'` → `PaymentStatus.waiting` (also supports correct spelling)
- Any other status → `PaymentStatus.waiting` (with warning log)

#### Example Usage

```bash
curl -X POST http://localhost:5010/api/v1/iris-pay/finish \
  -H "Content-Type: application/json" \
  -d '{
    "hookHash": "payment-123",
    "status": "CONFIRMED",
    "amount": 5000,
    "billingName": "John Doe",
    "billingEmail": "john.doe@example.com",
    "metadata": {
      "campaignId": "campaign-456",
      "personId": "person-789",
      "isAnonymous": "false",
      "type": "donation"
    }
  }'
```

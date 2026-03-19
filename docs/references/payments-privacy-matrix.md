# Payments Privacy Matrix

## Overview

The PAYMENTS stage has **strict privacy filtering** to ensure users only see their own financial information.

## 3 Payment Subsections

### 1️⃣ **Invoices** (Admin → Client)
Invoices that admin creates and sends to clients.

| Role | Can View | Can Create | Can Edit | Can Delete | What They See |
|------|----------|------------|----------|------------|---------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ALL invoices to ALL clients |
| **Client** | ✅ | ❌ | ❌ | ❌ | ONLY their own invoices |
| **Employee** | ❌ | ❌ | ❌ | ❌ | Nothing (no access) |

**Privacy Filter:**
```typescript
// Admin sees all
WHERE type = 'INVOICE'

// Client sees only their invoices
WHERE type = 'INVOICE' AND toUserId = clientId
```

---

### 2️⃣ **Client Payments** (Client → Admin)
Payments that clients make to admin (transfers, checks, initial payments).

| Role | Can View | Can Create | Can Edit | Can Delete | What They See |
|------|----------|------------|----------|------------|---------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ALL payments from ALL clients |
| **Client** | ✅ | ✅ | ❌ | ❌ | ONLY their own payments |
| **Employee** | ❌ | ❌ | ❌ | ❌ | Nothing (no access) |

**Privacy Filter:**
```typescript
// Admin sees all
WHERE type = 'INITIAL_PAYMENT'

// Client sees only their payments
WHERE type = 'INITIAL_PAYMENT' AND fromUserId = clientId
```

---

### 3️⃣ **Employee Payments** (Admin → Employee)
Payments that admin makes to employees for completed work.

| Role | Can View | Can Create | Can Edit | Can Delete | What They See |
|------|----------|------------|----------|------------|---------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ALL payments to ALL employees |
| **Client** | ❌ | ❌ | ❌ | ❌ | Nothing (no access) |
| **Employee** | ✅ | ❌ | ❌ | ❌ | ONLY their own payments received |

**Privacy Filter:**
```typescript
// Admin sees all
WHERE type = 'EMPLOYEE_PAYMENT'

// Employee sees only their payments
WHERE type = 'EMPLOYEE_PAYMENT' AND toUserId = employeeId
```

---

## UI Display Examples

### Admin Views Payments Section:

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Payments                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Tabs: [📄 Invoices] [💳 Client Payments] [💵 Employee Payments] │
│                                                          │
│ 📄 INVOICES (showing ALL clients)                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ INV-2024-12-20-001 | González Family | $5,000 | Paid│ │
│ │ INV-2024-12-20-002 | Smith Corp     | $8,000 | Due │ │
│ │ INV-2024-12-21-001 | López LLC      | $3,500 | Sent│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [+ Create Invoice]                                      │
└─────────────────────────────────────────────────────────┘
```

### Client Views Payments Section:

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Payments                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Tabs: [📄 My Invoices] [💳 My Payments]                  │
│      (Employee Payments tab NOT shown)                  │
│                                                          │
│ 📄 MY INVOICES (showing ONLY González Family)           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ INV-2024-12-20-001 | $5,000 | Paid on Dec 20       │ │
│ │ INV-2024-12-20-005 | $2,000 | Due Jan 15           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [+ Upload Payment Receipt]                             │
└─────────────────────────────────────────────────────────┘
```

### Employee Views Payments Section:

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Payments                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Tab: [💵 My Payments]                                    │
│      (Invoices and Client Payments tabs NOT shown)      │
│                                                          │
│ 💵 MY PAYMENTS (showing ONLY this employee)             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Kitchen Design   | $3,000 | Paid on Dec 22         │ │
│ │ Living Room      | $2,000 | Paid on Dec 25         │ │
│ │ Bedroom Layout   | Pending payment                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Total Received: $5,000 | Pending: $2,500               │
└─────────────────────────────────────────────────────────┘
```

---

## Database Implementation

### Payment Model (Simplified)
```prisma
model Payment {
  id           String      @id
  projectId    String
  type         PaymentType // INVOICE | INITIAL_PAYMENT | EMPLOYEE_PAYMENT
  fromUserId   String?     // Who pays (client for initial, admin for employee)
  toUserId     String?     // Who receives (admin for initial, employee for employee)
  amount       Decimal
  createdAt    DateTime

  // Relations
  project      Project     @relation(...)
  fromUser     User?       @relation("PaymentFrom", ...)
  toUser       User?       @relation("PaymentTo", ...)
}
```

### Query Examples

**Admin getting all invoices:**
```typescript
const invoices = await prisma.payment.findMany({
  where: {
    projectId,
    type: PaymentType.INVOICE,
  },
});
```

**Client getting their invoices:**
```typescript
const myInvoices = await prisma.payment.findMany({
  where: {
    projectId,
    type: PaymentType.INVOICE,
    toUserId: clientId, // Filter by client
  },
});
```

**Employee getting their payments:**
```typescript
const myPayments = await prisma.payment.findMany({
  where: {
    projectId,
    type: PaymentType.EMPLOYEE_PAYMENT,
    toUserId: employeeId, // Filter by employee
  },
});
```

---

## Security Notes

1. **Never** expose payment data across user boundaries
2. **Always** filter by `userId` based on role
3. **Validate** payment type access before any query
4. **Log** all payment access attempts for audit
5. **Test** with multiple users to ensure privacy

---

## Implementation Checklist

- [x] Stage permissions helper (`stage-permissions.helper.ts`)
- [x] Payment privacy rules defined in this document
- [x] EmployeePayment model with privacy (schema ready)
- [ ] Payment queries implement full privacy filters
- [ ] Frontend UI shows correct tabs per role
- [ ] Frontend hides unauthorized payment types
- [ ] Tests verify privacy boundaries

---

**Last Updated:** March 2025
**Status:** Schema ready, privacy rules defined. Frontend UI pending.

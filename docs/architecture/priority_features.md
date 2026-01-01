# Priority Features & Missing Functionality - Based on Business Review

This document outlines **ONLY** the critical missing features that need to be implemented based on the business requirements clarification.

---

## 🔴 **CRITICAL - Must Implement**

### 1. **Employee Assignment Rule - No Overlapping Active Projects**

**Issue:** System currently allows assigning employees who are already working on active projects.

**Business Rule:**
- Employees can ONLY be assigned to ONE active project at a time
- Once assigned to Project A (status: ACTIVE), they cannot be assigned to Project B until Project A is completed/archived

**Implementation:**

```sql
-- Add validation when assigning employees to projects
-- Check if employee is already in an active project

SELECT COUNT(*) FROM project_employees pe
JOIN projects p ON pe.project_id = p.id
WHERE pe.employee_id = :employee_id
AND p.status = 'active'

-- If count > 0, show error: "This employee is currently assigned to an active project"
```

**UI Changes:**
- When Admin tries to assign employee to new project
- Show warning badge next to employee name if already assigned to active project
- Display current active project name: "⚠️ Currently working on: Modern House - González"

---

### 2. **Feedback-to-Delivery Relationship (Rejection Tracking)**

**Issue:** System needs to properly track rejection cycles per employee.

**Business Logic:**
- When Admin creates feedback for Employee in "Feedback (Employee)" stage AFTER a delivery was made
- This indicates the delivery was REJECTED
- Need to link this rejection to the specific delivery that was rejected

**Database Addition:**

```sql
File_Document (add field)
├── rejection_count (INT, default 0)
├── last_rejected_at (DATETIME, nullable)
└── last_rejection_feedback_id (FK → Feedback, nullable)

Feedback (add field)
├── rejected_file_id (FK → File_Document, nullable)
└── is_rejection_feedback (BOOLEAN, default false)
```

**Workflow:**
1. Employee uploads file to "Submitted" stage
2. Admin reviews and DOES NOT approve
3. Admin creates NEW feedback in "Feedback (Employee)" stage
4. **System should ask:** "Is this feedback rejecting a specific delivery?"
   - If YES → Select which file from "Submitted" is being rejected
   - Link feedback to that file via `rejected_file_id`
   - Increment `rejection_count` on that file
   - Set `is_rejection_feedback = true`
5. Employee sees feedback and knows which delivery was rejected
6. Employee submits new version
7. Timer still counts from FIRST feedback in cycle (existing rule)

**UI Changes:**
- When creating feedback for employee, show option: "Related to a submitted file? (optional)"
- If selected, show dropdown of latest files in "Submitted" by that employee
- In employee view, show rejection badge on file: "❌ Rejected - See Feedback #123"

**Analytics Addition:**
- In employee performance analysis, show:
  - Total deliveries: 5
  - Approved on first try: 3
  - Required revisions: 2
  - Average rejections per delivery: 0.4

---

### 3. **Client History & Project Analytics**

**Issue:** No way to see client's full history across multiple projects.

**Implementation:**

```sql
-- View/Query for Client Analytics
Client_Analytics (calculated view)
├── client_id (FK → Users)
├── total_projects (INT)
├── active_projects (INT)
├── completed_projects (INT)
├── total_paid (DECIMAL, sum of all payments from this client)
├── total_invoiced (DECIMAL, sum of all invoices to this client)
├── outstanding_balance (DECIMAL, total_invoiced - total_paid)
├── average_project_value (DECIMAL)
├── first_project_date (DATE)
├── last_project_date (DATE)
├── payment_reliability_score (calculated: on_time_payments / total_payments)
└── late_payments_count (INT)
```

**Dashboard Views:**

#### **Client Profile Page:**
```
┌─────────────────────────────────────────────────────────┐
│ CLIENT: González Family                                  │
│ Contact: juan.gonzalez@email.com                        │
├─────────────────────────────────────────────────────────┤
│ 📊 Client Overview                                       │
│ • Total Projects: 3 (2 completed, 1 active)             │
│ • Total Revenue: $45,000                                │
│ • Outstanding Balance: $2,500                           │
│ • Payment Reliability: 95% (19/20 on-time)              │
│ • Client Since: Jan 2024                                │
│ • Last Project: Modern House (Active)                   │
├─────────────────────────────────────────────────────────┤
│ 📋 Project History                                       │
│ 1. Modern House          Status: Active    Value: $20K  │
│ 2. Apartment Redesign    Status: Done      Value: $15K  │
│ 3. Office Logo           Status: Done      Value: $10K  │
└─────────────────────────────────────────────────────────┘
```

#### **Admin Dashboard - Top Clients:**
```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Top Clients by Revenue                                │
├─────────────────────────────────────────────────────────┤
│ 1. González Family        $45,000    3 projects         │
│ 2. Tech Startup Inc       $32,000    2 projects         │
│ 3. Local Restaurant       $28,000    4 projects         │
└─────────────────────────────────────────────────────────┘
```

---

### 4. **File Version Control & Metadata**

**Current Issue:** When employee submits multiple versions, hard to track which is which.

**The Problem in Detail:**

When an employee works on the same deliverable and submits multiple times:
- **v1:** Employee submits Kitchen Design → Admin rejects
- **v2:** Employee submits revised Kitchen Design → Admin rejects
- **v3:** Employee submits final Kitchen Design → Admin approves

Currently, the system:
- ✅ Only shows "latest" file as approvable (good)
- ❌ Hard to tell which is v1, v2, v3
- ❌ Can't see what changed between versions
- ❌ No metadata about file (dimensions, size, format)
- ❌ "Hidden" files (old versions) accumulate and waste storage

**Recommended Solution:**

```sql
File_Document (add fields)
├── version_number (INT, auto-increment per file "group")
├── version_label (STRING, e.g., "v1", "v2", "v3")
├── parent_file_id (FK → File_Document, nullable, links to previous version)
├── is_current_version (BOOLEAN, only one per group)
├── file_size_bytes (BIGINT)
├── file_mime_type (STRING, e.g., "image/jpeg", "application/pdf")
├── file_dimensions (STRING, e.g., "1920x1080", nullable for images)
└── version_notes (TEXT, employee can add: "Fixed colors and layout")
```

**Workflow:**
1. Employee uploads first version to "Submitted"
   - `version_number = 1`
   - `is_current_version = true`
   - `parent_file_id = null`

2. Admin rejects, employee uploads new version
   - System detects it's a new version of same deliverable
   - `version_number = 2`
   - Previous file: `is_current_version = false`
   - New file: `is_current_version = true`, `parent_file_id = [previous_file_id]`

3. In "Submitted" view, show version history:
```
📄 Kitchen Design Layout
├── v3 (current) - Uploaded Dec 20, 2024 3:45 PM  [Approve]
│   └── Notes: "Final version with approved colors"
├── v2 - Uploaded Dec 19, 2024 11:30 AM  [View]
│   └── Notes: "Fixed color scheme, still need spacing adjustments"
└── v1 - Uploaded Dec 18, 2024 2:30 PM  [View]
    └── Notes: "Initial design"
```

**Metadata Capture (automatic on upload):**
```javascript
// Extract file metadata when uploaded
{
  file_size_bytes: 2458960,
  file_mime_type: "image/jpeg",
  file_dimensions: "1920x1080",
  upload_timestamp: "2024-12-20T15:45:30Z"
}
```

**Benefits:**
- ✅ Easy to see progression of work
- ✅ Can compare versions if needed
- ✅ Clear audit trail
- ✅ Employee can explain what changed
- ✅ Know file specs (important for print vs web)

**Storage Cleanup:**
- When project is archived, old versions (v1, v2) can be deleted after grace period
- Keep only final approved version permanently

---

### 5. **Basic Audit Trail for Critical Actions**

**Why this is important:**

**Scenarios:**
1. **Payment disputes:** "I never received payment" → Check audit log: "Payment recorded by Admin on Dec 20"
2. **File changes:** "Who deleted this file?" → Audit log shows it
3. **Status changes:** "Why is project archived?" → See who changed status and when
4. **Invoice modifications:** "Invoice was changed" → Who changed it?

**Implementation:**

```sql
Audit_Log
├── id (PK)
├── user_id (FK → Users)
├── action (STRING, e.g., "payment_created", "file_approved", "project_archived")
├── entity_type (STRING, e.g., "Payment", "File_Document", "Project")
├── entity_id (INT)
├── old_value (JSON, nullable)
├── new_value (JSON, nullable)
├── timestamp (DATETIME)
└── ip_address (STRING, optional)
```

**What to track:**
- ✅ Payment creation/modification/deletion
- ✅ File approval (Submitted → Admin Approved → Client Approved)
- ✅ Project status changes (Inactive → Active → Completed → Archived)
- ✅ File deletion/hiding
- ✅ User creation/deletion
- ✅ Employee assignment changes

**Example Audit Log Entries:**
```
[2024-12-20 15:30:00] Admin (Poncho) approved file #456 (Kitchen Design v3)
  Changed stage: "submitted" → "admin_approved"
  Selected approval date: 2024-12-20

[2024-12-20 16:45:00] Admin (Poncho) created payment #789
  Type: employee_payment
  Amount: $3,000 → Employee: Juan López → Files: [#456]
  Payment date: 2024-12-20

[2024-12-21 09:00:00] Client (González) uploaded payment receipt
  Payment #234 → Amount: $5,000 → Method: Transfer
  Receipt: receipt_2024_12_21.pdf

[2024-12-21 14:00:00] Admin (Poncho) changed project status
  Project: Modern House - González
  Status: "active" → "completed"
```

**UI:** Simple log view in admin panel:
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Recent Activity                                       │
├─────────────────────────────────────────────────────────┤
│ 2 hours ago - Admin approved Kitchen Design v3          │
│ 3 hours ago - Client uploaded payment ($5,000)          │
│ Yesterday - Admin created employee payment              │
│ 2 days ago - Project status changed to Active           │
│                                                          │
│ [View Full History]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🟡 **MEDIUM PRIORITY - Implement Soon**

### 6. **Project Completion Checklist**

**Issue:** Unclear when a project is "done" and ready to archive.

**Recommendation:**

```sql
Project_Completion_Status (calculated fields/view)
├── project_id (FK → Project)
├── all_payments_received (BOOLEAN, client paid everything)
├── all_employees_paid (BOOLEAN, all employees with approved work are paid)
├── final_files_delivered (BOOLEAN, at least one file in "Client Approved")
├── no_pending_feedback (BOOLEAN, no open feedback cycles)
├── can_be_archived (BOOLEAN, all above are true)
└── completion_blockers[] (array of reasons preventing completion)
```

**UI - Project Status Card:**
```
┌─────────────────────────────────────────────────────────┐
│ PROJECT: Modern House - González Family                 │
│ Status: ● ACTIVE                                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Completion Checklist                                  │
│ ✅ All payments received from client                    │
│ ⚠️  Pending employee payments: 1 (Juan - $1,500)        │
│ ✅ Final files delivered                                │
│ ✅ No pending feedback                                  │
├─────────────────────────────────────────────────────────┤
│ ⚠️  Cannot archive: 1 employee payment pending          │
│ [Archive Project] (disabled)                            │
└─────────────────────────────────────────────────────────┘
```

**Business Rule:**
- Project can ONLY be archived when all checklist items are ✅
- This ensures no loose ends

---

### 7. **Invoice System with Proper Numbering**

**Current Issue:** Invoices uploaded as files, no structured tracking.

**Recommendation:**

```sql
Invoice (proper invoice table)
├── id (PK)
├── invoice_number (STRING, auto-generated, e.g., "INV-2024-001")
├── project_id (FK → Project)
├── issue_date (DATE)
├── due_date (DATE, issue_date + payment_terms_days)
├── payment_terms_days (INT, e.g., 30 for "Net 30")
├── subtotal (DECIMAL)
├── tax_amount (DECIMAL, optional)
├── total_amount (DECIMAL)
├── amount_paid (DECIMAL, sum of related payments)
├── status (draft | sent | paid | overdue | cancelled)
├── invoice_file_url (STRING, link to PDF)
└── sent_to_client_at (DATETIME, nullable)

Payment (modify to link to invoice)
├── invoice_id (FK → Invoice, nullable for initial payments)
└── ... (rest of existing fields)
```

**Automated Status Updates:**
- Daily job checks: if `due_date < TODAY()` AND `amount_paid < total_amount` → set `status = 'overdue'`
- When `amount_paid >= total_amount` → set `status = 'paid'`

**Notifications:**
- 3 days before due date: "Invoice #INV-2024-001 due in 3 days"
- On due date: "Invoice #INV-2024-001 is due today"
- After due date: "Invoice #INV-2024-001 is overdue by X days"

**Invoice Number Format Options:**
- `INV-2024-001` (year + sequential)
- `INV-DEC-001` (month + sequential)
- `INV-GON-001` (client abbreviation + sequential)

---

### 8. **File Storage Cleanup Policy**

**Issue:** Hidden files accumulate and waste storage.

**Recommendation:**

```sql
Project (add fields)
├── archived_at (DATETIME, nullable)
├── files_cleanup_scheduled_at (DATETIME, nullable)
└── files_cleanup_completed_at (DATETIME, nullable)
```

**Rules:**
1. When project status changes to "archived":
   - Mark `archived_at = current_timestamp`
   - Schedule cleanup: `files_cleanup_scheduled_at = archived_at + 90 days` (3 months grace period)

2. Automated job runs daily:
   - Find projects where `files_cleanup_scheduled_at < NOW()` AND `files_cleanup_completed_at IS NULL`
   - Permanently delete all files with `status = 'hidden'`
   - Mark `files_cleanup_completed_at = NOW()`

3. Before permanent deletion, send email to Admin:
   - "Project X will have hidden files permanently deleted in 7 days. Download if needed."

**Benefits:**
- Keeps storage costs down
- Clear policy on file retention
- Grace period prevents accidental data loss

**Retention Policy:**
- **Active files (approved):** Keep forever
- **Hidden files (old versions):** Delete 90 days after project archived
- **Project archived:** Can reactivate within 90 days, then read-only

---

## 🟢 **OPTIONAL - Low Priority**

### 9. **File Download Tracking**

**When this is useful:**
- Security: Did a file leak? Who downloaded it?
- Client engagement: Has client actually viewed the files?
- Legal: Prove who had access to files

**Implementation (if needed):**

```sql
File_Access_Log
├── id (PK)
├── file_id (FK → File_Document)
├── user_id (FK → Users)
├── action (view | download)
├── timestamp (DATETIME)
└── ip_address (STRING)
```

**Recommendation:** Skip for now unless specific security concerns arise.

---

### 10. **Admin Permission Levels** (Clarification Needed)

**Current Understanding:**
- Only one Admin (Poncho)
- All admins have same permissions

**Question:** Do you need different admin levels in the future?

**Possible Roles:**
- **Super Admin (Poncho):** Full access
- **Project Manager:** Manage projects, approve files, but NOT manage payments
- **Accountant:** Manage payments, but NOT approve creative work
- **Viewer:** Read-only access to reports

**If needed:**
```sql
User_Roles
├── user_id (FK → Users)
├── role (super_admin | project_manager | accountant | viewer)
├── can_create_projects (BOOLEAN)
├── can_approve_files (BOOLEAN)
├── can_manage_payments (BOOLEAN)
├── can_manage_users (BOOLEAN)
└── can_delete_projects (BOOLEAN)
```

**For now:** Assume only one admin (Poncho) with full access.

---

## 📋 **Implementation Priority Summary**

### **Phase 1 - Critical (Implement First):**

1. ✅ **Employee assignment validation** - Prevent assigning to multiple active projects
2. ✅ **Rejection tracking** - Link feedback to rejected files, count revisions
3. ✅ **Client history dashboard** - Show client's full project history and revenue
4. ✅ **Basic audit trail** - Track critical actions (payments, approvals, status changes)

### **Phase 2 - Important (Next):**

5. ✅ **File versioning** - Track v1, v2, v3 with notes and metadata
6. ✅ **Project completion checklist** - Clear criteria before archiving
7. ✅ **Invoice system** - Proper invoice numbering, due dates, overdue tracking
8. ✅ **File cleanup policy** - Auto-delete hidden files 90 days after archiving

### **Phase 3 - Optional (Future):**

9. File download tracking (if security needed)
10. Admin permission levels (if multiple admins needed)

---

## ❓ **Questions to Answer Before Implementation:**

1. **File Versioning:** Should employee manually enter notes explaining what changed? Or optional?

2. **Invoice Numbering:** Preferred format?
   - `INV-2024-001` (year + number)
   - `INV-DEC-001` (month + number)
   - `INV-GON-001` (client code + number)

3. **File Retention:** How long to keep hidden files after project archived?
   - 30 days?
   - 90 days?
   - 6 months?

4. **Payment Terms:** Standard terms?
   - Net 30?
   - Net 60?
   - Or custom per client?

5. **Admin Roles:** Only Poncho as admin, or will there be others with different permissions?

---

## 📊 **Revised System Flow with New Features**

### **Key Changes:**

**Before (Current):**
- Employee submits → Admin approves/rejects
- No clear version tracking
- No client history visibility
- No rejection count

**After (With Improvements):**
- Employee submits v1 → Admin rejects with linked feedback → Employee submits v2 with notes → Admin approves
- Clear version history (v1, v2, v3) with employee notes
- Client profile shows full history across all projects
- Analytics show rejection rates per employee
- Audit trail shows who did what and when

---

Ready to implement? Which phase should we start with?

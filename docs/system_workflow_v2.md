# Complete System Workflow v2.0 - Align Designs Platform

> **Version 2.0** - Updated with improved features: Employee assignment rules, rejection tracking, client history, file versioning, invoice system, and audit trail.

---

## Table of Contents
1. [System Users](#1-system-users)
2. [Project Creation and Initial Setup](#2-project-creation-and-initial-setup)
3. [System Stages](#3-system-stages-workflow-stages)
4. [Content Upload](#4-content-upload)
5. [Main Workflow](#5-main-workflow)
6. [Client → Admin Payment Flow](#6-client--admin-payment-flow)
7. [Project View](#7-project-view)
8. [Analysis System](#8-analysis-system-admin-only)
9. [Restrictions and Validations](#9-restrictions-and-validations)
10. [Database Structure](#10-database-structure---key-relationships)
11. [UI/UX Improvements](#11-uiux-improvements)
12. [Notifications/Alerts](#12-notificationsalerts)
13. [🆕 New Features v2.0](#13-new-features-v20)

---

## 1. System Users

- **Admin** (Poncho) - Single admin with full access
- **Clients** (client role)
- **Employees** (employee role, no specific positions)

---

## 2. Project Creation and Initial Setup

### STEP 1: Admin creates base structure

Admin creates clients in the system, employees, and then creates a project with:

- Name and description
- **ONE** assigned client
- Assigned employees (can be multiple)
- Planned start date
- Deadline/target date
- **Initial amount required** (amount needed to activate project)

**🆕 NEW RULE:** Employees can only be assigned if they are NOT already working on another ACTIVE project.

**Validation:**
- Only employees who do NOT have an active project appear in the selection list
- If an employee is working on another active project, they don't appear as an available option
- Employee becomes available again when their current project is Completed or Archived

### STEP 2: Project in "INACTIVE" status

**Project Status:** `WAITING FOR PAYMENT`

**🆕 AUTOMATIC INVOICE GENERATION:**
When admin creates project with `initialAmountRequired = $8000`:
- ✅ System **automatically creates** Invoice #INV-YYYY-MM-DD-001
- ✅ Invoice is saved in Payments stage
- ✅ Client can immediately see this invoice in their Payments section
- ✅ Invoice status: `PENDING`

**Visual indicators:**
- Badge visible: 🔒 **WAITING FOR PAYMENT**
- Message: *"This project will be activated once the client pays the initial amount of $X"*

**Admin CAN:**
- ✅ Edit project information (name, dates, client, employees, initial amount)
- ✅ View project details
- ✅ Delete project if needed
- ✅ View automatically generated invoice

**Admin CANNOT:**
- ❌ Upload files/links/comments (visually disabled/grayed out)
- ❌ Create stages content

**Client CAN:**
- ✅ View assigned project
- ✅ See payment requirement
- ✅ **View invoice in Payments section**
- ✅ **Upload payment receipts**

**Client CANNOT:**
- ❌ Upload files to other stages (project is locked until activated)

### STEP 3: Client makes initial payment

**🆕 NEW PAYMENT APPROVAL WORKFLOW:**

#### 3.1 Client Uploads Payment Receipt

1. Client enters Payments section and sees their invoice
2. Client clicks **"Upload Payment"** on the invoice
3. **⚠️ CRITICAL WARNING shown to client:**

```
╔═══════════════════════════════════════════════════════╗
║  ⚠️  IMPORTANTE - ANTES DE SUBIR EL COMPROBANTE      ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Por favor, sube el comprobante OFICIAL que te da     ║
║  tu aplicación bancaria usando la opción de           ║
║  "COMPARTIR" después de hacer la transferencia.       ║
║                                                        ║
║  ✅ Correcto: Captura desde "Compartir" del banco    ║
║  ❌ Incorrecto: Foto de la pantalla                   ║
║                                                        ║
║  Esto asegura que el comprobante sea legible y        ║
║  contenga toda la información necesaria.              ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

4. Client fills form:
   - **Payment Method:** Bank Transfer or Check
   - **Amount Paid:** Client enters amount (can be partial)
   - **Payment Date:** Select date
   - **Receipt File:** Upload official bank receipt

5. Upon submission:
   - Payment created with status: `PENDING_APPROVAL`
   - **NOTIFICATION sent to Admin:** "New payment pending review"
   - Client sees: "Your payment is under review"

#### 3.2 Admin Reviews and Approves/Rejects Payment

Admin receives notification and reviews payment with **3 options:**

**Option A - Approve with claimed amount:**
- ✅ Receipt is correct, amount is correct
- ✅ Payment status → `CONFIRMED`
- ✅ Amount added to project's `amountPaid`
- ✅ Invoice updated with payment progress
- ✅ **NOTIFICATION to Client:** "Your payment of $X has been approved"

**Option B - Approve but correct amount:**
- ✅ Receipt is correct, but client entered wrong amount
- ✅ Admin corrects the amount (e.g., client said $3,000 but receipt shows $2,800)
- ✅ Payment status → `CONFIRMED` with corrected amount
- ✅ Corrected amount added to `amountPaid`
- ✅ **NOTIFICATION to Client:** "Your payment has been approved for $2,800 (amount corrected)"

**Option C - Reject payment:**
- ❌ Receipt is not readable / incorrect format
- ❌ Payment status → `REJECTED`
- ❌ Not added to `amountPaid`
- ✅ **NOTIFICATION to Client:** "Your receipt was rejected. Reason: [admin's reason]. Please upload the official receipt using your banking app's SHARE option"
- ✅ Client can re-upload

#### 3.3 Partial Payments Allowed

**Example progression:**
```
Payment 1: $3,000 (Approved) ✅
Payment 2: $2,500 (Approved) ✅
Payment 3: $2,500 (Pending Review) ⏳
------------------------
Total Paid: $5,500 / $8,000 (68.75%)
Remaining: $2,500
```

**Payment Progress Display:**
- Shows: *"Payment progress: $5,500 / $8,000 (68.75%)"*
- Real-time updates as admin approves payments
- Client can make multiple partial payments until complete

#### 3.4 Initial Payment Complete → Project Can Be Activated

**When `amountPaid >= initialAmountRequired`:**
```
Payment 1: $3,000 ✅
Payment 2: $2,500 ✅
Payment 3: $2,500 ✅ (just approved)
------------------------
Total Paid: $8,000 / $8,000 (100%) ✅

🎉 INITIAL PAYMENT COMPLETE!
```

**Automatic actions:**
- ✅ Invoice status → `PAID`
- ✅ **"Activate Project" button enabled** for Admin
- ✅ **NOTIFICATION to Client:** "Initial payment complete! Your project will be activated soon"
- ✅ **NOTIFICATION to Admin:** "Project ready to activate - initial payment complete"

#### 3.5 Admin Activates Project

Admin clicks **"Activate Project"**:
- Status changes: `WAITING_PAYMENT` → `ACTIVE`
- Badge changes to: ● **ACTIVE**
- **NOTIFICATION to Client:** "Your project has been activated! Work has begun"
- **NOTIFICATION to Employees:** "New active project assigned to you"
- Now files/links/comments can be uploaded (according to stage permissions)

> **Note:** Admin can still edit/reduce the initial amount required if they negotiate with client. If reduced below already paid amount, project becomes immediately activatable.

---

## 3. System Stages (Workflow Stages)

**🆕 VISUAL DESIGN: Card/Folder System (Option C)**

Stages are displayed as **clickable cards** with:
- Icon and name
- File count
- Permission badge (Read+Write / Read Only)
- Active indicator

Users **only see stages they have permission to access**. Clicking a stage opens that "folder" to view/manage files.

### 8 Fixed Stages:

1. 📋 **Project Brief**
2. 💬 **Feedback (Client space)**
3. 📝 **Feedback (Employee space)**
4. 🔗 **References**
5. 📤 **Submitted**
6. ✅ **Admin Approved**
7. ⭐ **Client Approved**
8. 💰 **Payments** *(Special: 3 subsections with privacy)*

### Stage Permissions & Visibility:

| Stage | Icon | Admin | Client | Employee | Notes |
|-------|------|-------|--------|----------|-------|
| **Project Brief** | 📋 | R+W ✅ | NO ❌ | R 👁️ | Admin uploads initial specs. Required before employees can work. |
| **Feedback (Client)** | 💬 | R+W ✅ | R+W ✅ | NO ❌ | Client creates feedback. Admin responds. **Client DOES see this stage.** |
| **Feedback (Employee)** | 📝 | R+W ✅ | NO ❌ | R 👁️ | Admin creates feedback for employees. Employees read only. **Client does NOT see this stage.** |
| **References** | 🔗 | R+W ✅ | R+W ✅ | NO ❌ | Client uploads links (Pinterest, Google Drive, etc.). |
| **Submitted** | 📤 | R+W ✅ | NO ❌ | R+W ✅ | Employees submit work. Supports versioning with notes. |
| **Admin Approved** | ✅ | R+W ✅ | NO ❌ | NO ❌ | Admin only. Files approved by admin awaiting client review. |
| **Client Approved** | ⭐ | R+W ✅ | NO ❌ | NO ❌ | Admin only. **Client does NOT see this stage.** Files approved by client. |
| **Payments** | 💰 | R+W ✅ | R* 👁️ | R** 👁️ | *Client: Only THEIR invoices & payments. **Employee: Only THEIR payments. |

**Legend:**
- ✅ Read + Write (full access)
- 👁️ Read Only
- ❌ No Access (stage not even displayed to user)

### 🆕 UI Example - What Each User Sees:

**Admin sees ALL 8 stages:**
```
┌─────────────────────────────────────────────────────────┐
│ Project Sections                                         │
├─────────────────────────────────────────────────────────┤
│ 📋 Project Brief  💬 Client Feedback 📝 Employee Feedback│
│ 3 files           5 files            2 files             │
│ Read + Write      Read + Write       Read + Write        │
│                                                          │
│ 🔗 References     📤 Submitted       ✅ Admin Approved   │
│ 8 files           4 files            12 files            │
│ Read + Write      Read + Write       Read + Write        │
│                                                          │
│ ⭐ Client Approved 💰 Payments                           │
│ 8 files            15 files                              │
│ Read + Write       Read + Write                          │
└─────────────────────────────────────────────────────────┘
```

**Client sees ONLY 3 stages:**
```
┌─────────────────────────────────────────────────────────┐
│ Project Sections                                         │
├─────────────────────────────────────────────────────────┤
│ 💬 Client Feedback 🔗 References    💰 Payments         │
│ 5 files            8 files          3 invoices (theirs) │
│ Read + Write       Read + Write     Read Only           │
│                                                          │
│ (Other stages not shown - no access)                    │
└─────────────────────────────────────────────────────────┘
```

**Employee sees ONLY 4 stages:**
```
┌─────────────────────────────────────────────────────────┐
│ Project Sections                                         │
├─────────────────────────────────────────────────────────┤
│ 📋 Project Brief  📝 Employee Feedback 📤 Submitted     │
│ 3 files           2 files              4 files          │
│ Read Only         Read Only            Read + Write     │
│                                                          │
│ 💰 Payments                                             │
│ 2 payments (theirs only)                                │
│ Read Only                                               │
└─────────────────────────────────────────────────────────┘
```

### Payment Sub-stages (3 Types with Privacy):

The **Payments** stage contains **3 separate subsections**, each with **strict privacy filtering**:

#### 1️⃣ Invoices (Admin → Client)

**Purpose:** Admin creates and tracks invoices sent to clients

**Features:**
- **Auto-generation:** Creating project with `initialAmountRequired` auto-creates invoice
- **Invoice Number:** Auto-generated `INV-2024-12-20-001` format
- **Payment Terms:** Net 15, 30, 60, or custom days
- **Due Date:** Automatically calculated
- **Status Tracking:** Pending, Partially Paid, Paid, Overdue
- **Overdue Detection:** System automatically flags overdue invoices

**Who Sees What:**
- **Admin:** ALL invoices to ALL clients across ALL projects
- **Client:** ONLY their own invoices
- **Employee:** NO access (doesn't see this subsection)

**Client Payment Process:**
1. Client sees invoice in Payments → Invoices tab
2. Client uploads payment receipt with warning about using bank's SHARE feature
3. Payment goes to `PENDING_APPROVAL` status
4. Admin reviews and approves/corrects/rejects
5. Upon approval, invoice shows payment progress
6. When fully paid, invoice status → `PAID`

#### 2️⃣ Client Payments (Client → Admin)

**Purpose:** Track all payments from clients (initial payments, invoice payments, etc.)

**Payment States:**
- `PENDING_APPROVAL` - Client uploaded, awaiting admin review
- `CONFIRMED` - Admin approved payment
- `REJECTED` - Admin rejected, client can re-upload

**Admin Review Options:**
- ✅ Approve with claimed amount
- ✏️ Approve but correct amount
- ❌ Reject (request new receipt)

**Who Sees What:**
- **Admin:** ALL payments from ALL clients
- **Client:** ONLY their own payments
- **Employee:** NO access

**Visible Information:**
- Payment amount (claimed vs. approved)
- Receipt file
- Payment date
- Status
- Admin notes/corrections

#### 3️⃣ Employee Payments (Admin → Employee)

**Purpose:** Track payments from admin to employees for completed work

**Features:**
- Admin uploads transfer receipt + amount + date
- Admin links payment to specific approved file(s)
- Tracks which deliverables are "Pending payment" vs "Paid"
- Shows payment history per employee
- Shows rejection count and approval dates for each file

**Who Sees What:**
- **Admin:** ALL payments to ALL employees
- **Client:** NO access (doesn't see this subsection)
- **Employee:** ONLY their own payments received

**Employee View - Pending Payments:**
```
┌─────────────────────────────────────────────────────────┐
│ MY PENDING PAYMENTS                                      │
├─────────────────────────────────────────────────────────┤
│ ✓ Kitchen Design Final                                  │
│   Approved: Dec 22, 2024                                │
│   Versions: 3 (rejected 2 times)                        │
│   Status: PENDING PAYMENT                               │
│                                                          │
│ ✓ Living Room Layout                                    │
│   Approved: Dec 25, 2024                                │
│   Versions: 1 (approved first try)                      │
│   Status: PENDING PAYMENT                               │
│                                                          │
│ Total Pending: 2 files | Estimated: $5,500             │
└─────────────────────────────────────────────────────────┘
```

**Employee View - Payment History:**
```
┌─────────────────────────────────────────────────────────┐
│ MY PAYMENT HISTORY                                       │
├─────────────────────────────────────────────────────────┤
│ ✅ Bedroom Design | $3,000 | Paid Dec 28, 2024         │
│ ✅ Bathroom Layout | $2,000 | Paid Dec 20, 2024        │
│                                                          │
│ Total Received: $5,000                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Content Upload

### General Rule:
`(FILE || LINK || COMMENT) && STAGE`

### Allowed Types:
- **Files:** PDFs, images, screenshots (max 2GB)
- **Links:** Employees can send links in any allowed stage. Clients can send links **ONLY** in "References" stage
- **Comments:** Free text

### Restrictions:
- ✅ Project must be **ACTIVE**
- ✅ Max 2GB per file
- ✅ Must have write permissions for that stage
- ✅ Links: Employees in any allowed stage, Clients only in "References"

### 🆕 Automatic Information on Upload:
- Upload date and time
- User who uploaded (system identifies if client or employee)
- Assigned stage
- **Version number** (if it's a revision)
- **File metadata:** size, dimensions (for images), format
- **Version notes** (employee can explain what changed)

---

## 5. Main Workflow

### PHASE 1: Project starts (Admin prepares)

**Requirement:** Project must be **ACTIVE** (initial payment received)

1. Admin already spoke with client (outside system)
2. Admin knows initial client requirements
3. **MANDATORY:** Admin uploads initial information/files to **"Project Brief"** stage

> **Important:** Employees **CANNOT** start working until at least 1 file is uploaded to "Project Brief"
> - Message shown to employees: *"⚠️ Waiting for Project Brief. You'll be notified when ready."*

4. Once Project Brief has content, employees can now receive feedback and work

### PHASE 2: Client requests changes/corrections

1. Client reviews progress (admin shows outside system)
2. Client creates **Feedback** in their space (comments/files with corrections)
3. This feedback stays as evidence in client's space
4. Employees **DO NOT** see client's feedback

### PHASE 3: Admin processes and delegates to employees

1. Admin reviews client's feedback (in client's space)
2. Admin creates **NEW** feedback in employee's space (based on client's)

**CRITICAL DATE - Timer starts:**
- System saves date/time when admin creates feedback for employee
- **Special rule for time tracking:**
  - If admin uploads feedback **before 12:00 PM** → Timer starts **next day at 9:00 AM**
  - If admin uploads feedback **after 12:00 PM** → Timer starts **same day at current time**
  - **Note:** Time tracking only counts **days**, not hours/minutes (to be fair to employees)
- Tooltip shown: *"⏱️ Time tracking starts: [Tomorrow 9:00 AM / Today at current time]"*

3. **🆕 NEW: If rejecting a submitted file:**
   - Admin can link this feedback to the specific file being rejected
   - System increments rejection counter on that file
   - Employee sees: "❌ Rejected - See Feedback #123"

4. Employees receive notification and read feedback in their space (read only)
5. Client **DOES NOT** see feedback that admin sends to employees

**Important about multiple feedback cycles:**
- If admin creates Feedback 1 → Employee doesn't submit yet
- Admin creates Feedback 2 → Employee doesn't submit yet
- Admin creates Feedback 3 → Employee finally submits
- **Timer counts from Feedback 1 (first one), not the last one**
- System tracks: *"Started from first feedback on [date]"*

### PHASE 4: Employee works and delivers

1. Employee works on requested changes
2. Employee uploads work to **"Submitted"** stage (file/link/comment)

**🆕 NEW: Version Management:**
- If employee submits multiple versions:
  - v1, v2, v3 automatically tracked
  - Employee can add notes: "Fixed colors and spacing as requested"
  - System shows version history with notes
  - Only current version shows "Approve" button

**CRITICAL DATE - Timer ends:**
- System saves date/time when employee uploads to Submitted

**System automatically calculates:**
- **Time** = (Submitted date) - (First feedback date from admin to this employee)
- **Link:** System relates this submission with the specific feedback cycle via ID
- **🆕 Rejection count:** If file was rejected before, tracks how many times

**Important:**
- Only the **LATEST** file uploaded to Submitted by each employee shows button: *"Approve → Admin Approved"*
- Previous files can be accessed but don't show approve button
- If admin prefers an older version, they can "Hide" the latest version, and the previous one becomes "latest"

### PHASE 5: Admin reviews employee work

1. Admin sees all files in **Submitted**
2. **🆕 Can see version history** with employee notes explaining changes
3. Only the **LAST** file uploaded by an employee has visible option: *"Move to Admin Approved"*

**If does NOT approve:**
- Admin creates new feedback for employee → Returns to **PHASE 3**
- **🆕 Admin links feedback to rejected file**
- **🆕 System increments rejection count**
- New feedback cycle starts
- Timer counts from **FIRST** feedback (if there were previous ones not completed)

**If approves:**
- Admin changes file stage from "Submitted" to "Admin Approved"
- **THREE dates are saved:**
  1. **Original upload date** (when employee uploaded to Submitted)
  2. **Admin approval date** (when admin moved it to Admin Approved) - Admin selects this date
  3. **Client approval date** (will be set later) - Admin will select this too
- System marks file as *"Pending client presentation"*
- **🆕 System logs this action in audit trail**

### PHASE 6: Client reviews approved work

1. Admin presents work to client (outside system)

**If client does NOT approve:**
- Client creates new feedback in their space → Returns to **PHASE 2**

**If client approves:**
- Admin changes stage from "Admin Approved" to "Client Approved"
- **THREE dates now complete:**
  1. Original upload date
  2. Admin approval date
  3. **Client approval date** (when admin moved it to Client Approved) - Admin selects this date
- System automatically marks file as *"Pending payment"* for the employee who uploaded it
- Client **DOES NOT** see "Client Approved" stage (only admin and employee)
- **🆕 System logs approval in audit trail**

### PHASE 7: Payment to employee

1. Admin goes to **"Payments"** stage → **"Employee Payment"**
2. System shows pending payments grouped by employee
3. **🆕 Shows which files are pending payment with rejection history**
4. Admin selects employee
5. System shows list of files *"Pending payment"* for that employee
6. Admin selects which file(s) they're paying
7. Admin uploads:
   - Payment receipt (file)
   - Amount deposited (numeric input)
   - Payment date (calendar/date selector)
8. System links payment with selected file(s) via ID
9. System removes *"Pending payment"* mark from those files
10. **🆕 System logs payment in audit trail**
11. Employee can now see this payment in their "Payments" section and in "Pending Payments" (will show as paid)

---

## 6. Client → Admin Payment Flow

### A. 🆕 Admin generates Invoice (NEW SYSTEM)

1. Admin goes to **"Payments"** stage → **"Invoice"**
2. Admin creates new invoice:
   - **Invoice Number:** Auto-generated `INV-2024-12-20-001`
     - Format: `INV-YEAR-MONTH-DAY-SEQUENCE`
     - Resets sequence daily
   - **Issue Date:** Selected by admin
   - **Payment Terms:** Admin chooses (Net 15, 30, 60, or custom days)
   - **Due Date:** Auto-calculated based on payment terms
   - **Amount:** Subtotal + Tax (optional)
   - **Status:** Draft → Sent → Paid/Overdue

3. Admin can save as draft or send immediately to client
4. **🆕 System automatically tracks:**
   - Days until due
   - Days overdue (if applicable)
   - Payment status
   - Sends notifications before and after due date

### B. Client pays Admin

#### Option 1 - Bank Transfer:
- Client uploads transfer receipt (screenshot/PDF)
- Client enters amount paid
- Client selects payment date (calendar)
- **🆕 Client can link payment to specific invoice**
- System registers payment with that date immediately

#### Option 2 - Check:
- Client enters check amount
- Client selects estimated check date
- Client does **NOT** upload file
- Record stays as *"Pending check confirmation"*
- Admin later:
  - Enters that check record
  - Uploads cashed check receipt (photo/scan)
  - Admin selects/confirms actual payment date
- System now registers payment as confirmed with admin's date

**🆕 When payment is made:**
- If payment >= invoice total → Status changes to "Paid"
- Invoice is marked as settled
- System logs payment in audit trail
- Both admin and client receive confirmation

---

## 7. Project View

### Main Interface with Stage Tabs:

**Navigation:**
```
[Project Brief] [Feedback] [References] [Submitted] [Admin Approved] [Payments]
      (3)          (5)         (2)         (4)           (8)            (12)
```

**Feedback Tab has Sub-tabs:**
- **Client Feedback** (only admin and client see)
- **Employee Feedback** (only admin and employees see)

### Main Table:

**Columns:**
- Type (file/link/comment)
- Name/description
- **🆕 Version** (v1, v2, v3)
- Stage
- User who uploaded
- Upload date
- **🆕 Rejection count** (if rejected)
- **🆕 File metadata** (size, dimensions)
- Actions (according to permissions)

**Stage change functionality (admin only):**
- Option visible only on **LAST** file per employee in "Submitted" → can change to "Admin Approved"
- Option visible only in files in "Admin Approved" → can change to "Client Approved"
- Date selectors appear when changing stages for admin to choose approval dates
- **🆕 Action is logged in audit trail**

**🆕 Version History View:**
```
📄 Kitchen Design Layout
├── v3 (current) - Uploaded Dec 20, 2024 3:45 PM  [Approve]
│   └── 💬 Notes: "Final version with approved colors"
│   └── 📏 1920x1080 | 💾 2.3 MB | 📄 image/jpeg
├── v2 - Uploaded Dec 19, 2024 11:30 AM  [View]
│   └── 💬 Notes: "Fixed color scheme, still need spacing"
│   └── ❌ Rejected 1 time
└── v1 - Uploaded Dec 18, 2024 2:30 PM  [View]
    └── 💬 Notes: "Initial design"
    └── ❌ Rejected 1 time
```

**Hide/Delete functionality:**
- Files can be marked as "Hidden" (don't show in main view but aren't deleted)
- Hidden files can be restored
- **🆕 When project is archived, all hidden files are permanently deleted after 90 days**

---

## 8. Analysis System (Admin only)

### 8.1 Linking Feedback → Submitted → Approvals

**ID Relationship System:**

```
Feedback_Cycle_ID_123
├─ First_Feedback_ID_124 (Admin → Employee 1) [Dec 15, 2025 11:00 AM]
│  └─→ 🆕 Rejected_File_ID_450 (v1) - Kitchen Design
├─ Second_Feedback_ID_125 (Admin → Employee 1) [Dec 16, 2025 2:00 PM]
│  └─→ 🆕 Rejected_File_ID_451 (v2) - Kitchen Design
├─ Third_Feedback_ID_126 (Admin → Employee 1) [Dec 17, 2025 10:00 AM]
└─→ Submitted_ID_456 (Employee 1) [Dec 18, 2025 4:26 PM]
    └─→ 🆕 Version: v3, Rejection Count: 2
     └─→ Admin_Approved_ID_789 [Dec 19, 2025 - selected by admin]
          └─→ Client_Approved_ID_101112 [Dec 20, 2025 - selected by admin]
               └─→ Payment_ID_131415 [$3,000] [Dec 22, 2025 - selected by admin]
```

**Time Calculation:**
- **Start:** First_Feedback_ID_124 date (with 12:00 PM rule applied)
- **End:** Submitted_ID_456 date
- **Time:** 3 days (hours not counted, only days)
- **🆕 Rejection cycles:** 2 (v1 and v2 rejected before v3 approved)

### 8.2 🆕 Enhanced Time tracking per employee per delivery

For each file in "Client Approved":
- Employee who uploaded it
- ID of linked feedback cycle (start date)
- Submitted date (end date)
- Time elapsed (days only)
- **Number of rejections before approval**
- **Total versions submitted** (v1, v2, v3, etc.)
- Associated payment (Payment_ID, amount, date)

**Example Employee 1:**

```
Delivery 1: Kitchen Design
  - Cycle: Feedback Dec 1, 2024 10:00 AM → Submitted Dec 6, 2024 4:00 PM
  - Time: 5 days
  - Versions: 3 (v1, v2 rejected; v3 approved)
  - Rejection count: 2
  - Payment: $3,000 [Dec 10, 2024]

Delivery 2: Living Room
  - Cycle: Feedback Dec 8, 2024 2:00 PM → Submitted Dec 11, 2024 9:00 AM
  - Time: 3 days
  - Versions: 1 (approved first try)
  - Rejection count: 0
  - Payment: $2,000 [Dec 15, 2024]

Delivery 3: Bedroom
  - Cycle: Feedback Dec 12, 2024 9:00 AM → Submitted Dec 16, 2024 5:00 PM
  - Time: 4 days
  - Versions: 2 (v1 rejected; v2 approved)
  - Rejection count: 1
  - Payment: $2,500 [Dec 18, 2024]
------------------------
Total deliveries: 3
Total time: 12 days
Total paid: $7,500
Average per day: $625
🆕 Approved first try: 1 (33%)
🆕 Required revisions: 2 (67%)
🆕 Average rejections per delivery: 1.0
Pending payments: 0
```

### 8.3 🆕 Client payments tracking (Enhanced)

All invoices and payments:

**Invoice Tracking:**
```
Invoice #INV-2024-12-15-001
  Issue Date: Dec 15, 2024
  Due Date: Jan 14, 2025 (Net 30)
  Amount: $5,000
  Status: Paid
  Paid On: Dec 20, 2024 (5 days early)

Invoice #INV-2024-12-18-001
  Issue Date: Dec 18, 2024
  Due Date: Jan 17, 2025 (Net 30)
  Amount: $3,000
  Status: Paid
  Paid On: Dec 22, 2024 (4 days early)

Invoice #INV-2024-12-20-001
  Issue Date: Dec 20, 2024
  Due Date: Jan 4, 2025 (Net 15)
  Amount: $8,000
  Status: Overdue
  Days Overdue: 3

Invoice #INV-2024-12-25-001
  Issue Date: Dec 25, 2024
  Due Date: Jan 24, 2025 (Net 30)
  Amount: $4,700
  Status: Sent (Pending payment)
------------------------
Total invoiced: $20,700
Total paid: $8,000
Total pending: $12,700
Overdue amount: $8,000
Payment reliability: 100% (2/2 paid on time before becoming overdue)
```

### 8.4 Analysis per employee

```
EMPLOYEE 1:
- Approved deliveries: 3
- Total working time: 12 days
- Total paid: $7,500
- Average per day: $625
- Efficiency: $625/day
- 🆕 Approved first try: 1 (33%)
- 🆕 Required revisions: 2 (67%)
- 🆕 Average rejections per delivery: 1.0
- Pending payments: 0

EMPLOYEE 2:
- Approved deliveries: 3
- Total working time: 10 days
- Total paid: $5,800
- Average per day: $580
- Efficiency: $580/day
- 🆕 Approved first try: 2 (67%)
- 🆕 Required revisions: 1 (33%)
- 🆕 Average rejections per delivery: 0.33
- Pending payments: 1 ($1,500)

EMPLOYEE 3:
- Approved deliveries: 3
- Total working time: 8 days
- Total paid: $3,700
- Average per day: $462.50
- Efficiency: $462.50/day
- 🆕 Approved first try: 3 (100%)
- 🆕 Required revisions: 0 (0%)
- 🆕 Average rejections per delivery: 0
- Pending payments: 0
```

### 🆕 8.5 Client History & Analytics (NEW)

**Client Profile Overview:**
```
════════════════════════════════════════
CLIENT: González Family
════════════════════════════════════════
Contact: juan.gonzalez@email.com
Client Since: Jan 2024
Last Project: Dec 2024

Total Projects: 3
  • Active: 1
  • Completed: 2
  • Archived: 0

Financial Summary:
  • Total Revenue: $45,000
  • Total Invoiced: $47,500
  • Outstanding Balance: $2,500
  • Average Project Value: $15,000

Payment Reliability:
  • On-time payments: 19/20 (95%)
  • Late payments: 1
  • Average days to pay: 12 days

Project History:
1. Modern House (Active) - $20,000 - Started Dec 2024
2. Apartment Redesign (Completed) - $15,000 - Jan-Mar 2024
3. Office Logo (Completed) - $10,000 - Nov 2023
```

### 8.6 Global project analysis

```
════════════════════════════════════════
PROJECT INFORMATION
════════════════════════════════════════
Name: Modern House - González Family
Status: ● ACTIVE
Start date: Dec 1, 2024
Deadline: Dec 31, 2024
Last approved delivery: Dec 28, 2024
Actual duration: 27 days

════════════════════════════════════════
EMPLOYEES
════════════════════════════════════════
Total employees: 3
Total approved deliveries: 9
🆕 First-try approvals: 6 (67%)
🆕 Required revisions: 3 (33%)
Total paid to employees: $17,000
Average per employee: $5,666.67

Efficiency ranking:
1. Employee 1: $625/day (33% first-try approval)
2. Employee 2: $580/day (67% first-try approval)
3. Employee 3: $462.50/day (100% first-try approval)

🆕 Quality ranking (by first-try approval rate):
1. Employee 3: 100% approved first try
2. Employee 2: 67% approved first try
3. Employee 1: 33% approved first try

════════════════════════════════════════
CLIENT
════════════════════════════════════════
Total invoiced: $20,700
Total received (confirmed): $19,500
Total pending confirmation: $1,200
🆕 Invoices overdue: $0
🆕 Payment reliability: 95%

════════════════════════════════════════
FINANCIAL RESULTS
════════════════════════════════════════
Gross profit: $2,500 ($19,500 - $17,000)
Current margin: 12.82%
Expected profit: $3,700 ($20,700 - $17,000)
Expected margin: 17.86%

Profit per day: $92.59 ($2,500 / 27 days)

════════════════════════════════════════
COMPLIANCE
════════════════════════════════════════
Met deadline?: YES
Days ahead/behind: +3 days (delivered 3 days early)

════════════════════════════════════════
🆕 PROJECT COMPLETION CHECKLIST
════════════════════════════════════════
✅ All payments received from client
⚠️  Pending employee payments: 1 ($1,500)
✅ Final files delivered
✅ No pending feedback
❌ CANNOT ARCHIVE: 1 employee payment pending
````

**Formulas used:**
- **Gross profit** = Total received from client - Total paid to employees
- **Margin** = (Gross profit / Total received from client) × 100
- **Profit per day** = Gross profit / Actual project duration
- **Efficiency per employee** = Total paid to employee / Time they took
- **🆕 First-try approval rate** = Files approved without rejection / Total files
- **🆕 Payment reliability** = On-time payments / Total payments × 100

---

## 9. Restrictions and Validations

### When creating project:
- ✅ Must have initial amount required
- ✅ Project starts INACTIVE (status: WAITING FOR PAYMENT)
- ✅ Only activates when client pays 100% of initial amount
- ✅ Partial payments allowed and accumulate
- ✅ **🆕 Employees can only be assigned if NOT working on another ACTIVE project**

### When uploading content:
- ✅ Project must be ACTIVE
- ✅ Must have minimum: file OR link OR comment
- ✅ Must have stage (mandatory)
- ✅ Validate write permissions
- ✅ Validate size (max 2GB)
- ✅ Links: Employees in any allowed stage, Clients only in "References"
- ✅ **🆕 If uploading new version, employee can add notes explaining changes**
- ✅ **🆕 System captures file metadata automatically** (size, dimensions, format)

### When changing stage:
- ✅ Only admin can change
- ✅ Only from "Submitted" → "Admin Approved" (and only the latest file per employee)
- ✅ Only from "Admin Approved" → "Client Approved"
- ✅ When changing, save change date without modifying original date
- ✅ Admin selects approval dates when changing stages
- ✅ When changing to "Client Approved" → mark as "Pending payment"
- ✅ **🆕 All stage changes logged in audit trail**

### When registering payment to employee:
- ✅ Must select at least one file "Pending payment"
- ✅ Must upload receipt
- ✅ Must enter amount
- ✅ Must select payment date
- ✅ Link payment with file(s) via ID
- ✅ **🆕 Payment logged in audit trail**

### When creating invoice:
- ✅ **🆕 Invoice number auto-generated:** `INV-YYYY-MM-DD-XXX`
- ✅ **🆕 Must set payment terms** (Net 15, 30, 60, or custom)
- ✅ **🆕 Due date calculated automatically**
- ✅ **🆕 System tracks overdue invoices daily**

### When registering client payment:
- ✅ Transfer: file + amount + date → Confirms immediately
- ✅ Check: amount + estimated date → Stays pending until admin uploads receipt + confirms actual date
- ✅ **🆕 Can link payment to specific invoice**
- ✅ **🆕 Payment logged in audit trail**

### Feedback (Revisions):
- ✅ Client space separate from employee space
- ✅ Each space only visible according to permissions
- ✅ Multiple feedback in same cycle → Timer counts from FIRST one
- ✅ **🆕 Admin can link feedback to specific rejected file**
- ✅ **🆕 System tracks rejection count per file**

### Project Brief:
- ✅ Admin must upload at least 1 file to Project Brief before employees can start working
- ✅ Message shown to employees if empty: "⚠️ Waiting for Project Brief"

### Hidden files:
- ✅ Can be marked as "Hidden" instead of permanently deleted
- ✅ Hidden files can be restored
- ✅ **🆕 When project is archived, all hidden files are permanently deleted after 90 days**
- ✅ **🆕 Admin receives warning email 7 days before deletion**

### 🆕 Project Completion:
- ✅ **Project can only be archived when:**
  - All client payments received
  - All employees paid
  - Final files delivered
  - No pending feedback cycles
- ✅ **System shows completion checklist with blockers**

---

## 10. Database Structure - Key Relationships

```sql
Project
├── id (PK)
├── name
├── description
├── client_id (FK → Users)
├── status (waiting_payment | active | completed | archived)
├── initial_amount_required (DECIMAL)
├── amount_paid (DECIMAL, calculated from payments)
├── start_date (DATE)
├── deadline_date (DATE)
├── created_at
├── 🆕 archived_at (DATETIME, nullable)
├── 🆕 files_cleanup_scheduled_at (DATETIME, nullable, +90 days from archived_at)
├── 🆕 files_cleanup_completed_at (DATETIME, nullable)
└── employees[] (many-to-many → Users via project_employees)

Users
├── id (PK)
├── name
├── email
├── role (admin | client | employee)
├── created_at

File_Document
├── id (PK)
├── project_id (FK → Project)
├── uploaded_by_user_id (FK → Users)
├── stage (project_brief | feedback_client | feedback_employee | references | submitted | admin_approved | client_approved)
├── file_url (nullable, if file)
├── link_url (nullable, if link)
├── comment_text (nullable, if comment)
├── uploaded_at (DATETIME, original upload)
├── approved_admin_at (DATETIME, nullable, admin selects)
├── approved_client_at (DATETIME, nullable, admin selects)
├── related_feedback_cycle_id (FK → Feedback_Cycle, nullable)
├── status (active | hidden | deleted)
├── pending_payment (BOOLEAN)
├── version_number (INT, for tracking multiple submissions)
├── 🆕 version_label (STRING, e.g., "v1", "v2", "v3")
├── 🆕 parent_file_id (FK → File_Document, nullable, links to previous version)
├── 🆕 is_current_version (BOOLEAN)
├── 🆕 file_size_bytes (BIGINT)
├── 🆕 file_mime_type (STRING, e.g., "image/jpeg")
├── 🆕 file_dimensions (STRING, e.g., "1920x1080")
├── 🆕 version_notes (TEXT, employee notes about changes)
├── 🆕 rejection_count (INT, default 0)
├── 🆕 last_rejected_at (DATETIME, nullable)
└── 🆕 last_rejection_feedback_id (FK → Feedback, nullable)

Feedback_Cycle
├── id (PK)
├── project_id (FK → Project)
├── employee_id (FK → Users)
├── start_date (DATETIME, first feedback in cycle with 12PM rule applied)
├── end_date (DATETIME, nullable, when submitted)
├── status (open | submitted | approved | rejected)
└── created_at

Feedback
├── id (PK)
├── feedback_cycle_id (FK → Feedback_Cycle)
├── project_id (FK → Project)
├── created_by_user_id (FK → Users, admin or client)
├── target_audience (client_space | employee_space)
├── file_document_id (FK → File_Document, the actual feedback content)
├── created_at (DATETIME)
├── related_employee_id (FK → Users, if for specific employee)
├── sequence_in_cycle (INT, 1st, 2nd, 3rd feedback in same cycle)
├── �� rejected_file_id (FK → File_Document, nullable, if this feedback rejects a file)
└── 🆕 is_rejection_feedback (BOOLEAN, default false)

🆕 Invoice (NEW TABLE)
├── id (PK)
├── invoice_number (STRING, unique, e.g., "INV-2024-12-20-001")
├── project_id (FK → Project)
├── client_id (FK → Users)
├── issue_date (DATE)
├── due_date (DATE, calculated from issue_date + payment_terms_days)
├── payment_terms_days (INT, e.g., 30 for "Net 30")
├── subtotal (DECIMAL)
├── tax_amount (DECIMAL, optional)
├── total_amount (DECIMAL)
├── amount_paid (DECIMAL, default 0)
├── status (draft | sent | paid | overdue | cancelled)
├── invoice_file_url (TEXT, nullable)
├── notes (TEXT, nullable)
├── sent_to_client_at (DATETIME, nullable)
├── created_at
└── updated_at

Payment
├── id (PK)
├── project_id (FK → Project)
├── type (invoice | employee_payment | initial_payment)
├── from_user_id (FK → Users, who pays)
├── to_user_id (FK → Users, who receives)
├── amount (DECIMAL)
├── payment_method (transfer | check)
├── payment_date (DATE, selected by user/admin)
├── receipt_file_url (nullable)
├── status (confirmed | pending_check_confirmation)
├── created_at
├── 🆕 invoice_id (FK → Invoice, nullable)
└── related_files[] (many-to-many → File_Document via payment_file_links)

Time_Tracking
├── id (PK)
├── project_id (FK → Project)
├── employee_id (FK → Users)
├── feedback_cycle_id (FK → Feedback_Cycle)
├── start_time (DATETIME, from first feedback in cycle)
├── end_time (DATETIME, from submitted file)
├── duration_days (INT, calculated)
├── approved_file_id (FK → File_Document, the client approved file)
├── payment_id (FK → Payment, nullable until paid)
├── 🆕 rejection_count (INT, how many times rejected before approval)
└── 🆕 version_count (INT, how many versions submitted)

🆕 Audit_Log (NEW TABLE)
├── id (PK)
├── user_id (FK → Users)
├── action (STRING, e.g., "payment_created", "file_approved", "project_archived")
├── entity_type (STRING, e.g., "Payment", "File_Document", "Project")
├── entity_id (INT)
├── old_value (JSON, nullable)
├── new_value (JSON, nullable)
├── ip_address (STRING, optional)
├── user_agent (TEXT, optional)
└── created_at (DATETIME)

🆕 Client_Analytics (VIEW - calculated)
├── client_id (FK → Users)
├── client_name
├── client_email
├── total_projects (INT)
├── active_projects (INT)
├── completed_projects (INT)
├── archived_projects (INT)
├── total_paid (DECIMAL)
├── total_invoiced (DECIMAL)
├── outstanding_balance (DECIMAL)
├── average_project_value (DECIMAL)
├── first_project_date (DATE)
├── last_project_date (DATE)
├── on_time_payments (INT)
├── total_payment_count (INT)
└── payment_reliability_score (DECIMAL, percentage)
```

---

## 11. UI/UX Improvements

### Admin Dashboard:

```
┌─────────────────────────────────────────────┐
│ PROJECT: Modern House - González Family      │
│ Status: ● ACTIVE                             │
│ Progress: 67% complete                       │
├─────────────────────────────────────────────┤
│ 📊 Quick Stats                               │
│ • Invoiced: $20,700 / Paid: $19,500         │
│ • Paid to employees: $17,000                │
│ • Pending employee payments: 1              │
│ • Days until deadline: 3 days               │
│ • 🆕 Overdue invoices: $0                   │
├─────────────────────────────────────────────┤
│ ⚡ Actions Needed                            │
│ • 2 files in Submitted awaiting review      │
│ • 1 check payment needs confirmation        │
│ • 🆕 Invoice #INV-2024-12-20-001 due in 5d │
├─────────────────────────────────────────────┤
│ 🆕 📋 Recent Activity                        │
│ • 2h ago - Admin approved Kitchen Design v3  │
│ • 3h ago - Client uploaded payment ($5,000) │
│ • 1d ago - Employee submitted Living Room   │
│                                             │
│ [View Full Audit Log]                       │
└─────────────────────────────────────────────┘
```

### 🆕 Client Profile Page:

```
┌─────────────────────────────────────────────┐
│ CLIENT: González Family                      │
│ 📧 juan.gonzalez@email.com                  │
├─────────────────────────────────────────────┤
│ 📊 Overview                                  │
│ • Total Projects: 3 (2 done, 1 active)      │
│ • Total Revenue: $45,000                    │
│ • Outstanding: $2,500                       │
│ • Payment Reliability: 95% (19/20 on-time) │
│ • Client Since: Jan 2024                    │
├─────────────────────────────────────────────┤
│ 📋 Project History                           │
│ 1. Modern House      Active    $20K         │
│ 2. Apartment         Done      $15K         │
│ 3. Office Logo       Done      $10K         │
│                                             │
│ [View Details]                              │
└─────────────────────────────────────────────┘
```

### Stage Flow Visualization:

```
[Project Brief] → [Feedback] → [Submitted] → [Admin Approved] → [Client Approved]
     ✓ (3)          ✓ (5)        ! (2)            ✓ (4)              ✓ (8)
                                   ↓
                            [Review Now]
```

### Employee Pending Payments View:

```
┌─────────────────────────────────────────────┐
│ YOUR PENDING PAYMENTS                        │
├─────────────────────────────────────────────┤
│ ✓ Modern Living Room Design                 │
│   Approved: Dec 20, 2024                    │
│   Status: Pending payment                   │
│   🆕 Versions: 1 (approved first try)       │
│                                             │
│ ✓ Kitchen Layout - Final Version           │
│   Approved: Dec 22, 2024                    │
│   Status: Pending payment                   │
│   🆕 Versions: 3 (rejected 2 times)         │
│                                             │
│ Total pending: 2 deliveries                 │
└─────────────────────────────────────────────┘
```

### 🆕 Invoice Management View:

```
┌─────────────────────────────────────────────────────────┐
│ INVOICES - Modern House Project                         │
├─────────────────────────────────────────────────────────┤
│ INV-2024-12-15-001                                      │
│ • Amount: $5,000 | Due: Jan 14, 2025                   │
│ • Status: ✅ Paid (Dec 20) - 5 days early              │
│                                                         │
│ INV-2024-12-20-001                                      │
│ • Amount: $8,000 | Due: Jan 4, 2025                    │
│ • Status: ⚠️ OVERDUE - 3 days late                     │
│                                                         │
│ INV-2024-12-25-001                                      │
│ • Amount: $4,700 | Due: Jan 24, 2025                   │
│ • Status: 📤 Sent - Due in 15 days                     │
│                                                         │
│ [Create New Invoice]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Notifications/Alerts

### For Admin:
- 🔔 "New feedback from client"
- 🔔 "Employee submitted work for review"
- 🔔 "Payment received from client"
- ⚠️ "Deadline approaching (3 days left)"
- ⏰ "Check payment pending confirmation"
- 🆕 "Invoice #INV-2024-12-20-001 due in 3 days"
- 🆕 "Invoice #INV-2024-12-18-001 is now overdue"
- 🆕 "Project ready to archive (all checklist items complete)"
- 🆕 "Hidden files will be deleted in 7 days"

### For Employee:
- 🔔 "New feedback assigned to you"
- ✅ "Your work was approved!"
- 💰 "Payment received: $3,000"
- 📋 "Project Brief uploaded - you can start working"
- 🆕 "Your submission was rejected - See Feedback #123"

### For Client:
- ✅ "Project activated! Work has started"
- 🔔 "New update ready for review"
- ✅ "Final work approved and delivered"
- ⏰ "Initial payment received - Project activating..."
- 🆕 "Invoice #INV-2024-12-20-001 is ready"
- 🆕 "Invoice #INV-2024-12-20-001 is due in 3 days"
- 🆕 "Invoice #INV-2024-12-18-001 is overdue"

---

## 13. 🆕 New Features v2.0

### Summary of Major Improvements:

#### 1. **Employee Assignment Rules**
- ✅ Employees can only work on ONE active project at a time
- ✅ System prevents assigning busy employees
- ✅ Visual indicators show current project assignment

#### 2. **Rejection Tracking & Quality Metrics**
- ✅ Admin can link feedback to rejected files
- ✅ System counts how many times each file was rejected
- ✅ Employee sees rejection history on their submissions
- ✅ Analytics show first-try approval rates per employee
- ✅ Quality ranking based on rejection rates

#### 3. **Client History & Relationship Management**
- ✅ Complete client profile with all projects
- ✅ Total revenue per client across all projects
- ✅ Payment reliability scoring
- ✅ Outstanding balance tracking
- ✅ Top clients dashboard widget

#### 4. **File Versioning System**
- ✅ Automatic version numbering (v1, v2, v3)
- ✅ Employee can add notes explaining changes
- ✅ Complete version history with notes
- ✅ File metadata capture (size, dimensions, format)
- ✅ Easy comparison between versions

#### 5. **Professional Invoice System**
- ✅ Auto-generated invoice numbers: `INV-2024-12-20-001`
- ✅ Flexible payment terms (Net 15, 30, 60, custom)
- ✅ Automatic due date calculation
- ✅ Overdue invoice detection and notifications
- ✅ Invoice status tracking (Draft, Sent, Paid, Overdue)
- ✅ Payment linking to invoices

#### 6. **Audit Trail & Accountability**
- ✅ Complete log of all critical actions
- ✅ Track who did what and when
- ✅ Payment creation/modification logging
- ✅ File approval tracking
- ✅ Project status change history
- ✅ Recent activity dashboard widget

#### 7. **Project Completion Management**
- ✅ Clear checklist before archiving
- ✅ Prevents archiving with pending items
- ✅ Shows specific blockers
- ✅ Automated file cleanup after 90 days
- ✅ Warning notifications before deletion

#### 8. **Enhanced Analytics**
- ✅ Rejection rates per employee
- ✅ First-try approval percentages
- ✅ Version count tracking
- ✅ Quality vs speed comparison
- ✅ Client payment reliability metrics
- ✅ Overdue invoice tracking

---

## Changes from v1.0 to v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Employee assignment | Can assign to multiple projects | ✅ Only 1 active project per employee |
| Rejection tracking | No formal tracking | ✅ Linked to feedback with count |
| Client history | No cross-project view | ✅ Complete client profile & analytics |
| File versions | Manual tracking | ✅ Automatic versioning with notes |
| Invoice system | File uploads only | ✅ Structured invoices with auto-numbering |
| Payment terms | Not tracked | ✅ Flexible terms with due dates |
| Overdue tracking | Manual | ✅ Automatic detection & notifications |
| Audit trail | None | ✅ Complete action logging |
| Project completion | Unclear criteria | ✅ Checklist with blockers |
| File cleanup | Manual | ✅ Automated after 90 days |
| Quality metrics | Not measured | ✅ Rejection rates & first-try approvals |
| Version notes | Not available | ✅ Employee can explain changes |

---

## Implementation Priority

### Phase 1 - Critical (Implement First):
1. ✅ Employee assignment validation
2. ✅ Rejection tracking & feedback linking
3. ✅ Client history dashboard
4. ✅ Basic audit trail

### Phase 2 - Important (Next):
5. ✅ File versioning with notes & metadata
6. ✅ Project completion checklist
7. ✅ Invoice system with auto-numbering
8. ✅ File cleanup policy (90 days)

---

**End of System Workflow v2.0**

> For implementation details and code examples, see `docs/final_requirements.md`

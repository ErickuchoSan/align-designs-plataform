# Complete System Workflow - Align Designs Platform

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

---

## 1. System Users

- **Admin** (Poncho)
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

### STEP 2: Project in "INACTIVE" status

**Project Status:** `WAITING FOR PAYMENT`

**Visual indicators:**
- Badge visible: 🔒 **WAITING FOR PAYMENT**
- Message: *"This project will be activated once the client pays the initial amount of $X"*

**Admin CAN:**
- ✅ Edit project information (name, dates, client, employees, initial amount)
- ✅ View project details
- ✅ Delete project if needed

**Admin CANNOT:**
- ❌ Upload files/links/comments (visually disabled/grayed out)
- ❌ Create stages content

**Client CAN:**
- ✅ View assigned project
- ✅ See payment requirement

**Client CANNOT:**
- ❌ Upload anything (project is locked)

### STEP 3: Client makes initial payment

1. Client enters the project
2. System shows modal: *"Initial payment of $X required to activate this project"*
3. Client clicks **"Make Payment"**
4. Modal opens with payment options:

#### Option A - Bank Transfer:
- Upload receipt (screenshot/PDF)
- Enter amount
- Select payment date (calendar)
- Upon saving, payment counts immediately
- System accumulates payments

#### Option B - Check:
- Enter check amount
- Select estimated check date
- Client does **NOT** upload file
- Record stays as *"Pending check confirmation"*
- Admin later:
  - Enters that check record
  - Uploads check receipt (photo/scan)
  - Confirms/selects actual payment date
- System now registers payment as confirmed

**Payment Progress:**
- Shows: *"Payment progress: $2,000 / $5,000 (40%)"*
- Allows partial payments
- Accumulates all payments (transfers + confirmed checks)

**Once initial amount is 100% covered → Project ACTIVATES automatically**
- Status changes to: ✅ **ACTIVE**
- Badge changes to: ● **ACTIVE**
- Now files/links/comments can be uploaded (according to stage permissions)

> **Note:** Admin can still edit/reduce the initial amount required if they negotiate with client.

---

## 3. System Stages (Workflow Stages)

### 7 Fixed Stages:

1. **Project Brief**
2. **Feedback (Client space)**
3. **Feedback (Employee space)**
4. **References**
5. **Submitted**
6. **Admin Approved**
7. **Client Approved**
8. **Payments**

### Stage Permissions:

| Stage | Admin | Client | Employee | Notes |
|-------|-------|--------|----------|-------|
| **Project Brief** | Read + Write | NO access | Read only | Admin uploads initial specs. Required before employees can work. |
| **Feedback (Client)** | Read + Write | Read + Write | NO access | Client creates feedback. Admin responds. Separate space from employee feedback. |
| **Feedback (Employee)** | Read + Write | NO access | Read only | Admin creates feedback for employees. Employees can only read. Separate space from client feedback. |
| **References** | Read + Write | Read + Write | NO access | Client can upload links (Google, visual references). |
| **Submitted** | Read + Write | NO access | Read + Write | Employees submit work here. |
| **Admin Approved** | Read + Write | NO access | NO access | Admin only. Files approved by admin. |
| **Client Approved** | Read + Write | NO access | NO access | Admin only (can write). Client does NOT see this stage. |
| **Payments** | Read + Write | Read + Write (invoices/payments only) | Read (only their payments) | Separated by payment type. |

### Payment Sub-stages:

#### Invoices (Admin → Client):
- Admin uploads invoices
- Client uploads payment receipts (transfer with file + amount + date, or check with amount + date)
- If check, admin uploads receipt later + confirms date
- **Visible to:** Admin and Client only

#### Employee Payments (Admin → Employee):
- Admin uploads transfer receipt + amount + date
- Admin selects which file(s) "Pending payment" they're paying
- **Visible to:** Admin and specific employee receiving payment

#### Pending Payments (Employee view):
- Employee sees list of files approved by client that don't have associated payment yet
- Gives transparency to employee about what's pending

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

### Automatic Information on Upload:
- Upload date and time
- User who uploaded (system identifies if client or employee)
- Assigned stage

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

3. Employees receive notification and read feedback in their space (read only)
4. Client **DOES NOT** see feedback that admin sends to employees

**Important about multiple feedback cycles:**
- If admin creates Feedback 1 → Employee doesn't submit yet
- Admin creates Feedback 2 → Employee doesn't submit yet
- Admin creates Feedback 3 → Employee finally submits
- **Timer counts from Feedback 1 (first one), not the last one**
- System tracks: *"Started from first feedback on [date]"*

### PHASE 4: Employee works and delivers

1. Employee works on requested changes
2. Employee uploads work to **"Submitted"** stage (file/link/comment)

**CRITICAL DATE - Timer ends:**
- System saves date/time when employee uploads to Submitted

**System automatically calculates:**
- **Time** = (Submitted date) - (First feedback date from admin to this employee)
- **Link:** System relates this submission with the specific feedback cycle via ID

**Important:**
- Only the **LATEST** file uploaded to Submitted by each employee shows button: *"Approve → Admin Approved"*
- Previous files can be accessed but don't show approve button
- If admin prefers an older version, they can "Hide" the latest version, and the previous one becomes "latest"

### PHASE 5: Admin reviews employee work

1. Admin sees all files in **Submitted**
2. Only the **LAST** file uploaded by an employee has visible option: *"Move to Admin Approved"*

**If does NOT approve:**
- Admin creates new feedback for employee → Returns to **PHASE 3**
- New feedback cycle starts
- Timer counts from **FIRST** feedback (if there were previous ones not completed)

**If approves:**
- Admin changes file stage from "Submitted" to "Admin Approved"
- **THREE dates are saved:**
  1. **Original upload date** (when employee uploaded to Submitted)
  2. **Admin approval date** (when admin moved it to Admin Approved) - Admin selects this date
  3. **Client approval date** (will be set later) - Admin will select this too
- System marks file as *"Pending client presentation"*

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

### PHASE 7: Payment to employee

1. Admin goes to **"Payments"** stage → **"Employee Payment"**
2. System shows pending payments grouped by employee
3. Admin selects employee
4. System shows list of files *"Pending payment"* for that employee
5. Admin selects which file(s) they're paying
6. Admin uploads:
   - Payment receipt (file)
   - Amount deposited (numeric input)
   - Payment date (calendar/date selector)
7. System links payment with selected file(s) via ID
8. System removes *"Pending payment"* mark from those files
9. Employee can now see this payment in their "Payments" section and in "Pending Payments" (will show as paid)

---

## 6. Client → Admin Payment Flow

### A. Admin generates Invoice

1. Admin goes to **"Payments"** stage → **"Invoice"**
2. Admin uploads invoice with template of total to charge
3. Only admin and client see this information

### B. Client pays Admin

#### Option 1 - Bank Transfer:
- Client uploads transfer receipt (screenshot/PDF)
- Client enters amount paid
- Client selects payment date (calendar)
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
- Stage
- User who uploaded
- Upload date
- Actions (according to permissions)

**Stage change functionality (admin only):**
- Option visible only on **LAST** file per employee in "Submitted" → can change to "Admin Approved"
- Option visible only in files in "Admin Approved" → can change to "Client Approved"
- Date selectors appear when changing stages for admin to choose approval dates

**Hide/Delete functionality:**
- Files can be marked as "Hidden" (don't show in main view but aren't deleted)
- Hidden files can be restored
- When project is completed/archived, all hidden files are permanently deleted

---

## 8. Analysis System (Admin only)

### 8.1 Linking Feedback → Submitted → Approvals

**ID Relationship System:**

```
Feedback_Cycle_ID_123
├─ First_Feedback_ID_124 (Admin → Employee 1) [Dec 15, 2025 11:00 AM]
├─ Second_Feedback_ID_125 (Admin → Employee 1) [Dec 16, 2025 2:00 PM]
├─ Third_Feedback_ID_126 (Admin → Employee 1) [Dec 17, 2025 10:00 AM]
└─→ Submitted_ID_456 (Employee 1) [Dec 18, 2025 4:26 PM]
     └─→ Admin_Approved_ID_789 [Dec 19, 2025 - selected by admin]
          └─→ Client_Approved_ID_101112 [Dec 20, 2025 - selected by admin]
               └─→ Payment_ID_131415 [$3,000] [Dec 22, 2025 - selected by admin]
```

**Time Calculation:**
- **Start:** First_Feedback_ID_124 date (with 12:00 PM rule applied)
- **End:** Submitted_ID_456 date
- **Time:** 3 days (hours not counted, only days)

### 8.2 Time tracking per employee per delivery

For each file in "Client Approved":
- Employee who uploaded it
- ID of linked feedback cycle (start date)
- Submitted date (end date)
- Time elapsed (days only)
- Associated payment (Payment_ID, amount, date)

**Example Employee 1:**

```
Delivery 1:
  - Cycle: Feedback Dec 1, 2024 10:00 AM → Submitted Dec 6, 2024 4:00 PM
  - Time: 5 days
  - Payment: $3,000 [Dec 10, 2024]

Delivery 2:
  - Cycle: Feedback Dec 8, 2024 2:00 PM → Submitted Dec 11, 2024 9:00 AM
  - Time: 3 days
  - Payment: $2,000 [Dec 15, 2024]

Delivery 3:
  - Cycle: Feedback Dec 12, 2024 9:00 AM → Submitted Dec 16, 2024 5:00 PM
  - Time: 4 days
  - Payment: $2,500 [Dec 18, 2024]
------------------------
Total deliveries: 3
Total time: 12 days
Total paid: $7,500
Average per day: $625
Pending payments: 0
```

### 8.3 Client payments tracking

All payments in **Payments → Invoices:**
- Payment date (selected by client or admin depending on transfer/confirmed check)
- Amount
- Type (transfer/check)
- Status (confirmed/pending check confirmation)

**Example:**

```
Payment 1: Dec 15, 2024 - $3,000 (Transfer) [Confirmed]
Payment 2: Dec 18, 2024 - $2,500 (Transfer) [Confirmed]
Payment 3: Dec 20, 2024 - $6,000 (Check) [Confirmed - Admin uploaded receipt]
Payment 4: Dec 22, 2024 - $8,000 (Transfer) [Confirmed]
Payment 5: Dec 25, 2024 - $1,200 (Check) [Pending - Client indicated amount, admin hasn't confirmed]
------------------------
Total confirmed: $19,500
Total pending: $1,200
Total expected: $20,700
```

### 8.4 Analysis per employee

```
EMPLOYEE 1:
- Approved deliveries: 3
- Total working time: 12 days
- Total paid: $7,500
- Average per day: $625
- Efficiency: $625/day
- Pending payments: 0

EMPLOYEE 2:
- Approved deliveries: 3
- Total working time: 10 days
- Total paid: $5,800
- Average per day: $580
- Efficiency: $580/day
- Pending payments: 1 ($1,500)

EMPLOYEE 3:
- Approved deliveries: 3
- Total working time: 8 days
- Total paid: $3,700
- Average per day: $462.50
- Efficiency: $462.50/day
- Pending payments: 0
```

### 8.5 Global project analysis

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
Total paid to employees: $17,000
Average per employee: $5,666.67

Efficiency ranking:
1. Employee 1: $625/day
2. Employee 2: $580/day
3. Employee 3: $462.50/day

════════════════════════════════════════
CLIENT
════════════════════════════════════════
Total received (confirmed): $19,500
Total pending confirmation: $1,200
Total expected: $20,700

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
EFFICIENCY PER EMPLOYEE
════════════════════════════════════════
[Detailed table from section 8.4]
```

**Formulas used:**
- **Gross profit** = Total received from client - Total paid to employees
- **Margin** = (Gross profit / Total received from client) × 100
- **Profit per day** = Gross profit / Actual project duration
- **Efficiency per employee** = Total paid to employee / Time they took
- **Most profitable employee** = Lowest cost per day worked

---

## 9. Restrictions and Validations

### When creating project:
- ✅ Must have initial amount required
- ✅ Project starts INACTIVE (status: WAITING FOR PAYMENT)
- ✅ Only activates when client pays 100% of initial amount
- ✅ Partial payments allowed and accumulate

### When uploading content:
- ✅ Project must be ACTIVE
- ✅ Must have minimum: file OR link OR comment
- ✅ Must have stage (mandatory)
- ✅ Validate write permissions
- ✅ Validate size (max 2GB)
- ✅ Links: Employees in any allowed stage, Clients only in "References"

### When changing stage:
- ✅ Only admin can change
- ✅ Only from "Submitted" → "Admin Approved" (and only the latest file per employee)
- ✅ Only from "Admin Approved" → "Client Approved"
- ✅ When changing, save change date without modifying original date
- ✅ Admin selects approval dates when changing stages
- ✅ When changing to "Client Approved" → mark as "Pending payment"

### When registering payment to employee:
- ✅ Must select at least one file "Pending payment"
- ✅ Must upload receipt
- ✅ Must enter amount
- ✅ Must select payment date
- ✅ Link payment with file(s) via ID

### When registering client payment:
- ✅ Transfer: file + amount + date → Confirms immediately
- ✅ Check: amount + estimated date → Stays pending until admin uploads receipt + confirms actual date

### Feedback (Revisions):
- ✅ Client space separate from employee space
- ✅ Each space only visible according to permissions
- ✅ Multiple feedback in same cycle → Timer counts from FIRST one

### Project Brief:
- ✅ Admin must upload at least 1 file to Project Brief before employees can start working
- ✅ Message shown to employees if empty: "⚠️ Waiting for Project Brief"

### Hidden files:
- ✅ Can be marked as "Hidden" instead of permanently deleted
- ✅ Hidden files can be restored
- ✅ When project completes/archives, all hidden files are permanently deleted

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
└── version_number (INT, for tracking multiple submissions)

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
└── sequence_in_cycle (INT, 1st, 2nd, 3rd feedback in same cycle)

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
└── payment_id (FK → Payment, nullable until paid)
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
│ • Paid by client: $19,500 / $20,700         │
│ • Paid to employees: $17,000                │
│ • Pending employee payments: 1              │
│ • Days until deadline: 3 days               │
├─────────────────────────────────────────────┤
│ ⚡ Actions Needed                            │
│ • 2 files in Submitted awaiting review      │
│ • 1 check payment needs confirmation        │
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
│                                             │
│ ✓ Kitchen Layout - Final Version           │
│   Approved: Dec 22, 2024                    │
│   Status: Pending payment                   │
│                                             │
│ Total pending: 2 deliveries                 │
└─────────────────────────────────────────────┘
```

---

## 12. Notifications/Alerts

### For Admin:
- 🔔 "New feedback from client"
- 🔔 "Employee submitted work for review"
- 🔔 "Payment received from client"
- ⚠️ "Deadline approaching (3 days left)"
- ⏰ "Check payment pending confirmation"

### For Employee:
- 🔔 "New feedback assigned to you"
- ✅ "Your work was approved!"
- 💰 "Payment received: $3,000"
- 📋 "Project Brief uploaded - you can start working"

### For Client:
- ✅ "Project activated! Work has started"
- 🔔 "New update ready for review"
- ✅ "Final work approved and delivered"
- ⏰ "Initial payment received - Project activating..."

---

## Summary of Key Changes from Spanish Version

- ✅ "Categorías" → "Stages" (more intuitive for workflow)
- ✅ "Redlines" → "Feedback" (more universal term)
- ✅ "Inspiration" → "References" (clearer purpose)
- ✅ "Revised" → "Submitted" (more accurate, "revised" sounds already reviewed)
- ✅ "Aproved for Admin/Client" → "Admin Approved/Client Approved" (natural English)
- ✅ Client does NOT see "Client Approved" stage (only admin and employee see it)
- ✅ Time tracking only counts days (not hours/minutes) for fairness
- ✅ Timer starts from FIRST feedback in cycle, not last
- ✅ Only latest file per employee can be approved (others can be hidden)
- ✅ All approval dates selected by admin (not automatic timestamps)
- ✅ Partial payments allowed for initial amount
- ✅ Project Brief required before employees can start
- ✅ Employee can see "Pending Payments" section for transparency
- ✅ Hidden files deleted permanently when project completes

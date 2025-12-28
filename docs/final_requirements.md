# Final Requirements - Confirmed Features to Implement

## ✅ **Decisiones Confirmadas**

### 1. **Versionado de Archivos**
- ✅ Empleado PUEDE agregar notas explicando qué cambió en cada versión
- ✅ Metadata automática (dimensiones, tamaño, formato)
- ✅ Borrar archivos ocultos 90 días después de archivar proyecto

### 2. **Sistema de Facturas**
- ✅ Numeración: `INV-YYYY-MM-DD-001` (año-mes-día-número secuencial)
  - Ejemplo: `INV-2024-12-20-001`, `INV-2024-12-20-002`, etc.
- ✅ Términos de pago: **Admin decide por factura** (flexible por cliente)
  - Admin puede poner: 15 días, 30 días, 60 días, o fecha específica
- ✅ Tracking de facturas vencidas

### 3. **Roles de Admin**
- ✅ Solo UN admin (Poncho)
- ✅ No necesita múltiples niveles de permisos por ahora

---

## 🔴 **FASE 1 - CRÍTICO (Implementar Primero)**

### 1. Employee Assignment Validation

**Regla de Negocio:**
- Un empleado solo puede estar asignado a UN proyecto ACTIVO a la vez
- No puede asignarse a nuevo proyecto hasta que el actual esté Completado o Archivado

**Implementación:**

```typescript
// Validation when assigning employee to project
async function canAssignEmployee(employeeId: string, newProjectId: string): Promise<{
  canAssign: boolean;
  reason?: string;
  currentProject?: Project;
}> {
  const activeProjects = await db.query(`
    SELECT p.* FROM projects p
    JOIN project_employees pe ON p.id = pe.project_id
    WHERE pe.employee_id = $1
    AND p.status = 'active'
    AND p.id != $2
  `, [employeeId, newProjectId]);

  if (activeProjects.length > 0) {
    return {
      canAssign: false,
      reason: 'Employee is already assigned to an active project',
      currentProject: activeProjects[0]
    };
  }

  return { canAssign: true };
}
```

**UI:**
```tsx
// When admin selects employee for new project
{employees.map(emp => (
  <EmployeeCard key={emp.id}>
    <span>{emp.name}</span>
    {emp.hasActiveProject && (
      <Badge color="warning">
        ⚠️ Currently on: {emp.currentProjectName}
      </Badge>
    )}
  </EmployeeCard>
))}

// Validation message
"Cannot assign {employee.name}. They are currently working on '{currentProject.name}'.
Please wait until that project is completed or remove them from it first."
```

---

### 2. Rejection Tracking & Feedback Linking

**Schema Updates:**

```sql
-- Add to File_Document table
ALTER TABLE file_documents ADD COLUMN rejection_count INTEGER DEFAULT 0;
ALTER TABLE file_documents ADD COLUMN last_rejected_at TIMESTAMP;
ALTER TABLE file_documents ADD COLUMN last_rejection_feedback_id INTEGER REFERENCES feedback(id);

-- Add to Feedback table
ALTER TABLE feedback ADD COLUMN rejected_file_id INTEGER REFERENCES file_documents(id);
ALTER TABLE feedback ADD COLUMN is_rejection_feedback BOOLEAN DEFAULT false;
```

**Workflow Implementation:**

```typescript
// When admin creates feedback for employee after submission
interface CreateEmployeeFeedbackDTO {
  projectId: string;
  employeeId: string;
  content: string; // or file_id for feedback content
  isRejectionFeedback: boolean;
  rejectedFileId?: string; // if isRejectionFeedback = true
}

async function createEmployeeFeedback(data: CreateEmployeeFeedbackDTO) {
  // Create feedback cycle if doesn't exist
  let cycle = await findOpenFeedbackCycle(data.projectId, data.employeeId);

  if (!cycle) {
    cycle = await createFeedbackCycle({
      projectId: data.projectId,
      employeeId: data.employeeId,
      startDate: calculateStartDate(new Date()), // 12PM rule
      status: 'open'
    });
  }

  // Create feedback
  const feedback = await db.feedback.create({
    feedbackCycleId: cycle.id,
    projectId: data.projectId,
    createdByUserId: currentUser.id,
    targetAudience: 'employee_space',
    relatedEmployeeId: data.employeeId,
    isRejectionFeedback: data.isRejectionFeedback,
    rejectedFileId: data.rejectedFileId
  });

  // If rejection, update file
  if (data.isRejectionFeedback && data.rejectedFileId) {
    await db.fileDocuments.update(data.rejectedFileId, {
      rejectionCount: { increment: 1 },
      lastRejectedAt: new Date(),
      lastRejectionFeedbackId: feedback.id
    });
  }

  return feedback;
}
```

**UI - Create Feedback Form:**

```tsx
<Form onSubmit={handleCreateFeedback}>
  <FileUpload
    label="Upload feedback document or comment"
    onChange={setFeedbackContent}
  />

  <Checkbox
    label="This feedback is rejecting a submitted file"
    checked={isRejection}
    onChange={setIsRejection}
  />

  {isRejection && (
    <Select
      label="Which file are you rejecting?"
      options={submittedFiles.map(f => ({
        value: f.id,
        label: `${f.name} - Submitted ${formatDate(f.uploadedAt)}`
      }))}
      onChange={setRejectedFileId}
    />
  )}

  <Button type="submit">Send Feedback to Employee</Button>
</Form>
```

**UI - Employee View:**

```tsx
// File in "Submitted" stage with rejection
<FileCard file={file}>
  <FileIcon type={file.type} />
  <FileInfo>
    <h4>{file.name}</h4>
    <span>Uploaded {formatDate(file.uploadedAt)}</span>

    {file.rejectionCount > 0 && (
      <Badge color="error">
        ❌ Rejected {file.rejectionCount} time{file.rejectionCount > 1 ? 's' : ''}
      </Badge>
    )}

    {file.lastRejectionFeedbackId && (
      <Link to={`/feedback/${file.lastRejectionFeedbackId}`}>
        View Rejection Feedback →
      </Link>
    )}
  </FileInfo>
</FileCard>
```

**Analytics Update:**

```typescript
// Employee Performance Report
interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  totalDeliveries: number;
  approvedFirstTry: number;
  requiredRevisions: number;
  averageRejectionsPerDelivery: number;
  totalRevisionCycles: number;
}

async function calculateEmployeePerformance(employeeId: string, projectId?: string) {
  const query = `
    SELECT
      COUNT(DISTINCT fd.id) as total_deliveries,
      COUNT(DISTINCT CASE WHEN fd.rejection_count = 0 THEN fd.id END) as approved_first_try,
      COUNT(DISTINCT CASE WHEN fd.rejection_count > 0 THEN fd.id END) as required_revisions,
      COALESCE(AVG(fd.rejection_count), 0) as avg_rejections_per_delivery
    FROM file_documents fd
    WHERE fd.uploaded_by_user_id = $1
    AND fd.stage = 'client_approved'
    ${projectId ? 'AND fd.project_id = $2' : ''}
  `;

  return db.query(query, projectId ? [employeeId, projectId] : [employeeId]);
}
```

---

### 3. Client History & Analytics

**Database View:**

```sql
CREATE VIEW client_analytics AS
SELECT
  u.id as client_id,
  u.name as client_name,
  u.email as client_email,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'archived' THEN p.id END) as archived_projects,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'confirmed'), 0) as total_paid,
  COALESCE(SUM(p.initial_amount_required), 0) as total_invoiced,
  COALESCE(SUM(p.initial_amount_required) - SUM(pay.amount) FILTER (WHERE pay.status = 'confirmed'), 0) as outstanding_balance,
  MIN(p.created_at) as first_project_date,
  MAX(p.created_at) as last_project_date,
  COUNT(DISTINCT pay.id) FILTER (WHERE pay.payment_date <= pay.expected_date) as on_time_payments,
  COUNT(DISTINCT pay.id) as total_payment_count
FROM users u
LEFT JOIN projects p ON u.id = p.client_id
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.type = 'invoice'
WHERE u.role = 'client'
GROUP BY u.id, u.name, u.email;
```

**UI - Client Profile Page:**

```tsx
function ClientProfilePage({ clientId }: { clientId: string }) {
  const client = useClientAnalytics(clientId);
  const projects = useClientProjects(clientId);

  return (
    <div className="client-profile">
      <Header>
        <h1>{client.name}</h1>
        <p>{client.email}</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <Label>Total Projects</Label>
          <Value>{client.totalProjects}</Value>
          <Breakdown>
            {client.activeProjects} active, {client.completedProjects} completed
          </Breakdown>
        </StatCard>

        <StatCard>
          <Label>Total Revenue</Label>
          <Value>${formatMoney(client.totalPaid)}</Value>
          <Breakdown>
            Invoiced: ${formatMoney(client.totalInvoiced)}
          </Breakdown>
        </StatCard>

        <StatCard>
          <Label>Outstanding Balance</Label>
          <Value color={client.outstandingBalance > 0 ? 'warning' : 'success'}>
            ${formatMoney(client.outstandingBalance)}
          </Value>
        </StatCard>

        <StatCard>
          <Label>Payment Reliability</Label>
          <Value>
            {Math.round((client.onTimePayments / client.totalPaymentCount) * 100)}%
          </Value>
          <Breakdown>
            {client.onTimePayments} on-time / {client.totalPaymentCount} total
          </Breakdown>
        </StatCard>

        <StatCard>
          <Label>Client Since</Label>
          <Value>{formatDate(client.firstProjectDate)}</Value>
        </StatCard>

        <StatCard>
          <Label>Average Project Value</Label>
          <Value>
            ${formatMoney(client.totalInvoiced / client.totalProjects)}
          </Value>
        </StatCard>
      </StatsGrid>

      <ProjectHistory>
        <h2>Project History</h2>
        <Table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Value</th>
              <th>Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td><StatusBadge status={project.status} /></td>
                <td>{formatDate(project.startDate)}</td>
                <td>${formatMoney(project.initialAmountRequired)}</td>
                <td>${formatMoney(project.amountPaid)}</td>
                <td>
                  <Link to={`/projects/${project.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ProjectHistory>
    </div>
  );
}
```

**UI - Admin Dashboard - Top Clients Widget:**

```tsx
function TopClientsWidget() {
  const topClients = useTopClients({ limit: 5, sortBy: 'total_paid' });

  return (
    <Widget>
      <WidgetHeader>
        <h3>🏆 Top Clients by Revenue</h3>
      </WidgetHeader>
      <WidgetBody>
        {topClients.map((client, index) => (
          <ClientRow key={client.id}>
            <Rank>#{index + 1}</Rank>
            <ClientInfo>
              <ClientName>{client.name}</ClientName>
              <ClientStats>
                ${formatMoney(client.totalPaid)} • {client.totalProjects} project{client.totalProjects > 1 ? 's' : ''}
              </ClientStats>
            </ClientInfo>
            <Link to={`/clients/${client.id}`}>View →</Link>
          </ClientRow>
        ))}
      </WidgetBody>
    </Widget>
  );
}
```

---

### 4. Basic Audit Trail

**Schema:**

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

**Implementation:**

```typescript
// Audit logging service
enum AuditAction {
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_UPDATED = 'payment_updated',
  PAYMENT_DELETED = 'payment_deleted',
  FILE_APPROVED = 'file_approved',
  FILE_REJECTED = 'file_rejected',
  FILE_DELETED = 'file_deleted',
  FILE_HIDDEN = 'file_hidden',
  PROJECT_STATUS_CHANGED = 'project_status_changed',
  PROJECT_CREATED = 'project_created',
  PROJECT_ARCHIVED = 'project_archived',
  USER_CREATED = 'user_created',
  EMPLOYEE_ASSIGNED = 'employee_assigned',
  EMPLOYEE_REMOVED = 'employee_removed'
}

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  async log(entry: AuditLogEntry) {
    await db.auditLogs.create({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: new Date()
    });
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return db.auditLogs.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
  }

  async getRecentActivity(limit = 50) {
    return db.auditLogs.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
  }
}

// Usage examples
const auditLogger = new AuditLogger();

// When approving file
await auditLogger.log({
  userId: currentUser.id,
  action: AuditAction.FILE_APPROVED,
  entityType: 'File_Document',
  entityId: file.id,
  oldValue: { stage: 'submitted' },
  newValue: { stage: 'admin_approved', approvedAt: new Date() },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// When creating payment
await auditLogger.log({
  userId: currentUser.id,
  action: AuditAction.PAYMENT_CREATED,
  entityType: 'Payment',
  entityId: payment.id,
  newValue: {
    amount: payment.amount,
    employeeId: payment.toUserId,
    fileIds: payment.relatedFiles.map(f => f.id)
  },
  ipAddress: req.ip
});

// When changing project status
await auditLogger.log({
  userId: currentUser.id,
  action: AuditAction.PROJECT_STATUS_CHANGED,
  entityType: 'Project',
  entityId: project.id,
  oldValue: { status: 'active' },
  newValue: { status: 'completed' },
  ipAddress: req.ip
});
```

**UI - Recent Activity Widget:**

```tsx
function RecentActivityWidget() {
  const activities = useRecentActivity({ limit: 10 });

  return (
    <Widget>
      <WidgetHeader>
        <h3>📋 Recent Activity</h3>
        <Link to="/audit-log">View All</Link>
      </WidgetHeader>
      <ActivityList>
        {activities.map(activity => (
          <ActivityItem key={activity.id}>
            <ActivityIcon action={activity.action} />
            <ActivityContent>
              <ActivityText>
                <strong>{activity.user.name}</strong> {getActionText(activity)}
              </ActivityText>
              <ActivityTime>{formatRelativeTime(activity.createdAt)}</ActivityTime>
            </ActivityContent>
          </ActivityItem>
        ))}
      </ActivityList>
    </Widget>
  );
}

function getActionText(activity: AuditLog): string {
  switch (activity.action) {
    case 'payment_created':
      return `created payment of $${activity.newValue.amount}`;
    case 'file_approved':
      return `approved file`;
    case 'project_status_changed':
      return `changed project status to ${activity.newValue.status}`;
    case 'employee_assigned':
      return `assigned employee to project`;
    default:
      return activity.action.replace(/_/g, ' ');
  }
}
```

**UI - Full Audit Log Page:**

```tsx
function AuditLogPage() {
  const [filters, setFilters] = useState({
    action: null,
    entityType: null,
    userId: null,
    dateFrom: null,
    dateTo: null
  });

  const logs = useAuditLogs(filters);

  return (
    <Page>
      <PageHeader>
        <h1>Audit Log</h1>
      </PageHeader>

      <Filters>
        <Select
          label="Action"
          options={auditActions}
          value={filters.action}
          onChange={action => setFilters({ ...filters, action })}
        />
        <Select
          label="Entity Type"
          options={['Project', 'Payment', 'File_Document', 'User']}
          value={filters.entityType}
          onChange={entityType => setFilters({ ...filters, entityType })}
        />
        <DateRangePicker
          label="Date Range"
          from={filters.dateFrom}
          to={filters.dateTo}
          onChange={({ from, to }) => setFilters({ ...filters, dateFrom: from, dateTo: to })}
        />
      </Filters>

      <Table>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Changes</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.user.name}</td>
              <td><Badge>{log.action}</Badge></td>
              <td>
                {log.entityType} #{log.entityId}
              </td>
              <td>
                <ChangesDiff
                  oldValue={log.oldValue}
                  newValue={log.newValue}
                />
              </td>
              <td>{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Page>
  );
}
```

---

## 🟡 **FASE 2 - IMPORTANTE**

### 5. File Versioning with Metadata

**Schema:**

```sql
ALTER TABLE file_documents ADD COLUMN version_number INTEGER DEFAULT 1;
ALTER TABLE file_documents ADD COLUMN version_label VARCHAR(20);
ALTER TABLE file_documents ADD COLUMN parent_file_id INTEGER REFERENCES file_documents(id);
ALTER TABLE file_documents ADD COLUMN is_current_version BOOLEAN DEFAULT true;
ALTER TABLE file_documents ADD COLUMN file_size_bytes BIGINT;
ALTER TABLE file_documents ADD COLUMN file_mime_type VARCHAR(100);
ALTER TABLE file_documents ADD COLUMN file_dimensions VARCHAR(50);
ALTER TABLE file_documents ADD COLUMN version_notes TEXT;

CREATE INDEX idx_file_versions ON file_documents(parent_file_id);
CREATE INDEX idx_current_version ON file_documents(is_current_version) WHERE is_current_version = true;
```

**Implementation:**

```typescript
interface UploadFileDTO {
  projectId: string;
  stage: string;
  file: File;
  versionNotes?: string;
  isNewVersionOf?: string; // parent file ID if this is a revision
}

async function uploadFile(data: UploadFileDTO) {
  // Extract metadata
  const metadata = await extractFileMetadata(data.file);

  let versionNumber = 1;
  let parentFileId = null;

  // If this is a new version
  if (data.isNewVersionOf) {
    const parentFile = await db.fileDocuments.findUnique({
      where: { id: data.isNewVersionOf }
    });

    versionNumber = parentFile.versionNumber + 1;
    parentFileId = data.isNewVersionOf;

    // Mark parent as not current
    await db.fileDocuments.update(data.isNewVersionOf, {
      isCurrentVersion: false
    });
  }

  // Upload file to storage
  const fileUrl = await uploadToStorage(data.file);

  // Create file record
  const fileDocument = await db.fileDocuments.create({
    projectId: data.projectId,
    uploadedByUserId: currentUser.id,
    stage: data.stage,
    fileUrl: fileUrl,
    versionNumber: versionNumber,
    versionLabel: `v${versionNumber}`,
    parentFileId: parentFileId,
    isCurrentVersion: true,
    fileSizeBytes: metadata.size,
    fileMimeType: metadata.mimeType,
    fileDimensions: metadata.dimensions,
    versionNotes: data.versionNotes,
    uploadedAt: new Date()
  });

  return fileDocument;
}

async function extractFileMetadata(file: File) {
  const metadata: any = {
    size: file.size,
    mimeType: file.type,
    dimensions: null
  };

  // For images, extract dimensions
  if (file.type.startsWith('image/')) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);
    metadata.dimensions = `${img.width}x${img.height}`;
  }

  // For PDFs, could extract page count (requires library)
  // For now just return basic metadata

  return metadata;
}

async function getFileVersionHistory(fileId: string) {
  // Get current file
  const currentFile = await db.fileDocuments.findUnique({
    where: { id: fileId }
  });

  // Get all versions in the chain
  const versions = [];
  let current = currentFile;

  while (current) {
    versions.unshift(current);
    if (current.parentFileId) {
      current = await db.fileDocuments.findUnique({
        where: { id: current.parentFileId }
      });
    } else {
      current = null;
    }
  }

  return versions;
}
```

**UI - Upload with Version Notes:**

```tsx
function UploadFileForm({ projectId, stage }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [parentFile, setParentFile] = useState<string | null>(null);

  const existingFiles = useProjectFiles(projectId, stage);

  return (
    <Form onSubmit={handleSubmit}>
      <FileInput
        label="Select File"
        onChange={setFile}
        accept="image/*,application/pdf"
      />

      {existingFiles.length > 0 && (
        <Checkbox
          label="This is a new version of an existing file"
          checked={isNewVersion}
          onChange={setIsNewVersion}
        />
      )}

      {isNewVersion && (
        <Select
          label="New version of which file?"
          options={existingFiles.map(f => ({
            value: f.id,
            label: `${f.name} (${f.versionLabel})`
          }))}
          value={parentFile}
          onChange={setParentFile}
        />
      )}

      <Textarea
        label="Version Notes (Optional)"
        placeholder="Explain what changed in this version..."
        value={versionNotes}
        onChange={setVersionNotes}
        rows={3}
      />

      <HelpText>
        Example: "Fixed color scheme and adjusted spacing as requested"
      </HelpText>

      <Button type="submit">Upload File</Button>
    </Form>
  );
}
```

**UI - Version History Display:**

```tsx
function FileVersionHistory({ fileId }: { fileId: string }) {
  const versions = useFileVersionHistory(fileId);

  return (
    <VersionTimeline>
      {versions.map((version, index) => (
        <VersionItem key={version.id} isCurrent={version.isCurrentVersion}>
          <VersionBadge current={version.isCurrentVersion}>
            {version.versionLabel}
            {version.isCurrentVersion && ' (current)'}
          </VersionBadge>

          <VersionInfo>
            <VersionHeader>
              <FileName>{version.name || `Version ${version.versionNumber}`}</FileName>
              <VersionDate>{formatDateTime(version.uploadedAt)}</VersionDate>
            </VersionHeader>

            {version.versionNotes && (
              <VersionNotes>
                💬 {version.versionNotes}
              </VersionNotes>
            )}

            <VersionMetadata>
              <MetaItem>
                📏 {version.fileDimensions || 'N/A'}
              </MetaItem>
              <MetaItem>
                💾 {formatFileSize(version.fileSizeBytes)}
              </MetaItem>
              <MetaItem>
                📄 {version.fileMimeType}
              </MetaItem>
            </VersionMetadata>

            <VersionActions>
              <Button size="small" onClick={() => viewFile(version.id)}>
                View
              </Button>
              <Button size="small" onClick={() => downloadFile(version.id)}>
                Download
              </Button>
              {version.isCurrentVersion && canApprove && (
                <Button size="small" variant="primary" onClick={() => approveFile(version.id)}>
                  Approve
                </Button>
              )}
            </VersionActions>
          </VersionInfo>

          {index < versions.length - 1 && <VersionConnector />}
        </VersionItem>
      ))}
    </VersionTimeline>
  );
}
```

---

### 6. Invoice System

**Schema:**

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INTEGER REFERENCES projects(id) NOT NULL,
  client_id INTEGER REFERENCES users(id) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms_days INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  invoice_file_url TEXT,
  notes TEXT,
  sent_to_client_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN invoice_id INTEGER REFERENCES invoices(id);

CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

**Invoice Number Generation:**

```typescript
// Format: INV-YYYY-MM-DD-XXX
// Example: INV-2024-12-20-001

async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const datePrefix = `INV-${year}-${month}-${day}`;

  // Get count of invoices created today
  const todayStart = new Date(year, today.getMonth(), today.getDate());
  const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);

  const count = await db.invoices.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd
      }
    }
  });

  const sequence = String(count + 1).padStart(3, '0');

  return `${datePrefix}-${sequence}`;
}

// Examples:
// First invoice of the day: INV-2024-12-20-001
// Second invoice: INV-2024-12-20-002
// First invoice next day: INV-2024-12-21-001
```

**Create Invoice:**

```typescript
interface CreateInvoiceDTO {
  projectId: string;
  issueDate: Date;
  paymentTermsDays: number; // Admin decides: 15, 30, 60, custom
  subtotal: number;
  taxAmount?: number;
  notes?: string;
  invoiceFile?: File;
}

async function createInvoice(data: CreateInvoiceDTO) {
  const project = await db.projects.findUnique({
    where: { id: data.projectId },
    include: { client: true }
  });

  const invoiceNumber = await generateInvoiceNumber();

  const dueDate = new Date(data.issueDate);
  dueDate.setDate(dueDate.getDate() + data.paymentTermsDays);

  const totalAmount = data.subtotal + (data.taxAmount || 0);

  let invoiceFileUrl = null;
  if (data.invoiceFile) {
    invoiceFileUrl = await uploadToStorage(data.invoiceFile);
  }

  const invoice = await db.invoices.create({
    invoiceNumber,
    projectId: data.projectId,
    clientId: project.clientId,
    issueDate: data.issueDate,
    dueDate: dueDate,
    paymentTermsDays: data.paymentTermsDays,
    subtotal: data.subtotal,
    taxAmount: data.taxAmount || 0,
    totalAmount: totalAmount,
    amountPaid: 0,
    status: 'draft',
    invoiceFileUrl: invoiceFileUrl,
    notes: data.notes,
    createdAt: new Date()
  });

  // Log audit
  await auditLogger.log({
    userId: currentUser.id,
    action: 'invoice_created',
    entityType: 'Invoice',
    entityId: invoice.id,
    newValue: invoice
  });

  return invoice;
}

async function sendInvoiceToClient(invoiceId: string) {
  const invoice = await db.invoices.update(invoiceId, {
    status: 'sent',
    sentToClientAt: new Date()
  });

  // Send email notification to client
  await sendEmail({
    to: invoice.client.email,
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: `
      Your invoice is ready.
      Amount: $${invoice.totalAmount}
      Due Date: ${formatDate(invoice.dueDate)}
      Payment Terms: Net ${invoice.paymentTermsDays}
    `
  });

  return invoice;
}
```

**Automated Overdue Detection:**

```typescript
// Cron job runs daily
async function updateOverdueInvoices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = await db.invoices.updateMany({
    where: {
      dueDate: { lt: today },
      amountPaid: { lt: db.raw('total_amount') },
      status: { in: ['sent'] }
    },
    data: {
      status: 'overdue'
    }
  });

  // Send notifications for newly overdue invoices
  for (const invoice of overdueInvoices) {
    await sendEmail({
      to: invoice.client.email,
      subject: `Overdue Invoice ${invoice.invoiceNumber}`,
      body: `Your invoice is now overdue. Please make payment as soon as possible.`
    });

    // Notify admin
    await createNotification({
      userId: adminId,
      type: 'invoice_overdue',
      message: `Invoice ${invoice.invoiceNumber} is now overdue`,
      relatedEntityType: 'Invoice',
      relatedEntityId: invoice.id
    });
  }

  return overdueInvoices.length;
}
```

**UI - Create Invoice Form:**

```tsx
function CreateInvoiceForm({ projectId }: { projectId: string }) {
  const [formData, setFormData] = useState({
    issueDate: new Date(),
    paymentTermsDays: 30,
    subtotal: 0,
    taxAmount: 0,
    notes: '',
    invoiceFile: null
  });

  const totalAmount = formData.subtotal + formData.taxAmount;

  return (
    <Form onSubmit={handleSubmit}>
      <DatePicker
        label="Issue Date"
        value={formData.issueDate}
        onChange={date => setFormData({ ...formData, issueDate: date })}
      />

      <Select
        label="Payment Terms"
        value={formData.paymentTermsDays}
        onChange={days => setFormData({ ...formData, paymentTermsDays: days })}
      >
        <option value={15}>Net 15 (15 días)</option>
        <option value={30}>Net 30 (30 días)</option>
        <option value={60}>Net 60 (60 días)</option>
        <option value={90}>Net 90 (90 días)</option>
      </Select>

      <Input
        type="number"
        label="Custom Payment Terms (days)"
        value={formData.paymentTermsDays}
        onChange={e => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) })}
      />

      <CalculatedField>
        <Label>Due Date</Label>
        <Value>
          {formatDate(
            new Date(formData.issueDate.getTime() + formData.paymentTermsDays * 24 * 60 * 60 * 1000)
          )}
        </Value>
      </CalculatedField>

      <Input
        type="number"
        label="Subtotal"
        value={formData.subtotal}
        onChange={e => setFormData({ ...formData, subtotal: parseFloat(e.target.value) })}
        prefix="$"
      />

      <Input
        type="number"
        label="Tax Amount (Optional)"
        value={formData.taxAmount}
        onChange={e => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) })}
        prefix="$"
      />

      <CalculatedField highlight>
        <Label>Total Amount</Label>
        <Value>${formatMoney(totalAmount)}</Value>
      </CalculatedField>

      <FileInput
        label="Upload Invoice PDF (Optional)"
        accept=".pdf"
        onChange={file => setFormData({ ...formData, invoiceFile: file })}
      />

      <Textarea
        label="Notes (Optional)"
        value={formData.notes}
        onChange={e => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
      />

      <ButtonGroup>
        <Button type="submit" variant="secondary">
          Save as Draft
        </Button>
        <Button type="submit" variant="primary" onClick={() => setFormData({ ...formData, sendNow: true })}>
          Create & Send to Client
        </Button>
      </ButtonGroup>
    </Form>
  );
}
```

**UI - Invoice List:**

```tsx
function InvoicesList({ projectId }: { projectId?: string }) {
  const invoices = useInvoices(projectId);

  return (
    <Table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Client</th>
          <th>Project</th>
          <th>Issue Date</th>
          <th>Due Date</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map(invoice => (
          <tr key={invoice.id}>
            <td>
              <strong>{invoice.invoiceNumber}</strong>
            </td>
            <td>{invoice.client.name}</td>
            <td>{invoice.project.name}</td>
            <td>{formatDate(invoice.issueDate)}</td>
            <td>
              {formatDate(invoice.dueDate)}
              {isOverdue(invoice) && (
                <Badge color="error" size="small">
                  {getDaysOverdue(invoice)} days overdue
                </Badge>
              )}
            </td>
            <td>${formatMoney(invoice.totalAmount)}</td>
            <td>${formatMoney(invoice.amountPaid)}</td>
            <td>
              <InvoiceStatusBadge status={invoice.status} />
            </td>
            <td>
              <ButtonGroup size="small">
                <Button onClick={() => viewInvoice(invoice.id)}>View</Button>
                {invoice.status === 'draft' && (
                  <Button onClick={() => sendInvoice(invoice.id)}>Send</Button>
                )}
                <Button onClick={() => recordPayment(invoice.id)}>Record Payment</Button>
              </ButtonGroup>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

---

### 7. Project Completion Checklist

```typescript
interface ProjectCompletionStatus {
  projectId: string;
  allPaymentsReceived: boolean;
  allEmployeesPaid: boolean;
  finalFilesDelivered: boolean;
  noPendingFeedback: boolean;
  canBeArchived: boolean;
  blockers: string[];
}

async function getProjectCompletionStatus(projectId: string): Promise<ProjectCompletionStatus> {
  const project = await db.projects.findUnique({
    where: { id: projectId },
    include: {
      payments: true,
      fileDocuments: true,
      feedbackCycles: true,
      employees: true
    }
  });

  // Check 1: All payments received from client
  const totalInvoiced = project.initialAmountRequired;
  const totalPaid = project.payments
    .filter(p => p.type === 'invoice' && p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);
  const allPaymentsReceived = totalPaid >= totalInvoiced;

  // Check 2: All employees paid
  const approvedFiles = project.fileDocuments.filter(f => f.stage === 'client_approved');
  const unpaidFiles = approvedFiles.filter(f => f.pendingPayment === true);
  const allEmployeesPaid = unpaidFiles.length === 0;

  // Check 3: At least one file in client approved
  const finalFilesDelivered = approvedFiles.length > 0;

  // Check 4: No pending feedback cycles
  const openCycles = project.feedbackCycles.filter(fc => fc.status === 'open');
  const noPendingFeedback = openCycles.length === 0;

  // Determine if can archive
  const canBeArchived =
    allPaymentsReceived &&
    allEmployeesPaid &&
    finalFilesDelivered &&
    noPendingFeedback;

  // Build blockers list
  const blockers: string[] = [];
  if (!allPaymentsReceived) {
    const outstanding = totalInvoiced - totalPaid;
    blockers.push(`Outstanding client payment: $${outstanding}`);
  }
  if (!allEmployeesPaid) {
    blockers.push(`${unpaidFiles.length} employee payment(s) pending`);
  }
  if (!finalFilesDelivered) {
    blockers.push('No final files delivered yet');
  }
  if (!noPendingFeedback) {
    blockers.push(`${openCycles.length} open feedback cycle(s)`);
  }

  return {
    projectId,
    allPaymentsReceived,
    allEmployeesPaid,
    finalFilesDelivered,
    noPendingFeedback,
    canBeArchived,
    blockers
  };
}
```

**UI:**

```tsx
function ProjectCompletionCard({ projectId }: { projectId: string }) {
  const status = useProjectCompletionStatus(projectId);

  return (
    <Card>
      <CardHeader>
        <h3>✅ Completion Checklist</h3>
      </CardHeader>
      <CardBody>
        <ChecklistItem checked={status.allPaymentsReceived}>
          All payments received from client
        </ChecklistItem>
        <ChecklistItem checked={status.allEmployeesPaid}>
          All employees paid
        </ChecklistItem>
        <ChecklistItem checked={status.finalFilesDelivered}>
          Final files delivered
        </ChecklistItem>
        <ChecklistItem checked={status.noPendingFeedback}>
          No pending feedback
        </ChecklistItem>

        {!status.canBeArchived && status.blockers.length > 0 && (
          <BlockersSection>
            <h4>⚠️ Cannot archive yet:</h4>
            <ul>
              {status.blockers.map((blocker, i) => (
                <li key={i}>{blocker}</li>
              ))}
            </ul>
          </BlockersSection>
        )}

        <Button
          variant="primary"
          disabled={!status.canBeArchived}
          onClick={() => archiveProject(projectId)}
        >
          {status.canBeArchived ? 'Archive Project' : 'Cannot Archive Yet'}
        </Button>
      </CardBody>
    </Card>
  );
}
```

---

### 8. File Cleanup Policy

```typescript
// Add to Project model
interface Project {
  // ... existing fields
  archivedAt?: Date;
  filesCleanupScheduledAt?: Date;
  filesCleanupCompletedAt?: Date;
}

async function archiveProject(projectId: string) {
  const now = new Date();
  const cleanupDate = new Date(now);
  cleanupDate.setDate(cleanupDate.getDate() + 90); // 90 days from now

  const project = await db.projects.update(projectId, {
    status: 'archived',
    archivedAt: now,
    filesCleanupScheduledAt: cleanupDate
  });

  // Log audit
  await auditLogger.log({
    userId: currentUser.id,
    action: 'project_archived',
    entityType: 'Project',
    entityId: projectId,
    newValue: { status: 'archived', archivedAt: now }
  });

  // Send notification to admin
  await createNotification({
    userId: adminId,
    type: 'project_archived',
    message: `Project "${project.name}" archived. Hidden files will be deleted on ${formatDate(cleanupDate)}`,
    relatedEntityType: 'Project',
    relatedEntityId: projectId
  });

  return project;
}

// Cron job runs daily
async function cleanupArchivedProjectFiles() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find projects ready for cleanup
  const projectsToClean = await db.projects.findMany({
    where: {
      filesCleanupScheduledAt: { lte: today },
      filesCleanupCompletedAt: null
    },
    include: {
      fileDocuments: {
        where: { status: 'hidden' }
      }
    }
  });

  for (const project of projectsToClean) {
    console.log(`Cleaning up files for project: ${project.name}`);

    // Delete hidden files from storage
    for (const file of project.fileDocuments) {
      if (file.fileUrl) {
        await deleteFromStorage(file.fileUrl);
      }
    }

    // Delete file records
    await db.fileDocuments.deleteMany({
      where: {
        projectId: project.id,
        status: 'hidden'
      }
    });

    // Mark cleanup as completed
    await db.projects.update(project.id, {
      filesCleanupCompletedAt: new Date()
    });

    console.log(`Deleted ${project.fileDocuments.length} hidden files from project ${project.name}`);
  }

  return projectsToClean.length;
}

// Warning notification 7 days before cleanup
async function sendCleanupWarnings() {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 7);

  const projectsNearCleanup = await db.projects.findMany({
    where: {
      filesCleanupScheduledAt: {
        gte: new Date(),
        lte: warningDate
      },
      filesCleanupCompletedAt: null
    }
  });

  for (const project of projectsNearCleanup) {
    await sendEmail({
      to: adminEmail,
      subject: `File Cleanup Warning: ${project.name}`,
      body: `
        Hidden files for project "${project.name}" will be permanently deleted on ${formatDate(project.filesCleanupScheduledAt)}.

        If you need to keep any files, please download them before this date.

        You can view the project here: ${projectUrl(project.id)}
      `
    });
  }
}
```

---

## 📋 **Summary - Implementation Checklist**

### **Phase 1 - Critical:**
- [ ] Employee assignment validation
- [ ] Rejection tracking & feedback linking
- [ ] Client history dashboard
- [ ] Basic audit trail

### **Phase 2 - Important:**
- [ ] File versioning with notes & metadata
- [ ] Project completion checklist
- [ ] Invoice system with auto-numbering
- [ ] File cleanup policy (90 days)

### **Configuration Confirmed:**
- ✅ Invoice format: `INV-YYYY-MM-DD-XXX`
- ✅ Payment terms: Admin chooses per invoice (15, 30, 60, custom)
- ✅ File retention: 90 days after archiving
- ✅ Version notes: Required from employee
- ✅ Admin roles: Single admin (Poncho)

---

¿Quieres que empiece a implementar alguna de estas features? ¿Por cuál fase comenzamos?

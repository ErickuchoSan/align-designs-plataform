# Database Index Documentation

This document explains all database indexes in the Align Designs application, their purpose, and performance implications.

## Index Strategy Overview

Our indexing strategy focuses on:
1. **Foreign Keys**: All foreign key columns are indexed for efficient JOIN operations
2. **Lookup Fields**: Fields frequently used in WHERE clauses (email, token, etc.)
3. **Temporal Queries**: Time-based fields for expiration checks and sorting
4. **Unique Constraints**: Ensuring data integrity

## Table: `users`

### Indexes

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `users_email_key` | `email` | UNIQUE | Primary lookup field for authentication. Ensures email uniqueness. |
| `users_email_idx` | `email` | INDEX | Fast email lookups during login and check-email operations. |
| `users_role_idx` | `role` | INDEX | Filter users by role (ADMIN/CLIENT) for admin dashboards and client lists. |

### Query Patterns

```sql
-- Optimized by email index
SELECT * FROM users WHERE email = 'user@example.com';

-- Optimized by role index
SELECT * FROM users WHERE role = 'CLIENT' AND is_active = true;

-- Optimized by email index (unique constraint)
INSERT INTO users (email, ...) VALUES ('new@example.com', ...);
-- Fails fast if email exists
```

### Performance Notes

- **Email lookups**: O(log n) with B-tree index
- **Role filtering**: Efficient for admin dashboards showing client lists
- **Combined queries**: PostgreSQL may use index merge for `email + role` queries

---

## Table: `projects`

### Indexes

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `projects_client_id_idx` | `client_id` | INDEX | Find all projects for a specific client. Foreign key index. |
| `projects_created_by_idx` | `created_by` | INDEX | Find all projects created by a specific admin. Foreign key index. |

### Query Patterns

```sql
-- Optimized by client_id index
SELECT * FROM projects
WHERE client_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC;

-- Optimized by created_by index
SELECT * FROM projects
WHERE created_by = 'admin-uuid'
ORDER BY updated_at DESC;

-- JOIN optimization (both indexes used)
SELECT p.*, u.email
FROM projects p
JOIN users u ON p.client_id = u.id
WHERE u.role = 'CLIENT';
```

### Performance Notes

- **Client dashboard**: Fast retrieval of all projects for a logged-in client
- **Admin views**: Efficient filtering by creator
- **Cascade deletes**: Indexed foreign keys speed up `ON DELETE CASCADE` operations

### Missing Indexes (Potential Optimizations)

Consider adding if query patterns emerge:
- `@@index([created_at])` - If sorting by creation date becomes common
- `@@index([updated_at])` - If "recently updated" queries are frequent

---

## Table: `files`

### Indexes

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `files_project_id_idx` | `project_id` | INDEX | Retrieve all files for a project. Foreign key index. |
| `files_uploaded_by_idx` | `uploaded_by` | INDEX | Find all files uploaded by a user. Foreign key index. |

### Query Patterns

```sql
-- Optimized by project_id index
SELECT * FROM files
WHERE project_id = 'project-uuid'
ORDER BY uploaded_at DESC;

-- Optimized by uploaded_by index
SELECT COUNT(*) FROM files
WHERE uploaded_by = 'user-uuid';

-- JOIN for project file listing
SELECT f.*, u.first_name, u.last_name
FROM files f
JOIN users u ON f.uploaded_by = u.id
WHERE f.project_id = 'project-uuid'
ORDER BY f.uploaded_at DESC;
```

### Performance Notes

- **Project detail page**: Index ensures fast file listing
- **User activity tracking**: Efficient counting of files per user
- **Storage cleanup**: Fast cascade deletes when projects are removed

### Missing Indexes (Potential Optimizations)

Consider adding:
- `@@index([uploaded_at])` - For temporal queries and sorting
- `@@index([mime_type])` - If filtering by file type becomes common
- Composite index `@@index([project_id, uploaded_at])` - For optimized project file listing with sorting

---

## Table: `otp_tokens`

### Indexes

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `otp_tokens_user_id_idx` | `user_id` | INDEX | Find OTP tokens for a user. Foreign key index. |
| `otp_tokens_token_idx` | `token` | INDEX | Fast lookup during OTP verification. |
| `otp_tokens_expires_at_idx` | `expires_at` | INDEX | Cleanup expired tokens and validation checks. |

### Query Patterns

```sql
-- Optimized by user_id + token (index merge possible)
SELECT * FROM otp_tokens
WHERE user_id = 'user-uuid'
  AND token = '123456'
  AND used = false
  AND expires_at > NOW();

-- Optimized by token index
SELECT * FROM otp_tokens
WHERE token = '123456'
  AND used = false
  AND expires_at > NOW();

-- Cleanup query (optimized by expires_at index)
DELETE FROM otp_tokens
WHERE expires_at < NOW() - INTERVAL '1 day';
```

### Performance Notes

- **OTP verification**: Sub-millisecond lookups with token index
- **Expiration checks**: Efficient temporal filtering
- **Cleanup operations**: Index on `expires_at` enables fast pruning of old records

### Recommended Maintenance

```sql
-- Run periodically (e.g., daily cron job)
DELETE FROM otp_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Or mark as cleaned
UPDATE otp_tokens
SET used = true
WHERE expires_at < NOW() AND used = false;
```

### Missing Indexes (Potential Optimizations)

Consider composite index for most common query:
- `@@index([token, used, expires_at])` - Covers the entire verification query

---

## Table: `password_reset_tokens`

### Indexes

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `password_reset_tokens_token_key` | `token` | UNIQUE | Primary lookup field. Ensures token uniqueness. |
| `password_reset_tokens_user_id_idx` | `user_id` | INDEX | Find reset tokens for a user. Foreign key index. |
| `password_reset_tokens_token_idx` | `token` | INDEX | Fast token validation (may be redundant with UNIQUE constraint). |
| `password_reset_tokens_expires_at_idx` | `expires_at` | INDEX | Cleanup expired tokens and validation checks. |

### Query Patterns

```sql
-- Optimized by unique token index
SELECT * FROM password_reset_tokens
WHERE token = 'abc123...'
  AND used = false
  AND expires_at > NOW();

-- Invalidate all tokens for user (optimized by user_id index)
UPDATE password_reset_tokens
SET used = true
WHERE user_id = 'user-uuid';

-- Cleanup query (optimized by expires_at index)
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Performance Notes

- **Token validation**: O(1) lookup with unique index
- **Security**: Fast invalidation of all user tokens after password change
- **Cleanup**: Efficient removal of expired tokens

### Index Redundancy Note

The `password_reset_tokens_token_idx` is partially redundant with `password_reset_tokens_token_key` (UNIQUE constraint). PostgreSQL unique constraints create an index automatically. Consider removing the explicit `@@index([token])` if it exists.

**Recommendation**: Remove redundant index to save storage and update overhead.

---

## Composite Index Recommendations

Based on common query patterns, consider these composite indexes:

### High Priority

```prisma
model File {
  // Current indexes...

  // Recommended: Optimizes project file listing with sorting
  @@index([projectId, uploadedAt])

  // Recommended: Optimizes user upload history
  @@index([uploadedBy, uploadedAt])
}

model OtpToken {
  // Current indexes...

  // Recommended: Covers entire verification query
  @@index([token, used, expiresAt])
}

model Project {
  // Current indexes...

  // Recommended: Client dashboard with sorting
  @@index([clientId, createdAt])
  @@index([clientId, updatedAt])
}
```

### Medium Priority

```prisma
model User {
  // Current indexes...

  // Recommended: Filter active users by role
  @@index([role, isActive])
}
```

---

## Index Maintenance

### Monitoring

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as number_of_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
  AND schemaname = 'public';

-- Check index size
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Cleanup Tasks

Create a maintenance script to run periodically:

```typescript
// backend/src/scripts/cleanup-expired-tokens.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredTokens() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [otpDeleted, passwordResetDeleted] = await Promise.all([
    prisma.otpToken.deleteMany({
      where: { expiresAt: { lt: oneWeekAgo } }
    }),
    prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: oneWeekAgo } }
    })
  ]);

  console.log(`Cleaned up ${otpDeleted.count} OTP tokens`);
  console.log(`Cleaned up ${passwordResetDeleted.count} password reset tokens`);
}

cleanupExpiredTokens()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run via cron:
```bash
# Daily at 3 AM
0 3 * * * cd /app && npm run cleanup:tokens
```

---

## Performance Benchmarks

Expected query performance with current indexes (1M users, 100K projects, 1M files):

| Query Type | Without Index | With Index | Improvement |
|------------|---------------|------------|-------------|
| Email lookup | ~500ms | <1ms | 500x |
| Client's projects | ~800ms | <5ms | 160x |
| Project files | ~1s | <10ms | 100x |
| OTP verification | ~600ms | <1ms | 600x |
| Token validation | ~700ms | <1ms | 700x |

---

## Migration Strategy

To add recommended indexes without downtime:

```sql
-- Create indexes concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY files_project_id_uploaded_at_idx
ON files (project_id, uploaded_at);

CREATE INDEX CONCURRENTLY otp_tokens_token_used_expires_at_idx
ON otp_tokens (token, used, expires_at);

CREATE INDEX CONCURRENTLY projects_client_id_created_at_idx
ON projects (client_id, created_at);
```

Then update `schema.prisma`:

```prisma
model File {
  // ...
  @@index([projectId, uploadedAt])
}
```

---

## Troubleshooting

### Slow Queries

1. Enable query logging:
```sql
ALTER DATABASE align_designs SET log_min_duration_statement = 1000;
```

2. Check execution plan:
```sql
EXPLAIN ANALYZE
SELECT * FROM files WHERE project_id = 'uuid' ORDER BY uploaded_at DESC;
```

3. Look for `Seq Scan` - indicates missing index

### Index Bloat

```sql
-- Check for bloated indexes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

Rebuild if needed:
```sql
REINDEX INDEX CONCURRENTLY index_name;
```

---

## Best Practices

1. **Don't over-index**: Each index has write overhead
2. **Monitor usage**: Remove unused indexes after 3 months
3. **Composite over multiple**: `@@index([a, b])` > `@@index([a])` + `@@index([b])`
4. **Column order matters**: Most selective column first
5. **VACUUM regularly**: Prevents index bloat
6. **Test before production**: Use EXPLAIN ANALYZE on staging

---

## Related Documentation

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#index)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

# Failed Jobs Management ([/admin/queue/failed](/admin/queue/failed))

The **Failed Jobs Management** interface provides tools to view, analyze, and retry jobs that encountered errors during processing.

## Quick Actions

| Action | How |
|--------|-----|
| View failed jobs | Go to [/admin/queue/failed](/admin/queue/failed) |
| Retry single job | Click **"Retry"** button on job row |
| Retry multiple jobs | Click **"Retry Failed Jobs"** (batch) |
| View error details | Click to expand error message |
| Check all jobs | Go to [/admin/queue/jobs](/admin/queue/jobs) |

## Failed Jobs Overview

### What Are Failed Jobs?

Jobs that encountered errors during processing:
- **Worker Errors**: Code exceptions, crashes
- **Network Errors**: External service timeouts
- **Data Errors**: Invalid payload, missing fields
- **Resource Errors**: Memory limits, database issues

### When Jobs Fail

Jobs marked as "failed" when:
1. Worker throws unhandled exception
2. Network timeout occurs
3. External service returns error
4. Data validation fails
5. Max attempts exceeded (3 retries)

## Job Information Display

### Failed Jobs List

| Column | Description |
|--------|-------------|
| **ID** | Unique job identifier |
| **Queue** | Origin queue (email_queue, test_queue) |
| **Data** | JSON job payload (expandable) |
| **Attempts** | Retry count (e.g., 3/3 = max reached) |
| **Error** | Detailed error message (expandable) |
| **Created** | Initial job creation time |
| **Started** | Last processing attempt time |
| **Actions** | Retry button |

### Error Message Display

**Expandable Error Details:**
1. Click on error text to expand
2. View full error message and stack trace
3. Identify root cause
4. Click again to collapse

**Error Types:**

| Error Pattern | Likely Cause |
|---------------|--------------|
| `Connection timeout` | Network/external service issue |
| `Validation error` | Invalid job data |
| `Cannot read property` | Code bug, missing data field |
| `ECONNREFUSED` | External service down |
| `SMTP error` | Email server issue |
| `Database error` | Database connection/query issue |

## Retry Functionality

### Single Job Retry

**When to Use:**
- After fixing root cause
- For individual job investigation
- Testing error resolution

**How to Retry:**
1. Identify job to retry
2. Click **"Retry"** button on job row
3. Job status changes to "Pending"
4. Worker picks up job
5. Check [/admin/queue/jobs](/admin/queue/jobs) for result

### Batch Retry

**When to Use:**
- After systemic issue resolved (e.g., external service back online)
- Network restored after outage
- Code bug fixed and deployed

**How to Batch Retry:**
1. Click **"Retry Failed Jobs"** button (top of page)
2. Enter number of jobs to retry (e.g., 10, 50, 100)
3. Confirm action
4. System retries oldest failed jobs first
5. **Result**: Jobs move from "Failed" to "Pending"

**Batch Retry Limit:**
- Maximum 100 jobs per batch (default)
- Prevents queue overload
- Can retry multiple batches sequentially

## Dead Letter Queue (DLQ)

### What is DLQ?

**Dead Letter Queue** stores jobs that:
- Failed 3+ times
- Exceeded max retry attempts
- Marked as "unrecoverable"

### DLQ Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **TTL** | 24 hours | Auto-delete after 1 day |
| **Max Attempts** | 3 | Threshold for DLQ |
| **Storage** | RabbitMQ DLQ | Separate queue from main |

### DLQ Behavior

**Automatic Routing:**
1. Job fails 3 times
2. Moved to DLQ automatically
3. Still visible in [/admin/queue/failed](/admin/queue/failed)
4. Can be manually retried
5. Expires after 24 hours if not retried

**24-Hour TTL Benefits:**
- Prevents DLQ buildup
- Automatic cleanup
- Forces resolution within 24 hours
- Reduces storage requirements

## Common Scenarios

### Scenario 1: Email Service Outage

**Problem:** 50 email jobs failed due to SMTP timeout

**Diagnosis:**
1. Go to [/admin/queue/failed](/admin/queue/failed)
2. Review error messages: "SMTP connection timeout"
3. All errors identical → External service issue

**Resolution:**
1. Verify email service (SMTP) is back online
2. Test with single job: Send test email
3. If successful: Click **"Retry Failed Jobs"**
4. Enter 50 → Retry all failed email jobs
5. Monitor [/admin/queue/jobs](/admin/queue/jobs) for completion

### Scenario 2: Bad Job Data

**Problem:** Individual jobs failing with "Validation error"

**Diagnosis:**
1. Click job row to expand **Data** column
2. Review JSON payload
3. Identify missing/invalid fields
4. Error message: "Missing required field: recipient"

**Resolution:**
1. **Cannot fix data**: Delete job (if feature available)
2. **Can fix data**: Update database directly (advanced)
3. **Prevention**: Fix data validation before job creation
4. **Do not retry**: Will fail again with same data

### Scenario 3: Code Bug Fixed

**Problem:** Worker code had bug causing 100 jobs to fail

**Resolution Process:**
1. Developer fixes bug in worker code
2. Deploy new worker version
3. Restart worker processes
4. Go to [/admin/queue/failed](/admin/queue/failed)
5. **Retry Failed Jobs** → Enter 100
6. Monitor processing at [/admin/queue/jobs](/admin/queue/jobs)
7. Verify successful completion

### Scenario 4: DLQ Threshold Reached

**Problem:** Job at 3/3 attempts, in DLQ

**Understanding:**
- Job has failed 3 times
- Moved to Dead Letter Queue
- Will expire in 24 hours
- Last chance to retry

**Decision:**
1. **Retry**: If root cause fixed
2. **Ignore**: If job no longer relevant
3. **Log & Delete**: For audit trail

### Scenario 5: Network Temporarily Down

**Problem:** 20 jobs failed during network outage

**Quick Recovery:**
1. Verify network restored
2. Test with ping/curl to external services
3. Send test job at [/admin/queue](/admin/queue)
4. If test passes: **Retry Failed Jobs** → 20
5. All jobs should complete successfully

## Bulk Retry Strategy

### Pre-Retry Checklist

Before bulk retry:
- [ ] Root cause identified
- [ ] Issue resolved/fixed
- [ ] Test job successful
- [ ] Workers running
- [ ] Network/services available

### Retry Batch Sizes

| Batch Size | Use Case |
|------------|----------|
| 1-10 | Testing after fix, individual investigation |
| 11-50 | Small outage recovery, targeted retry |
| 51-100 | Large outage, network restoration |
| 100+ | Sequential batches, careful monitoring |

### Monitoring After Retry

1. Navigate to [/admin/queue/jobs](/admin/queue/jobs)
2. Filter by **"Processing"** → Check active jobs
3. Filter by **"Failed"** → Watch for re-failures
4. Filter by **"Completed"** → Verify success
5. Review error patterns if re-failures occur

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Retry not working | Worker not running | Check worker status, restart workers |
| Jobs re-failing immediately | Root cause not fixed | Identify and fix underlying issue |
| Cannot see failed jobs | Database query issue | Check [/admin/cache/stats](/admin/cache/stats), clear cache |
| Retry button disabled | Job already retrying | Wait for current retry to complete |
| High DLQ count | Systemic failures | Review error patterns, fix root causes |
| DLQ TTL expired | Jobs auto-deleted | Cannot recover, must resend jobs |

## Error Analysis

### Common Error Patterns

**Network Errors:**
```
ECONNREFUSED, ETIMEDOUT, ENOTFOUND
```
- **Cause**: External service unavailable
- **Solution**: Wait for service recovery, then retry

**Validation Errors:**
```
Missing required field, Invalid email format
```
- **Cause**: Bad job data
- **Solution**: Fix data source, do not retry bad data

**Worker Errors:**
```
TypeError, ReferenceError, Cannot read property
```
- **Cause**: Code bug
- **Solution**: Fix code, deploy, then retry

**Resource Errors:**
```
Out of memory, Database connection lost
```
- **Cause**: Resource exhaustion
- **Solution**: Scale resources, optimize code

### Error Investigation Steps

1. **Group by error message** - Find patterns
2. **Check timestamps** - Identify outage windows
3. **Review job data** - Look for common attributes
4. **Check external services** - Verify connectivity
5. **Review worker logs** - Find detailed traces
6. **Correlate with activity logs** - System-wide view

## Integration Points

### Related Pages

| Page | Purpose |
|------|---------|
| **Queue Dashboard** | [/admin/queue](/admin/queue) - Overview stats |
| **All Jobs** | [/admin/queue/jobs](/admin/queue/jobs) - Complete job listing |
| **Activity Logs** | [/admin/log](/admin/log) - Retry operations audit |
| **Cache Stats** | [/admin/cache/stats](/admin/cache/stats) - Performance monitoring |

### Cache Invalidation

After retry operations:
- `admin:queue:*` - Queue stats cache
- `datatable:jobs:*` - Jobs DataTable cache
- `datatable:failed-jobs:*` - Failed jobs DataTable cache

**Automatic**: System invalidates caches after retry actions

## Best Practices

### Regular Monitoring

✅ **Daily:**
- Check failed job count
- Review error messages
- Identify patterns

✅ **Weekly:**
- Analyze failure trends
- Review DLQ expiration count
- Audit retry operations

### Retry Guidelines

✅ **Do Retry:**
- After fixing root cause
- Network/service restored
- Code bug patched
- Test job successful

❌ **Don't Retry:**
- Without fixing cause
- Bad/corrupted data
- Obsolete jobs
- Before investigating

### DLQ Management

✅ **Good Practice:**
- Monitor DLQ count
- Investigate before 24h expiration
- Document unrecoverable failures
- Log decisions for audit

❌ **Avoid:**
- Ignoring DLQ jobs
- Letting jobs expire
- Retrying without analysis
- No error documentation

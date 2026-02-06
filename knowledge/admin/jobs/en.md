# All Jobs Management ([/admin/queue/jobs](/admin/queue/jobs))

The **All Jobs Management** interface provides comprehensive visibility and control over all queue jobs in the system, with advanced filtering and detailed job information.

## Quick Actions

| Action | How |
|--------|-----|
| View all jobs | Go to [/admin/queue/jobs](/admin/queue/jobs) |
| Filter by status | Click status buttons (All, Pending, Processing, Completed, Failed) |
| View job details | Click row to expand JSON data |
| Retry failed job | Go to [/admin/queue/failed](/admin/queue/failed) |
| Navigate pages | Use pagination controls at bottom |

## Status Filtering

### Available Filters

| Filter | Shows | Badge Color |
|--------|-------|-------------|
| **All** | Every job in system | Mixed |
| **Pending** | Jobs waiting to process | Yellow (warning) |
| **Processing** | Jobs currently running | Blue (info) |
| **Completed** | Successfully finished jobs | Green (success) |
| **Failed** | Jobs that encountered errors | Red (danger) |

### How to Filter

1. Navigate to [/admin/queue/jobs](/admin/queue/jobs)
2. Click desired status button in button group
3. Page reloads with filtered results
4. Pagination resets to page 1

## Job Information Display

### Job List Columns

| Column | Description | Details |
|--------|-------------|---------|
| **ID** | Unique job identifier | Auto-increment number |
| **Status** | Current job state | Colored badge |
| **Queue** | Target queue name | `test_queue`, `email_queue`, etc. |
| **Data** | JSON job payload | Click to expand |
| **Attempts** | Retry count | `current / max` (e.g., 1/3) |
| **Created** | Job creation time | Timestamp |
| **Started** | Processing start time | Null if not started |
| **Completed** | Finish time | Null if not finished |
| **Error** | Failure details | Only for failed jobs |

### Job Status Badges

**Pending (Yellow):**
- Job queued, waiting for worker
- Not yet sent to RabbitMQ or in queue
- Normal state before processing

**Processing (Blue):**
- Worker currently executing job
- Database marked as "processing"
- Should complete within minutes

**Completed (Green):**
- Job successfully finished
- Worker returned success
- No errors encountered

**Failed (Red):**
- Job encountered error during processing
- May retry depending on attempts
- Error details in "Error" column

## JSON Data Viewer

### Viewing Job Data

1. Click on job row in table
2. **Data** column expands to show formatted JSON
3. View complete job payload
4. Click again to collapse

### Data Structure Example

**Test Queue Job:**
```json
{
  "type": "test_job",
  "message": "Hello from admin panel",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "triggeredBy": "admin@omniflow.id"
}
```

**Email Queue Job:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Omniflow",
  "template": "welcome",
  "data": {
    "username": "jsmith",
    "loginUrl": "https://app.omniflow.id"
  }
}
```

### Handling Corrupted Data

If JSON data is corrupted or invalid:
- **Display**: Shows error message instead of JSON
- **Expandable**: Still clickable to see raw data
- **Troubleshooting**: Check worker logs for parsing errors

## Job Lifecycle

### Normal Job Flow

```
1. Created (Pending) → Job sent to queue
2. Processing → Worker picks up job
3. Completed → Job finishes successfully
```

**Timeline:**
- **Pending**: Seconds to minutes (depends on queue depth)
- **Processing**: Seconds to minutes (depends on job type)
- **Completed**: Permanent state

### Failed Job Flow

```
1. Created (Pending)
2. Processing → Error encountered
3. Failed → Retry (if attempts < max)
4. Processing → Retry failed
5. Failed (Final) → Moved to DLQ
```

**Retry Logic:**
- **Max Attempts**: 3 (default)
- **Retry Delay**: Exponential backoff
- **DLQ Threshold**: 3+ failures

## Pagination

### Navigation Controls

- **Previous**: Go to previous page
- **Page Numbers**: Direct page navigation
- **Next**: Go to next page
- **Results Per Page**: 25 jobs per page (default)

### Total Records

Displayed at bottom:
```
Showing 1-25 of 1,250 total jobs
```

### Page Navigation

1. View current page of jobs
2. Click page number or Previous/Next
3. Page reloads with new job set
4. Filters persist across pagination

## Common Scenarios

### Scenario 1: Monitor Recent Jobs

**How to Check:**
1. Go to [/admin/queue/jobs](/admin/queue/jobs)
2. Leave filter on **"All"**
3. Jobs ordered by ID descending (newest first)
4. Review recent job statuses
5. Look for unusual failure patterns

### Scenario 2: Investigate Processing Jobs

**When to Check:**
- Jobs stuck in "Processing" state
- Suspicion of worker hang
- Performance investigation

**How to Investigate:**
1. Click **"Processing"** filter
2. Check **Started** timestamp
3. If > 10 minutes: likely stuck
4. Review **Data** column for clues
5. Check worker logs
6. Consider restarting workers

### Scenario 3: Analyze Failed Jobs

**Diagnosis Process:**
1. Click **"Failed"** filter
2. Review **Error** messages
3. Look for patterns:
   - Same error repeated → Systemic issue
   - Different errors → Data quality issue
   - Network errors → External service down
4. Click **Data** to view job payload
5. Navigate to [/admin/queue/failed](/admin/queue/failed) to retry

### Scenario 4: Audit Job History

**Use Case:** Verify job completion for compliance

**Process:**
1. Filter by **"Completed"**
2. Navigate through pages
3. Review **Created** and **Completed** timestamps
4. Calculate processing times
5. Export to activity logs at [/admin/log](/admin/log)

### Scenario 5: Clear Old Jobs

**Maintenance Task:** Remove completed jobs older than 30 days

**Process:**
1. Filter by **"Completed"**
2. Review oldest jobs (last pages)
3. Note job IDs for deletion
4. **Admin Action**: Database cleanup (manual)
5. **Alternative**: Implement auto-cleanup cron job

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| No jobs showing | Empty queue or filter issue | Check "All" filter, verify jobs exist |
| Jobs stuck in Pending | Workers not running | Check worker status, restart if needed |
| Jobs stuck in Processing | Worker hang or long operation | Review worker logs, restart workers |
| High failed job count | Systemic error | Check [/admin/queue/failed](/admin/queue/failed) for errors |
| JSON not expanding | Browser JavaScript error | Refresh page, check console |
| Pagination not working | Cache or session issue | Clear browser cache, refresh |

## Performance Considerations

### DataTable Implementation

- **Server-Side Processing**: Handles millions of jobs
- **Pagination**: Loads only 25 jobs per page
- **Database Indexing**: Fast queries on status, queue, created_at
- **Cache Integration**: Results cached for 2 minutes

### Cache Behavior

**Cache Key Pattern:**
```
datatable:jobs:{base64_query}
```

**TTL**: 2 minutes

**Invalidation:** Automatic after:
- Job status changes
- New jobs created
- Failed job retries

### View Cache Stats

Check cache performance at [/admin/cache/stats](/admin/cache/stats):
- Hit rate for job queries
- Memory usage
- Response times

## Integration Points

### Related Pages

| Page | Purpose | Link |
|------|---------|------|
| **Queue Dashboard** | Overview statistics | [/admin/queue](/admin/queue) |
| **Failed Jobs** | Retry management | [/admin/queue/failed](/admin/queue/failed) |
| **Activity Logs** | Job operation audit | [/admin/log](/admin/log) |
| **Cache Stats** | Performance monitoring | [/admin/cache/stats](/admin/cache/stats) |

### Worker System

**Worker Location:** `workers/` directory

**Active Workers:**
- `EmailWorker` - Email queue processing
- `TestWorker` - Test queue processing

**Worker Manager:** Orchestrates all workers at startup

### Database Schema

**jobs table:**
```sql
- id (primary key, auto-increment)
- queue (string, indexed)
- data (JSON payload)
- status (enum: pending, processing, completed, failed)
- attempts (integer)
- max_attempts (integer, default 3)
- error (text, nullable)
- available_at (timestamp)
- started_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- created_at, updated_at
```

## Best Practices

### Regular Monitoring

✅ **Daily Checks:**
- Review failed job count
- Check processing job ages
- Monitor pending queue depth
- Verify worker connectivity

### Job Cleanup

✅ **Maintenance:**
- Archive completed jobs monthly
- Remove failed jobs after resolution
- Keep last 90 days for audit
- Export to long-term storage if needed

### Performance Optimization

✅ **Optimization:**
- Keep total job count < 1 million
- Index frequently queried columns
- Use appropriate cache TTLs
- Monitor database query performance

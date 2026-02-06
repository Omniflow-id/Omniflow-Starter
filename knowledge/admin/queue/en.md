# Queue Management ([/admin/queue](/admin/queue))

The **Queue Management** system provides monitoring and control over RabbitMQ job queues and background task processing in the Omniflow system.

## Quick Actions

| Action | How |
|--------|-----|
| View queue stats | Go to [/admin/queue](/admin/queue) |
| Send test job | Click **"Send Test Job"** button |
| View all jobs | Go to [/admin/queue/jobs](/admin/queue/jobs) |
| View failed jobs | Go to [/admin/queue/failed](/admin/queue/failed) |
| Retry failed jobs | Go to [/admin/queue/failed](/admin/queue/failed) → **Retry** button |

## Queue Statistics Dashboard

### Job Status Overview

| Status | Description | Color Badge |
|--------|-------------|-------------|
| **Pending** | Jobs waiting to be processed | Yellow |
| **Processing** | Jobs currently being worked on | Blue |
| **Completed** | Successfully finished jobs | Green |
| **Failed** | Jobs that encountered errors | Red |

### RabbitMQ Connection Status

- **🟢 Connected**: RabbitMQ operational, jobs processing
- **🔴 Disconnected**: Fallback to database-only mode
- **⚙️ Circuit Breaker States**:
  - **CLOSED**: Normal operation, all jobs processed
  - **OPEN**: Service protection active, jobs saved to database only
  - **HALF_OPEN**: Testing recovery, limited job processing

## Circuit Breaker System

The circuit breaker protects the system from RabbitMQ failures:

### States

**CLOSED (Normal)**
- All jobs sent to RabbitMQ
- Workers processing jobs
- Full queue functionality

**OPEN (Protected)**
- Jobs saved to database only
- No RabbitMQ connection attempts
- Prevents cascade failures
- **Duration**: 1 minute before retry

**HALF_OPEN (Testing)**
- Limited job processing
- Testing if RabbitMQ recovered
- Auto-closes if successful
- Re-opens if fails

### Trigger Conditions

Circuit breaker opens after:
- 5 consecutive RabbitMQ failures
- Connection timeout errors
- Authentication failures

### Recovery

1. Wait for cooldown period (1 minute)
2. Circuit breaker enters HALF_OPEN
3. Send test job
4. **If success**: Circuit closes, resume normal operation
5. **If fail**: Circuit re-opens, wait another cycle

## Test Job Feature

Send test jobs to verify queue functionality:

### How to Send Test Job

1. Go to [/admin/queue](/admin/queue)
2. Click **"Send Test Job"** button
3. Job sent to `test_queue`
4. **Success**: Job appears in [/admin/queue/jobs](/admin/queue/jobs)
5. **Worker logs**: Check console for "Processing job from test_queue"

### What Test Jobs Do

- Verify RabbitMQ connection
- Test worker processing
- Validate job lifecycle
- Check circuit breaker recovery

**Test Job Data:**
```json
{
  "type": "test_job",
  "message": "Hello from admin panel",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "triggeredBy": "admin@omniflow.id"
}
```

## Job Management

### View All Jobs

Navigate to [/admin/queue/jobs](/admin/queue/jobs) for comprehensive job management:

- **Status Filtering**: All, Pending, Processing, Completed, Failed
- **Job Details**: ID, queue, status, attempts, timestamps
- **JSON Data Viewer**: Click to expand job data
- **Pagination**: Navigate through large job lists
- **Retry Failed**: Direct retry from job listing

### Job Data Structure

Each job contains:
- **ID**: Unique job identifier
- **Queue**: Target queue name (`test_queue`, `email_queue`, etc.)
- **Data**: JSON payload with job instructions
- **Status**: Current job state
- **Attempts**: Retry count vs max attempts
- **Timestamps**: Created, started, completed times
- **Error**: Failure details (for failed jobs)

## Navigation

### Queue Management Routes

| Route | Purpose |
|-------|---------|
| `/admin/queue` | Main statistics dashboard |
| `/admin/queue/jobs` | All jobs management interface |
| `/admin/queue/failed` | Failed jobs with retry functionality |

### Related Pages

- **Activity Logs**: [/admin/log](/admin/log) - View queue operation logs
- **Cache Stats**: [/admin/cache/stats](/admin/cache/stats) - Queue stats cached here

## Common Scenarios

### Scenario 1: Test Queue Functionality

**How to Verify:**
1. Go to [/admin/queue](/admin/queue)
2. Check connection status (should be 🟢 Connected)
3. Click **"Send Test Job"**
4. Navigate to [/admin/queue/jobs](/admin/queue/jobs)
5. Verify job appears with status "Completed"

### Scenario 2: RabbitMQ Connection Lost

**Symptoms:**
- Connection status shows 🔴 Disconnected
- Circuit breaker state: OPEN
- New jobs pending (not processing)

**Recovery Steps:**
1. Check RabbitMQ service status
2. Restart RabbitMQ if needed
3. Wait for circuit breaker to enter HALF_OPEN (1 minute)
4. Send test job to verify recovery
5. Circuit should close automatically

### Scenario 3: Jobs Stuck in Processing

**Diagnosis:**
1. Go to [/admin/queue/jobs](/admin/queue/jobs)
2. Filter by "Processing" status
3. Check timestamp - if > 10 minutes, likely stuck
4. Review worker logs for errors

**Solutions:**
- Restart worker processes
- Check worker health
- Review job data for corruption
- If persistent: restart RabbitMQ

### Scenario 4: High Failed Job Count

**Diagnosis:**
1. Go to [/admin/queue/failed](/admin/queue/failed)
2. Review error messages
3. Look for patterns:
   - Network errors → External service issues
   - Validation errors → Bad job data
   - Timeout errors → Worker overload

**Solutions:**
- Fix underlying issue (code, config, external service)
- Retry failed jobs in batches
- If unrec overable: Delete failed jobs after logging

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Jobs not processing | Connection status | Verify RabbitMQ service running |
| Circuit breaker open | Last error message | Fix RabbitMQ connection, wait for recovery |
| High pending count | Worker status | Ensure workers are running |
| Jobs failing repeatedly | Failed job errors | Review job data and worker logic |
| Test job not completing | Worker logs | Check worker process is active |
| No stats showing | Redis cache | Verify Redis connection |

## Queue System Architecture

### Workers

**Active Workers:**
- `EmailWorker`: Processes email queue jobs
- `TestWorker`: Handles test queue jobs (development)

**Worker Location:** `workers/` directory

**Worker Management:** `WorkerManager` orchestrates all workers

### Database Integration

**jobs table** stores all jobs:
- Persistent storage for durability
- Job tracking and monitoring
- Failed job analysis
- Retry management

### Dead Letter Queue (DLQ)

**Purpose:** Store jobs that fail 3+ times

**Configuration:**
- **TTL**: 24 hours (jobs auto-expire)
- **Manual Recovery**: Admin can view and retry
- **Access**: [/admin/queue/failed](/admin/queue/failed)

**When Jobs Go to DLQ:**
- After 3 failed attempts
- Unrecoverable errors
- Invalid job data

## Performance Monitoring

### Key Metrics

- **Pending Jobs**: Should be low (< 100)
- **Processing Jobs**: Indicates worker activity
- **Completed Jobs**: Total successful jobs
- **Failed Jobs**: Should be < 5% of total

### Cache Integration

Queue statistics cached for 2 minutes:
- **Cache Key**: `admin:queue:stats`
- **Invalidation**: After job operations
- **View Cache**: [/admin/cache/stats](/admin/cache/stats)

### Activity Logging

All queue operations logged:
- Job creation
- Job completion
- Job failures
- Retry operations
- Circuit breaker state changes

**View Logs:** [/admin/log](/admin/log)

## Best Practices

### Monitoring

✅ **Regular Checks:**
- Monitor pending count daily
- Review failed jobs weekly
- Test queue monthly
- Check circuit breaker state

### Job Retry Strategy

✅ **Good Practice:**
- Retry failed jobs after fixing root cause
- Review error patterns before bulk retry
- Keep DLQ TTL at 24 hours

❌ **Avoid:**
- Blindly retrying all failed jobs
- Ignoring failure patterns
- Letting DLQ grow indefinitely

### Production Deployment

✅ **Checklist:**
- Verify RabbitMQ connection
- Ensure workers are running
- Check circuit breaker is CLOSED
- Send test job to verify
- Monitor for first hour

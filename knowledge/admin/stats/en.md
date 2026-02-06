# Cache Statistics ([/admin/cache/stats](/admin/cache/stats))

The **Cache Statistics** page provides a comprehensive Redis cache dashboard for monitoring and managing system performance through caching operations.

## Quick Actions

| Action | How |
|--------|-----|
| View cache stats | Go to [/admin/cache/stats](/admin/cache/stats) |
| Test cache performance | Click **"Test Cache Performance"** button |
| Check health | Click **"Check Health"** button |
| Flush all cache | Click **"Flush All Cache"** button (⚠️ requires confirmation) |
| Invalidate pattern | Enter pattern → Click **"Invalidate Cache"** |

## Dashboard Overview

### Connection Status

- **🟢 Connected**: Redis is operational, caching active
- **🟡 Disconnected**: Falling back to database queries
- **Connection Info**: Host, port, database number
- **Uptime**: How long Redis has been running

### Cache Statistics

| Metric | Description | Good Value |
|--------|-------------|------------|
| **Total Keys** | Number of cached items | Varies by usage |
| **Memory Used** | Redis memory consumption | < 80% of max |
| **Hit Rate** | Cache success percentage | > 80% |
| **Hits** | Successful cache retrievals | Increasing |
| **Misses** | Cache misses (DB queries) | Low relative to hits |

## Cache Operations

### Test Cache Performance

Measures cache read/write speed:

1. Click **"Test Cache Performance"** button
2. View results:
   - **Write Time**: Time to store data in cache
   - **Read Time**: Time to retrieve data from cache
   - **Total Time**: Combined operation time
3. **Good Performance**: < 10ms per operation
4. **Slow Performance**: > 50ms (investigate Redis health)

### Check Health

Verifies Redis connection and responsiveness:

1. Click **"Check Health"** button
2. Response shows:
   - ✅ **Healthy**: Redis responding to PING
   - ❌ **Unhealthy**: Connection issues

### Flush All Cache ⚠️

**Warning:** This clears ALL cached data system-wide.

**When to Use:**
- After database schema changes
- After major configuration updates
- When debugging cache issues
- Before deployment (optional)

**How to Flush:**
1. Click **"Flush All Cache"** button
2. Confirm action in modal
3. All cache keys deleted immediately
4. **Result**: Next requests will be slower (cache rebuild)

### Invalidate Cache by Pattern

Selectively delete cache entries matching a pattern:

**Common Patterns:**

| Pattern | What It Deletes | Use Case |
|---------|----------------|----------|
| `admin:users:*` | All user-related admin cache | After user CRUD operations |
| `user:123:*` | Specific user's cache | After user profile update |
| `datatable:*` | All DataTable cache | After bulk data changes |
| `admin:logs:*` | Activity log cache | After log cleanup |
| `admin:queue:*` | Queue statistics cache | After queue operations |
| `admin:permissions:*` | Permission/role cache | After RBAC changes |

**How to Invalidate:**
1. Enter pattern in text field (e.g., `admin:users:*`)
2. Click **"Invalidate Cache"** button
3. **Result**: Only matching keys deleted

**Wildcard Rules:**
- `*` matches any characters
- `user:*` deletes `user:123`, `user:456:profile`, etc.
- `admin:*:list` deletes `admin:users:list`, `admin:logs:list`, etc.

## Cache Key Patterns

### Understanding Cache Keys

All cache keys follow a structured pattern:

```
{scope}:{resource}:{identifier}:{sub-resource}
```

### Common Key Patterns

**Admin Panel:**
- `admin:users:list` - User list page
- `admin:users:metadata` - User counts and filters
- `admin:logs:filters` - Log filter options
- `admin:permissions:roles` - Roles with permissions
- `admin:queue:stats` - Queue statistics

**DataTables:**
- `datatable:users:{base64_query}` - User DataTable results
- `datatable:logs:{base64_query}` - Log DataTable results
- `datatable:jobs:{base64_query}` - Jobs DataTable results

**User-Specific:**
- `user:{userId}:permissions` - User permissions cache
- `user:{userId}:profile` - User profile data
- `user:{userId}:settings` - User preferences

### Cache TTL (Time-To-Live)

| Cache Type | TTL | Reason |
|------------|-----|--------|
| User permissions | 5 minutes | Security-sensitive |
| Activity logs | 2 minutes | Frequently updated |
| User list | 5 minutes | Moderate changes |
| Queue stats | 2 minutes | Real-time monitoring |
| Role permissions | 5 minutes | Infrequent changes |
| DataTable queries | 2 minutes | User-specific searches |

## Interpreting Stats

### High Hit Rate (> 80%)

✅ **Good Sign:**
- Cache is effective
- Reduced database load
- Fast response times
- System performing well

### Low Hit Rate (< 50%)

⚠️ **Warning Signs:**
- Cache TTL too short
- Highly dynamic data
- Users making unique queries
- Cache being flushed too often

**Solutions:**
- Increase TTL for stable data
- Review cache invalidation logic
- Add more cache patterns
- Consider Redis memory limits

### High Memory Usage (> 80%)

⚠️ **Action Required:**
- Review cache key count
- Identify large cached objects
- Consider shorter TTLs
- Flush unused cache patterns
- Upgrade Redis memory allocation

## Common Cache Patterns

### Cache-Aside Pattern (Current Implementation)

1. **Check cache** first for data
2. **If miss**: Query database
3. **Store in cache** for next request
4. **If hit**: Return cached data

**Benefits:**
- Lazy loading (cache on demand)
- Resilient (works if Redis down)
- Automatic cache warming

### Cache Invalidation Strategy

The application uses **smart invalidation**:

```javascript
// After user creation
await invalidateCache("admin:users:*", true);
await invalidateCache("datatable:users:*", true);

// After permission change
await invalidateCache(`user:${userId}:permissions`, false);
await invalidateCache("admin:permissions:*", true);
```

## Common Scenarios

### Scenario 1: Page Loading Slow

**Problem:** Admin pages taking too long to load

**Diagnosis:**
1. Go to [/admin/cache/stats](/admin/cache/stats)
2. Check **Hit Rate** - if < 50%, cache not effective
3. Click **"Test Cache Performance"** - check response times
4. Review **Total Keys** - if very low, cache not being used

**Solutions:**
- If Redis disconnected: Check Redis service
- If high miss rate: Increase cache TTL
- If slow performance: Check Redis memory/CPU

### Scenario 2: Stale Data Showing

**Problem:** Updated data not appearing immediately

**Cause:** Cached data not invalidated after update

**Solutions:**
1. **Immediate**: Invalidate specific pattern:
   - For users: `admin:users:*`
   - For logs: `admin:logs:*`
   - For permissions: `user:*:permissions`
2. **Nuclear option**: Flush all cache (⚠️ impacts performance)
3. **Fix code**: Ensure controllers call `invalidateCache()` after updates

### Scenario 3: Memory Overflow

**Problem:** Redis running out of memory

**Diagnosis:**
1. Check **Memory Used** metric
2. Review **Total Keys** count
3. Look for unusual cache growth

**Solutions:**
1. **Immediate**: Flush old cache patterns
2. **Short-term**: Reduce cache TTLs
3. **Long-term**:
   - Increase Redis memory limit
   - Implement cache key expiration policy
   - Review what's being cached (avoid large objects)

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Cache not working | Redis disconnected | Check Redis service, restart if needed |
| Slow cache performance | High memory usage | Flush cache, check Redis resources |
| Stale data | Cache not invalidated | Use invalidation pattern or flush |
| Too many keys | No expiration policy | Review cache TTLs, implement cleanup |
| Low hit rate | Wrong cache patterns | Review application cache strategy |
| High memory | Large cached objects | Reduce cached data size, increase memory |

## Cache Monitoring Best Practices

### Regular Checks

- Monitor hit rate daily
- Review memory usage weekly
- Test performance monthly
- Flush cache after deployments (optional)

### Performance Benchmarks

- **Write operation**: < 5ms
- **Read operation**: < 2ms
- **Hit rate**: > 80%
- **Memory usage**: < 70%

### When to Flush

✅ **Good Times:**
- After database migrations
- After RBAC structure changes
- During deployment (optional)
- When debugging cache issues

❌ **Avoid Flushing:**
- During peak hours
- As a regular maintenance task
- Without understanding the issue
- When specific invalidation works

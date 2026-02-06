# User Overview ([/admin/overview](/admin/overview))

The **User Overview** page provides statistical insights and analytics about user accounts in the Omniflow system.

## Quick Actions

| Action | How |
|--------|-----|
| View user statistics | Go to [/admin/overview](/admin/overview) |
| View all users | Go to [/admin/users](/admin/users) |
| Manage roles | Go to [/admin/roles](/admin/roles) |
| Check activity logs | Go to [/admin/log](/admin/log) |

## Route Collision Notice

⚠️ **Important:** This page serves **two routes**:
- `/admin/overview` - Module overview
- `/admin/user/overview` - User-specific statistics

Both routes display the same user statistics content. This is a known route collision in the system.

## User Statistics Dashboard

### Total User Metrics

| Metric | Description |
|--------|-------------|
| **Total Users** | All user accounts in system |
| **Active Users** | Users with `is_active = true` |
| **Inactive Users** | Users with `is_active = false` |
| **New This Month** | Users created in current month |

### Role Distribution

**User Count by Role:**
- **Admin**: Full system access users
- **Manager**: Mid-level access users
- **User**: Basic access users
- **Custom Roles**: Department-specific roles

### Account Status Breakdown

**Active vs Inactive:**
- Percentage of active accounts
- Inactive account count
- Recent activation/deactivation trends

## Statistics Visualization

### Recommended Charts

**User Growth Chart (Line Chart):**
- X-axis: Months
- Y-axis: New users
- Shows monthly user registration trends

**Role Distribution (Pie Chart):**
- Segments: Each role
- Percentages: Distribution across roles
- Colors: Admin (red), Manager (yellow), User (blue)

**Active Status (Doughnut Chart):**
- Inner: Active count
- Outer: Inactive count
- Percentages: Active vs inactive ratio

### Chart.js Integration

The page uses Chart.js for data visualization:

```javascript
// Example: User growth chart
const ctx = document.getElementById('userGrowthChart').getContext('2d');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [12, 19, 8, 15, 22, 18],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
});
```

## Module Overview Context

### What is Module Overview?

Since this page also serves `/admin/overview`, it provides:
- **User module** statistics and insights
- High-level summary of user management
- Quick navigation to related pages
- Key metrics dashboard

### Related Modules

| Module | Overview Page |
|--------|---------------|
| Users | `/admin/overview` (this page) |
| Logs | `/admin/log` |
| Queue | `/admin/queue` |
| Cache | `/admin/cache/stats` |
| Permissions | `/admin/roles` |

## Common Scenarios

### Scenario 1: Monthly User Audit

**How to Review:**
1. Go to [/admin/overview](/admin/overview)
2. Check **Total Users** count
3. Review **Active vs Inactive** ratio
4. Note **New This Month** count
5. Compare with previous month
6. Document for compliance

### Scenario 2: Role Distribution Analysis

**How to Analyze:**
1. View role distribution chart
2. Identify imbalanced roles:
   - Too many Admins → Security risk
   - Too few Managers → Bottleneck
   - Unusual custom role counts
3. Navigate to [/admin/roles](/admin/roles) for details
4. Review role assignments at [/admin/users](/admin/users)

### Scenario 3: Inactive Account Cleanup

**Cleanup Process:**
1. Note **Inactive Users** count
2. Navigate to [/admin/users](/admin/users)
3. Filter or identify inactive accounts
4. Review last login dates (if available)
5. Deactivate or delete unused accounts
6. Return to overview to verify reduction

### Scenario 4: Growth Monitoring

**Monthly Review:**
1. Check **New This Month** metric
2. Compare with target (e.g., 50 new users/month)
3. If below target:
   - Review onboarding process
   - Check bulk import success
   - Verify registration availability
4. If above target:
   - Verify legitimate signups
   - Check for bulk imports
   - Review system capacity

## Statistics Context

### Cache Integration

User statistics are cached:
- **Cache Key**: `admin:user:overview` or `admin:overview`
- **TTL**: 5 minutes
- **Invalidation**: After user CRUD operations

**View Cache Performance:** [/admin/cache/stats](/admin/cache/stats)

### Data Sources

**Database Queries:**
```sql
-- Total users
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL

-- Active users
SELECT COUNT(*) FROM users WHERE is_active = true AND deleted_at IS NULL

-- New this month
SELECT COUNT(*) FROM users
WHERE created_at >= FIRST_DAY_OF_MONTH
AND deleted_at IS NULL

-- Role distribution
SELECT role, COUNT(*) FROM users
WHERE deleted_at IS NULL
GROUP BY role
```

### Activity Logging

User operations logged:
- User creation
- Account activation/deactivation
- Role changes
- User deletions

**View Logs:** [/admin/log](/admin/log)

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Statistics not loading | Cache status | Clear cache at [/admin/cache/stats](/admin/cache/stats) |
| Counts seem wrong | Soft deletes | Verify `deleted_at IS NULL` filter |
| New user count incorrect | Timezone | Check server timezone configuration |
| Role distribution missing | Database query | Verify roles table populated |
| Chart not rendering | Browser console | Check Chart.js library loaded |

## Performance Considerations

### Query Optimization

Statistics queries are:
- **Indexed**: Fast COUNT queries on status fields
- **Cached**: 5-minute TTL for repeated access
- **Lightweight**: Only aggregate counts, no user data

### Cache Benefits

- **Response Time**: < 5ms (cached) vs 50-100ms (database)
- **Database Load**: Reduced by 95% during high traffic
- **Scalability**: Handles thousands of concurrent views

## Best Practices

### Regular Monitoring

✅ **Weekly:**
- Review total user count
- Check active/inactive ratio
- Monitor new user trends
- Verify role distribution

✅ **Monthly:**
- Audit inactive accounts
- Review growth metrics
- Compare with business targets
- Document for reporting

### Threshold Alerts

Set up monitoring for:
- **Inactive ratio > 30%** - Too many inactive accounts
- **New users = 0** - Registration issue
- **Admin count > 10** - Security review needed
- **Total users > capacity** - Scale infrastructure

### Integration with Reporting

Use overview statistics for:
- **Management Reports**: Monthly KPIs
- **Compliance Audits**: User account tracking
- **Capacity Planning**: Growth projections
- **Security Reviews**: Role distribution analysis

## Related Pages

| Page | Purpose | Link |
|------|---------|------|
| **User Management** | CRUD operations | [/admin/users](/admin/users) |
| **Role Management** | Role configuration | [/admin/roles](/admin/roles) |
| **Activity Logs** | User operation audit | [/admin/log](/admin/log) |
| **Cache Stats** | Performance monitoring | [/admin/cache/stats](/admin/cache/stats) |

## Future Enhancements

### Potential Additions

- **Login Frequency Chart**: Track user engagement
- **Last Login Dates**: Identify dormant accounts
- **Registration Trends**: Daily/weekly signup patterns
- **Permission Usage**: Most/least used permissions
- **Department Breakdown**: User distribution by department
- **Export Functionality**: Download statistics as CSV/Excel

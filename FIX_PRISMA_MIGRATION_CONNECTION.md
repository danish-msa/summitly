# Fix Prisma Migration Connection Error (P1017)

## Problem
Error: `P1017 - Server has closed the connection` when running `npx prisma migrate dev`

## Root Cause
Prisma migrations use a **direct connection** (not the pg Pool adapter), and AWS RDS may be closing idle connections or timing out during migration operations.

## Solutions

### Solution 1: Add Connection Timeout Parameters (RECOMMENDED)

Update your `DATABASE_URL` in `.env.local` to include connection timeout parameters:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require&connect_timeout=30&pool_timeout=30"
```

**Important:**
- Replace `[PASSWORD]` with your actual RDS password (URL-encode special characters)
- `connect_timeout=30` - Wait up to 30 seconds to establish connection
- `pool_timeout=30` - Wait up to 30 seconds for a connection from the pool

### Solution 2: Use Connection Pooling Parameters

If Solution 1 doesn't work, try adding more connection parameters:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require&connect_timeout=60&pool_timeout=60&statement_timeout=300000"
```

- `statement_timeout=300000` - Allow queries to run for up to 5 minutes (300,000ms)

### Solution 3: Check RDS Security Group

1. Go to **AWS Console** → **RDS** → Your database instance
2. Click on **Connectivity & security** tab
3. Check **Security groups** → Click on the security group
4. Verify **Inbound rules** allow:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Your IP address (or `0.0.0.0/0` for testing, but restrict later)

### Solution 4: Verify RDS Instance Status

1. Go to **AWS Console** → **RDS** → Your database instance
2. Check **Status** is **Available** (not **Stopped** or **Maintenance**)
3. Check **Endpoint** matches your connection string

### Solution 5: Test Connection First

Before running migrations, test the connection:

```powershell
# Test direct connection
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly -c "SELECT version();"
```

If this fails, the issue is with network/security groups, not Prisma.

### Solution 6: Use Prisma Migrate with Explicit Connection

Try running migration with explicit connection parameters:

```powershell
# Set environment variable temporarily
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require&connect_timeout=60"

# Run migration
npx prisma migrate dev --name add_saved_comparables
```

### Solution 7: Check for Active Connections

If RDS has connection limits, check current connections:

```sql
-- Connect to RDS
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'summitly';

-- Check max connections
SHOW max_connections;
```

## Quick Fix Steps

1. **Update `.env.local`** with timeout parameters (Solution 1)
2. **Restart your terminal** to reload environment variables
3. **Try migration again:**
   ```powershell
   npx prisma migrate dev --name add_saved_comparables
   ```

## If Still Failing

1. **Check RDS logs:**
   - AWS Console → RDS → Your instance → **Logs & events**
   - Look for connection errors or timeouts

2. **Try connecting from different network:**
   - Test if it's a network/firewall issue

3. **Check RDS parameter group:**
   - Ensure `statement_timeout` and `idle_in_transaction_session_timeout` are set appropriately

4. **Contact AWS Support** if RDS instance is misconfigured

## Example .env.local Format

```env
# AWS RDS Connection with timeout parameters
DATABASE_URL="postgresql://postgres:YourPassword%40Here@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require&connect_timeout=60&pool_timeout=60"
```

**Remember:** URL-encode special characters in password:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`


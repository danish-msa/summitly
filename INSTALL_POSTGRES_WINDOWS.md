# Quick PostgreSQL Installation for Windows

## Step 1: Download PostgreSQL

1. **Visit**: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. **Select**:
   - Operating System: **Windows x86-64**
   - Version: **PostgreSQL 16** (latest)
3. **Click**: "Download" button

## Step 2: Install PostgreSQL

1. **Run the installer** (e.g., `postgresql-16.x-windows-x64.exe`)

2. **Installation Steps**:
   - **Welcome**: Click "Next"
   - **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`) → Click "Next"
   - **Select Components**: 
     - ✅ **PostgreSQL Server** (required)
     - ✅ **Command Line Tools** (REQUIRED - includes `pg_dump`, `psql`)
     - ✅ **pgAdmin 4** (optional, GUI tool)
     - ✅ **Stack Builder** (optional)
     - Click "Next"
   - **Data Directory**: Keep default → Click "Next"
   - **Password**: 
     - Enter: `postgres` (or any password you want - this is for LOCAL database only)
     - Confirm password
     - Click "Next"
   - **Port**: Keep `5432` (default) → Click "Next"
   - **Advanced Options**: Keep default → Click "Next"
   - **Pre Installation Summary**: Click "Next"
   - **Ready to Install**: Click "Next"
   - **Installing**: Wait for installation to complete
   - **Completing**: 
     - ✅ Uncheck "Launch Stack Builder" (optional)
     - Click "Finish"

## Step 3: Verify Installation

1. **Open a NEW PowerShell window** (important - restart PowerShell)

2. **Test commands**:
```powershell
pg_dump --version
psql --version
```

Both should show version numbers (e.g., `pg_dump (PostgreSQL) 16.x`)

## Step 4: Export Your Database

Once PostgreSQL is installed, run:

```powershell
cd C:\Users\Danish\Documents\GitHub\summitly

# Export schema
pg_dump -h db.omsefyactufffyqaxowx.supabase.co -U postgres -d postgres --schema-only --no-owner --no-privileges -f schema.sql

# When prompted, enter password: summitly@123

# Export data
pg_dump -h db.omsefyactufffyqaxowx.supabase.co -U postgres -d postgres --data-only --no-owner --no-privileges -f data.sql

# When prompted, enter password: summitly@123
```

## Troubleshooting

**If `pg_dump` is still not recognized after installation:**

1. **Check if PostgreSQL is installed**:
```powershell
Test-Path "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
```

2. **If it exists, add to PATH manually**:
   - Open **System Properties** → **Environment Variables**
   - Under **System variables**, find `Path` → Click **Edit**
   - Click **New** → Add: `C:\Program Files\PostgreSQL\16\bin`
   - Click **OK** on all dialogs
   - **Restart PowerShell**

3. **Or use full path**:
```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h db.omsefyactufffyqaxowx.supabase.co -U postgres -d postgres --schema-only --no-owner --no-privileges -f schema.sql
```

---

**Installation takes ~5 minutes. After that, you'll have `pg_dump` permanently available!**


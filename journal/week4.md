# Week 4 — Postgres and RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier cruddur-db-instance \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version  14.6 \
  --master-username <USERNAME> \
  --master-user-password <PASSWORD> \
  --allocated-storage 20 \
  --availability-zone us-east-1a \
  --backup-retention-period 0 \
  --port 5432 \
  --no-multi-az \
  --db-name cruddur \
  --storage-type gp2 \
  --publicly-accessible \
  --storage-encrypted \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --no-deletion-protection
```

```bash
# Connect to local Postgres DB
psql -h localhost -U postgres

# Create schema from a file
psql cruddur < db/schema.sql -h localhost -U postgres

# Postgres connection env vars
export CONNECTION_URL="postgresql://postgres:password@127.0.0.1:5432/cruddur"
gp env CONNECTION_URL="postgresql://postgres:password@127.0.0.1:5432/cruddur"
```
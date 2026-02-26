#!/usr/bin/env node
// Simple runner for SQL migration files using `pg` and `DATABASE_URL` env var.
// Usage:
//   npm install pg
//   DATABASE_URL="postgres://..." node scripts/run_migration.js

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function run(){
  const databaseUrl = process.env.DATABASE_URL
  if(!databaseUrl){
    console.error('ERROR: set DATABASE_URL environment variable (Postgres connection string)')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, '..', 'migrations', '20260226_add_price_pln.sql')
  if(!fs.existsSync(sqlPath)){
    console.error('Migration file not found:', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = new Client({ connectionString: databaseUrl })
  try{
    await client.connect()
    console.log('Connected — running migration...')
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('Migration applied successfully')
  }catch(err){
    try{ await client.query('ROLLBACK') }catch(_){ }
    console.error('Migration failed:', err.message || err)
    process.exit(1)
  }finally{
    await client.end()
  }
}

run()

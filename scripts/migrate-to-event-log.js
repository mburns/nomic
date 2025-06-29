#!/usr/bin/env node

const { runMigration } = require('../dist/scripts/migrate-to-event-log');

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🔄 Starting migration from YAML state to event log...');
  console.log('Args:', args);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    backupExisting: !args.includes('--no-backup'),
  };
  
  console.log('Migration options:', options);
  
  try {
    await runMigration(options);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 
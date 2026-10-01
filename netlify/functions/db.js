import mysql from 'mysql2/promise';

let pool = null;

export function getDbPool() {
  if (pool) return pool;

  const host = process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const port = Number(process.env.TIDB_PORT) || 4000;
  const user = process.env.TIDB_USER || 'xKet7a55B8AWXCZ.root';
  const password = process.env.TIDB_PASSWORD || 'wGDA8dCgw07PaR7t';
  const database = process.env.TIDB_DATABASE || 'test';

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  return pool;
}

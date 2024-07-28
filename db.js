import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candidatos',
  password: '48344834',
  port: 5432,
});

export default pool;

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres", 
  host: "localhost", 
  database: "sistema_votacao", 
  password: "48344834", 
  port: 5432, 
  // ssl: {
  //   rejectUnauthorized: false, 
  // }
});

export default pool;
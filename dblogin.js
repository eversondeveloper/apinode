import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres", 
  host: "worryingly-charitable-pewee.data-1.use1.tembo.io", 
  database: "sistema_votacao3", 
  password: "xQ2D0VaoyJcizFd9", 
  port: 5432, 
  ssl: {
    rejectUnauthorized: false, 
  }
});

export default pool;
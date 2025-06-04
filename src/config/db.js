import mysql from "mysql"
import dotenv from "dotenv"
dotenv.config()
const pool = mysql.createPool({
     host : process.env.HOST || "localhost",
    user : process.env.USER || "root",
    password : process.env.PASSWORD || "",
    database : process.env.DATABASE || "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

})

pool.getConnection((err, connection) => {
  if (err) {
    console.error(`Failed to connect to MySQL: ${err.message}`);
    console.error('Please check your database credentials and server.');
  } else {
    console.log(`MySQL connection pool created successfully at ${new Date().toLocaleString()}`);
    connection.release(); 
  }
});

export default pool;
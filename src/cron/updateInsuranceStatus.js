import cron from "node-cron";
import pool from "../config/db.js";  // note the `.js` extension


// Run at midnight every day
cron.schedule("0 0 * * *", () => {
  console.log("Running cron to update expired insurance cards...");

  const sql = `
    UPDATE insurance_cards
    SET status = 'expired'
    WHERE expiry_date < CURDATE() AND status != 'expired'
  `;

  pool.query(sql, (err, result) => {
    if (err) {
      return console.error("Cron job error:", err.message);
    }
    console.log(`Cron job completed. Rows updated: ${result.affectedRows}`);
  });
});

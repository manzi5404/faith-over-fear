require('dotenv').config({ path: './fof-backend/.env' });
const pool = require('./fof-backend/db/connection');

async function fixDB() {
    try {
        console.log("Checking and fixing reservations table...");
        
        // 1. Ensure id is AUTO_INCREMENT
        await pool.query(`ALTER TABLE reservations MODIFY id INT AUTO_INCREMENT;`);
        console.log("✅ id is now AUTO_INCREMENT");

        // 2. Add status column if it doesn't exist
        try {
            await pool.query(`ALTER TABLE reservations ADD COLUMN status VARCHAR(50) DEFAULT 'pending';`);
            console.log("✅ status column added");
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("✅ status column already exists");
            } else {
                throw e;
            }
        }

        console.log("✅ DB fixes completed successfully!");
    } catch (err) {
        console.error("❌ Error fixing DB:", err);
    } finally {
        process.exit(0);
    }
}

fixDB();

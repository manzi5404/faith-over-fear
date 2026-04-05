// checkEnv.js (ES module)
import dotenv from 'dotenv';
import path from 'path';

// path to your .env inside fof-backend
dotenv.config({ path: path.resolve('./fof-backend/.env') });

console.log('DB HOST:', process.env.DB_HOST);
console.log('DB USER:', process.env.DB_USER);
console.log('DB NAME:', process.env.DB_NAME);
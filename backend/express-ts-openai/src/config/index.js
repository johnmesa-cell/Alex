import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'alex_super_secret_key_2026',
};

export default config;
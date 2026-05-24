import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.trim() === '') {
            console.error('Error: JWT_SECRET no está definido en las variables de entorno');
            process.exit(1);
        }
        return secret;
    })(),
};

export default config;
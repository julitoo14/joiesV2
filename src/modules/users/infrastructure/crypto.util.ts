import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';

const getEncryptionKey = () => {
    // The user will set ENCRYPTION_KEY in their .env
    const envKey = process.env.ENCRYPTION_KEY || 'joies-default-secret-key-32-chars';
    return crypto.scryptSync(envKey, 'salt', 32); 
};

export function encryptString(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Error encrypting string:', error);
        return text;
    }
}

export function decryptString(text: string): string {
    if (!text) return text;
    if (!text.includes(':')) return text; // If it's not encrypted yet, return as is.
    
    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        if (!ivHex) return text;
        
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = textParts.join(':');
        
        const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Error decrypting string:', error);
        return text; 
    }
}

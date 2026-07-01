import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
        (req as any).userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
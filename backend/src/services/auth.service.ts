import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db.js';
import { config } from '../config/index.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  created_at?: string | Date;
}

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: UserResponse; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check existing email
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      const error: any = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Insert user into PostgreSQL
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [input.name.trim(), normalizedEmail, passwordHash]
    );

    const user: UserResponse = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as any
    );

    return { user, token };
  }

  static async login(input: LoginInput): Promise<{ user: UserResponse; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const result = await query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const dbUser = result.rows[0];

    const isMatch = await bcrypt.compare(input.password, dbUser.password_hash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const user: UserResponse = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      created_at: dbUser.created_at,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as any
    );

    return { user, token };
  }

  static async getProfile(userId: string): Promise<UserResponse> {
    const result = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }
}

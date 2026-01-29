import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Validate JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required in production');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-fallback-secret-not-for-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
}

export class AuthService {
  /**
   * Get or create default user for single-user mode (personal app)
   */
  static async getOrCreateDefaultUser(): Promise<AuthResult> {
    const defaultEmail = 'owner@localhost';

    let user = await prisma.user.findUnique({
      where: { email: defaultEmail },
    });

    if (!user) {
      // Create default user with profile
      const passwordHash = await bcrypt.hash('not-used-for-auto-login', 12);
      user = await prisma.user.create({
        data: {
          email: defaultEmail,
          passwordHash,
          name: 'Owner',
          profile: {
            create: {
              skills: '[]',
              preferRemote: true,
            },
          },
        },
      });
      console.log('Created default user for single-user mode');
    }

    // Generate long-lived token
    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Register a new user
   */
  static async register(email: string, password: string, name?: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with default profile
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        profile: {
          create: {
            skills: '[]',
            preferRemote: true,
          },
        },
      },
    });

    // Generate token
    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Login an existing user
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Verify a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as TokenPayload;
      return decoded;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate a JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, EFFECTIVE_JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      skills?: string[];
      experienceLevel?: string;
      minHourlyRate?: number;
      preferRemote?: boolean;
    }
  ) {
    const { name, ...profileData } = data;

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    // Update profile
    if (Object.keys(profileData).length > 0) {
      const updateData: Record<string, unknown> = {};

      if (profileData.skills !== undefined) {
        updateData.skills = JSON.stringify(profileData.skills);
      }
      if (profileData.experienceLevel !== undefined) {
        updateData.experienceLevel = profileData.experienceLevel;
      }
      if (profileData.minHourlyRate !== undefined) {
        updateData.minHourlyRate = profileData.minHourlyRate;
      }
      if (profileData.preferRemote !== undefined) {
        updateData.preferRemote = profileData.preferRemote;
      }

      await prisma.profile.update({
        where: { userId },
        data: updateData,
      });
    }

    return this.getUserById(userId);
  }
}

export default AuthService;

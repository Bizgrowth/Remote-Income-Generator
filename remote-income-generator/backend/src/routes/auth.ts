import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { requireAuth } from '../middleware/auth';
import { safeJsonParse } from '../utils/safeJson';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await AuthService.register(email, password, name);

    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      token: result.token,
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    let message = 'Registration failed';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthService.login(email, password);

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    let message = 'Login failed';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }
    res.status(401).json({ error: message });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await AuthService.getUserById(req.user!.userId);

    // Parse skills from JSON string safely
    const profile = user.profile
      ? {
          ...user.profile,
          skills: safeJsonParse<string[]>(user.profile.skills, []),
        }
      : null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, skills, experienceLevel, minHourlyRate, preferRemote } = req.body;

    const user = await AuthService.updateProfile(req.user!.userId, {
      name,
      skills,
      experienceLevel,
      minHourlyRate,
      preferRemote,
    });

    // Parse skills from JSON string safely
    const profile = user.profile
      ? {
          ...user.profile,
          skills: safeJsonParse<string[]>(user.profile.skills, []),
        }
      : null;

    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: message });
  }
});

export default router;

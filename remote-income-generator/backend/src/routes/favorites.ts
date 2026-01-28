import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/favorites
 * Get all favorited jobs for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const favorites = await prisma.favoriteJob.findMany({
      where: { userId: req.user!.userId },
      include: {
        applications: true,
        optimizedResumes: {
          select: { id: true, atsScore: true, createdAt: true },
        },
        coverLetters: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsed = favorites.map((fav) => ({
      ...fav,
      requirements: fav.requirements ? JSON.parse(fav.requirements) : [],
      matchReasons: fav.matchReasons ? JSON.parse(fav.matchReasons) : [],
      application: fav.applications[0] || null,
      hasOptimizedResume: fav.optimizedResumes.length > 0,
      hasCoverLetter: fav.coverLetters.length > 0,
    }));

    res.json({ favorites: parsed, total: favorites.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get favorites';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/favorites
 * Add a job to favorites
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      externalId,
      title,
      company,
      description,
      requirements,
      url,
      source,
      salary,
      location,
      isRemote,
      postedAt,
      matchScore,
      matchReasons,
    } = req.body;

    // Validation
    if (!title || !company || !url || !source) {
      return res.status(400).json({
        error: 'Missing required fields: title, company, url, source',
      });
    }

    // Check if already favorited
    const existing = await prisma.favoriteJob.findUnique({
      where: {
        userId_url: {
          userId: req.user!.userId,
          url,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Job already favorited', favorite: existing });
    }

    // Create favorite and application tracking entry
    const favorite = await prisma.favoriteJob.create({
      data: {
        userId: req.user!.userId,
        externalId,
        title,
        company,
        description: description || '',
        requirements: requirements ? JSON.stringify(requirements) : null,
        url,
        source,
        salary,
        location,
        isRemote: isRemote ?? true,
        postedAt: postedAt ? new Date(postedAt) : null,
        matchScore,
        matchReasons: matchReasons ? JSON.stringify(matchReasons) : null,
        applications: {
          create: {
            userId: req.user!.userId,
            status: 'favorited',
          },
        },
      },
      include: {
        applications: true,
      },
    });

    res.status(201).json({
      message: 'Job added to favorites',
      favorite: {
        ...favorite,
        requirements: favorite.requirements ? JSON.parse(favorite.requirements) : [],
        matchReasons: favorite.matchReasons ? JSON.parse(favorite.matchReasons) : [],
        application: favorite.applications[0],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add favorite';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/favorites/:id
 * Get a single favorite job with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const favorite = await prisma.favoriteJob.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        applications: true,
        optimizedResumes: {
          include: {
            resume: { select: { id: true, name: true } },
          },
        },
        coverLetters: true,
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({
      favorite: {
        ...favorite,
        requirements: favorite.requirements ? JSON.parse(favorite.requirements) : [],
        matchReasons: favorite.matchReasons ? JSON.parse(favorite.matchReasons) : [],
        application: favorite.applications[0] || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get favorite';
    res.status(500).json({ error: message });
  }
});

/**
 * PATCH /api/favorites/:id
 * Update a favorite (notes, priority)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { notes, priority } = req.body;

    const favorite = await prisma.favoriteJob.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data: {
        ...(notes !== undefined && { notes }),
        ...(priority !== undefined && { priority }),
      },
    });

    if (favorite.count === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    const updated = await prisma.favoriteJob.findUnique({
      where: { id: req.params.id },
    });

    res.json({ message: 'Favorite updated', favorite: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update favorite';
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/favorites/:id
 * Remove a job from favorites
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await prisma.favoriteJob.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove favorite';
    res.status(500).json({ error: message });
  }
});

/**
 * PATCH /api/favorites/:id/status
 * Update application status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = [
      'favorited',
      'optimized',
      'applied',
      'interviewing',
      'offered',
      'rejected',
      'withdrawn',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Get the application for this favorite
    const application = await prisma.application.findFirst({
      where: {
        favoriteJobId: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update with appropriate timestamps
    const updateData: Record<string, unknown> = { status };

    if (notes !== undefined) updateData.notes = notes;

    if (status === 'optimized' && !application.optimizedAt) {
      updateData.optimizedAt = new Date();
    }
    if (status === 'applied' && !application.appliedAt) {
      updateData.appliedAt = new Date();
    }
    if (['interviewing', 'offered', 'rejected'].includes(status) && !application.responseAt) {
      updateData.responseAt = new Date();
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: updateData,
    });

    res.json({ message: 'Status updated', application: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/favorites/stats
 * Get statistics about favorites and applications
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user!.userId },
      select: { status: true },
    });

    const stats = {
      total: applications.length,
      byStatus: {} as Record<string, number>,
    };

    for (const app of applications) {
      stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
    }

    res.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    res.status(500).json({ error: message });
  }
});

export default router;

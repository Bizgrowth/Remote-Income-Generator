import { Router, Request, Response } from 'express';
import { getProfile, saveProfile } from '../services/database';
import { SKILL_CATEGORIES } from '../types';

const router = Router();

// Get user profile
router.get('/', (req: Request, res: Response) => {
  try {
    const profile = getProfile();
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.post('/', (req: Request, res: Response) => {
  try {
    const { skills, experience, minHourlyRate, minProjectRate, preferredCategories } = req.body;

    saveProfile({
      skills: skills || [],
      experience: experience || '',
      minHourlyRate: minHourlyRate ? parseInt(minHourlyRate, 10) : undefined,
      minProjectRate: minProjectRate ? parseInt(minProjectRate, 10) : undefined,
      preferredCategories: preferredCategories || []
    });

    const updatedProfile = getProfile();
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get available skill categories
router.get('/skills', (req: Request, res: Response) => {
  res.json({
    categories: SKILL_CATEGORIES
  });
});

// Add skills to profile
router.post('/skills', (req: Request, res: Response) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array' });
    }

    const profile = getProfile();
    const newSkills = [...new Set([...profile.skills, ...skills])];

    saveProfile({
      ...profile,
      skills: newSkills
    });

    res.json({
      message: 'Skills added successfully',
      skills: newSkills
    });
  } catch (error) {
    console.error('Error adding skills:', error);
    res.status(500).json({ error: 'Failed to add skills' });
  }
});

// Remove skill from profile
router.delete('/skills/:skill', (req: Request, res: Response) => {
  try {
    const { skill } = req.params;
    const profile = getProfile();

    const newSkills = profile.skills.filter(s => s !== skill);

    saveProfile({
      ...profile,
      skills: newSkills
    });

    res.json({
      message: 'Skill removed successfully',
      skills: newSkills
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

export default router;

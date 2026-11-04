import express from 'express';
import { google, signOut, signin, signup, getMe, syncProfile, demoLogin } from '../controllers/auth.controller.js';
import { verifyToken, verifyTokenIfPresent } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/signup', verifyTokenIfPresent, signup);
router.post('/signin', signin);
router.post('/demo', demoLogin);
router.post('/google', verifyTokenIfPresent, google);
router.get('/signout', signOut);
router.get('/me', verifyToken, getMe);
router.post('/me', verifyToken, syncProfile);

export default router;
import express from 'express';
import { createListing, deleteListing, updateListing, getListing, getListings, reportListing } from '../controllers/listing.controller.js';
import { verifyToken, verifyTokenIfPresent } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/create', verifyToken, createListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.delete('/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.put('/update/:id', verifyToken, updateListing);
router.patch('/update/:id', verifyToken, updateListing);
router.put('/:id', verifyToken, updateListing);
router.patch('/:id', verifyToken, updateListing);
router.get('/get/:id', verifyTokenIfPresent, getListing);
router.post('/reports', reportListing);
router.get('/get', getListings);
router.get('/:id', verifyTokenIfPresent, getListing);
router.get('/', getListings);

export default router;

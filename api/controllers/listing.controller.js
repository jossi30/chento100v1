import { errorHandler } from '../utils/error.js';
import { firebaseStore } from '../utils/firebaseStore.js';

const isAdmin = (user) => Boolean(user?.isAdmin || user?.role === 'admin');

export const createListing = async (req, res, next) => {
  try {
    const admin = isAdmin(req.user);
    const status = admin && req.body.status === 'approved' ? 'approved' : 'pending';
    const userId = req.user?.id || req.user?.uid || req.user?._id || 'user_demo';
    const listing = await firebaseStore.createListing({
      ...req.body,
      status,
      isApproved: status === 'approved',
      active: req.body.active !== false,
      isActive: req.body.active !== false,
      ownerId: userId,
      userRef: userId,
      ownerEmail: req.user?.email || '',
      ownerName: req.user?.displayName || req.user?.name || '',
    });
    return res.status(201).json(listing);
  } catch (error) {
    return next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await firebaseStore.getListing(id);
    if (!listing) return next(errorHandler(404, 'Listing not found.'));

    const admin = isAdmin(req.user);
    const userMatches = [req.user?.id, req.user?.uid, req.user?._id].filter(Boolean);
    const listingOwners = [listing.ownerId, listing.userRef].filter(Boolean);
    const isOwner =
      listingOwners.some((o) => userMatches.includes(o)) ||
      Boolean(listing.ownerEmail && req.user?.email && listing.ownerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!admin && !isOwner) {
      return next(errorHandler(403, 'You can only delete your own listings.'));
    }

    await firebaseStore.deleteListing(id);
    return res.status(200).json({ success: true, message: 'Listing deleted.', deletedId: id });
  } catch (error) {
    return next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await firebaseStore.getListing(id);
    if (!existing) return next(errorHandler(404, 'Listing not found.'));

    const admin = isAdmin(req.user);
    const userMatches = [req.user?.id, req.user?.uid, req.user?._id].filter(Boolean);
    const listingOwners = [existing.ownerId, existing.userRef].filter(Boolean);
    const isOwner =
      listingOwners.some((o) => userMatches.includes(o)) ||
      Boolean(existing.ownerEmail && req.user?.email && existing.ownerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!admin && !isOwner) return next(errorHandler(403, 'You can only update your own listings.'));

    let updates = { ...req.body };
    if (!admin) {
      const attemptsToTakeOffline =
        updates.active === false ||
        updates.isActive === false ||
        updates.isAvailable === false ||
        updates.available === false;
      for (const field of ['status', 'isApproved', 'active', 'isActive', 'featured', 'rejectionReason', 'ownerId', 'userRef', 'approvedAt', 'approvedBy']) {
        delete updates[field];
      }

      if (updates.availabilityRequest) {
        if (existing.status !== 'approved') {
          return next(errorHandler(400, 'Only approved listings can request an availability change.'));
        }
        updates.availabilityRequest = {
          status: 'pending',
          requestedAt: new Date().toISOString(),
          requestedBy: req.user.id || req.user.uid,
          requestedByEmail: req.user.email || '',
          availabilityNotes: String(updates.availabilityRequest.availabilityNotes || ''),
          availableFrom: String(updates.availabilityRequest.availableFrom || ''),
          availableUntil: String(updates.availabilityRequest.availableUntil || ''),
          blockedDates: Array.isArray(updates.availabilityRequest.blockedDates) ? updates.availabilityRequest.blockedDates : [],
        };
        for (const field of ['isAvailable', 'available', 'availabilityStatus']) {
          delete updates[field];
        }
      } else {
        if (attemptsToTakeOffline) {
          return next(errorHandler(400, 'Request an availability change for admin approval instead of taking the listing offline directly.'));
        }
      }
    }

    const updated = await firebaseStore.updateListing(id, updates);
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await firebaseStore.getListing(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found.'));
    const isPubliclyVisible =
      listing.status === 'approved' &&
      listing.active !== false &&
      listing.isActive !== false;
    const userMatches = [req.user?.id, req.user?.uid, req.user?._id].filter(Boolean);
    const listingOwners = [listing.ownerId, listing.userRef].filter(Boolean);
    const isOwner = Boolean(
      req.user &&
      (listingOwners.some((o) => userMatches.includes(o)) ||
        (listing.ownerEmail && req.user?.email && listing.ownerEmail.toLowerCase() === req.user.email.toLowerCase()))
    );
    if (!isPubliclyVisible && !isAdmin(req.user) && !isOwner) {
      return next(errorHandler(404, 'Listing not found.'));
    }
    return res.status(200).json(listing);
  } catch (error) {
    return next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const listings = await firebaseStore.getListings(req.query);
    return res.status(200).json(listings);
  } catch (error) {
    return next(error);
  }
};

export const reportListing = async (req, res, next) => {
  try {
    const listingId = String(req.body?.listingId || '').trim();
    const reason = String(req.body?.reason || '').trim();
    if (!listingId || !reason) return next(errorHandler(400, 'A listing ID and report reason are required.'));
    const listing = await firebaseStore.getListing(listingId);
    if (!listing) return next(errorHandler(404, 'Listing not found.'));
    const report = await firebaseStore.createReport({
      listingId,
      listingTitle: listing.title || listing.name || '',
      reporterId: req.body.reporterId || 'visitor',
      reason: reason.slice(0, 2000),
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
};

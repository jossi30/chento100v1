import { errorHandler } from '../utils/error.js';
import { firebaseStore, getFirebaseAuth } from '../utils/firebaseStore.js';

const listingQuery = (req) => ({
  ...req.query,
  all: 'true',
  isAdmin: 'true',
  limit: req.query.limit || '500',
});

export const getAdminListings = async (req, res, next) => {
  try {
    let listings = await firebaseStore.getListings(listingQuery(req));
    const filter = req.query.status || req.query.filter;
    if (filter && filter !== 'all') {
      listings = listings.filter((listing) => listing.status === filter);
    }
    return res.status(200).json(listings);
  } catch (error) {
    return next(error);
  }
};

export const getAllListings = getAdminListings;

export const getPendingListings = async (req, res, next) => {
  try {
    const listings = await firebaseStore.getListings({ ...listingQuery(req), status: 'pending' });
    return res.status(200).json(listings);
  } catch (error) {
    return next(error);
  }
};

export const approveListing = async (req, res, next) => {
  try {
    const updated = await firebaseStore.approveListing(req.params.id, req.user.id);
    if (!updated) return next(errorHandler(404, 'Listing not found.'));
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

export const rejectListing = async (req, res, next) => {
  try {
    const reason = String(req.body?.reason || req.body?.rejectionReason || '').trim();
    if (!reason) return next(errorHandler(400, 'A rejection reason is required.'));
    const updated = await firebaseStore.rejectListing(req.params.id, reason);
    if (!updated) return next(errorHandler(404, 'Listing not found.'));
    const withReviewer = await firebaseStore.updateListing(req.params.id, {
      rejectedBy: req.user.id,
      rejectedAt: new Date().toISOString(),
    });
    return res.status(200).json(withReviewer);
  } catch (error) {
    return next(error);
  }
};

export const toggleStatusListing = async (req, res, next) => {
  try {
    const updated = await firebaseStore.toggleStatusListing(req.params.id);
    if (!updated) return next(errorHandler(404, 'Listing not found.'));
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

export const toggleActiveListing = toggleStatusListing;

export const getUsers = async (req, res, next) => {
  try {
    const [users, listings] = await Promise.all([firebaseStore.getAllUsers(), firebaseStore.getAllListings()]);
    let enriched = users.map((user) => {
      const { password, ...safeUser } = user;
      const userListings = listings.filter(
        (listing) =>
          listing.ownerId === user._id ||
          listing.userRef === user._id ||
          (user.email && listing.ownerEmail?.toLowerCase() === user.email.toLowerCase())
      );
      const isAdmin = Boolean(safeUser.isAdmin || safeUser.role === 'admin');
      const isHost = safeUser.accountType === 'host' || safeUser.role === 'host' || userListings.length > 0;
      return {
        ...safeUser,
        uid: safeUser._id || safeUser.id,
        id: safeUser._id || safeUser.id,
        displayName: safeUser.displayName || safeUser.username || safeUser.email?.split('@')[0],
        name: safeUser.displayName || safeUser.username || safeUser.email?.split('@')[0],
        phoneNumber: safeUser.phoneNumber || safeUser.phone || '',
        phone: safeUser.phone || safeUser.phoneNumber || '',
        accountType: isAdmin ? 'admin' : isHost ? 'host' : 'user',
        role: isAdmin ? 'admin' : isHost ? 'host' : 'user',
        listingCount: userListings.length,
      };
    });

    const type = req.query.type;
    if (type && type !== 'all') {
      if (type === 'host') enriched = enriched.filter((user) => user.role === 'host');
      else if (type === 'admin') enriched = enriched.filter((user) => user.role === 'admin');
      else if (type === 'user' || type === 'guest') enriched = enriched.filter((user) => user.role === 'user');
    }

    const search = String(req.query.search || req.query.q || '').toLowerCase().trim();
    if (search) {
      enriched = enriched.filter((user) =>
        [user.displayName, user.email, user.phone, user.phoneNumber]
          .some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    return res.status(200).json(enriched);
  } catch (error) {
    return next(error);
  }
};

export const getAdminStatsController = async (req, res, next) => {
  try {
    return res.status(200).json(await firebaseStore.getAdminStats());
  } catch (error) {
    return next(error);
  }
};

export const getEnquiriesController = async (req, res, next) => {
  try {
    return res.status(200).json(await firebaseStore.getEnquiries());
  } catch (error) {
    return next(error);
  }
};

export const getReportsController = async (_req, res, next) => {
  try {
    const reports = await firebaseStore.getReports();
    reports.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
    return res.status(200).json(reports);
  } catch (error) {
    return next(error);
  }
};

export const updateReportController = async (req, res, next) => {
  try {
    const status = String(req.body.status || '').trim();
    if (!['open', 'resolved', 'dismissed'].includes(status)) {
      return next(errorHandler(400, 'A valid report status is required.'));
    }
    const report = await firebaseStore.updateReport(req.params.id, { status });
    if (!report) return next(errorHandler(404, 'Report not found.'));
    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

export const getAuditLogsController = async (req, res, next) => {
  try {
    return res.status(200).json(await firebaseStore.getAuditLogs(req.query.limit));
  } catch (error) {
    return next(error);
  }
};

export const createAuditLogController = async (req, res, next) => {
  try {
    const { action, targetId, details } = req.body;
    if (!action || typeof action !== 'string') {
      return next(errorHandler(400, 'An audit action is required.'));
    }
    const entry = await firebaseStore.createAuditLog({
      adminId: req.user.id,
      action: action.slice(0, 100),
      targetId: typeof targetId === 'string' ? targetId.slice(0, 200) : '',
      details: details && typeof details === 'object' ? details : {},
    });
    return res.status(201).json(entry);
  } catch (error) {
    return next(error);
  }
};

export const getAdminSettingsController = async (_req, res, next) => {
  try {
    return res.status(200).json(await firebaseStore.getSettings('marketplace') || {});
  } catch (error) {
    return next(error);
  }
};

export const updateAdminSettingsController = async (req, res, next) => {
  try {
    const settings = { ...req.body, updatedBy: req.user.id };
    delete settings.updatedAt;
    const updated = await firebaseStore.updateSettings('marketplace', settings);
    await firebaseStore.createAuditLog({
      adminId: req.user.id,
      action: 'UPDATE_SETTINGS',
      targetId: 'marketplace',
    });
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

export const getListingHistoryController = async (_req, res, next) => {
  try {
    const listings = await firebaseStore.getAllListings();
    const now = new Date();
    const days = new Map();
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - offset);
      const dateKey = date.toISOString().split('T')[0];
      days.set(dateKey, {
        date: dateKey,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        guesthouse: 0,
        car: 0,
        total: 0,
      });
    }
    for (const listing of listings) {
      const item = days.get(String(listing.createdAt || '').split('T')[0]);
      if (!item) continue;
      if (listing.type === 'car') item.car += 1;
      else item.guesthouse += 1;
      item.total += 1;
    }
    return res.status(200).json(Array.from(days.values()));
  } catch (error) {
    return next(error);
  }
};

export const getOwnerIntelligenceController = async (req, res, next) => {
  try {
    const ownerEmail = String(req.query.email || '').trim().toLowerCase();
    const listings = await firebaseStore.getAllListings();
    const ownerListings = listings.filter((listing) =>
      listing.ownerId === req.params.id ||
      listing.userRef === req.params.id ||
      (ownerEmail && String(listing.ownerEmail || '').toLowerCase() === ownerEmail)
    );
    const rejectionHistory = ownerListings
      .filter((listing) => listing.status === 'rejected')
      .map((listing) => ({
        id: listing.id || listing._id,
        title: listing.title || 'Untitled',
        reason: listing.rejectionReason || 'No reason provided',
        date: listing.updatedAt || listing.createdAt,
      }));
    return res.status(200).json({
      totalListings: ownerListings.length,
      otherListings: ownerListings,
      rejectionCount: rejectionHistory.length,
      rejectionHistory,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateEnquiryController = async (req, res, next) => {
  try {
    const updated = await firebaseStore.updateEnquiry(req.params.id, {
      status: req.body.status || 'contacted',
      notes: req.body.notes || '',
    });
    if (!updated) return next(errorHandler(404, 'Enquiry not found.'));
    return res.status(200).json({ success: true, ...updated });
  } catch (error) {
    return next(error);
  }
};

export const adminCreateListing = async (req, res, next) => {
  try {
    const body = req.body;
    const category =
      body.category === 'car' || ['car', 'car_service', 'sale'].includes(body.type)
        ? 'car_service'
        : 'guesthouse';
    const title = body.title || body.name || 'Untitled Listing';
    const address = body.address || body.location || '';
    const price = Number(body.price ?? body.regularPrice ?? 0);
    const regularPrice = Number(body.regularPrice ?? body.price ?? 0);
    const status = body.status === 'pending' || body.status === 'rejected' ? body.status : 'approved';
    const images = body.images || body.imageUrls || body.imageURLs || [];
    const listing = await firebaseStore.createListing({
      ...body,
      title,
      name: body.name || title,
      address,
      location: body.location || address,
      city: body.city || address.split(',')[0].trim(),
      category,
      type: category === 'car_service' ? 'car' : 'guesthouse',
      regularPrice,
      price,
      status,
      isApproved: status === 'approved',
      active: body.active !== false,
      isActive: body.active !== false,
      images: Array.isArray(images) ? images : [],
      imageUrls: Array.isArray(images) ? images : [],
      ownerId: req.user.id,
      userRef: req.user.id,
      ownerEmail: req.user.email || '',
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json(listing);
  } catch (error) {
    return next(error);
  }
};

export const adminDeleteListing = async (req, res, next) => {
  try {
    const deleted = await firebaseStore.deleteListing(req.params.id);
    if (!deleted) return next(errorHandler(404, 'Listing not found.'));
    return res.status(200).json({
      success: true,
      message: 'Listing deleted.',
      deletedId: req.params.id,
    });
  } catch (error) {
    return next(error);
  }
};

export const adminUpdateListing = async (req, res, next) => {
  try {
    const updated = await firebaseStore.updateListing(req.params.id, req.body);
    if (!updated) return next(errorHandler(404, 'Listing not found.'));
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

export const adminGetListing = async (req, res, next) => {
  try {
    if (req.params.id === 'pending') return getPendingListings(req, res, next);
    if (req.params.id === 'all') return getAllListings(req, res, next);
    const listing = await firebaseStore.getListing(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found.'));
    return res.status(200).json(listing);
  } catch (error) {
    return next(error);
  }
};

export const setAdminClaim = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const uid = String(req.body.uid || '').trim();
    const grantAdmin = req.body.admin !== false;
    if (!email && !uid) return next(errorHandler(400, 'Target user ID or email is required.'));
    if (!grantAdmin && ((email && req.user.email?.toLowerCase() === email) || (uid && req.user.id === uid))) {
      return next(errorHandler(400, 'You cannot demote yourself.'));
    }
    const user = uid ? await firebaseStore.getUser(uid) : await firebaseStore.getUserByEmail(email);
    if (!user) return next(errorHandler(404, 'User not found.'));

    const targetEmail = String(user.email || email).toLowerCase();
    await firebaseStore.updateUser(user._id, {
      role: grantAdmin ? 'admin' : 'user',
      accountType: grantAdmin ? 'admin' : 'user',
      isAdmin: grantAdmin,
    });
    await getFirebaseAuth().setCustomUserClaims(user._id, grantAdmin ? { admin: true } : { admin: false });
    if (grantAdmin) {
      await firebaseStore.createAdminRecord(user._id, targetEmail);
    } else {
      await firebaseStore.deleteAdminRecord(user._id);
    }
    return res.status(200).json({
      success: true,
      message: `Admin privileges ${grantAdmin ? 'granted to' : 'revoked from'} ${targetEmail}.`,
    });
  } catch (error) {
    return next(error);
  }
};

export const setUserDisabled = async (req, res, next) => {
  try {
    const uid = req.body.uid || req.params.id;
    if (!uid) return next(errorHandler(400, 'User UID is required.'));
    const disabled = Boolean(req.body.disabled);
    if (req.user.id === uid && disabled) {
      return next(errorHandler(400, 'You cannot disable your own account.'));
    }
    await getFirebaseAuth().updateUser(uid, { disabled });
    await firebaseStore.updateUser(uid, { disabled });
    return res.status(200).json({ success: true, message: `User ${disabled ? 'disabled' : 'enabled'}.` });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { uid } = req.body;
    if (!uid) return next(errorHandler(400, 'User UID is required.'));
    if (req.user.id === uid) return next(errorHandler(400, 'You cannot delete your own account.'));
    await getFirebaseAuth().deleteUser(uid);
    await firebaseStore.deleteUser(uid);
    return res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    return next(error);
  }
};

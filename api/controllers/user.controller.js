import { errorHandler } from '../utils/error.js';
import { firebaseStore, getFirebaseAuth } from '../utils/firebaseStore.js';

const publicUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const test = (_req, res) => {
  res.json({ message: 'Api route is working!' });
};

export const updateUser = async (req, res, next) => {
  try {
    const isSelf = req.user.id === req.params.id || req.user.uid === req.params.id || req.user._id === req.params.id;
    if (!isSelf && !req.user.isAdmin) {
      return next(errorHandler(403, 'You can only update your own account.'));
    }

    const allowedFields = ['displayName', 'name', 'username', 'phone', 'phoneNumber', 'avatar', 'hostType', 'businessName', 'city', 'registeredAsPartner'];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );
    if (req.body.role === 'host' || req.body.accountType === 'host') {
      updates.role = 'host';
      updates.accountType = 'host';
      updates.registeredAsPartner = true;
    }
    if (updates.displayName) {
      try {
        const auth = getFirebaseAuth();
        if (auth && typeof auth.updateUser === 'function') {
          await auth.updateUser(req.params.id, { displayName: updates.displayName });
        }
      } catch {
        // Safe fallback in development / local mode
      }
    }
    const updated = await firebaseStore.updateUser(req.params.id, updates);
    if (!updated) return next(errorHandler(404, 'User not found.'));
    return res.status(200).json(publicUser(updated));
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const isSelf = req.user.id === req.params.id || req.user.uid === req.params.id || req.user._id === req.params.id;
    if (!isSelf && !req.user.isAdmin) {
      return next(errorHandler(403, 'You can only delete your own account.'));
    }
    try {
      const auth = getFirebaseAuth();
      if (auth && typeof auth.deleteUser === 'function') {
        await auth.deleteUser(req.params.id);
      }
    } catch {
      // Safe fallback in development / local mode
    }
    await firebaseStore.deleteUser(req.params.id);
    return res.status(200).json({ success: true, message: 'User account deleted.' });
  } catch (error) {
    return next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  try {
    const isSelf = req.user.id === req.params.id || req.user.uid === req.params.id || req.user._id === req.params.id;
    if (!isSelf && !req.user.isAdmin) {
      return next(errorHandler(403, 'You can only view your own listings.'));
    }
    const listings = await firebaseStore.getListings({
      all: 'true',
      isAdmin: 'true',
      userRef: req.params.id,
      limit: '500',
    });
    return res.status(200).json(listings);
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await firebaseStore.getUser(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found.'));
    return res.status(200).json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};

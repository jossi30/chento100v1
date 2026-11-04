import fs from 'fs';
import path from 'path';
import { normalizeListing } from './normalizeListing.js';

const resolveDataDir = () => {
  const rootData = path.join(process.cwd(), 'api', 'data');
  if (fs.existsSync(rootData)) return rootData;
  const directData = path.join(process.cwd(), 'data');
  if (fs.existsSync(directData)) return directData;
  return rootData;
};
const DATA_DIR = resolveDataDir();
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const listingsMap = new Map();
const usersMap = new Map();

export { normalizeListing };

// Save listings to disk synchronously
const saveListingsToDisk = () => {
  try {
    const list = Array.from(listingsMap.values());
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage Engine] Failed to save listings to disk:', err.message);
  }
};

// Load listings from disk on startup
const loadListingsFromDisk = () => {
  try {
    if (fs.existsSync(LISTINGS_FILE)) {
      const content = fs.readFileSync(LISTINGS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        listingsMap.clear();
        for (const item of parsed) {
          const norm = normalizeListing(item);
          listingsMap.set(norm._id, norm);
        }
        console.log(`[Storage Engine] Successfully loaded ${listingsMap.size} persistent listings from disk.`);
        return;
      }
    }
  } catch (err) {
    console.warn('[Storage Engine] Read error, creating fresh persistent store:', err.message);
  }
};

loadListingsFromDisk();

export const storage = {
  getAllListings() {
    return Array.from(listingsMap.values());
  },

  getListings(queryObj = {}) {
    let list = Array.from(listingsMap.values());

    // Search term
    if (queryObj.searchTerm && typeof queryObj.searchTerm === 'string') {
      const term = queryObj.searchTerm.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.name?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term) ||
          item.address?.toLowerCase().includes(term) ||
          item.location?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.make?.toLowerCase().includes(term) ||
          item.model?.toLowerCase().includes(term)
        );
      });
    }

    // Status filter
    const isAllOrAdmin =
      queryObj.all === 'true' ||
      queryObj.isAdmin === 'true' ||
      queryObj.onlyApproved === false;

    if (!isAllOrAdmin) {
      list = list.filter((item) => (item.status === 'approved' || item.isApproved === true) && item.active !== false && item.isActive !== false);
    } else {
      if (queryObj.status && queryObj.status !== 'all') {
        list = list.filter((item) => item.status === queryObj.status);
      }
      if (queryObj.isApproved !== undefined) {
        const reqApp = queryObj.isApproved === 'true';
        list = list.filter((item) => Boolean(item.isApproved || item.status === 'approved') === reqApp);
      }
    }

    // Category / Type filter
    let typeFilter = queryObj.type || queryObj.category;
    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'guesthouse' || typeFilter === 'rent') {
        list = list.filter((item) => item.type === 'guesthouse' || item.category === 'guesthouse' || item.type === 'rent');
      } else if (typeFilter === 'car' || typeFilter === 'car_service' || typeFilter === 'sale') {
        list = list.filter((item) => item.type === 'car' || item.category === 'car_service' || item.category === 'car' || item.type === 'sale');
      }
    }

    // City filter
    if (queryObj.city && typeof queryObj.city === 'string' && queryObj.city.trim()) {
      const c = queryObj.city.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.city?.toLowerCase().includes(c) ||
          item.location?.toLowerCase().includes(c) ||
          item.address?.toLowerCase().includes(c) ||
          item.area?.toLowerCase().includes(c)
        );
      });
    }

    // Offer / Promo filter
    if (queryObj.offer === 'true') {
      list = list.filter((item) => Boolean(item.offer) || (Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.regularPrice)));
    }

    // Featured filter
    if (queryObj.featured === 'true') {
      list = list.filter((item) => Boolean(item.featured));
    }

    // User / Owner filter
    if (queryObj.userRef) {
      list = list.filter((item) => item.userRef === queryObj.userRef || item.ownerId === queryObj.userRef);
    }

    // Price filters
    if (queryObj.minPrice !== undefined && queryObj.minPrice !== null && queryObj.minPrice !== '') {
      const min = Number(queryObj.minPrice);
      if (!isNaN(min)) list = list.filter((item) => Number(item.price) >= min);
    }
    if (queryObj.maxPrice !== undefined && queryObj.maxPrice !== null && queryObj.maxPrice !== '') {
      const max = Number(queryObj.maxPrice);
      if (!isNaN(max)) list = list.filter((item) => Number(item.price) <= max);
    }

    // Sort
    const sort = queryObj.sort || queryObj.sortBy || 'createdAt';
    const order = queryObj.order || 'desc';

    if (sort === 'price' || sort === 'regularPrice') {
      list.sort((a, b) => order === 'asc' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // Limit
    if (queryObj.limit && !isNaN(Number(queryObj.limit))) {
      const limit = Number(queryObj.limit);
      list = list.slice(0, limit);
    }

    return list;
  },

  getListing(id) {
    if (!id) return null;
    const direct = listingsMap.get(id);
    if (direct) return direct;
    for (const item of listingsMap.values()) {
      if (item._id === id || item.id === id) return item;
    }
    return null;
  },

  createListing(data) {
    const norm = normalizeListing(data);
    listingsMap.set(norm._id, norm);
    saveListingsToDisk();
    return norm;
  },

  updateListing(id, updates) {
    const existing = this.getListing(id);
    if (!existing) return null;

    const targetKey = existing._id || id;
    const merged = normalizeListing({
      ...existing,
      ...updates,
      _id: targetKey,
      id: targetKey,
      updatedAt: new Date().toISOString(),
    });

    listingsMap.set(targetKey, merged);
    saveListingsToDisk();
    return merged;
  },

  deleteListing(id) {
    if (!id) return false;
    if (listingsMap.has(id)) {
      listingsMap.delete(id);
      saveListingsToDisk();
      return true;
    }
    for (const [key, item] of listingsMap.entries()) {
      if (item._id === id || item.id === id) {
        listingsMap.delete(key);
        saveListingsToDisk();
        return true;
      }
    }
    return false;
  },

  approveListing(id) {
    const existing = listingsMap.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: 'approved',
      isApproved: true,
      active: true,
      isActive: true,
      rejectionReason: '',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    listingsMap.set(id, updated);
    saveListingsToDisk();
    return updated;
  },

  rejectListing(id, reason = 'Does not meet marketplace standards') {
    const existing = listingsMap.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: 'rejected',
      isApproved: false,
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    listingsMap.set(id, updated);
    saveListingsToDisk();
    return updated;
  },

  toggleStatusListing(id) {
    const existing = listingsMap.get(id);
    if (!existing) return null;

    const currentActive = existing.active !== false && existing.isActive !== false;
    const newActive = !currentActive;

    const updated = {
      ...existing,
      active: newActive,
      isActive: newActive,
      updatedAt: new Date().toISOString(),
    };

    listingsMap.set(id, updated);
    saveListingsToDisk();
    return updated;
  },

  toggleFeaturedListing(id) {
    const existing = listingsMap.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      featured: !existing.featured,
      updatedAt: new Date().toISOString(),
    };

    listingsMap.set(id, updated);
    saveListingsToDisk();
    return updated;
  },

  getPendingListings() {
    return Array.from(listingsMap.values()).filter(
      (item) => item.status === 'pending' || !item.isApproved
    );
  },
};

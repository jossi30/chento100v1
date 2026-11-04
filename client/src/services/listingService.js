import { auth } from '../firebase';
import { apiFetch as fetch } from './apiFetch';

async function requestApiJson(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

/**
 * Normalizes any listing object into standard frontend format
 */
export function normalizeClientListing(data, id) {
  if (!data) return null;
  const _id = id || data.id || data._id || `listing_${Date.now()}`;
  const isGuestHouse =
    data.type === 'guesthouse' ||
    data.category === 'guesthouse' ||
    data.type === 'rent';
  const type = isGuestHouse ? 'guesthouse' : 'car';
  const category = isGuestHouse ? 'guesthouse' : 'car_service';
  const title = data.title || data.name || 'Untitled Listing';
  const name = data.name || title;

  let images = Array.isArray(data.images) && data.images.length > 0
    ? data.images
    : Array.isArray(data.imageUrls) && data.imageUrls.length > 0
    ? data.imageUrls
    : [isGuestHouse ? '/images/kampala_apartment_living.jpg' : '/images/kampala_city_sedan.jpg'];

  const price = Number(data.price !== undefined ? data.price : (data.regularPrice || 0));
  const regularPrice = Number(data.regularPrice !== undefined ? data.regularPrice : price);
  const discountPrice = Number(data.discountPrice || data.discountedPrice || 0);
  const location = data.location || data.address || 'Makindye Division, Kampala';
  const city = data.city || location.split(',')[0].trim() || 'Makindye';
  const area = data.area || '';
  const address = data.address || location;

  const status = data.status || (data.isApproved ? 'approved' : 'pending');
  const isApproved = status === 'approved' || Boolean(data.isApproved);
  const active = data.active !== undefined ? Boolean(data.active) : (data.isActive !== undefined ? Boolean(data.isActive) : isApproved);

  return {
    ...data,
    id: _id,
    _id,
    type,
    category,
    title,
    name,
    description: data.description || '',
    images,
    imageUrls: images,
    price,
    regularPrice,
    discountPrice,
    discountedPrice: discountPrice,
    priceUnit: data.priceUnit || (isGuestHouse ? 'night' : 'day'),
    currency: data.currency || 'USD',
    location,
    address,
    city,
    area,
    status,
    isApproved,
    active,
    isActive: active,
    isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : (data.available !== undefined ? Boolean(data.available) : true),
    available: data.isAvailable !== undefined ? Boolean(data.isAvailable) : (data.available !== undefined ? Boolean(data.available) : true),
    availabilityStatus: data.availabilityStatus || ((data.isAvailable === false || data.available === false) ? 'booked' : 'available'),
    availableFrom: data.availableFrom || '',
    availableUntil: data.availableUntil || '',
    blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
    availabilityNotes: data.availabilityNotes || '',
    featured: Boolean(data.featured),
    rejectionReason: data.rejectionReason || '',
    ownerId: data.ownerId || data.userRef || 'user_guest',
    userRef: data.userRef || data.ownerId || 'user_guest',
    ownerEmail: data.ownerEmail || '',
    contactPhone: data.contactPhone || '',
    bedrooms: Number(data.bedrooms || (isGuestHouse ? 1 : 0)),
    bathrooms: Number(data.bathrooms || (isGuestHouse ? 1 : 0)),
    maxGuests: Number(data.maxGuests || (isGuestHouse ? 2 : 4)),
    seats: Number(data.seats || (isGuestHouse ? 0 : 4)),
    driverIncluded: data.driverIncluded !== undefined ? Boolean(data.driverIncluded) : !isGuestHouse,
    driverName: data.driverName || '',
    driverContact: data.driverContact || '',
    amenities: Array.isArray(data.amenities)
      ? data.amenities
      : (typeof data.amenities === 'string' && data.amenities ? data.amenities.split(',').map((s) => s.trim()).filter(Boolean) : ['WiFi', 'Air Conditioning']),
    viewCount: Number(data.viewCount || 0),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Fetch listings from the shared Firebase-backed API
 */
async function fetchApiListings(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      q.set(key, String(value));
    }
  });
  const res = await fetch(`/api/listing/get?${q.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Could not load listings (${res.status}).`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('The listings API returned an invalid response.');
  return data;
}

/**
 * Fetch approved listings with filtering, sorting, and cursor pagination
 * Fetch approved listings from the shared API
 */
export async function getApprovedListings({
  type = null,
  city = null,
  minPrice = null,
  maxPrice = null,
  bedrooms = null,
  seats = null,
  amenities = [],
  driverIncluded = null,
  sortBy = 'newest',
  lastDoc = null,
  pageSize = 12,
} = {}) {
  const offset = Number.isFinite(lastDoc) ? lastDoc : 0;
  const apiItems = await fetchApiListings({
    onlyApproved: true,
    type,
    city,
    minPrice,
    maxPrice,
    sortBy,
  });
  const combinedMap = new Map(
    apiItems.map((item) => {
      const listing = normalizeClientListing(item);
      return [listing.id, listing];
    })
  );

  // 3. In-memory refinement for secondary filters
  let items = Array.from(combinedMap.values()).filter((data) => {
    // Only approved & active listings on main page
    if (data.status !== 'approved' || data.active === false || data.isActive === false) {
      return false;
    }

    if (type && type !== 'all') {
      if (type === 'guesthouse') {
        if (data.type !== 'guesthouse' && data.category !== 'guesthouse' && data.type !== 'rent') {
          return false;
        }
      } else if (type === 'car') {
        if (data.type !== 'car' && data.category !== 'car_service' && data.type !== 'sale') {
          return false;
        }
      }
    }

    if (city && city.trim()) {
      let c = city.toLowerCase().trim();
      // Handle spelling variations for Makindye / Makinde
      if (c === 'makinde') c = 'makindye';
      const inCity = data.city && (data.city.toLowerCase().includes(c) || (c === 'makindye' && data.city.toLowerCase().includes('makinde')));
      const inLoc = data.location && (data.location.toLowerCase().includes(c) || (c === 'makindye' && data.location.toLowerCase().includes('makinde')));
      const inAddr = data.address && (data.address.toLowerCase().includes(c) || (c === 'makindye' && data.address.toLowerCase().includes('makinde')));
      const inArea = data.area && data.area.toLowerCase().includes(c);
      const inTitle = data.title && data.title.toLowerCase().includes(c);
      const inDesc = data.description && data.description.toLowerCase().includes(c);
      if (!inCity && !inLoc && !inAddr && !inArea && !inTitle && !inDesc) return false;
    }

    if (minPrice !== null && minPrice !== undefined && Number(data.price) < Number(minPrice)) {
      return false;
    }
    if (maxPrice !== null && maxPrice !== undefined && Number(data.price) > Number(maxPrice)) {
      return false;
    }

    if (bedrooms && data.type === 'guesthouse' && Number(data.bedrooms) < Number(bedrooms)) {
      return false;
    }

    if (seats && data.type === 'car' && Number(data.seats) < Number(seats)) {
      return false;
    }

    if (driverIncluded !== null && data.type === 'car' && Boolean(data.driverIncluded) !== Boolean(driverIncluded)) {
      return false;
    }

    if (amenities && amenities.length > 0 && data.amenities) {
      const itemAmenities = Array.isArray(data.amenities) ? data.amenities : [];
      const hasAll = amenities.every((a) =>
        itemAmenities.some((ia) => ia.toLowerCase().includes(a.toLowerCase()))
      );
      if (!hasAll) return false;
    }

    return true;
  });

  // Sort
  if (sortBy === 'price_asc') {
    items.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === 'price_desc') {
    items.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  const pagedListings = items.slice(offset, offset + pageSize);
  return {
    listings: pagedListings,
    lastVisible: items.length > offset + pageSize ? offset + pageSize : null,
    hasMore: items.length > offset + pageSize,
  };
}

/**
 * Fetch featured approved listings
 */
export async function getFeaturedListings(type = null, limitCount = 6) {
  const listings = await fetchApiListings({ onlyApproved: true, featured: true, type, limit: limitCount });
  const featured = listings.map((item) => normalizeClientListing(item));
  if (featured.length) return featured.slice(0, limitCount);
  const fallbackListings = await getApprovedListings({ type, pageSize: limitCount });
  return fallbackListings.listings.slice(0, limitCount);
}

/**
 * Fetch best offer / discounted approved listings for Home Page slideshow
 */
export async function getOfferListings(limitCount = 8) {
  const listings = await fetchApiListings({ onlyApproved: true, limit: 500 });
  const combined = listings.map((item) => normalizeClientListing(item));
  let list = combined.filter((item) => {
    if (item.status !== 'approved' || item.active === false || item.isActive === false) return false;
    return Boolean(
      item.offer ||
      (Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.regularPrice)) ||
      item.featured
    );
  });

  // If fewer than 4 offer listings, backfill with approved listings
  if (list.length < 4) {
    const fallback = combined.filter(
      (item) => item.status === 'approved' && item.active !== false && item.isActive !== false
    );
    fallback.forEach((f) => {
      if (!list.find((x) => x.id === f.id)) {
        list.push({ ...f, offer: true });
      }
    });
  }

  return list.slice(0, limitCount);
}

/**
 * Fetch recent approved listings for Home Page
 */
export async function getRecentApprovedListings(type = null, limitCount = 6) {
  const result = await getApprovedListings({ type, pageSize: limitCount });
  return result.listings.slice(0, limitCount);
}

/**
 * Fetch single listing by ID and increment view count
 */
export async function getListingById(id) {
  try {
    const res = await fetch(`/api/listing/get/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data._id || data.id)) {
        return normalizeClientListing(data, data._id || data.id);
      }
    }
    if (res.status === 404) return null;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Could not load listing (${res.status}).`);
  } catch (apiErr) {
    console.error('API getListingById error:', apiErr.message);
    throw apiErr;
  }
}

/**
 * Fetch all listings created by a specific user (My Listings)
 */
export async function getUserListings(userId) {
  const res = await fetch(`/api/user/listings/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Could not load your listings (${res.status}).`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('The user listings API returned an invalid response.');
  const list = data.map((item) => normalizeClientListing(item));
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return list;
}

/**
 * Create a new listing with strict 'pending' status
 * Saves the listing through the shared API
 */
export async function createListing(listingData, user) {
  if (!user) throw new Error('You must be signed in to create a listing.');

  const cleanData = {
    ...listingData,
    type: listingData.type || 'guesthouse',
    title: listingData.title?.trim() || '',
    name: listingData.title?.trim() || listingData.name || '',
    description: listingData.description?.trim() || '',
    price: Number(listingData.price) || 0,
    regularPrice: Number(listingData.regularPrice) || Number(listingData.price) || 0,
    priceUnit: listingData.priceUnit || (listingData.type === 'guesthouse' ? 'night' : 'day'),
    currency: listingData.currency || 'USD',
    city: listingData.city?.trim() || '',
    area: listingData.area?.trim() || '',
    address: listingData.address?.trim() || listingData.city || '',
    location: listingData.location || listingData.address || listingData.city || '',
    images: (Array.isArray(listingData.imageUrls) && listingData.imageUrls.length > 0
      ? listingData.imageUrls
      : Array.isArray(listingData.images)
      ? listingData.images
      : []).slice(0, 10),
    imageUrls: (Array.isArray(listingData.imageUrls) && listingData.imageUrls.length > 0
      ? listingData.imageUrls
      : Array.isArray(listingData.images)
      ? listingData.images
      : []).slice(0, 10),
    ownerId: user.uid || user._id || user.id || 'user_demo',
    userRef: user.uid || user._id || user.id || 'user_demo',
    ownerEmail: user.email || '',
    contactPhone: listingData.contactPhone?.trim() || '',
    status: 'pending', // Rule 4: Every new listing is created with status "pending"
    isApproved: false,
    active: true,
    isActive: true,
    rejectionReason: '',
    featured: false,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add guest house specific fields
  if (cleanData.type === 'guesthouse') {
    cleanData.bedrooms = Number(listingData.bedrooms) || 1;
    cleanData.bathrooms = Number(listingData.bathrooms) || 1;
    cleanData.maxGuests = Number(listingData.maxGuests) || 2;
    cleanData.amenities = Array.isArray(listingData.amenities) ? listingData.amenities : [];
    cleanData.checkIn = listingData.checkIn || '14:00';
    cleanData.checkOut = listingData.checkOut || '11:00';
    cleanData.houseRules = listingData.houseRules || 'No smoking, quiet hours after 10 PM';
  } else {
    // Add car leasing specific fields
    cleanData.make = listingData.make?.trim() || '';
    cleanData.model = listingData.model?.trim() || '';
    cleanData.year = Number(listingData.year) || new Date().getFullYear();
    cleanData.transmission = listingData.transmission || 'automatic';
    cleanData.fuel = listingData.fuel || 'Petrol';
    cleanData.seats = Number(listingData.seats) || 4;
    cleanData.mileageLimit = listingData.mileageLimit || '200 km / day';
    cleanData.deposit = Number(listingData.deposit) || 0;
    cleanData.minLeaseTerm = listingData.minLeaseTerm || '1 day';
    cleanData.driverIncluded = Boolean(listingData.driverIncluded);
  }

  const res = await fetch('/api/listing/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Could not create listing (${res.status}).`);
  }
  const created = await res.json();
  return normalizeClientListing(created, created._id || created.id);
}

/**
 * Update an existing listing and sync with API
 */
export async function updateListing(id, updates, isAdmin = false) {
  const cleanIsAdmin = typeof isAdmin === 'boolean'
    ? isAdmin
    : Boolean(isAdmin?.isAdmin || isAdmin?.role === 'admin');

  const cleanUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (!cleanIsAdmin) {
    delete cleanUpdates.status;
    delete cleanUpdates.approvedAt;
    delete cleanUpdates.approvedBy;
    delete cleanUpdates.featured;
    delete cleanUpdates.rejectionReason;
    delete cleanUpdates.ownerId;
  }

  const url = cleanIsAdmin
    ? `/api/admin/listings/${encodeURIComponent(id)}`
    : `/api/listing/update/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanUpdates),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not update listing (${response.status}).`);
  }
  return normalizeClientListing(await response.json(), id);
}

/**
 * Host/Owner update listing availability anytime
 * Updates the listing through the shared API
 */
export async function updateListingAvailability(id, { isAvailable, availabilityStatus = 'available', availableFrom = '', availableUntil = '', blockedDates = [], availabilityNotes = '' } = {}) {
  if (!isAvailable) {
    return requestListingUnavailable(id, { availabilityNotes, availableFrom, availableUntil, blockedDates });
  }
  const updates = {
    isAvailable: true,
    available: true,
    active: true,
    isActive: true,
    availabilityStatus: availabilityStatus || 'available',
    availableFrom: availableFrom || '',
    availableUntil: availableUntil || '',
    blockedDates: Array.isArray(blockedDates) ? blockedDates : [],
    availabilityNotes: availabilityNotes || '',
    updatedAt: new Date().toISOString(),
  };

  return updateListing(id, updates, false);
}

/**
 * Ask an administrator to take an approved listing offline.
 */
export async function requestListingUnavailable(id, requestDetails = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to request an availability change.');

  const request = {
    status: 'pending',
    requestedAt: new Date().toISOString(),
    requestedBy: user.uid,
    requestedByEmail: user.email || '',
    availabilityNotes: requestDetails.availabilityNotes || '',
    availableFrom: requestDetails.availableFrom || '',
    availableUntil: requestDetails.availableUntil || '',
    blockedDates: Array.isArray(requestDetails.blockedDates) ? requestDetails.blockedDates : [],
  };
  const response = await fetch(`/api/listing/update/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availabilityRequest: request }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not notify administrators (${response.status}).`);
  }
  return request;
}

/**
 * Confirm a partner request and take the listing off the marketplace.
 */
export async function confirmListingUnavailable(listing, adminUid) {
  const request = listing.availabilityRequest;
  if (!request || request.status !== 'pending') {
    throw new Error('This listing has no pending availability request.');
  }

  const resolvedAt = new Date().toISOString();
  await updateListing(
    listing.id,
    {
      active: false,
      isActive: false,
      isAvailable: false,
      available: false,
      availabilityStatus: 'booked',
      availabilityNotes: request.availabilityNotes || '',
      availableFrom: request.availableFrom || '',
      availableUntil: request.availableUntil || '',
      blockedDates: Array.isArray(request.blockedDates) ? request.blockedDates : [],
      availabilityRequest: {
        ...request,
        status: 'completed',
        resolvedAt,
        resolvedBy: adminUid,
      },
    },
    true
  );

  return true;
}

/**
 * Soft delete (archive) listing
 */
export async function archiveListing(id) {
  await updateListing(id, { status: 'archived', active: false, isActive: false }, true);
  return true;
}

/**
 * Permanently delete a listing through the shared API
 */
export async function deleteListing(id) {
  let response = await fetch(`/api/listing/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok && response.status === 404) {
    response = await fetch(`/api/listing/delete/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  if (!response.ok && (response.status === 403 || response.status === 404)) {
    response = await fetch(`/api/admin/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not delete listing (${response.status}).`);
  }
  return true;
}

/**
 * Report a listing
 */
export async function submitReport(listingId, reason, reporterId = 'visitor') {
  await requestApiJson('/api/listing/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, reporterId, reason }),
  });
  return true;
}

// ==========================================
// ADMIN SERVICE METHODS
// ==========================================

/**
 * Get dashboard stats calculated from live queries
 */
export async function getAdminStats() {
  const response = await fetch('/api/admin/stats');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load admin statistics (${response.status}).`);
  }
  return response.json();
}

/**
 * Fetch pending listings for the admin queue
 */
export async function getPendingListings() {
  const response = await fetch('/api/admin/listings/pending');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load pending listings (${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The pending listings API returned an invalid response.');
  const list = data.map((item) => normalizeClientListing(item));
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return list;
}

/**
 * Fetch all listings for the management table
 */
export async function getAllListingsForAdmin(statusFilter = 'all') {
  const queryString = statusFilter && statusFilter !== 'all'
    ? `?status=${encodeURIComponent(statusFilter)}`
    : '';
  const response = await fetch(`/api/admin/listings/all${queryString}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load admin listings (${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The admin listings API returned an invalid response.');
  let list = data.map((item) => normalizeClientListing(item));
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((item) => item.status === statusFilter);
  }
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return list;
}

/**
 * Approve a pending listing through the shared API
 */
export async function approveListing(listingId, adminUid) {
  const response = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy: adminUid }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not approve listing (${response.status}).`);
  }
  return normalizeClientListing(await response.json(), listingId);
}

/**
 * Reject a pending listing with a required reason
 */
export async function rejectListing(listingId, reason, adminUid) {
  if (!reason || !reason.trim()) {
    throw new Error('A rejection reason is required.');
  }

  const response = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason.trim(), rejectedBy: adminUid }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not reject listing (${response.status}).`);
  }
  return normalizeClientListing(await response.json(), listingId);
}

/**
 * Toggle a listing's featured flag through the shared API
 */
export async function toggleFeaturedListing(listingId, featuredState, adminUid) {
  const response = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featured: Boolean(featuredState), featuredBy: adminUid }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not update featured status (${response.status}).`);
  }
  return normalizeClientListing(await response.json(), listingId);
}

/**
 * Get all users for the admin table
 */
export async function getAllUsers(typeFilter = 'all') {
  const suffix = typeFilter && typeFilter !== 'all' ? `?type=${encodeURIComponent(typeFilter)}` : '';
  const response = await fetch(`/api/admin/users${suffix}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load users (${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The users API returned an invalid response.');
  const list = data;
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return list;
}

/**
 * Get enquiries & concierge bookings for admin
 */
export async function getAdminEnquiries() {
  const response = await fetch('/api/admin/enquiries');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load enquiries (${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The enquiries API returned an invalid response.');
  return data;
}

/**
 * Update enquiry status
 */
export async function updateAdminEnquiry(id, status, notes = '') {
  const response = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not update enquiry (${response.status}).`);
  }
  return response.json();
}

/**
 * Toggle user disabled status
 */
export async function toggleUserDisabled(userId, disabledState, adminUid) {
  const response = await fetch('/api/admin/toggle-user-disabled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, disabled: Boolean(disabledState), adminUid }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not update user status (${response.status}).`);
  }
  return true;
}

/**
 * Get all listing reports
 */
export async function getAllReports() {
  const reports = await requestApiJson('/api/admin/reports');
  if (!Array.isArray(reports)) throw new Error('The reports API returned an invalid response.');
  return reports;
}

/**
 * Update report status
 */
export async function updateReportStatus(reportId, status) {
  await requestApiJson(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return true;
}

/**
 * Get audit logs
 */
export async function getAuditLogs(limitCount = 50) {
  const logs = await requestApiJson(`/api/admin/audit?limit=${encodeURIComponent(limitCount)}`);
  if (!Array.isArray(logs)) throw new Error('The audit API returned an invalid response.');
  return logs;
}

/**
 * Subscribe to real-time live stat cards (onSnapshot)
 */
export function subscribeAdminStats(onUpdate) {
  let stopped = false;
  const refresh = async () => {
    try {
      const stats = await requestApiJson('/api/admin/stats');
      if (!stopped) onUpdate(stats);
    } catch (error) {
      if (!stopped) console.error('Could not refresh admin statistics:', error);
    }
  };
  void refresh();
  const interval = setInterval(refresh, 30000);
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/**
 * Subscribe to real-time audit logs
 */
export function subscribeAuditLogs(onUpdate, limitCount = 50) {
  let stopped = false;
  const refresh = async () => {
    try {
      const logs = await getAuditLogs(limitCount);
      if (!stopped) onUpdate(logs);
    } catch (error) {
      if (!stopped) console.error('Could not refresh audit logs:', error);
    }
  };
  void refresh();
  const interval = setInterval(refresh, 30000);
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/**
 * Get 30-day listing submission history grouped by day and type
 */
export async function getListingsHistory30Days() {
  const history = await requestApiJson('/api/admin/listing-history');
  if (!Array.isArray(history)) throw new Error('The listing history API returned an invalid response.');
  return history;
}

/**
 * Request changes on a listing
 */
export async function requestChanges(listingId, notes, adminUid) {
  const changeNotes = String(notes || '').trim();
  if (!changeNotes) throw new Error('Please provide notes describing the requested changes.');
  const response = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'pending',
      isApproved: false,
      changeRequestNotes: changeNotes,
      changeRequestedBy: adminUid,
      changeRequestedAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not request listing changes (${response.status}).`);
  }
  return true;
}

/**
 * Bulk approve multiple listings
 */
export async function bulkApproveListings(listingIds = [], adminUid) {
  if (!listingIds.length) return false;
  await Promise.all(listingIds.map((id) => approveListing(id, adminUid)));
  return true;
}

/**
 * Bulk reject multiple listings
 */
export async function bulkRejectListings(listingIds = [], reason, adminUid) {
  if (!listingIds.length) return false;
  if (!reason || !reason.trim()) throw new Error('A rejection reason is required.');
  await Promise.all(listingIds.map((id) => rejectListing(id, reason, adminUid)));
  return true;
}

/**
 * Restore an archived or rejected listing to approved
 */
export async function restoreListing(listingId, adminUid) {
  await updateListing(listingId, {
    status: 'approved',
    isApproved: true,
    active: true,
    isActive: true,
    approvedBy: adminUid,
    approvedAt: new Date().toISOString(),
  }, true);
  return true;
}

/**
 * Get owner intelligence profile (other listings, rejection history, report count)
 */
export async function getOwnerIntelligence(ownerId, ownerEmail) {
  const params = new URLSearchParams();
  if (ownerEmail) params.set('email', ownerEmail);
  return requestApiJson(`/api/admin/owners/${encodeURIComponent(ownerId)}/intelligence?${params.toString()}`);
}

/**
 * Get Marketplace Settings
 */
export async function getAdminSettings() {
  const defaultSettings = {
    adminEmails: ['jossvision11@gmail.com'],
    rejectionPresets: [
      'Blurry or low-quality images',
      'Missing or incomplete information',
      'Suspected scam or fraudulent activity',
      'Duplicate listing',
      'Wrong category or inappropriate content',
    ],
    maxPendingPerUser: 5,
    requireEmailVerification: true,
    slaHoursWarning: 48,
    reportThreshold: 3,
  };

  const settings = await requestApiJson('/api/admin/settings');
  return { ...defaultSettings, ...settings };
}

/**
 * Update Marketplace Settings
 */
export async function updateAdminSettings(settings, adminUid) {
  await requestApiJson('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...settings, updatedBy: adminUid }),
  });
  return true;
}

/**
 * Promote a user to Administrator
 */
export async function promoteUserToAdmin(userId, email, adminUid) {
  await requestApiJson('/api/admin/set-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, email, admin: true, assignedBy: adminUid }),
  });
  return true;
}

/**
 * Demote an Administrator to User
 */
export async function demoteUserFromAdmin(userId, adminUid) {
  await requestApiJson('/api/admin/set-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userId, admin: false, assignedBy: adminUid }),
  });
  return true;
}

/**
 * Export users array to CSV file
 */
export function exportUsersCSV(users = []) {
  const headers = ['UID', 'Email', 'Display Name', 'Role', 'Email Verified', 'Disabled', 'Created At', 'Last Login'];
  const rows = users.map((u) => [
    `"${u.uid || u._id || ''}"`,
    `"${u.email || ''}"`,
    `"${(u.displayName || '').replace(/"/g, '""')}"`,
    `"${u.role || 'user'}"`,
    u.emailVerified ? 'Yes' : 'No',
    u.disabled ? 'Yes' : 'No',
    `"${u.createdAt || ''}"`,
    `"${u.lastLoginAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `chento100_users_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Callable Cloud Function / API: setAdminClaim
 */
export async function callSetAdminClaim(email, grantAdmin = true, adminUid = 'admin') {
  return requestApiJson('/api/admin/set-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, admin: grantAdmin, assignedBy: adminUid }),
  });
}

/**
 * Callable Cloud Function / API: setUserDisabled
 */
export async function callSetUserDisabled(uid, disabled = true, adminUid = 'admin') {
  return requestApiJson('/api/admin/toggle-user-disabled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, disabled, adminUid }),
  });
}

/**
 * Callable Cloud Function / API: deleteUser
 */
export async function callDeleteUser(uid, adminUid = 'admin') {
  return requestApiJson('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, adminUid }),
  });
}

/**
 * Cursor-paginated listings query for Admin table (25 per page)
 */
export async function getListingsAdminPaginated({
  statusFilter = 'all',
  typeFilter = 'all',
  cityFilter = '',
  featuredFilter = null,
  sortField = 'createdAt',
  sortOrder = 'desc',
  lastDoc = null,
  pageSize = 25,
} = {}) {
  const offset = Number.isFinite(lastDoc) ? lastDoc : 0;
  const params = new URLSearchParams({
    limit: String(pageSize + 1),
    offset: String(offset),
    sort: sortField,
    order: sortOrder === 'asc' ? 'asc' : 'desc',
  });
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
  if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
  if (featuredFilter === true) params.set('featured', 'true');
  if (cityFilter.trim()) params.set('city', cityFilter.trim());

  const response = await fetch(`/api/admin/listings/all?${params.toString()}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Could not load admin listings (${response.status}).`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The admin listings API returned an invalid response.');
  const hasMore = data.length > pageSize;
  const listings = data.slice(0, pageSize).map((item) => normalizeClientListing(item));
  return {
    listings,
    lastVisible: hasMore ? offset + listings.length : null,
    hasMore,
  };
}

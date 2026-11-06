const normalizeDate = (value) => {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
};

export const normalizeListing = (data, id) => {
  const _id = id || data._id || data.id || `listing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const title = data.title || data.name || 'Untitled Listing';
  const name = data.name || title;
  const address = data.address || data.location || data.city || 'Makindye Division, Kampala';
  const location = data.location || address;
  const city = data.city || location.split(',')[0].trim() || 'Makindye';
  const area = data.area || '';
  const description = data.description || '';
  const regularPrice = data.regularPrice !== undefined ? Number(data.regularPrice) : Number(data.price || 0);
  const price = data.price !== undefined ? Number(data.price) : regularPrice;
  const discountPrice = Number(data.discountPrice || data.discountedPrice || 0);
  const discountedPrice = discountPrice;
  const offer = Boolean(data.offer);

  let category = data.category;
  if (!category) {
    if (data.type === 'car' || data.type === 'car_service' || data.type === 'sale') {
      category = 'car_service';
    } else {
      category = 'guesthouse';
    }
  } else if (category === 'car') {
    category = 'car_service';
  }

  const type = (category === 'car_service' || data.type === 'car' || data.type === 'sale') ? 'car' : 'guesthouse';
  const status = data.status || (data.isApproved ? 'approved' : 'pending');
  const isApproved = status === 'approved';
  const active = data.active !== undefined ? Boolean(data.active) : (data.isActive !== undefined ? Boolean(data.isActive) : isApproved);
  const isActive = active;

  let imageUrls = data.images || data.imageUrls || data.imageURLs || [];
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    imageUrls = type === 'car'
      ? ['/images/kampala_prado_suv.jpg', '/images/kampala_city_sedan.jpg']
      : ['/images/kampala_apartment_living.jpg', '/images/kampala_bedroom_suite.jpg'];
  }

  return {
    ...data,
    _id,
    id: _id,
    title,
    name,
    address,
    location,
    city,
    area,
    description,
    regularPrice,
    price,
    discountPrice,
    discountedPrice,
    priceUnit: data.priceUnit || (type === 'guesthouse' ? 'night' : 'day'),
    currency: data.currency || 'USD',
    offer,
    category,
    type,
    isApproved,
    status,
    active,
    isActive,
    featured: Boolean(data.featured),
    rejectionReason: data.rejectionReason || '',
    images: imageUrls,
    imageUrls,
    imageURLs: imageUrls,
    userRef: data.ownerId || data.userRef || 'user_guest',
    ownerId: data.ownerId || data.userRef || 'user_guest',
    ownerName: data.ownerName || 'Verified Host',
    ownerEmail: data.ownerEmail || 'chentoadmin@gmail.com',
    contactPhone: data.contactPhone || '+256762242354',
    bedrooms: Number(data.bedrooms || (type === 'guesthouse' ? 1 : 0)),
    bathrooms: Number(data.bathrooms || (type === 'guesthouse' ? 1 : 0)),
    maxGuests: Number(data.maxGuests || (type === 'guesthouse' ? 2 : 4)),
    amenities: Array.isArray(data.amenities)
      ? data.amenities
      : ['WiFi', 'Air Conditioning'],
    make: data.make || '',
    model: data.model || '',
    year: Number(data.year || new Date().getFullYear()),
    transmission: data.transmission || 'automatic',
    fuel: data.fuel || 'Petrol',
    seats: Number(data.seats || 4),
    driverIncluded: data.driverIncluded !== undefined ? Boolean(data.driverIncluded) : (type === 'car'),
    driverName: data.driverName || 'Verified Driver',
    driverContact: data.driverContact || data.contactPhone || '+256762242354',
    viewCount: Number(data.viewCount || 0),
    createdAt: normalizeDate(data.createdAt) || new Date().toISOString(),
    updatedAt: normalizeDate(data.updatedAt) || new Date().toISOString(),
  };
};

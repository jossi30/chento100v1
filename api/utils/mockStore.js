import bcryptjs from 'bcryptjs';
import { storage } from './storage.js';

const mockUsers = new Map();
const mockListings = storage;
const deletedListingIds = new Set();

// Seed initial mock users, hosts, and guests with names, emails, and phone numbers
const seedUsersData = [
  {
    _id: 'user_joe_001',
    username: 'Joe Patriot',
    displayName: 'Joe Patriot',
    email: 'joepatriot30@gmail.com',
    phone: '+1 202-555-0149',
    phoneNumber: '+1 202-555-0149',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin',
    isAdmin: true,
    accountType: 'admin',
    verified: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    _id: 'user_joss_001',
    username: 'Joss Vision',
    displayName: 'Joss Vision',
    email: 'jossvision11@gmail.com',
    phone: '+1 305-555-0182',
    phoneNumber: '+1 305-555-0182',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin',
    isAdmin: true,
    accountType: 'admin',
    verified: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
  },
  {
    _id: 'user_sahand_001',
    username: 'Chento Fleet Master',
    displayName: 'Chento Fleet Admin',
    email: 'admin@chento100.com',
    phone: '+1 800-555-0100',
    phoneNumber: '+1 800-555-0100',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin',
    isAdmin: true,
    accountType: 'admin',
    verified: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  // HOSTS (Service Providers: Guest House Hosts & Car/Driver Chauffeur Hosts)
  {
    _id: 'host_demo_001',
    username: 'Alexander (Demo Host)',
    displayName: 'Alexander (Demo Host)',
    email: 'demo.host@chento100.com',
    phone: '+291 7 888 999',
    phoneNumber: '+291 7 888 999',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'both',
    serviceCategory: 'both',
    businessName: 'Makindye Sunset Guest Houses & Fleet',
    verified: true,
    emailVerified: true,
    listingsCount: 2,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString(),
  },
  {
    _id: 'host_elena_001',
    username: 'Elena Rostova',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@guesthousehub.com',
    phone: '+1 305-555-8821',
    phoneNumber: '+1 305-555-8821',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'guesthouse',
    serviceCategory: 'guesthouse',
    businessName: 'Rostova City Apartments',
    verified: true,
    emailVerified: true,
    listingsCount: 2,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
  },
  {
    _id: 'host_marcus_002',
    username: 'Marcus Vance',
    displayName: 'Marcus Vance',
    email: 'marcus.vance@citychauffeurs.com',
    phone: '+1 305-555-0199',
    phoneNumber: '+1 305-555-0199',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'car_service',
    serviceCategory: 'car_service',
    businessName: 'Vance Executive Chauffeur Services',
    verified: true,
    emailVerified: true,
    listingsCount: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-10').toISOString(),
  },
  {
    _id: 'host_amara_003',
    username: 'Amara Diop',
    displayName: 'Amara Diop',
    email: 'amara.diop@urbanstays.com',
    phone: '+1 718-555-3342',
    phoneNumber: '+1 718-555-3342',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'guesthouse',
    serviceCategory: 'guesthouse',
    businessName: 'Riverside Modern Lofts',
    verified: true,
    emailVerified: true,
    listingsCount: 1,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString(),
  },
  {
    _id: 'host_james_004',
    username: 'James Wilson',
    displayName: 'James Wilson',
    email: 'james.wilson@metrodrivers.com',
    phone: '+1 718-555-0142',
    phoneNumber: '+1 718-555-0142',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'car_service',
    serviceCategory: 'car_service',
    businessName: 'Wilson City Car & Chauffeur',
    verified: true,
    emailVerified: true,
    listingsCount: 1,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString(),
  },
  {
    _id: 'host_david_005',
    username: 'David Chen',
    displayName: 'David Chen',
    email: 'david.chen@elitechauffeuring.com',
    phone: '+1 415-555-0188',
    phoneNumber: '+1 415-555-0188',
    password: bcryptjs.hashSync('password123', 10),
    role: 'host',
    isAdmin: false,
    accountType: 'host',
    hostType: 'car_service',
    serviceCategory: 'car_service',
    businessName: 'Golden Gate Executive Chauffeur Fleet',
    verified: true,
    emailVerified: true,
    listingsCount: 1,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-08').toISOString(),
    updatedAt: new Date('2024-03-08').toISOString(),
  },
  // USERS / GUESTS (Registered Travelers & Ride Clients)
  {
    _id: 'guest_sarah_001',
    username: 'Sarah Jenkins',
    displayName: 'Sarah Jenkins',
    email: 'sarah.jenkins@gmail.com',
    phone: '+1 646-555-0128',
    phoneNumber: '+1 646-555-0128',
    password: bcryptjs.hashSync('password123', 10),
    role: 'user',
    isAdmin: false,
    accountType: 'user',
    hostType: null,
    bookingsCount: 3,
    inquiriesCount: 4,
    verified: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-12').toISOString(),
    updatedAt: new Date('2024-03-12').toISOString(),
  },
  {
    _id: 'guest_mateo_002',
    username: 'Mateo Rossi',
    displayName: 'Mateo Rossi',
    email: 'mateo.rossi@outlook.com',
    phone: '+39 06 6987 1234',
    phoneNumber: '+39 06 6987 1234',
    password: bcryptjs.hashSync('password123', 10),
    role: 'user',
    isAdmin: false,
    accountType: 'user',
    hostType: null,
    bookingsCount: 2,
    inquiriesCount: 3,
    verified: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-15').toISOString(),
    updatedAt: new Date('2024-03-15').toISOString(),
  },
  {
    _id: 'guest_chloe_003',
    username: 'Chloe Martin',
    displayName: 'Chloe Martin',
    email: 'chloe.martin@yahoo.fr',
    phone: '+33 6 12 34 56 78',
    phoneNumber: '+33 6 12 34 56 78',
    password: bcryptjs.hashSync('password123', 10),
    role: 'user',
    isAdmin: false,
    accountType: 'user',
    hostType: null,
    bookingsCount: 1,
    inquiriesCount: 2,
    verified: false,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-22').toISOString(),
    updatedAt: new Date('2024-03-22').toISOString(),
  },
  {
    _id: 'guest_lucas_004',
    username: 'Lucas Alvarez',
    displayName: 'Lucas Alvarez',
    email: 'lucas.alvarez@gmail.com',
    phone: '+1 312-555-0176',
    phoneNumber: '+1 312-555-0176',
    password: bcryptjs.hashSync('password123', 10),
    role: 'user',
    isAdmin: false,
    accountType: 'user',
    hostType: null,
    bookingsCount: 4,
    inquiriesCount: 5,
    verified: true,
    emailVerified: false,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-03-28').toISOString(),
    updatedAt: new Date('2024-03-28').toISOString(),
  },
];

seedUsersData.forEach((u) => {
  mockUsers.set(u._id, u);
});

const initialUser = mockUsers.get('user_sahand_001');
const jossUser = mockUsers.get('user_joss_001');
const joeUser = mockUsers.get('user_joe_001');

// Seed initial mock guest houses & car rentals with driver (normal Airbnb apartments and regular city cars)
const initialListings = [
  {
    _id: 'listing_001',
    title: 'Modern Studio Apartment Airbnb Tank Hill',
    name: 'Modern Studio Apartment Airbnb Tank Hill',
    description: 'Bright and stylish modern studio apartment guest house in Tank Hill, Muyenga overlooking Lake Victoria. Features an open-concept living space with plush sofa, dedicated work desk, high-speed Wi-Fi, fully equipped kitchen with espresso machine, rainfall shower, and self check-in smart lock.',
    location: 'Tank Hill Road, Muyenga, Makindye Division, Kampala',
    address: 'Tank Hill Road, Muyenga, Makindye Division, Kampala',
    price: 120,
    regularPrice: 120,
    discountPrice: 95,
    category: 'guesthouse',
    bathrooms: 1,
    bedrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Workspace'],
    furnished: true,
    parking: true,
    type: 'rent',
    offer: true,
    imageUrls: [
      '/images/kampala_apartment_living.jpg',
      '/images/kampala_bedroom_suite.jpg',
      '/images/kampala_tank_hill.jpg',
      '/images/kampala_guest_house.jpg',
    ],
    userRef: 'host_elena_001',
    ownerName: 'Elena Rostova',
    ownerEmail: 'elena.rostova@guesthousehub.com',
    contactPhone: '+1 305-555-8821',
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString(),
  },
  {
    _id: 'listing_002',
    title: 'Toyota Corolla Modern City Sedan with Private Driver',
    name: 'Toyota Corolla Modern City Sedan with Private Driver',
    description: 'Comfortable and dependable modern Toyota Corolla sedan with a courteous, experienced driver based in Makindye Hill. Perfect for city business commutes, Entebbe airport pickups, shopping trips, and urban travel across Makindye Division and Kampala. Clean air-conditioned interior, phone charging ports, and smooth ride.',
    location: 'Makindye Hill Road, Makindye Division, Kampala',
    address: 'Makindye Hill Road, Makindye Division, Kampala',
    price: 75,
    regularPrice: 75,
    discountPrice: 65,
    category: 'car_service',
    make: 'Toyota',
    model: 'Corolla Sedan',
    year: 2023,
    transmission: 'automatic',
    seats: 4,
    driverIncluded: true,
    driverName: 'Marcus Vance',
    driverContact: '+1 305-555-0199',
    bathrooms: 4,
    bedrooms: 4,
    furnished: true,
    parking: true,
    type: 'sale',
    offer: true,
    imageUrls: [
      '/images/kampala_city_sedan.jpg',
      '/images/city_regular_sedan.jpg',
      '/images/city_driver_car.jpg',
    ],
    userRef: 'host_marcus_002',
    ownerName: 'Marcus Vance',
    ownerEmail: 'marcus.vance@citychauffeurs.com',
    contactPhone: '+1 305-555-0199',
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString(),
  },
  {
    _id: 'listing_003',
    title: 'Cozy 2-Bedroom Urban Loft Airbnb with Balcony',
    name: 'Cozy 2-Bedroom Urban Loft Airbnb with Balcony',
    description: 'Spacious contemporary two-bedroom apartment guest suite with floor-to-ceiling windows and private balcony in Kansanga off Ggaba Road. Features a Scandinavian-inspired living room, memory-foam queen beds, modern kitchen with dishwasher, smart TV with streaming, and in-unit washer/dryer.',
    location: 'Ggaba Road, Kansanga, Makindye Division, Kampala',
    address: 'Ggaba Road, Kansanga, Makindye Division, Kampala',
    price: 165,
    regularPrice: 165,
    discountPrice: 139,
    category: 'guesthouse',
    bathrooms: 2,
    bedrooms: 2,
    maxGuests: 4,
    amenities: ['WiFi', 'Kitchen', 'Balcony', 'Air Conditioning'],
    furnished: true,
    parking: true,
    type: 'rent',
    offer: true,
    imageUrls: [
      '/images/kampala_guest_house.jpg',
      '/images/kampala_apartment_living.jpg',
      '/images/kampala_bedroom_suite.jpg',
      '/images/kampala_ggaba_waterfront.jpg',
    ],
    userRef: 'host_amara_003',
    ownerName: 'Amara Diop',
    ownerEmail: 'amara.diop@urbanstays.com',
    contactPhone: '+1 718-555-3342',
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date('2024-03-10').toISOString(),
  },
  {
    _id: 'listing_004',
    title: 'Mercedes-Benz E-Class Executive Chauffeur Service',
    name: 'Mercedes-Benz E-Class Executive Chauffeur Service',
    description: 'Premium black Mercedes-Benz E-Class sedan with an impeccably dressed, discreet professional chauffeur operating throughout Munyonyo and Kabalagala. Tailored for diplomatic delegations, Entebbe VIP airport meet-and-greets, corporate events, and wedding party transport. Bottled water, Wi-Fi, and climate control included.',
    location: 'Munyonyo Waterfront Drive, Makindye Division, Kampala',
    address: 'Munyonyo Waterfront Drive, Makindye Division, Kampala',
    price: 80,
    regularPrice: 80,
    discountPrice: 70,
    category: 'car_service',
    make: 'Honda',
    model: 'Civic Sedan',
    year: 2024,
    transmission: 'automatic',
    seats: 4,
    driverIncluded: true,
    driverName: 'James Wilson',
    driverContact: '+1 718-555-0142',
    bathrooms: 4,
    bedrooms: 4,
    furnished: true,
    parking: true,
    type: 'sale',
    offer: true,
    imageUrls: [
      '/images/kampala_prado_suv.jpg',
      '/images/kampala_city_sedan.jpg',
      '/images/city_driver_car.jpg',
    ],
    userRef: 'host_james_004',
    ownerName: 'James Wilson',
    ownerEmail: 'james.wilson@metrodrivers.com',
    contactPhone: '+1 718-555-0142',
    createdAt: new Date('2024-03-15').toISOString(),
    updatedAt: new Date('2024-03-15').toISOString(),
  },
  {
    _id: 'listing_005',
    title: 'Sunlit Minimalist 1-Bedroom Airbnb Flat with Balcony',
    name: 'Sunlit Minimalist 1-Bedroom Airbnb Flat with Balcony',
    description: 'Peaceful and minimalist 1-bedroom apartment guest house located in a quiet residential neighborhood on Buziga Hill with scenic Lake Victoria breeze. Fully furnished with natural wood accents, comfortable reading chair, fast Wi-Fi, queen bed, and a breezy balcony for morning coffee.',
    location: 'Buziga Hill Rise, Makindye Division, Kampala',
    address: 'Buziga Hill Rise, Makindye Division, Kampala',
    price: 110,
    regularPrice: 110,
    discountPrice: 0,
    category: 'guesthouse',
    bathrooms: 1,
    bedrooms: 1,
    maxGuests: 3,
    amenities: ['WiFi', 'Air Conditioning', 'Kitchen'],
    furnished: true,
    parking: true,
    type: 'rent',
    offer: false,
    imageUrls: [
      '/images/kampala_bedroom_suite.jpg',
      '/images/kampala_apartment_living.jpg',
      '/images/kampala_munyonyo_lake.jpg',
      '/images/kampala_guest_house.jpg',
    ],
    userRef: 'host_elena_001',
    ownerName: 'Elena Rostova',
    ownerEmail: 'elena.rostova@guesthousehub.com',
    contactPhone: '+1 305-555-8821',
    createdAt: new Date('2024-03-20').toISOString(),
    updatedAt: new Date('2024-03-20').toISOString(),
  },
  {
    _id: 'listing_006',
    title: 'Toyota Land Cruiser Prado 4WD with Professional Driver',
    name: 'Toyota Land Cruiser Prado 4WD with Professional Driver',
    description: 'Rugged, spacious, and highly capable Toyota Land Cruiser Prado 4x4 SUV based at Ggaba Marina with private experienced driver. Perfect for Lake Victoria excursions, Entebbe expressway transfers, executive security details, and family holiday tours across Makindye Division and greater Kampala.',
    location: 'Ggaba Marina Way, Makindye Division, Kampala',
    address: 'Ggaba Marina Way, Makindye Division, Kampala',
    price: 95,
    regularPrice: 95,
    discountPrice: 0,
    category: 'car_service',
    make: 'Toyota',
    model: 'Camry Sedan',
    year: 2023,
    transmission: 'automatic',
    seats: 5,
    driverIncluded: true,
    driverName: 'David Chen',
    driverContact: '+1 415-555-0188',
    bathrooms: 4,
    bedrooms: 5,
    furnished: true,
    parking: true,
    type: 'sale',
    offer: false,
    imageUrls: [
      '/images/kampala_prado_suv.jpg',
      '/images/prado_chauffeur_suv.jpg',
      '/images/safari_land_cruiser.jpg',
    ],
    userRef: 'host_david_005',
    ownerName: 'David Chen',
    ownerEmail: 'david.chen@elitechauffeuring.com',
    contactPhone: '+1 415-555-0188',
    createdAt: new Date('2024-03-25').toISOString(),
    updatedAt: new Date('2024-03-25').toISOString(),
  },
];

for (const listing of initialListings) {
  if (listing.category === 'car') {
    listing.category = 'car_service';
  }
  if (!listing.status) {
    listing.status =
      listing._id === 'listing_004' ||
      listing._id === 'listing_005' ||
      listing._id === 'listing_006'
        ? 'pending'
        : 'approved';
  }
  if (listing.isApproved === undefined) {
    listing.isApproved = listing.status === 'approved';
  }
  if (listing.active === undefined) {
    listing.active = true;
  }
  if (listing.isActive === undefined) {
    listing.isActive = listing.active;
  }
  if (!listing.address && listing.location) listing.address = listing.location;
  if (!listing.location && listing.address) listing.location = listing.address;
  if (listing.regularPrice === undefined && listing.price !== undefined) listing.regularPrice = listing.price;
  if (listing.price === undefined && listing.regularPrice !== undefined) listing.price = listing.regularPrice;
  if (!listing.imageURLs && listing.imageUrls) listing.imageURLs = listing.imageUrls;
  if (!listing.imageUrls && listing.imageURLs) listing.imageUrls = listing.imageURLs;
  if (!storage.getListing(listing._id)) {
    storage.createListing(listing);
  }
}

export const mockStore = {
  users: mockUsers,
  listings: mockListings,

  getAllListings() {
    return storage.getAllListings();
  },

  getListings(query = {}) {
    return storage.getListings(query);
  },

  getListing(id) {
    return storage.getListing(id);
  },

  createListing(data) {
    return storage.createListing(data);
  },

  updateListing(id, data) {
    return storage.updateListing(id, data);
  },

  deleteListing(id) {
    return storage.deleteListing(id);
  },

  getUserListings(userRef) {
    return storage.getListings({ userRef, all: 'true' });
  },

  getPendingListings() {
    return storage.getPendingListings();
  },

  findUserByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const target = email.toLowerCase();
    for (const user of mockUsers.values()) {
      if (user && user.email && typeof user.email === 'string' && user.email.toLowerCase() === target) {
        return user;
      }
    }
    return null;
  },

  findUserById(id) {
    return mockUsers.get(id) || null;
  },

  createUser(data) {
    const id = 'user_' + Date.now();
    const isSpecialAdmin =
      data &&
      data.email &&
      typeof data.email === 'string' &&
      (data.email.toLowerCase() === 'jossvision11@gmail.com' ||
        data.email.toLowerCase() === 'admin@chento100.com' ||
        data.email.toLowerCase().includes('admin'));
    const isAdmin = isSpecialAdmin ? true : (data.isAdmin !== undefined ? Boolean(data.isAdmin) : data.role === 'admin');
    const role = isAdmin ? 'admin' : (data.role || 'user');
    const newUser = {
      _id: id,
      ...data,
      isAdmin,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.set(id, newUser);
    return newUser;
  },

  updateUser(id, data) {
    const user = mockUsers.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    mockUsers.set(id, updated);
    return updated;
  },

  getAllUsers() {
    return Array.from(mockUsers.values());
  },

  deleteUser(id) {
    return mockUsers.delete(id);
  },

  // Enquiries / Concierge Requests
  getEnquiries() {
    return [
      {
        id: 'enquiry_001',
        _id: 'enquiry_001',
        listingId: 'listing_001',
        listingTitle: 'Modern Downtown Studio Apartment Airbnb',
        category: 'guesthouse',
        guestName: 'Sarah Jenkins',
        guestEmail: 'sarah.jenkins@gmail.com',
        guestPhone: '+1 646-555-0128',
        hostName: 'Elena Rostova',
        hostEmail: 'elena.rostova@guesthousehub.com',
        hostPhone: '+1 305-555-8821',
        dates: 'Next Weekend (3 Nights)',
        guestsCount: 2,
        notes: 'Inquiring about late check-in at 9 PM and high speed wifi stability for remote work.',
        status: 'new', // 'new' | 'contacted' | 'confirmed' | 'cancelled'
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'enquiry_002',
        _id: 'enquiry_002',
        listingId: 'listing_002',
        listingTitle: 'Toyota Corolla Modern City Sedan with Private Driver',
        category: 'car_service',
        guestName: 'Mateo Rossi',
        guestEmail: 'mateo.rossi@outlook.com',
        guestPhone: '+39 06 6987 1234',
        hostName: 'Marcus Vance',
        hostEmail: 'marcus.vance@citychauffeurs.com',
        hostPhone: '+1 305-555-0199',
        driverName: 'Marcus Vance',
        driverPhone: '+1 305-555-0199',
        dates: 'Tomorrow 08:30 AM',
        serviceType: 'Airport Pickup & Full Day City Commute',
        notes: 'Needs pickup from International Terminal 2 with 2 large luggage bags.',
        status: 'contacted',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'enquiry_003',
        _id: 'enquiry_003',
        listingId: 'listing_006',
        listingTitle: 'Toyota Camry Executive City Sedan with Chauffeur',
        category: 'car_service',
        guestName: 'Lucas Alvarez',
        guestEmail: 'lucas.alvarez@gmail.com',
        guestPhone: '+1 312-555-0176',
        hostName: 'David Chen',
        hostEmail: 'david.chen@elitechauffeuring.com',
        hostPhone: '+1 415-555-0188',
        driverName: 'David Chen',
        driverPhone: '+1 415-555-0188',
        dates: 'Friday 6:00 PM - Midnight',
        serviceType: 'Corporate Dinner Transfers',
        notes: 'Roundtrip transportation for 4 executives between Midtown and Financial District.',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'enquiry_004',
        _id: 'enquiry_004',
        listingId: 'listing_003',
        listingTitle: 'Cozy 2-Bedroom Urban Loft Airbnb with Balcony',
        category: 'guesthouse',
        guestName: 'Chloe Martin',
        guestEmail: 'chloe.martin@yahoo.fr',
        guestPhone: '+33 6 12 34 56 78',
        hostName: 'Amara Diop',
        hostEmail: 'amara.diop@urbanstays.com',
        hostPhone: '+1 718-555-3342',
        dates: 'Nov 12 - Nov 16 (4 Nights)',
        guestsCount: 4,
        notes: 'Family vacation stay, requests baby crib if available.',
        status: 'new',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
  },
};

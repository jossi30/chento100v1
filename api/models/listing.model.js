import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    // Required field title with backwards compatibility support for name
    title: {
      type: String,
      required: function () {
        return !this.name;
      },
      set: function (val) {
        if (!this.name) this.name = val;
        return val;
      },
    },
    name: {
      type: String,
      set: function (val) {
        if (!this.title) this.title = val;
        return val;
      },
    },

    description: {
      type: String,
      required: true,
    },

    // Required field address with backwards compatibility support for location
    address: {
      type: String,
      required: function () {
        return !this.location;
      },
      set: function (val) {
        if (!this.location) this.location = val;
        return val;
      },
    },
    location: {
      type: String,
      set: function (val) {
        if (!this.address) this.address = val;
        return val;
      },
    },

    // Required field regularPrice with backwards compatibility support for price
    regularPrice: {
      type: Number,
      required: function () {
        return this.price === undefined;
      },
      set: function (val) {
        if (this.price === undefined) this.price = val;
        return val;
      },
    },
    price: {
      type: Number,
      set: function (val) {
        if (this.regularPrice === undefined) this.regularPrice = val;
        return val;
      },
    },

    discountedPrice: {
      type: Number,
      default: 0,
      set: function (val) {
        if (this.discountPrice === undefined || this.discountPrice === 0) this.discountPrice = val;
        return val;
      },
    },
    discountPrice: {
      type: Number,
      default: 0,
      set: function (val) {
        if (this.discountedPrice === undefined || this.discountedPrice === 0) this.discountedPrice = val;
        return val;
      },
    },

    // Required field imageURLs with backwards compatibility support for imageUrls
    imageURLs: {
      type: Array,
      required: function () {
        return !this.imageUrls || this.imageUrls.length === 0;
      },
      set: function (val) {
        if (!this.imageUrls || this.imageUrls.length === 0) this.imageUrls = val;
        return val;
      },
    },
    imageUrls: {
      type: Array,
      set: function (val) {
        if (!this.imageURLs || this.imageURLs.length === 0) this.imageURLs = val;
        return val;
      },
    },

    userRef: {
      type: String,
      required: true,
    },

    // 1. Add a category field (String, enum: ['guesthouse', 'car_service'], required: true)
    category: {
      type: String,
      required: true,
      enum: ['guesthouse', 'car_service'],
      set: function (val) {
        // Backwards compatibility for legacy 'car' documents
        if (val === 'car') return 'car_service';
        return val;
      },
    },

    // 2. Add isApproved (Boolean, default: false) and isActive (Boolean, default: true)
    isApproved: {
      type: Boolean,
      default: false,
      set: function (val) {
        if (val !== undefined) {
          this.status = val ? 'approved' : 'pending';
        }
        return val;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      set: function (val) {
        if (val !== undefined) {
          this.active = Boolean(val);
        }
        return val;
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    availabilityStatus: {
      type: String,
      default: 'available',
    },
    availabilityNotes: {
      type: String,
      default: '',
    },
    availableFrom: {
      type: String,
      default: '',
    },
    availableUntil: {
      type: String,
      default: '',
    },
    blockedDates: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    availabilityRequest: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Status and active retained for backwards compatibility
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      set: function (val) {
        if (val === 'approved') {
          this.isApproved = true;
        } else if (val === 'pending' || val === 'rejected') {
          this.isApproved = false;
        }
        return val;
      },
    },
    active: {
      type: Boolean,
      default: true,
      set: function (val) {
        if (val !== undefined) {
          this.isActive = Boolean(val);
        }
        return val;
      },
    },

    // 3. Make bedroom/bathroom fields optional so they aren't required when submitting a car service listing
    bathrooms: {
      type: Number,
      required: false,
      default: 0,
    },
    bedrooms: {
      type: Number,
      required: false,
      default: 0,
    },

    // Optional property fields
    furnished: {
      type: Boolean,
      default: false,
    },
    parking: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'rent',
    },
    offer: {
      type: Boolean,
      default: false,
    },
    amenities: {
      type: Array,
      default: [],
    },
    maxGuests: {
      type: Number,
      required: false,
      default: 1,
    },

    // Optional car service fields
    make: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
      set: function (val) {
        if (this.carModel === undefined) this.carModel = val;
        return val;
      },
    },
    carModel: {
      type: String,
      required: false,
      set: function (val) {
        if (this.model === undefined) this.model = val;
        return val;
      },
    },
    year: {
      type: Number,
      required: false,
    },
    transmission: {
      type: String,
      required: false,
    },
    seats: {
      type: Number,
      required: false,
      set: function (val) {
        if (this.seatingCapacity === undefined) this.seatingCapacity = val;
        return val;
      },
    },
    seatingCapacity: {
      type: Number,
      required: false,
      set: function (val) {
        if (this.seats === undefined) this.seats = val;
        return val;
      },
    },
    driverIncluded: {
      type: Boolean,
      default: true,
    },
    driverName: {
      type: String,
      required: false,
    },
    driverContact: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate middleware for fallback normalization
listingSchema.pre('validate', function (next) {
  // Ensure category default if omitted in existing documents
  if (!this.category) {
    this.category = 'guesthouse';
  } else if (this.category === 'car') {
    this.category = 'car_service';
  }

  // Cross-populate aliases if not already set
  if (!this.title && this.name) this.title = this.name;
  if (!this.name && this.title) this.name = this.title;

  if (!this.address && this.location) this.address = this.location;
  if (!this.location && this.address) this.location = this.address;

  if (this.regularPrice === undefined && this.price !== undefined) this.regularPrice = this.price;
  if (this.price === undefined && this.regularPrice !== undefined) this.price = this.regularPrice;

  if ((this.discountedPrice === undefined || this.discountedPrice === 0) && this.discountPrice) {
    this.discountedPrice = this.discountPrice;
  }
  if ((this.discountPrice === undefined || this.discountPrice === 0) && this.discountedPrice) {
    this.discountPrice = this.discountedPrice;
  }

  if ((!this.imageURLs || !this.imageURLs.length) && this.imageUrls && this.imageUrls.length) {
    this.imageURLs = this.imageUrls;
  }
  if ((!this.imageUrls || !this.imageUrls.length) && this.imageURLs && this.imageURLs.length) {
    this.imageUrls = this.imageURLs;
  }

  if (this.isApproved !== undefined && !this.status) {
    this.status = this.isApproved ? 'approved' : 'pending';
  }
  if (this.status && this.isApproved === undefined) {
    this.isApproved = this.status === 'approved';
  }

  if (this.isActive !== undefined && this.active === undefined) {
    this.active = Boolean(this.isActive);
  }
  if (this.active !== undefined && this.isActive === undefined) {
    this.isActive = Boolean(this.active);
  }

  next();
});

// Clear existing model if registered to allow dynamic schema re-compilation
if (mongoose.models && mongoose.models.Listing) {
  delete mongoose.models.Listing;
}

const Listing = mongoose.model('Listing', listingSchema);

// Retain named exports for backwards compatibility
export const Guesthouse = Listing;
export const Car = Listing;

export { Listing };
export default Listing;

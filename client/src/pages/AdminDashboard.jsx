import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShieldAlt,
  FaUsers,
  FaClock,
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaArchive,
  FaFlag,
  FaHistory,
  FaSearch,
  FaStar,
  FaEdit,
  FaTrashAlt,
  FaBan,
  FaCheck,
  FaEye,
  FaTimes,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaCar,
  FaHome,
  FaFilter,
  FaRedo,
  FaSun,
  FaMoon,
  FaKeyboard,
  FaFileCsv,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaArrowRight,
  FaCog,
  FaBars,
  FaChevronRight,
  FaInfoCircle,
  FaWhatsapp,
  FaBed,
  FaBath,
  FaConciergeBell,
  FaCopy,
  FaCalendarAlt,
  FaUserTie,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { apiFetch as fetch } from '../services/apiFetch';
import {
  subscribeAdminStats,
  subscribeAuditLogs,
  getPendingListings,
  getAllListingsForAdmin,
  confirmListingUnavailable,
  getListingsAdminPaginated,
  approveListing,
  rejectListing,
  requestChanges,
  bulkApproveListings,
  bulkRejectListings,
  toggleFeaturedListing,
  archiveListing,
  restoreListing,
  deleteListing,
  updateListing,
  getAllUsers,
  toggleUserDisabled,
  getAllReports,
  updateReportStatus,
  getAuditLogs,
  getListingsHistory30Days,
  getOwnerIntelligence,
  getAdminSettings,
  updateAdminSettings,
  promoteUserToAdmin,
  demoteUserFromAdmin,
  exportUsersCSV,
  callSetAdminClaim,
  callSetUserDisabled,
  callDeleteUser,
  getAdminEnquiries,
  updateAdminEnquiry,
} from '../services/listingService';

import AdminSidebar from '../components/admin/AdminSidebar';
import AdminToast from '../components/admin/AdminToast';
import ImageZoomModal from '../components/admin/ImageZoomModal';
import ReauthModal from '../components/admin/ReauthModal';
import AdminGuesthousesTab from '../components/admin/AdminGuesthousesTab';
import AdminCarsTab from '../components/admin/AdminCarsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminEnquiriesTab from '../components/admin/AdminEnquiriesTab';
import QuickContactModal from '../components/admin/QuickContactModal';
import AdminEditListingModal from '../components/admin/AdminEditListingModal';
import {
  rejectReasonSchema,
  requestChangesSchema,
  addAdminSchema,
  addPresetSchema,
  marketplaceSettingsSchema,
} from '../components/admin/adminSchemas';

export default function AdminDashboard() {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();

  // Theme & Navigation
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('admin_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Live Stats & Inactivity
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers7Days: 0,
    totalListings: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    archivedCount: 0,
    openReportsCount: 0,
    hasSlaWarning: false,
    oldestPendingTitle: '',
    oldestPendingHours: 0,
  });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success', title = '') => {
    setToast({ message, type, title });
    setTimeout(() => setToast(null), 4000);
  };

  // Re-authentication Modal
  const [reauthModal, setReauthModal] = useState({
    isOpen: false,
    actionTitle: '',
    actionDescription: '',
    onConfirm: null,
  });

  // Image Zoom Modal
  const [zoomModal, setZoomModal] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  // -----------------------------------------------------------------
  // 1. Inactivity Timer (30 minutes auto-signout)
  // -----------------------------------------------------------------
  const lastActivityRef = useRef(Date.now());
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMinutes = (now - lastActivityRef.current) / (1000 * 60);
      if (elapsedMinutes >= 30) {
        clearInterval(interval);
        logOut().finally(() => {
          navigate('/sign-in', { replace: true, state: { sessionExpired: true } });
        });
      }
    }, 60000); // Check once per minute

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, [logOut, navigate]);

  // Dark mode effect
  useEffect(() => {
    try {
      localStorage.setItem('admin_theme', darkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Theme storage notice:', e.message);
    }
  }, [darkMode]);

  // -----------------------------------------------------------------
  // Tab 1: Overview State
  // -----------------------------------------------------------------
  const [historyChartData, setHistoryChartData] = useState([]);
  const [liveAuditFeed, setLiveAuditFeed] = useState([]);

  // Subscribe to Live Stats & Live Audit Logs
  useEffect(() => {
    const unsubStats = subscribeAdminStats((updatedStats) => {
      setStats((prev) => ({ ...prev, ...updatedStats }));
    });

    const unsubAudit = subscribeAuditLogs((logs) => {
      setLiveAuditFeed(logs.slice(0, 8));
    }, 15);

    getListingsHistory30Days().then((history) => {
      setHistoryChartData(history);
    });

    return () => {
      unsubStats();
      unsubAudit();
    };
  }, []);

  // -----------------------------------------------------------------
  // Tab 2: Pending Review Queue State
  // -----------------------------------------------------------------
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingTypeFilter, setPendingTypeFilter] = useState('all');
  const [selectedPendingIndex, setSelectedPendingIndex] = useState(0);
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [ownerIntel, setOwnerIntel] = useState(null);
  const [loadingOwnerIntel, setLoadingOwnerIntel] = useState(false);
  const [availabilityRequests, setAvailabilityRequests] = useState([]);
  const [loadingAvailabilityRequests, setLoadingAvailabilityRequests] = useState(false);

  const loadAvailabilityRequests = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingAvailabilityRequests(true);
    try {
      const listings = await getAllListingsForAdmin();
      setAvailabilityRequests(
        listings.filter((listing) => listing.availabilityRequest?.status === 'pending')
      );
    } catch (err) {
      showToast('Error loading unavailable requests: ' + err.message, 'error');
    } finally {
      if (showLoading) setLoadingAvailabilityRequests(false);
    }
  }, []);

  useEffect(() => {
    loadAvailabilityRequests();
    const intervalId = setInterval(() => loadAvailabilityRequests(false), 30000);
    return () => clearInterval(intervalId);
  }, [loadAvailabilityRequests]);

  useEffect(() => {
    if (activeTab === 'availabilityRequests') loadAvailabilityRequests();
  }, [activeTab, loadAvailabilityRequests]);

  const handleConfirmUnavailableRequest = async (listing) => {
    try {
      await confirmListingUnavailable(listing, currentUser.uid);
      setAvailabilityRequests((prev) => prev.filter((item) => item.id !== listing.id));
      showToast(`"${listing.title || listing.name}" is now unavailable on the marketplace.`, 'success');
      loadListingsTable(true);
    } catch (err) {
      showToast('Could not mark listing unavailable: ' + err.message, 'error');
    }
  };

  // Reject / Request Changes Modals
  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    listing: null,
    preset: '',
    note: '',
    error: '',
    loading: false,
  });

  const [changesDialog, setChangesDialog] = useState({
    isOpen: false,
    listing: null,
    notes: '',
    error: '',
    loading: false,
  });

  const loadPendingQueue = useCallback(async () => {
    setLoadingPending(true);
    try {
      const data = await getPendingListings();
      // Sort oldest first (FIFO moderation queue)
      data.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      setPendingQueue(data);
      setSelectedPendingIndex(0);
      setSelectedPendingIds(new Set());
    } catch (err) {
      showToast('Error loading queue: ' + err.message, 'error');
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingQueue();
    }
  }, [activeTab, loadPendingQueue]);

  const filteredPending = pendingQueue.filter((item) => {
    if (pendingTypeFilter !== 'all' && item.type !== pendingTypeFilter) return false;
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.ownerEmail?.toLowerCase().includes(q) ||
        item.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activePendingListing = filteredPending[selectedPendingIndex] || null;

  // Load Owner Intelligence when active listing changes
  useEffect(() => {
    if (!activePendingListing) {
      setOwnerIntel(null);
      return;
    }
    setLoadingOwnerIntel(true);
    getOwnerIntelligence(activePendingListing.ownerId, activePendingListing.ownerEmail)
      .then((intel) => setOwnerIntel(intel))
      .catch(() => setOwnerIntel(null))
      .finally(() => setLoadingOwnerIntel(false));
  }, [activePendingListing]);

  // Actions on Pending
  const handleApprovePending = async (listing) => {
    if (!listing) return;
    try {
      await approveListing(listing.id, currentUser.uid);
      showToast(`Listing "${listing.title}" approved!`, 'success');
      setPendingQueue((prev) => prev.filter((l) => l.id !== listing.id));
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(listing.id);
        return next;
      });
    } catch (err) {
      showToast('Approve failed: ' + err.message, 'error');
    }
  };

  const handleOpenRejectDialog = (listing) => {
    setRejectDialog({
      isOpen: true,
      listing,
      preset: settings.rejectionPresets[0] || 'Blurry or low-quality images',
      note: '',
      error: '',
      loading: false,
    });
  };

  const handleSubmitReject = async (e) => {
    e.preventDefault();
    const result = rejectReasonSchema.safeParse({
      preset: rejectDialog.preset,
      note: rejectDialog.note,
    });
    if (!result.success) {
      setRejectDialog((prev) => ({
        ...prev,
        error: result.error.errors[0]?.message || 'Invalid reason',
      }));
      return;
    }

    const fullReason = rejectDialog.note?.trim()
      ? `${rejectDialog.preset} — Note: ${rejectDialog.note.trim()}`
      : rejectDialog.preset;

    setRejectDialog((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await rejectListing(rejectDialog.listing.id, fullReason, currentUser.uid);
      showToast(`Listing "${rejectDialog.listing.title}" rejected.`, 'info');
      setPendingQueue((prev) => prev.filter((l) => l.id !== rejectDialog.listing.id));
      setRejectDialog((prev) => ({ ...prev, isOpen: false, listing: null, loading: false }));
    } catch (err) {
      setRejectDialog((prev) => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const handleOpenChangesDialog = (listing) => {
    setChangesDialog({
      isOpen: true,
      listing,
      notes: '',
      error: '',
      loading: false,
    });
  };

  const handleSubmitChanges = async (e) => {
    e.preventDefault();
    const result = requestChangesSchema.safeParse({ notes: changesDialog.notes });
    if (!result.success) {
      setChangesDialog((prev) => ({
        ...prev,
        error: result.error.errors[0]?.message || 'Please provide details',
      }));
      return;
    }

    setChangesDialog((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await requestChanges(
        changesDialog.listing.id,
        changesDialog.notes.trim(),
        currentUser.uid
      );
      showToast(`Changes requested for "${changesDialog.listing.title}".`, 'info');
      setPendingQueue((prev) => prev.filter((l) => l.id !== changesDialog.listing.id));
      setChangesDialog((prev) => ({ ...prev, isOpen: false, listing: null, loading: false }));
    } catch (err) {
      setChangesDialog((prev) => ({ ...prev, error: err.message, loading: false }));
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedPendingIds);
    if (!ids.length) return;
    if (!window.confirm(`Approve all ${ids.length} selected listings?`)) return;

    try {
      await bulkApproveListings(ids, currentUser.uid);
      showToast(`${ids.length} listings approved in bulk!`, 'success');
      setPendingQueue((prev) => prev.filter((l) => !selectedPendingIds.has(l.id)));
      setSelectedPendingIds(new Set());
    } catch (err) {
      showToast('Bulk approve error: ' + err.message, 'error');
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedPendingIds);
    if (!ids.length) return;
    const reason = window.prompt(
      `Enter rejection reason for ${ids.length} listings:`,
      'Does not meet quality guidelines'
    );
    if (!reason || !reason.trim()) return;

    try {
      await bulkRejectListings(ids, reason.trim(), currentUser.uid);
      showToast(`${ids.length} listings rejected in bulk.`, 'info');
      setPendingQueue((prev) => prev.filter((l) => !selectedPendingIds.has(l.id)));
      setSelectedPendingIds(new Set());
    } catch (err) {
      showToast('Bulk reject error: ' + err.message, 'error');
    }
  };

  // Keyboard Shortcuts (A: Approve, R: Reject, J: Next, K: Prev)
  useEffect(() => {
    if (activeTab !== 'pending') return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (activePendingListing) handleApprovePending(activePendingListing);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (activePendingListing) setEditListingModal({ isOpen: true, listing: activePendingListing });
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (activePendingListing) handleOpenRejectDialog(activePendingListing);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setSelectedPendingIndex((prev) =>
          prev < filteredPending.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setSelectedPendingIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === '?') {
        setShowKeyboardHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activePendingListing, filteredPending.length]);

  // -----------------------------------------------------------------
  // Tab 3: Listings Management Table State
  // -----------------------------------------------------------------
  const [allListingsTable, setAllListingsTable] = useState([]);
  const [loadingListingsTable, setLoadingListingsTable] = useState(false);
  const [listingsStatusFilter, setListingsStatusFilter] = useState('all');
  const [listingsTypeFilter, setListingsTypeFilter] = useState('all');
  const [listingsCityFilter, setListingsCityFilter] = useState('');
  const [listingsFeaturedOnly, setListingsFeaturedOnly] = useState(false);
  const [listingsSortField, setListingsSortField] = useState('createdAt');
  const [listingsSortOrder, setListingsSortOrder] = useState('desc');
  const [listingsCursor, setListingsCursor] = useState(null);
  const [hasMoreListings, setHasMoreListings] = useState(false);

  const loadListingsTable = useCallback(
    async (reset = false) => {
      setLoadingListingsTable(true);
      try {
        const res = await getListingsAdminPaginated({
          statusFilter: listingsStatusFilter,
          typeFilter: listingsTypeFilter,
          cityFilter: listingsCityFilter,
          featuredFilter: listingsFeaturedOnly,
          sortField: listingsSortField,
          sortOrder: listingsSortOrder,
          lastDoc: reset ? null : listingsCursor,
          pageSize: 25,
        });
        setAllListingsTable(res.listings);
        setListingsCursor(res.lastVisible);
        setHasMoreListings(res.hasMore);
      } catch (err) {
        showToast('Error loading listings: ' + err.message, 'error');
      } finally {
        setLoadingListingsTable(false);
      }
    },
    [
      listingsStatusFilter,
      listingsTypeFilter,
      listingsCityFilter,
      listingsFeaturedOnly,
      listingsSortField,
      listingsSortOrder,
      listingsCursor,
    ]
  );

  useEffect(() => {
    if (
      activeTab === 'listings' ||
      activeTab === 'guesthouses' ||
      activeTab === 'cars'
    ) {
      loadListingsTable(true);
    }
  }, [
    activeTab,
    listingsStatusFilter,
    listingsTypeFilter,
    listingsFeaturedOnly,
    listingsSortField,
    listingsSortOrder,
    loadListingsTable,
  ]);

  const filteredAllListings = allListingsTable.filter((l) => {
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      const match =
        l.title?.toLowerCase().includes(q) ||
        l.ownerEmail?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleToggleFeatured = async (listing) => {
    try {
      const nextState = !listing.featured;
      await toggleFeaturedListing(listing.id, nextState, currentUser.uid);
      showToast(`Listing ${nextState ? 'featured' : 'unfeatured'}!`, 'success');
      setAllListingsTable((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, featured: nextState } : l))
      );
    } catch (err) {
      showToast('Feature toggle failed: ' + err.message, 'error');
    }
  };

  const handleArchiveListing = async (listing) => {
    if (!window.confirm(`Archive listing "${listing.title}"? It will be hidden from the public.`))
      return;
    try {
      await archiveListing(listing.id);
      showToast(`Listing "${listing.title}" archived.`, 'info');
      setAllListingsTable((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: 'archived' } : l))
      );
    } catch (err) {
      showToast('Archive failed: ' + err.message, 'error');
    }
  };

  const handleRestoreListing = async (listing) => {
    try {
      await restoreListing(listing.id, currentUser.uid);
      showToast(`Listing "${listing.title}" restored to approved!`, 'success');
      setAllListingsTable((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: 'approved' } : l))
      );
    } catch (err) {
      showToast('Restore failed: ' + err.message, 'error');
    }
  };

  // Re-authentication on destructive permanent delete
  const handleDeleteListingWithReauth = (listing) => {
    setReauthModal({
      isOpen: true,
      actionTitle: `Permanently Delete Listing: "${listing.title}"`,
      actionDescription:
        'This will permanently remove the listing and all its photos from the database. This action is irreversible.',
      onConfirm: async () => {
        setReauthModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteListing(listing.id);
          showToast(`Listing "${listing.title}" permanently deleted.`, 'info');
          setAllListingsTable((prev) => prev.filter((l) => l.id !== listing.id));
        } catch (err) {
          showToast('Delete failed: ' + err.message, 'error');
        }
      },
    });
  };

  // -----------------------------------------------------------------
  // Tab 4: Users Management State & Detail Drawer
  // -----------------------------------------------------------------
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'hosts' | 'users'
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userDetailIntel, setUserDetailIntel] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // Quick Concierge Direct Contact Modal
  const [quickContactModal, setQuickContactModal] = useState({
    isOpen: false,
    contact: null,
    customMessage: '',
  });

  // Admin Direct Listing Edit Modal State
  const [editListingModal, setEditListingModal] = useState({
    isOpen: false,
    listing: null,
  });

  const handleAdminSaveListing = async (listingId, updates) => {
    try {
      await updateListing(listingId, updates, true);
      showToast('Listing details updated successfully!', 'success');
      loadListingsTable(true);
      if (activeTab === 'pending') {
        loadPendingQueue();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update listing', 'error');
      throw err;
    }
  };

  // Enquiries & Leads State
  const [enquiriesList, setEnquiriesList] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('all');

  const loadEnquiriesList = useCallback(async () => {
    setLoadingEnquiries(true);
    try {
      const data = await getAdminEnquiries();
      setEnquiriesList(data || []);
    } catch (err) {
      console.warn('Load enquiries error:', err.message);
    } finally {
      setLoadingEnquiries(false);
    }
  }, []);

  const handleUpdateEnquiryStatus = async (id, newStatus) => {
    try {
      await updateAdminEnquiry(id, newStatus);
      setEnquiriesList((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      showToast(`Booking request marked as "${newStatus}"`, 'success');
    } catch (err) {
      showToast('Error updating enquiry: ' + err.message, 'error');
    }
  };

  const loadUsersList = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsersList(data);
    } catch (err) {
      showToast('Error loading users: ' + err.message, 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsersList();
    }
    if (activeTab === 'enquiries' || activeTab === 'overview') {
      loadEnquiriesList();
    }
  }, [activeTab, loadUsersList, loadEnquiriesList]);

  // Comprehensive Users Filtering (separating Hosts and Guests / Users)
  const filteredUsersList = usersList.filter((u) => {
    // 1. Role / Account Type separation
    const isHost = u.accountType === 'host' || u.role === 'host' || (u.listingsCount && u.listingsCount > 0);
    if (userRoleFilter === 'hosts' && !isHost) return false;
    if (userRoleFilter === 'users' && (isHost || u.isAdmin)) return false;

    // 2. Status filter
    if (userStatusFilter === 'verified' && !u.emailVerified && !u.verified) return false;
    if (userStatusFilter === 'unverified' && (u.emailVerified || u.verified)) return false;
    if (userStatusFilter === 'disabled' && !u.disabled) return false;

    // 3. User search term across name, email, phone number
    const term = (userSearchTerm || globalSearch).toLowerCase().trim();
    if (term) {
      const match =
        u.email?.toLowerCase().includes(term) ||
        u.displayName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.name?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.phoneNumber?.toLowerCase().includes(term) ||
        u.uid?.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const handleSelectUserForDrawer = async (user) => {
    setSelectedUserDetail(user);
    setLoadingUserDetail(true);
    try {
      const intel = await getOwnerIntelligence(user.uid || user.id, user.email);
      setUserDetailIntel(intel);
    } catch {
      setUserDetailIntel(null);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleToggleUserDisabled = async (user) => {
    if (user.uid === currentUser.uid || user.email === currentUser.email) {
      showToast('You cannot disable your own administrator account!', 'error');
      return;
    }
    const nextState = !user.disabled;
    const actionLabel = nextState ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${actionLabel} account: ${user.email}?`))
      return;

    try {
      await toggleUserDisabled(user.uid || user.id, nextState, currentUser.uid);
      callSetUserDisabled(user.uid || user.id, nextState, currentUser.uid);
      showToast(`User ${user.email} is now ${nextState ? 'disabled' : 'enabled'}.`, 'success');
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === user.uid || u.id === user.id ? { ...u, disabled: nextState } : u
        )
      );
      if (selectedUserDetail) {
        setSelectedUserDetail((prev) => ({ ...prev, disabled: nextState }));
      }
    } catch (err) {
      showToast('User status error: ' + err.message, 'error');
    }
  };

  const handleToggleAdminRole = async (user) => {
    const isCurrentlyAdmin = user.role === 'admin' || user.isAdmin === true;
    if (isCurrentlyAdmin && (user.uid === currentUser.uid || user.email === currentUser.email)) {
      showToast('You cannot demote yourself from Administrator!', 'error');
      return;
    }

    const actionText = isCurrentlyAdmin ? 'Demote to regular user' : 'Promote to Administrator';
    if (!window.confirm(`${actionText} for ${user.email}?`)) return;

    try {
      if (isCurrentlyAdmin) {
        await demoteUserFromAdmin(user.uid || user.id, currentUser.uid);
        callSetAdminClaim(user.email, false, currentUser.uid);
        showToast(`${user.email} demoted to user.`, 'info');
      } else {
        await promoteUserToAdmin(user.uid || user.id, user.email, currentUser.uid);
        callSetAdminClaim(user.email, true, currentUser.uid);
        showToast(`${user.email} promoted to Administrator!`, 'success');
      }
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === user.uid || u.id === user.id
            ? { ...u, role: isCurrentlyAdmin ? 'user' : 'admin', isAdmin: !isCurrentlyAdmin }
            : u
        )
      );
      if (selectedUserDetail) {
        setSelectedUserDetail((prev) => ({
          ...prev,
          role: isCurrentlyAdmin ? 'user' : 'admin',
          isAdmin: !isCurrentlyAdmin,
        }));
      }
    } catch (err) {
      showToast('Role update error: ' + err.message, 'error');
    }
  };

  const handleDeleteUserWithReauth = (user) => {
    if (user.uid === currentUser.uid || user.email === currentUser.email) {
      showToast('You cannot delete your own administrator account!', 'error');
      return;
    }

    setReauthModal({
      isOpen: true,
      actionTitle: `Permanently Delete User: ${user.email}`,
      actionDescription:
        'This will permanently delete the user credentials, profile, and all association data. This cannot be undone.',
      onConfirm: async () => {
        setReauthModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await callDeleteUser(user.uid || user.id, currentUser.uid);
          showToast(`User ${user.email} has been permanently deleted.`, 'info');
          setUsersList((prev) => prev.filter((u) => (u.uid || u.id) !== (user.uid || user.id)));
          if (selectedUserDetail?.uid === user.uid) setSelectedUserDetail(null);
        } catch (err) {
          showToast('User deletion failed: ' + err.message, 'error');
        }
      },
    });
  };

  // -----------------------------------------------------------------
  // Tab 5: Reports Queue State
  // -----------------------------------------------------------------
  const [reportsQueue, setReportsQueue] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadReportsQueue = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await getAllReports();
      setReportsQueue(data);
    } catch (err) {
      showToast('Error loading reports: ' + err.message, 'error');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReportsQueue();
    }
  }, [activeTab, loadReportsQueue]);

  const handleDismissReport = async (reportId) => {
    try {
      await updateReportStatus(reportId, 'resolved');
      showToast('Report marked as dismissed/resolved.', 'success');
      setReportsQueue((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
      );
    } catch (err) {
      showToast('Report update error: ' + err.message, 'error');
    }
  };

  // -----------------------------------------------------------------
  // Tab 6: Audit Logs State
  // -----------------------------------------------------------------
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const loadAuditLogsTable = useCallback(async () => {
    setLoadingAuditLogs(true);
    try {
      const data = await getAuditLogs(100);
      setAuditLogsList(data);
    } catch (err) {
      showToast('Error loading audit logs: ' + err.message, 'error');
    } finally {
      setLoadingAuditLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogsTable();
    }
  }, [activeTab, loadAuditLogsTable]);

  const filteredAuditLogs = auditLogsList.filter((log) => {
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      const match =
        log.adminId?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.targetId?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // -----------------------------------------------------------------
  // Tab 7: Settings State
  // -----------------------------------------------------------------
  const [settings, setSettings] = useState({
    adminEmails: ['jossvision11@gmail.com', 'joepatriot30@gmail.com'],
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
  });
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [newPresetInput, setNewPresetInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    getAdminSettings().then((res) => {
      setSettings((prev) => ({ ...prev, ...res }));
    });
  }, []);

  const handleAddAdminEmail = (e) => {
    e.preventDefault();
    const result = addAdminSchema.safeParse({ email: newAdminEmailInput.trim() });
    if (!result.success) {
      showToast(result.error.errors[0]?.message || 'Invalid email', 'error');
      return;
    }
    const clean = newAdminEmailInput.trim().toLowerCase();
    if (settings.adminEmails.includes(clean)) {
      showToast('Admin email already in list', 'info');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      adminEmails: [...prev.adminEmails, clean],
    }));
    setNewAdminEmailInput('');
  };

  const handleRemoveAdminEmail = (email) => {
    if (email === currentUser.email) {
      showToast('You cannot remove yourself from admin list!', 'error');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      adminEmails: prev.adminEmails.filter((e) => e !== email),
    }));
  };

  const handleAddPreset = (e) => {
    e.preventDefault();
    const result = addPresetSchema.safeParse({ preset: newPresetInput.trim() });
    if (!result.success) {
      showToast(result.error.errors[0]?.message || 'Invalid preset', 'error');
      return;
    }
    const clean = newPresetInput.trim();
    if (settings.rejectionPresets.includes(clean)) {
      showToast('Preset already exists', 'info');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      rejectionPresets: [...prev.rejectionPresets, clean],
    }));
    setNewPresetInput('');
  };

  const handleRemovePreset = (preset) => {
    setSettings((prev) => ({
      ...prev,
      rejectionPresets: prev.rejectionPresets.filter((p) => p !== preset),
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const result = marketplaceSettingsSchema.safeParse({
      maxPendingPerUser: settings.maxPendingPerUser,
      requireEmailVerification: settings.requireEmailVerification,
      slaHoursWarning: settings.slaHoursWarning,
      reportThreshold: settings.reportThreshold,
    });
    if (!result.success) {
      showToast(result.error.errors[0]?.message || 'Invalid settings values', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      await updateAdminSettings(settings, currentUser.uid);
      showToast('Marketplace settings updated and saved to Firestore!', 'success');
    } catch (err) {
      showToast('Settings save error: ' + err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200'>
        {/* Toast Component */}
        <AdminToast toast={toast} onDismiss={() => setToast(null)} />

        {/* Re-authentication Confirmation Modal */}
        <ReauthModal
          isOpen={reauthModal.isOpen}
          onClose={() => setReauthModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={reauthModal.onConfirm}
          actionTitle={reauthModal.actionTitle}
          actionDescription={reauthModal.actionDescription}
        />

        {/* Image Zoom Modal */}
        <ImageZoomModal
          isOpen={zoomModal.isOpen}
          images={zoomModal.images}
          initialIndex={zoomModal.initialIndex}
          onClose={() => setZoomModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Quick Concierge Direct Contact Modal (WhatsApp, Call, Email) */}
        <QuickContactModal
          isOpen={quickContactModal.isOpen}
          onClose={() => setQuickContactModal((prev) => ({ ...prev, isOpen: false }))}
          contact={quickContactModal.contact}
        />

        {/* Admin Direct Listing Edit Modal */}
        <AdminEditListingModal
          isOpen={editListingModal.isOpen}
          listing={editListingModal.listing}
          onClose={() => setEditListingModal({ isOpen: false, listing: null })}
          onSaved={handleAdminSaveListing}
        />

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div
            className='fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4'
            onClick={() => setShowKeyboardHelp(false)}
          >
            <div
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-900 dark:text-white'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3'>
                <div className='flex items-center gap-2'>
                  <FaKeyboard className='text-amber-500' />
                  <h3 className='font-bold text-sm'>Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className='p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer'
                >
                  <FaTimes />
                </button>
              </div>

              <div className='space-y-2 text-xs'>
                <div className='flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl'>
                  <span className='text-slate-600 dark:text-slate-400'>Approve Listing</span>
                  <kbd className='px-2 py-1 bg-white dark:bg-slate-700 font-mono font-bold rounded shadow-xs border border-slate-200 dark:border-slate-600'>
                    A
                  </kbd>
                </div>
                <div className='flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl'>
                  <span className='text-slate-600 dark:text-slate-400'>Reject Listing</span>
                  <kbd className='px-2 py-1 bg-white dark:bg-slate-700 font-mono font-bold rounded shadow-xs border border-slate-200 dark:border-slate-600'>
                    R
                  </kbd>
                </div>
                <div className='flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl'>
                  <span className='text-slate-600 dark:text-slate-400'>Next Listing</span>
                  <kbd className='px-2 py-1 bg-white dark:bg-slate-700 font-mono font-bold rounded shadow-xs border border-slate-200 dark:border-slate-600'>
                    J
                  </kbd>
                </div>
                <div className='flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl'>
                  <span className='text-slate-600 dark:text-slate-400'>Previous Listing</span>
                  <kbd className='px-2 py-1 bg-white dark:bg-slate-700 font-mono font-bold rounded shadow-xs border border-slate-200 dark:border-slate-600'>
                    K
                  </kbd>
                </div>
              </div>

              <p className='text-[11px] text-slate-500 dark:text-slate-400 text-center'>
                Active in the Pending Review Queue tab
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SIDEBAR NAVIGATION */}
        {/* ------------------------------------------------------------- */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          availabilityRequestCount={availabilityRequests.length}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          onSignOut={() => {
            if (window.confirm('Sign out of Administrator Console?')) {
              logOut().then(() => navigate('/sign-in'));
            }
          }}
          currentUser={currentUser}
        />

        {/* ------------------------------------------------------------- */}
        {/* MAIN CONTENT AREA */}
        {/* ------------------------------------------------------------- */}
        <div className='flex-1 flex flex-col min-w-0 h-screen overflow-y-auto'>
          {/* Top Bar */}
          <header className='sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3 flex-1 max-w-md'>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className='lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer'
                aria-label='Open sidebar'
              >
                <FaBars />
              </button>

              {/* Global Search */}
              <div className='relative w-full'>
                <FaSearch className='absolute left-3.5 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className='w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:outline-hidden transition'
                />
              </div>
            </div>

            {/* Right Topbar Controls */}
            <div className='flex items-center gap-2.5 sm:gap-3 shrink-0'>
              {/* Keyboard help button */}
              <button
                type='button'
                onClick={() => setShowKeyboardHelp(true)}
                className='p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5'
                title='Keyboard shortcuts (? / J / K / A / R)'
              >
                <FaKeyboard className='text-sm' />
                <span className='hidden md:inline font-semibold'>Shortcuts</span>
              </button>

              {/* Light / Dark Mode Toggle */}
              <button
                type='button'
                onClick={() => setDarkMode((d) => !d)}
                className='p-2 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer'
                title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
              >
                {darkMode ? <FaSun className='text-sm' /> : <FaMoon className='text-sm' />}
              </button>

              {/* Pending Queue Quick Link Badge */}
              <button
                onClick={() => setActiveTab('pending')}
                className='relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer'
                title='Pending queue'
              >
                <FaClock className='text-sm' />
                {stats.pendingCount > 0 && (
                  <span className='absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-xs'>
                    {stats.pendingCount}
                  </span>
                )}
              </button>

              <div className='h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block' />

              {/* Admin Identity Display */}
              <div className='hidden sm:flex items-center gap-2'>
                <div className='w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center'>
                  {(currentUser?.email?.[0] || 'A').toUpperCase()}
                </div>
                <span className='text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[140px] truncate'>
                  {currentUser?.email}
                </span>
              </div>
            </div>
          </header>

          {/* Page Body Container */}
          <main className='flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto'>
            {/* --------------------------------------------------------- */}
            {/* TAB 1: OVERVIEW */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                {/* 48-Hour SLA Warning Banner */}
                {stats.hasSlaWarning && (
                  <div className='p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm'>
                    <div className='flex items-start gap-3'>
                      <div className='p-2.5 bg-amber-500 text-slate-950 rounded-2xl shrink-0 mt-0.5 font-black'>
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <h4 className='font-bold text-sm'>
                          Moderation SLA Warning: Pending submissions waiting over 48 hours
                        </h4>
                        <p className='text-xs text-amber-700 dark:text-amber-300 mt-0.5'>
                          Oldest waiting:{' '}
                          <span className='font-bold'>&quot;{stats.oldestPendingTitle}&quot;</span> (waiting ~
                          {stats.oldestPendingHours} hours).
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('pending')}
                      className='px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto'
                    >
                      Review Queue Now →
                    </button>
                  </div>
                )}

                {availabilityRequests.length > 0 && (
                  <div className='p-4 sm:p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 shadow-sm'>
                    <div className='flex items-start gap-3'>
                      <div className='p-2.5 bg-rose-500 text-white rounded-2xl shrink-0 mt-0.5'>
                        <FaBell />
                      </div>
                      <div>
                        <h4 className='font-bold text-sm'>
                          {availabilityRequests.length} partner {availabilityRequests.length === 1 ? 'request' : 'requests'} to mark listings unavailable
                        </h4>
                        <p className='text-xs text-rose-700 dark:text-rose-300 mt-0.5'>
                          Review the request and confirm when the listing should be taken off the marketplace.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('availabilityRequests')}
                      className='px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto'
                    >
                      Review Requests →
                    </button>
                  </div>
                )}

                {/* Live Stat Cards Grid */}
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4'>
                  {/* Total Users */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Users</span>
                      <FaUsers className='text-blue-500' />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white'>
                      {stats.totalUsers}
                    </p>
                    <p className='text-[10px] text-emerald-600 dark:text-emerald-400 font-bold'>
                      +{stats.newUsers7Days} in last 7 days
                    </p>
                  </div>

                  {/* Pending Listings */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-amber-200/90 dark:border-amber-900/60 shadow-xs space-y-1.5 bg-amber-50/20 dark:bg-amber-950/20'>
                    <div className='flex items-center justify-between text-amber-600 dark:text-amber-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Pending</span>
                      <FaClock />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400'>
                      {stats.pendingCount}
                    </p>
                    <p className='text-[10px] text-amber-600 dark:text-amber-400 font-semibold'>
                      Requires review
                    </p>
                  </div>

                  {/* Approved Listings */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Approved</span>
                      <FaCheckCircle className='text-emerald-500' />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white'>
                      {stats.approvedCount}
                    </p>
                    <p className='text-[10px] text-slate-500'>Active on marketplace</p>
                  </div>

                  {/* Rejected Listings */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Rejected</span>
                      <FaTimesCircle className='text-rose-500' />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white'>
                      {stats.rejectedCount}
                    </p>
                    <p className='text-[10px] text-slate-500'>Revision needed</p>
                  </div>

                  {/* Archived Listings */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Archived</span>
                      <FaArchive className='text-slate-500' />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white'>
                      {stats.archivedCount}
                    </p>
                    <p className='text-[10px] text-slate-500'>Hidden by admin</p>
                  </div>

                  {/* Open Reports */}
                  <div className='bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5'>
                    <div className='flex items-center justify-between text-slate-400'>
                      <span className='text-[11px] font-semibold uppercase tracking-wider'>Reports</span>
                      <FaFlag className='text-rose-500' />
                    </div>
                    <p className='text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400'>
                      {stats.openReportsCount}
                    </p>
                    <p className='text-[10px] text-rose-500 font-semibold'>Awaiting triage</p>
                  </div>
                </div>

                {/* 30-Day Activity Chart & Live Audit Feed Split */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                  {/* Chart: Listings submitted per day (last 30 days) */}
                  <div className='lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-bold text-slate-900 dark:text-white text-sm'>
                          Daily Listing Submissions (Past 30 Days)
                        </h3>
                        <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                          Live volume trends split by Guest House vs Car Leasing
                        </p>
                      </div>

                      <div className='flex items-center gap-3 text-[11px] font-semibold'>
                        <span className='flex items-center gap-1.5'>
                          <span className='w-3 h-3 rounded-md bg-amber-500' />
                          <span>Guest Houses</span>
                        </span>
                        <span className='flex items-center gap-1.5'>
                          <span className='w-3 h-3 rounded-md bg-sky-500' />
                          <span>Car Leasing</span>
                        </span>
                      </div>
                    </div>

                    {/* SVG Interactive Trend Visualizer */}
                    <div className='h-48 w-full flex items-end gap-1.5 pt-4 border-b border-slate-100 dark:border-slate-800'>
                      {historyChartData.map((d, idx) => {
                        const maxVal = Math.max(
                          ...historyChartData.map((x) => x.total),
                          5
                        );
                        const totalHeightPct = Math.min((d.total / maxVal) * 100, 100);
                        const guesthousePct = d.total > 0 ? (d.guesthouse / d.total) * 100 : 0;
                        const carPct = d.total > 0 ? (d.car / d.total) * 100 : 0;

                        return (
                          <div
                            key={idx}
                            className='flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer'
                          >
                            {/* Hover tooltip */}
                            <div className='absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-950 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none'>
                              <span className='font-bold'>{d.label}</span>
                              <span>
                                {d.guesthouse} Guesthouses • {d.car} Cars ({d.total} Total)
                              </span>
                            </div>

                            {/* Stacked bar */}
                            <div
                              style={{ height: `${Math.max(totalHeightPct, 4)}%` }}
                              className='w-full max-w-[14px] rounded-t-sm flex flex-col overflow-hidden transition-all duration-300 group-hover:scale-y-105'
                            >
                              <div
                                style={{ height: `${guesthousePct}%` }}
                                className='bg-amber-500 w-full shrink-0'
                              />
                              <div
                                style={{ height: `${carPct}%` }}
                                className='bg-sky-500 w-full shrink-0'
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity Feed from auditLogs */}
                  <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <FaHistory className='text-amber-500' />
                        <h3 className='font-bold text-slate-900 dark:text-white text-sm'>
                          Recent Audit Activity
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('audit')}
                        className='text-xs font-bold text-amber-500 hover:underline cursor-pointer'
                      >
                        All logs →
                      </button>
                    </div>

                    <div className='space-y-3 overflow-y-auto max-h-[220px] divide-y divide-slate-100 dark:divide-slate-800/60'>
                      {liveAuditFeed.length === 0 ? (
                        <p className='text-xs text-slate-400 text-center py-6'>
                          No recent actions logged yet.
                        </p>
                      ) : (
                        liveAuditFeed.map((log) => (
                          <div key={log.id} className='pt-2.5 first:pt-0 flex items-start gap-2 text-xs'>
                            <span className='w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0' />
                            <div className='flex-1 min-w-0'>
                              <p className='font-semibold text-slate-900 dark:text-slate-100 truncate'>
                                {log.action?.replace(/_/g, ' ')}
                              </p>
                              <p className='text-[10px] text-slate-400 truncate'>
                                By: {log.adminId} • {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* PARTNER UNAVAILABLE REQUESTS */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'availabilityRequests' && (
              <div className='space-y-4'>
                <div className='bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-lg font-bold text-slate-900 dark:text-white'>Unavailable Requests</h2>
                      <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                        Confirming a request removes the listing from the public marketplace.
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => loadAvailabilityRequests()}
                      disabled={loadingAvailabilityRequests}
                      className='px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold disabled:opacity-60'
                    >
                      {loadingAvailabilityRequests ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {availabilityRequests.length === 0 && !loadingAvailabilityRequests ? (
                  <div className='bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center'>
                    <FaCheckCircle className='text-3xl text-emerald-500 mx-auto mb-3' />
                    <p className='text-sm font-semibold text-slate-700 dark:text-slate-200'>No pending unavailable requests.</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {availabilityRequests.map((listing) => {
                      const request = listing.availabilityRequest;
                      return (
                        <div
                          key={listing.id}
                          className='bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4'
                        >
                          <div className='flex items-start gap-4 min-w-0'>
                            <img
                              src={listing.images?.[0] || listing.imageUrls?.[0] || '/images/airbnb_apartment_living.jpg'}
                              alt=''
                              className='w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0'
                            />
                            <div className='min-w-0'>
                              <h3 className='text-sm font-bold text-slate-900 dark:text-white truncate'>
                                {listing.title || listing.name}
                              </h3>
                              <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                Requested by {listing.ownerName || request.requestedByEmail || listing.ownerEmail || 'Partner'}
                                {request.requestedAt ? ` • ${new Date(request.requestedAt).toLocaleString()}` : ''}
                              </p>
                              {request.availabilityNotes && (
                                <p className='text-xs text-rose-700 dark:text-rose-300 mt-2'>{request.availabilityNotes}</p>
                              )}
                              {request.availableFrom && request.availableUntil && (
                                <p className='text-xs text-slate-600 dark:text-slate-300 mt-1'>
                                  Requested dates: {request.availableFrom} to {request.availableUntil}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => handleConfirmUnavailableRequest(listing)}
                            className='px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap'
                          >
                            Mark Unavailable
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 2: PENDING REVIEW (SPLIT VIEW & KEYBOARD SHORTCUTS) */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'pending' && (
              <div className='space-y-4'>
                {/* Queue Controls Bar */}
                <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs font-bold text-slate-700 dark:text-slate-300'>
                      Type Filter:
                    </span>
                    <div className='inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold'>
                      {['all', 'guesthouse', 'car'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setPendingTypeFilter(t)}
                          className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                            pendingTypeFilter === t
                              ? 'bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {t === 'all' ? 'All Types' : t === 'guesthouse' ? 'Guest Houses' : 'Car Leasing'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedPendingIds.size > 0 && (
                    <div className='flex items-center gap-2 animate-fadeIn'>
                      <span className='text-xs font-bold text-amber-500'>
                        {selectedPendingIds.size} Selected
                      </span>
                      <button
                        onClick={handleBulkApprove}
                        className='px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer'
                      >
                        Bulk Approve
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className='px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer'
                      >
                        Bulk Reject
                      </button>
                    </div>
                  )}

                  <div className='flex items-center gap-2 text-xs text-slate-400'>
                    <span>Sorted: Oldest First</span>
                    <button
                      onClick={loadPendingQueue}
                      className='p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg'
                    >
                      <FaRedo />
                    </button>
                  </div>
                </div>

                {filteredPending.length === 0 ? (
                  <div className='p-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2'>
                    <div className='w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-xl'>
                      <FaCheck />
                    </div>
                    <h3 className='font-bold text-slate-800 dark:text-white'>Queue is empty!</h3>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      All submitted listings have been reviewed and moderated.
                    </p>
                  </div>
                ) : (
                  /* Split View Workflow Container */
                  <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
                    {/* Left: Queue List (4 cols) */}
                    <div className='lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col h-[700px]'>
                      <div className='p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold'>
                        <span>Queue ({filteredPending.length})</span>
                        <span className='text-[10px] text-slate-400'>Use J / K to navigate</span>
                      </div>

                      <div className='flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80'>
                        {filteredPending.map((item, idx) => {
                          const isSelected = idx === selectedPendingIndex;
                          const isChecked = selectedPendingIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedPendingIndex(idx)}
                              className={`p-3.5 flex items-start gap-3 cursor-pointer transition select-none ${
                                isSelected
                                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-amber-500'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <input
                                type='checkbox'
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedPendingIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    return next;
                                  });
                                }}
                                className='mt-1 rounded text-amber-500 focus:ring-amber-400'
                              />

                              <img
                                src={
                                  Array.isArray(item.images) && item.images.length > 0
                                    ? item.images[0]
                                    : '/images/airbnb_apartment_living.jpg'
                                }
                                alt=''
                                className='w-14 h-14 rounded-xl object-cover shrink-0'
                              />

                              <div className='flex-1 min-w-0'>
                                <p className='font-bold text-xs text-slate-900 dark:text-white truncate'>
                                  {item.title}
                                </p>
                                <p className='text-[11px] text-slate-500 dark:text-slate-400 truncate'>
                                  {item.type === 'guesthouse' ? 'Guest House' : 'Car Leasing'} • ${item.price}
                                </p>
                                <p className='text-[10px] text-slate-400 truncate mt-1'>
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Detailed Review Panel (8 cols) */}
                    {activePendingListing ? (
                      <div className='lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col h-[700px] overflow-y-auto space-y-6'>
                        {/* Action Header */}
                        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4'>
                          <div>
                            <span className='text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'>
                              {activePendingListing.type === 'guesthouse' ? 'Guest House' : 'Car Leasing'}
                            </span>
                            <h2 className='text-lg font-black text-slate-900 dark:text-white mt-1'>
                              {activePendingListing.title}
                            </h2>
                          </div>

                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              onClick={() => setEditListingModal({ isOpen: true, listing: activePendingListing })}
                              className='px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs'
                              title='Edit Listing Info, Pricing & Specs (E)'
                            >
                              <FaEdit />
                              <span>Edit Info (E)</span>
                            </button>
                            <button
                              onClick={() => handleOpenChangesDialog(activePendingListing)}
                              className='px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer'
                            >
                              Request Changes
                            </button>
                            <button
                              onClick={() => handleOpenRejectDialog(activePendingListing)}
                              className='px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5'
                            >
                              <FaTimes />
                              <span>Reject (R)</span>
                            </button>
                            <button
                              onClick={() => handleApprovePending(activePendingListing)}
                              className='px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5'
                            >
                              <FaCheck />
                              <span>Approve (A)</span>
                            </button>
                          </div>
                        </div>

                        {/* Image Gallery with Click-to-Zoom */}
                        <div>
                          <p className='text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between'>
                            <span>Photo Gallery (Click to Zoom &amp; Inspect)</span>
                            <span className='text-[10px] text-slate-400'>
                              {activePendingListing.images?.length || 0} Photos
                            </span>
                          </p>
                          <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                            {activePendingListing.images?.map((img, i) => (
                              <button
                                key={i}
                                type='button'
                                onClick={() =>
                                  setZoomModal({
                                    isOpen: true,
                                    images: activePendingListing.images,
                                    initialIndex: i,
                                  })
                                }
                                className='h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-amber-400 transition cursor-pointer'
                              >
                                <img src={img} alt='' className='w-full h-full object-cover' />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Specifications & Price */}
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs'>
                          <div>
                            <span className='text-slate-400 text-[10px] block'>Price</span>
                            <span className='font-bold text-slate-900 dark:text-white text-base'>
                              ${activePendingListing.price}
                            </span>
                          </div>
                          <div>
                            <span className='text-slate-400 text-[10px] block'>Location</span>
                            <span className='font-bold text-slate-900 dark:text-white'>
                              {activePendingListing.city || activePendingListing.location || 'N/A'}
                            </span>
                          </div>
                          {activePendingListing.type === 'guesthouse' ? (
                            <>
                              <div>
                                <span className='text-slate-400 text-[10px] block'>Capacity</span>
                                <span className='font-bold text-slate-900 dark:text-white'>
                                  {activePendingListing.bedrooms} Bed • {activePendingListing.bathrooms} Bath
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-400 text-[10px] block'>Max Guests</span>
                                <span className='font-bold text-slate-900 dark:text-white'>
                                  {activePendingListing.maxGuests || 2} Persons
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className='text-slate-400 text-[10px] block'>Vehicle</span>
                                <span className='font-bold text-slate-900 dark:text-white'>
                                  {activePendingListing.make} {activePendingListing.model}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-400 text-[10px] block'>Driver Included</span>
                                <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                                  {activePendingListing.driverIncluded ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <p className='text-xs font-bold text-slate-700 dark:text-slate-300 mb-1'>Description</p>
                          <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap'>
                            {activePendingListing.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Owner Intelligence Card */}
                        <div className='bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl space-y-2 text-xs'>
                          <h4 className='font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between'>
                            <span>Owner Reputation &amp; History</span>
                            {loadingOwnerIntel && <span className='text-[10px] animate-pulse'>Loading intel...</span>}
                          </h4>
                          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300 text-[11px]'>
                            <div>
                              <span className='text-slate-400 block'>Contact Email</span>
                              <span className='font-bold'>{activePendingListing.ownerEmail}</span>
                            </div>
                            <div>
                              <span className='text-slate-400 block'>Other Listings</span>
                              <span className='font-bold'>
                                {ownerIntel ? ownerIntel.totalListings : '0'} Properties
                              </span>
                            </div>
                            <div>
                              <span className='text-slate-400 block'>Past Rejections</span>
                              <span
                                className={`font-bold ${
                                  (ownerIntel?.rejectionCount || 0) > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {ownerIntel ? ownerIntel.rejectionCount : '0'} Rejections
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Reject Dialog Modal */}
                {rejectDialog.isOpen && (
                  <div
                    className='fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4'
                    onClick={() => setRejectDialog((prev) => ({ ...prev, isOpen: false }))}
                  >
                    <div
                      className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 dark:text-white'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className='font-bold text-base text-rose-600 dark:text-rose-400'>
                        Reject Listing: &quot;{rejectDialog.listing?.title}&quot;
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Select a standardized rejection preset and add an optional explanation note.
                      </p>

                      {rejectDialog.error && (
                        <div className='p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl text-xs'>
                          {rejectDialog.error}
                        </div>
                      )}

                      <form onSubmit={handleSubmitReject} className='space-y-3 text-xs'>
                        <div>
                          <label className='font-semibold block mb-1'>Reason Preset *</label>
                          <select
                            value={rejectDialog.preset}
                            onChange={(e) =>
                              setRejectDialog((prev) => ({ ...prev, preset: e.target.value }))
                            }
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs'
                          >
                            {settings.rejectionPresets.map((p, idx) => (
                              <option key={idx} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className='font-semibold block mb-1'>Optional Note to Owner</label>
                          <textarea
                            rows={3}
                            value={rejectDialog.note}
                            onChange={(e) =>
                              setRejectDialog((prev) => ({ ...prev, note: e.target.value }))
                            }
                            placeholder='Provide additional guidance for the seller...'
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs'
                          />
                        </div>

                        <div className='flex items-center justify-end gap-2 pt-2'>
                          <button
                            type='button'
                            onClick={() =>
                              setRejectDialog((prev) => ({ ...prev, isOpen: false }))
                            }
                            className='px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          >
                            Cancel
                          </button>
                          <button
                            type='submit'
                            disabled={rejectDialog.loading}
                            className='px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50'
                          >
                            {rejectDialog.loading ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Request Changes Modal */}
                {changesDialog.isOpen && (
                  <div
                    className='fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4'
                    onClick={() => setChangesDialog((prev) => ({ ...prev, isOpen: false }))}
                  >
                    <div
                      className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 dark:text-white'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className='font-bold text-base text-amber-500'>
                        Request Changes: &quot;{changesDialog.listing?.title}&quot;
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Send this listing back to the owner with specific instructions for revision.
                      </p>

                      {changesDialog.error && (
                        <div className='p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl text-xs'>
                          {changesDialog.error}
                        </div>
                      )}

                      <form onSubmit={handleSubmitChanges} className='space-y-3 text-xs'>
                        <div>
                          <label className='font-semibold block mb-1'>Required Revisions *</label>
                          <textarea
                            rows={4}
                            required
                            value={changesDialog.notes}
                            onChange={(e) =>
                              setChangesDialog((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder='E.g. Please upload clearer photos of the vehicle interior and specify the daily mileage limit...'
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs'
                          />
                        </div>

                        <div className='flex items-center justify-end gap-2 pt-2'>
                          <button
                            type='button'
                            onClick={() =>
                              setChangesDialog((prev) => ({ ...prev, isOpen: false }))
                            }
                            className='px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          >
                            Cancel
                          </button>
                          <button
                            type='submit'
                            disabled={changesDialog.loading}
                            className='px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-xs disabled:opacity-50'
                          >
                            {changesDialog.loading ? 'Sending...' : 'Send Request to Owner'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB: GUEST HOUSES & APARTMENTS (SEPARATED DIRECTORY) */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'guesthouses' && (
              <AdminGuesthousesTab
                listings={allListingsTable}
                loading={loadingListingsTable}
                onRefresh={() => loadListingsTable(true)}
                onToggleFeatured={handleToggleFeatured}
                onToggleActive={(id, active, title) => {
                  fetch(`/api/admin/listings/${id}/toggle-active`, {
                    method: 'PATCH',
                  })
                    .then(async (r) => {
                      const data = await r.json().catch(() => ({}));
                      if (!r.ok) throw new Error(data.message || `Status update failed (${r.status}).`);
                      return data;
                    })
                    .then(() => {
                      showToast(`Status updated for "${title || id}"`, 'success');
                      loadListingsTable(true);
                    })
                    .catch((err) => showToast(err.message, 'error'));
                }}
                onArchive={handleArchiveListing}
                onRestore={handleRestoreListing}
                onDeleteWithReauth={handleDeleteListingWithReauth}
                onOpenContact={(contact) =>
                  setQuickContactModal({ isOpen: true, contact, customMessage: '' })
                }
                onEditListing={(item) => setEditListingModal({ isOpen: true, listing: item })}
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB: CARS & PRIVATE DRIVERS FLEET (SEPARATED DIRECTORY) */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'cars' && (
              <AdminCarsTab
                listings={allListingsTable}
                loading={loadingListingsTable}
                onRefresh={() => loadListingsTable(true)}
                onToggleFeatured={handleToggleFeatured}
                onToggleActive={(id, active, title) => {
                  fetch(`/api/admin/listings/${id}/toggle-active`, {
                    method: 'PATCH',
                  })
                    .then(async (r) => {
                      const data = await r.json().catch(() => ({}));
                      if (!r.ok) throw new Error(data.message || `Status update failed (${r.status}).`);
                      return data;
                    })
                    .then(() => {
                      showToast(`Fleet status updated for "${title || id}"`, 'success');
                      loadListingsTable(true);
                    })
                    .catch((err) => showToast(err.message, 'error'));
                }}
                onArchive={handleArchiveListing}
                onRestore={handleRestoreListing}
                onDeleteWithReauth={handleDeleteListingWithReauth}
                onOpenContact={(contact) =>
                  setQuickContactModal({ isOpen: true, contact, customMessage: '' })
                }
                onEditListing={(item) => setEditListingModal({ isOpen: true, listing: item })}
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 3: ALL LISTINGS TABLE */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'listings' && (
              <div className='space-y-4'>
                {/* Filter and Search Bar */}
                <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {/* Status filter */}
                    <select
                      value={listingsStatusFilter}
                      onChange={(e) => setListingsStatusFilter(e.target.value)}
                      className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
                    >
                      <option value='all'>All Statuses</option>
                      <option value='approved'>Approved</option>
                      <option value='pending'>Pending</option>
                      <option value='rejected'>Rejected</option>
                      <option value='archived'>Archived</option>
                      <option value='changes_requested'>Changes Requested</option>
                    </select>

                    {/* Type filter */}
                    <select
                      value={listingsTypeFilter}
                      onChange={(e) => setListingsTypeFilter(e.target.value)}
                      className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
                    >
                      <option value='all'>All Types</option>
                      <option value='guesthouse'>Guest Houses</option>
                      <option value='car'>Car Leasing</option>
                    </select>

                    {/* Featured toggle */}
                    <label className='flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-semibold cursor-pointer select-none'>
                      <input
                        type='checkbox'
                        checked={listingsFeaturedOnly}
                        onChange={(e) => setListingsFeaturedOnly(e.target.checked)}
                        className='rounded text-amber-500'
                      />
                      <span>Featured Only</span>
                    </label>

                    {/* City input */}
                    <input
                      type='text'
                      value={listingsCityFilter}
                      onChange={(e) => setListingsCityFilter(e.target.value)}
                      placeholder='Filter by city...'
                      className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-[140px]'
                    />
                  </div>

                  <div className='flex items-center gap-2'>
                    <span className='text-slate-400 font-semibold'>
                      Showing {filteredAllListings.length} listings
                    </span>
                    <button
                      onClick={() => loadListingsTable(true)}
                      className='p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl'
                    >
                      <FaRedo />
                    </button>
                  </div>
                </div>

                {/* Desktop Table & Mobile Cards */}
                <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
                  <div className='overflow-x-auto hidden md:block'>
                    <table className='w-full text-left text-xs'>
                      <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
                        <tr>
                          <th className='py-3.5 px-4'>Thumbnail &amp; Title</th>
                          <th className='py-3.5 px-4'>Type</th>
                          <th className='py-3.5 px-4'>Owner</th>
                          <th className='py-3.5 px-4'>Status</th>
                          <th className='py-3.5 px-4'>Price</th>
                          <th className='py-3.5 px-4'>Views</th>
                          <th className='py-3.5 px-4'>Created</th>
                          <th className='py-3.5 px-4 text-right'>Actions</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
                        {filteredAllListings.map((listing) => (
                          <tr
                            key={listing.id}
                            className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition'
                          >
                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-2.5 min-w-0'>
                                <img
                                  src={
                                    Array.isArray(listing.images) && listing.images.length > 0
                                      ? listing.images[0]
                                      : '/images/airbnb_apartment_living.jpg'
                                  }
                                  alt=''
                                  className='w-10 h-10 rounded-xl object-cover shrink-0'
                                />
                                <div className='min-w-0'>
                                  <span className='font-bold text-slate-900 dark:text-white truncate block max-w-xs'>
                                    {listing.title}
                                  </span>
                                  <span className='text-[10px] text-slate-400'>
                                    {listing.city || 'City Center'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className='py-3 px-4'>
                              <span className='font-semibold text-slate-600 dark:text-slate-300 capitalize'>
                                {listing.type === 'guesthouse' ? 'Guest House' : 'Car Leasing'}
                              </span>
                            </td>

                            <td className='py-3 px-4'>
                              <span className='text-slate-500 dark:text-slate-400 truncate block max-w-[130px]' title={listing.ownerEmail}>
                                {listing.ownerEmail}
                              </span>
                            </td>

                            <td className='py-3 px-4'>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                  listing.status === 'approved'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : listing.status === 'pending'
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                    : listing.status === 'rejected'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {listing.status}
                              </span>
                            </td>

                            <td className='py-3 px-4 font-bold text-slate-900 dark:text-white'>
                              ${listing.price}
                            </td>

                            <td className='py-3 px-4 text-slate-500'>{listing.viewCount || 0}</td>

                            <td className='py-3 px-4 text-slate-400'>
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </td>

                            <td className='py-3 px-4 text-right'>
                              <div className='flex items-center justify-end gap-1.5'>
                                <Link
                                  to={`/listing/${listing.id}`}
                                  target='_blank'
                                  className='p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg'
                                  title='View Live'
                                >
                                  <FaExternalLinkAlt />
                                </Link>

                                <button
                                  type='button'
                                  onClick={() => setEditListingModal({ isOpen: true, listing })}
                                  className='p-1.5 text-slate-400 hover:text-amber-500 rounded-lg transition cursor-pointer'
                                  title='Edit Listing Information'
                                >
                                  <FaEdit />
                                </button>

                                <button
                                  type='button'
                                  onClick={() => handleToggleFeatured(listing)}
                                  className={`p-1.5 rounded-lg transition ${
                                    listing.featured
                                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                      : 'text-slate-400 hover:text-amber-500'
                                  }`}
                                  title={listing.featured ? 'Unfeature' : 'Feature Listing'}
                                >
                                  <FaStar />
                                </button>

                                {listing.status === 'archived' ? (
                                  <button
                                    type='button'
                                    onClick={() => handleRestoreListing(listing)}
                                    className='p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg'
                                    title='Restore to Approved'
                                  >
                                    <FaRedo />
                                  </button>
                                ) : (
                                  <button
                                    type='button'
                                    onClick={() => handleArchiveListing(listing)}
                                    className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg'
                                    title='Archive (Hide)'
                                  >
                                    <FaArchive />
                                  </button>
                                )}

                                <button
                                  type='button'
                                  onClick={() => handleDeleteListingWithReauth(listing)}
                                  className='p-1.5 text-slate-400 hover:text-rose-600 rounded-lg'
                                  title='Delete Permanently'
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className='divide-y divide-slate-100 dark:divide-slate-800 md:hidden'>
                    {filteredAllListings.map((listing) => (
                      <div key={listing.id} className='p-4 space-y-3'>
                        <div className='flex items-center gap-3'>
                          <img
                            src={
                              Array.isArray(listing.images) && listing.images.length > 0
                                ? listing.images[0]
                                : '/images/airbnb_apartment_living.jpg'
                            }
                            alt=''
                            className='w-14 h-14 rounded-2xl object-cover shrink-0'
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='font-bold text-xs text-slate-900 dark:text-white truncate'>
                              {listing.title}
                            </p>
                            <p className='text-[11px] text-slate-500'>
                              ${listing.price} • {listing.city}
                            </p>
                            <span className='px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 uppercase'>
                              {listing.status}
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center justify-between text-xs pt-1'>
                          <button
                            onClick={() => handleToggleFeatured(listing)}
                            className='text-amber-500 font-bold flex items-center gap-1'
                          >
                            <FaStar />
                            <span>{listing.featured ? 'Featured' : 'Feature'}</span>
                          </button>

                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              onClick={() => setEditListingModal({ isOpen: true, listing })}
                              className='px-3 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold cursor-pointer'
                            >
                              Edit
                            </button>
                            <Link
                              to={`/listing/${listing.id}`}
                              className='px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-white font-bold'
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteListingWithReauth(listing)}
                              className='px-3 py-1 bg-rose-50 text-rose-600 rounded-lg font-bold'
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cursor-Pagination Footer */}
                  <div className='p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500'>
                    <span>Page Size: 25 listings per fetch</span>
                    <button
                      disabled={!hasMoreListings || loadingListingsTable}
                      onClick={() => loadListingsTable(false)}
                      className='px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold rounded-xl transition disabled:opacity-40 cursor-pointer'
                    >
                      {loadingListingsTable ? 'Loading...' : 'Load Next 25 Listings →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 4: USERS & HOSTS DIRECTORY (SEPARATE HOSTS VS TRAVELERS) */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'users' && (
              <div className='space-y-4'>
                <AdminUsersTab
                  users={usersList}
                  loading={loadingUsers}
                  currentUser={currentUser}
                  onRefresh={loadUsersList}
                  onSelectUserForDrawer={handleSelectUserForDrawer}
                  onToggleAdminRole={handleToggleAdminRole}
                  onToggleUserDisabled={handleToggleUserDisabled}
                  onDeleteUserWithReauth={handleDeleteUserWithReauth}
                  onExportCSV={() => exportUsersCSV(usersList)}
                  onOpenContact={(contact) =>
                    setQuickContactModal({ isOpen: true, contact, customMessage: '' })
                  }
                />

                {/* User Detail Drawer (Slide-over for deep account inspection) */}
                {selectedUserDetail && (
                  <div
                    className='fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end'
                    onClick={() => setSelectedUserDetail(null)}
                  >
                    <div
                      className='bg-white dark:bg-slate-900 w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto space-y-6 text-slate-900 dark:text-white'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm'>
                            {(selectedUserDetail.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <h3 className='font-bold text-sm truncate max-w-xs'>
                              {selectedUserDetail.displayName || selectedUserDetail.username || selectedUserDetail.email}
                            </h3>
                            <p className='text-[11px] text-slate-400'>
                              {selectedUserDetail.email} • UID: {selectedUserDetail.uid || selectedUserDetail.id}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedUserDetail(null)}
                          className='p-2 text-slate-400 hover:text-slate-600 rounded-xl'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {/* Phone and Contact Actions */}
                      <div className='p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs'>
                        <div className='flex items-center justify-between'>
                          <span className='text-slate-400 font-semibold'>Phone Number:</span>
                          <span className='font-bold text-slate-800 dark:text-slate-100'>
                            {selectedUserDetail.phoneNumber || selectedUserDetail.phone || 'Not provided'}
                          </span>
                        </div>
                        {(selectedUserDetail.phoneNumber || selectedUserDetail.phone) && (
                          <div className='flex items-center gap-2 pt-2'>
                            <a
                              href={`tel:${selectedUserDetail.phoneNumber || selectedUserDetail.phone}`}
                              className='flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl text-center font-bold flex items-center justify-center gap-1.5'
                            >
                              <FaPhoneAlt className='text-emerald-500' />
                              <span>Direct Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${(selectedUserDetail.phoneNumber || selectedUserDetail.phone).replace(/[^\d]/g, '')}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-center font-bold flex items-center justify-center gap-1.5'
                            >
                              <FaWhatsapp />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* User Stats Card */}
                      <div className='grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs'>
                        <div>
                          <span className='text-slate-400 text-[10px] block'>Account Role</span>
                          <span className='font-bold capitalize'>{selectedUserDetail.role || selectedUserDetail.accountType || 'user'}</span>
                        </div>
                        <div>
                          <span className='text-slate-400 text-[10px] block'>Listings Owned</span>
                          <span className='font-bold'>{selectedUserDetail.listingsCount || userDetailIntel?.totalListings || 0}</span>
                        </div>
                        <div>
                          <span className='text-slate-400 text-[10px] block'>Status</span>
                          <span className='font-bold text-emerald-600'>
                            {selectedUserDetail.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Owner's Listings List */}
                      <div>
                        <h4 className='font-bold text-xs uppercase tracking-wider text-slate-400 mb-2'>
                          Properties &amp; Vehicles Owned
                        </h4>
                        {loadingUserDetail ? (
                          <div className='p-6 text-center text-xs text-slate-400 animate-pulse'>
                            Loading owner records...
                          </div>
                        ) : userDetailIntel?.otherListings?.length === 0 ? (
                          <p className='text-xs text-slate-400 py-3'>No listings posted yet.</p>
                        ) : (
                          <div className='space-y-2 max-h-60 overflow-y-auto'>
                            {userDetailIntel?.otherListings?.map((l) => (
                              <div
                                key={l.id}
                                className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs'
                              >
                                <div className='min-w-0 flex-1 pr-2'>
                                  <p className='font-bold truncate'>{l.title}</p>
                                  <p className='text-[10px] text-slate-400'>
                                    ${l.price} • {l.city}
                                  </p>
                                </div>
                                <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700'>
                                  {l.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rejection History */}
                      <div>
                        <h4 className='font-bold text-xs uppercase tracking-wider text-slate-400 mb-2'>
                          Moderation &amp; Rejection History
                        </h4>
                        {userDetailIntel?.rejectionHistory?.length === 0 ? (
                          <p className='text-xs text-slate-400 py-2'>Clean track record: 0 rejections.</p>
                        ) : (
                          <div className='space-y-2'>
                            {userDetailIntel?.rejectionHistory?.map((r, i) => (
                              <div
                                key={i}
                                className='p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1'
                              >
                                <p className='font-bold text-rose-800 dark:text-rose-300'>{r.title}</p>
                                <p className='text-rose-700 dark:text-rose-400 text-[11px]'>{r.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Drawer Actions */}
                      <div className='pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => handleToggleUserDisabled(selectedUserDetail)}
                          className='flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold'
                        >
                          {selectedUserDetail.disabled ? 'Enable Account' : 'Disable Account'}
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDeleteUserWithReauth(selectedUserDetail)}
                          className='px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold'
                        >
                          Delete User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB: BOOKINGS & CONCIERGE LEADS */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'enquiries' && (
              <AdminEnquiriesTab
                enquiries={enquiriesList}
                loading={loadingEnquiries}
                onRefresh={loadEnquiriesList}
                onUpdateStatus={handleUpdateEnquiryStatus}
                onOpenContact={(contact) =>
                  setQuickContactModal({ isOpen: true, contact, customMessage: '' })
                }
              />
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 5: REPORTS QUEUE */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'reports' && (
              <div className='space-y-4'>
                <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs'>
                  <div>
                    <h3 className='font-bold text-slate-900 dark:text-white'>
                      Community Reports Queue ({reportsQueue.length})
                    </h3>
                    <p className='text-slate-400 text-[11px]'>
                      Listings flagged by community members. Automatically warns at 3+ reports.
                    </p>
                  </div>
                  <button onClick={loadReportsQueue} className='p-2 text-slate-500 hover:text-slate-900'>
                    <FaRedo />
                  </button>
                </div>

                {reportsQueue.length === 0 ? (
                  <div className='p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400'>
                    No reported listings in queue. Community integrity healthy!
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {reportsQueue.map((report) => (
                      <div
                        key={report.id}
                        className='bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs'
                      >
                        <div className='space-y-1.5 min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <span className='px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white'>
                              Flagged Listing
                            </span>
                            <span className='text-slate-400 text-[11px]'>
                              Report ID: {report.id} • {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className='font-bold text-slate-900 dark:text-white text-sm'>
                            Target Listing ID: {report.listingId}
                          </h4>
                          <p className='text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl'>
                            <span className='font-semibold text-slate-400'>Reason reported:</span>{' '}
                            {report.reason || 'Suspected policy violation or inaccurate details.'}
                          </p>
                        </div>

                        <div className='flex items-center gap-2 shrink-0'>
                          <Link
                            to={`/listing/${report.listingId}`}
                            target='_blank'
                            className='px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-800 dark:text-slate-100'
                          >
                            Inspect Listing
                          </Link>
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            className='px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold'
                          >
                            Dismiss Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 6: IMMUTABLE AUDIT LOG */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'audit' && (
              <div className='space-y-4'>
                <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs'>
                  <div>
                    <h3 className='font-bold text-slate-900 dark:text-white'>
                      Read-Only Immutable Audit Trail ({filteredAuditLogs.length})
                    </h3>
                    <p className='text-slate-400 text-[11px]'>
                      Enforced by Firestore security rules: Update and Delete operations strictly forbidden.
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
                    >
                      <option value='all'>All Actions</option>
                      <option value='APPROVE_LISTING'>Approvals</option>
                      <option value='REJECT_LISTING'>Rejections</option>
                      <option value='REQUEST_CHANGES'>Change Requests</option>
                      <option value='DISABLE_USER'>Account Suspensions</option>
                      <option value='PROMOTE_ADMIN'>Admin Role Changes</option>
                      <option value='UPDATE_SETTINGS'>Settings Modifications</option>
                    </select>
                    <button onClick={loadAuditLogsTable} className='p-2 text-slate-500 hover:text-slate-900'>
                      <FaRedo />
                    </button>
                  </div>
                </div>

                <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                      <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
                        <tr>
                          <th className='py-3.5 px-4'>Action</th>
                          <th className='py-3.5 px-4'>Admin Actor</th>
                          <th className='py-3.5 px-4'>Target Identifier</th>
                          <th className='py-3.5 px-4'>Details</th>
                          <th className='py-3.5 px-4 text-right'>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
                        {filteredAuditLogs.map((log) => (
                          <tr key={log.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50'>
                            <td className='py-3 px-4 font-bold text-amber-500'>
                              {log.action}
                            </td>
                            <td className='py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                              {log.adminId}
                            </td>
                            <td className='py-3 px-4 font-mono text-[11px] text-slate-500'>
                              {log.targetId}
                            </td>
                            <td className='py-3 px-4 text-slate-500 truncate max-w-xs'>
                              {log.reason || log.details?.notes || JSON.stringify(log.details || {})}
                            </td>
                            <td className='py-3 px-4 text-right text-slate-400 whitespace-nowrap'>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 7: SETTINGS & POLICIES */}
            {/* --------------------------------------------------------- */}
            {activeTab === 'settings' && (
              <div className='space-y-6'>
                <form onSubmit={handleSaveSettings} className='space-y-6'>
                  {/* Top Header */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='font-bold text-slate-900 dark:text-white text-base'>
                        Marketplace Policies &amp; Governance
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Configure moderation rules, admin authority list, and rejection presets.
                      </p>
                    </div>

                    <button
                      type='submit'
                      disabled={savingSettings}
                      className='px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer'
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings to Firestore'}
                    </button>
                  </div>

                  {/* Settings Grid */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Admin Authority List */}
                    <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4'>
                      <div className='flex items-center gap-2'>
                        <FaUserShield className='text-amber-500' />
                        <h4 className='font-bold text-sm text-slate-900 dark:text-white'>
                          Designated Administrators
                        </h4>
                      </div>

                      <div className='flex items-center gap-2'>
                        <input
                          type='email'
                          value={newAdminEmailInput}
                          onChange={(e) => setNewAdminEmailInput(e.target.value)}
                          placeholder='new-admin@example.com'
                          className='flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white'
                        />
                        <button
                          type='button'
                          onClick={handleAddAdminEmail}
                          className='px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl'
                        >
                          Add
                        </button>
                      </div>

                      <div className='space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800'>
                        {settings.adminEmails.map((email, i) => (
                          <div key={i} className='pt-2 flex items-center justify-between text-xs'>
                            <span className='font-semibold'>{email}</span>
                            <button
                              type='button'
                              onClick={() => handleRemoveAdminEmail(email)}
                              className='text-rose-500 hover:underline text-[11px]'
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason Presets */}
                    <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4'>
                      <div className='flex items-center gap-2'>
                        <FaTimesCircle className='text-rose-500' />
                        <h4 className='font-bold text-sm text-slate-900 dark:text-white'>
                          Rejection Reason Presets
                        </h4>
                      </div>

                      <div className='flex items-center gap-2'>
                        <input
                          type='text'
                          value={newPresetInput}
                          onChange={(e) => setNewPresetInput(e.target.value)}
                          placeholder='Add reason preset...'
                          className='flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white'
                        />
                        <button
                          type='button'
                          onClick={handleAddPreset}
                          className='px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl'
                        >
                          Add
                        </button>
                      </div>

                      <div className='space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800'>
                        {settings.rejectionPresets.map((preset, i) => (
                          <div key={i} className='pt-2 flex items-center justify-between text-xs'>
                            <span className='font-medium text-slate-700 dark:text-slate-300'>{preset}</span>
                            <button
                              type='button'
                              onClick={() => handleRemovePreset(preset)}
                              className='text-rose-500 hover:underline text-[11px]'
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Marketplace Rules & Limits */}
                    <div className='md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-5'>
                      <h4 className='font-bold text-sm text-slate-900 dark:text-white'>
                        System Thresholds &amp; Verification Flags
                      </h4>

                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs'>
                        <div>
                          <label className='block font-semibold mb-1 text-slate-700 dark:text-slate-300'>
                            Max Pending Listings Per User
                          </label>
                          <input
                            type='number'
                            min={1}
                            max={50}
                            value={settings.maxPendingPerUser}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                maxPendingPerUser: Number(e.target.value),
                              }))
                            }
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl'
                          />
                        </div>

                        <div>
                          <label className='block font-semibold mb-1 text-slate-700 dark:text-slate-300'>
                            Moderation SLA Warning (Hours)
                          </label>
                          <input
                            type='number'
                            min={1}
                            max={168}
                            value={settings.slaHoursWarning}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                slaHoursWarning: Number(e.target.value),
                              }))
                            }
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl'
                          />
                        </div>

                        <div>
                          <label className='block font-semibold mb-1 text-slate-700 dark:text-slate-300'>
                            Report Auto-Flag Threshold
                          </label>
                          <input
                            type='number'
                            min={1}
                            max={20}
                            value={settings.reportThreshold}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                reportThreshold: Number(e.target.value),
                              }))
                            }
                            className='w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl'
                          />
                        </div>
                      </div>

                      <div className='pt-2'>
                        <label className='flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200'>
                          <input
                            type='checkbox'
                            checked={settings.requireEmailVerification}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                requireEmailVerification: e.target.checked,
                              }))
                            }
                            className='rounded text-amber-500 focus:ring-amber-400'
                          />
                          <span>Require Email Verification to submit new listings on Marketplace</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

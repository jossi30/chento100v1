import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch as fetch } from '../utils/apiFetch';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ListingModal from '../components/ListingModal';
import CreateListingModal from '../components/CreateListingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import QuickContactModal from '../components/QuickContactModal';
import EditListingModal from '../components/EditListingModal';
import {
  FaHome,
  FaCar,
  FaUsers,
  FaClock,
  FaListUl,
  FaConciergeBell,
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaFileCsv,
  FaSearch,
  FaRedo,
  FaCheck,
  FaTimes,
  FaStar,
  FaUserShield,
  FaUserCheck,
  FaBan,
  FaTrashAlt,
  FaCopy,
  FaBed,
  FaBath,
  FaGasPump,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserTie,
} from 'react-icons/fa';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'guesthouses' | 'cars' | 'users' | 'enquiries' | 'pending' | 'all'
  const [activeTab, setActiveTab] = useState('guesthouses');

  // Pending listings state
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);
  const [availabilityActionId, setAvailabilityActionId] = useState(null);

  // All listings state (approved + pending + rejected)
  const [allListings, setAllListings] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState(null);

  // Users & Hosts state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'hosts' | 'users' | 'admins'
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'verified' | 'disabled'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Enquiries & Leads state
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('all');
  const [enquirySearchQuery, setEnquirySearchQuery] = useState('');

  // Sub-filters: Guesthouses
  const [ghStatusFilter, setGhStatusFilter] = useState('all');
  const [ghBedroomFilter, setGhBedroomFilter] = useState('all');
  const [ghSearchQuery, setGhSearchQuery] = useState('');

  // Sub-filters: Cars
  const [carStatusFilter, setCarStatusFilter] = useState('all');
  const [carDriverFilter, setCarDriverFilter] = useState('all');
  const [carTransFilter, setCarTransFilter] = useState('all');
  const [carSearchQuery, setCarSearchQuery] = useState('');

  // Sub-filters: All Directory
  const [allStatusFilter, setAllStatusFilter] = useState('all');
  const [allActiveFilter, setAllActiveFilter] = useState('all');
  const [allSearchQuery, setAllSearchQuery] = useState('');

  // Modals & Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [inspectListing, setInspectListing] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Quick Concierge Direct Contact modal
  const [quickContact, setQuickContact] = useState({ isOpen: false, contact: null });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const handleSignOut = async () => {
    await logout();
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    navigate(loginPath, { replace: true });
  };

  // Fetch Pending Listings
  const fetchPendingListings = useCallback(async (isSilent = false) => {
    if (!isSilent) setPendingLoading(true);
    setPendingError(null);
    try {
      const res = await fetch('/api/admin/listings/pending', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch pending listings (${res.status})`);
      }
      const data = await res.json();
      setPendingListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch pending listings error:', err);
      setPendingError(err.message || 'Unable to load pending listings.');
    } finally {
      if (!isSilent) setPendingLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch All Listings
  const fetchAllListings = useCallback(async (isSilent = false) => {
    if (!isSilent) setAllLoading(true);
    setAllError(null);
    try {
      let res = await fetch('/api/admin/listings/all', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        res = await fetch('/api/admin/listings', {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch all listings (${res.status})`);
      }
      const data = await res.json();
      setAllListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch all listings error:', err);
      setAllError(err.message || 'Unable to load all listings.');
    } finally {
      if (!isSilent) setAllLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch Users & Hosts
  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setUsersLoading(true);
    setUsersError(null);
    try {
      let res = await fetch('/api/admin/users', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to load users (${res.status})`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users error:', err);
      setUsersError(err.message || 'Unable to load user directory.');
    } finally {
      if (!isSilent) setUsersLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch Enquiries & Leads
  const fetchEnquiries = useCallback(async (isSilent = false) => {
    if (!isSilent) setEnquiriesLoading(true);
    try {
      const res = await fetch('/api/admin/enquiries', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Enquiries notice:', err.message);
    } finally {
      if (!isSilent) setEnquiriesLoading(false);
    }
  }, [getAuthHeaders]);

  // Initial load
  useEffect(() => {
    fetchPendingListings();
    fetchAllListings();
    fetchUsers();
    fetchEnquiries();
  }, [fetchPendingListings, fetchAllListings, fetchUsers, fetchEnquiries]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingListings(true);
      fetchAllListings(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingListings, fetchAllListings]);

  // Handle Approve
  const handleApprove = async (id, title) => {
    setActionLoading({ id, action: 'approve' });
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to approve listing (${res.status})`);
      }
      showToast(`Listing "${title || id}" approved successfully!`, 'success');
      setPendingListings((prev) => prev.filter((item) => item._id !== id));
      setAllListings((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: 'approved', isApproved: true } : item))
      );
      if (inspectListing && inspectListing._id === id) {
        setInspectListing((prev) => ({ ...prev, status: 'approved', isApproved: true }));
      }
      fetchPendingListings(true);
      fetchAllListings(true);
    } catch (err) {
      console.error('Approve listing error:', err);
      showToast(err.message || 'Failed to approve listing.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleReject = async (id, title) => {
    setActionLoading({ id, action: 'reject' });
    try {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to reject listing (${res.status})`);
      }
      showToast(`Listing "${title || id}" rejected.`, 'success');
      setPendingListings((prev) => prev.filter((item) => item._id !== id));
      setAllListings((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: 'rejected', isApproved: false } : item))
      );
      if (inspectListing && inspectListing._id === id) {
        setInspectListing((prev) => ({ ...prev, status: 'rejected', isApproved: false }));
      }
      fetchPendingListings(true);
      fetchAllListings(true);
    } catch (err) {
      console.error('Reject listing error:', err);
      showToast(err.message || 'Failed to reject listing.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Toggle Active
  const handleToggleActive = async (id, currentActive, title) => {
    setToggleLoadingId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/toggle-active`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to toggle active status (${res.status})`);
      }
      const newActive = data.active !== undefined ? data.active : !currentActive;
      showToast(`Listing "${title || id}" is now ${newActive ? 'Active' : 'Inactive'}.`, 'success');
      setAllListings((prev) =>
        prev.map((item) => (item._id === id ? { ...item, active: newActive, isActive: newActive } : item))
      );
      setPendingListings((prev) =>
        prev.map((item) => (item._id === id ? { ...item, active: newActive, isActive: newActive } : item))
      );
      if (inspectListing && inspectListing._id === id) {
        setInspectListing((prev) => ({ ...prev, active: newActive, isActive: newActive }));
      }
    } catch (err) {
      console.error('Toggle active error:', err);
      showToast(err.message || 'Failed to toggle active status.', 'error');
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingListing) return;
    const id = deletingListing._id || deletingListing.id;
    const title = deletingListing.title || deletingListing.name || 'Listing';
    try {
      setIsDeleting(true);
      let res = await fetch(`/api/admin/listings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        res = await fetch(`/api/listing/delete/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      if (!res.ok) {
        res = await fetch(`/api/listing/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to delete listing (${res.status})`);
      }
      showToast(`Listing "${title}" permanently deleted.`, 'success');
      setAllListings((prev) => prev.filter((item) => (item._id || item.id) !== id));
      setPendingListings((prev) => prev.filter((item) => (item._id || item.id) !== id));
      if (inspectListing && (inspectListing._id || inspectListing.id) === id) {
        setInspectListing(null);
      }
      setDeletingListing(null);
    } catch (err) {
      console.error('Delete listing error:', err);
      showToast(err.message || 'Failed to delete listing.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Listing Created
  const handleListingCreated = (newListing) => {
    showToast(`Listing "${newListing.title || newListing.name}" created successfully!`, 'success');
    setAllListings((prev) => [newListing, ...prev]);
    if (newListing.status === 'pending' || newListing.isApproved === false) {
      setPendingListings((prev) => [newListing, ...prev]);
    }
    fetchAllListings(true);
    fetchPendingListings(true);
  };

  // Handle Listing Updated
  const handleListingUpdated = (updatedListing) => {
    const id = updatedListing._id || updatedListing.id;
    showToast(`Listing "${updatedListing.title || updatedListing.name}" updated successfully!`, 'success');
    setAllListings((prev) =>
      prev.map((l) => ((l._id || l.id) === id ? { ...l, ...updatedListing } : l))
    );
    setPendingListings((prev) =>
      prev.map((l) => ((l._id || l.id) === id ? { ...l, ...updatedListing } : l))
    );
    if (inspectListing && (inspectListing._id || inspectListing.id) === id) {
      setInspectListing((prev) => ({ ...prev, ...updatedListing }));
    }
    fetchAllListings(true);
  };

  // Handle Update Enquiry Status
  const handleUpdateEnquiryStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
        showToast(`Booking inquiry marked as "${newStatus}"`, 'success');
      }
    } catch (err) {
      showToast('Error updating enquiry: ' + err.message, 'error');
    }
  };

  // Handle Toggle User Disabled
  const handleToggleUserDisabled = async (targetUser) => {
    const userId = targetUser.uid || targetUser._id || targetUser.id;
    const currentDisabled = Boolean(targetUser.disabled);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-disabled`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === userId || u._id === userId ? { ...u, disabled: !currentDisabled } : u))
        );
        showToast(`User account ${currentDisabled ? 'activated' : 'suspended'}.`, 'success');
      }
    } catch (err) {
      showToast('Status update failed: ' + err.message, 'error');
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export for Users
  const exportUsersCSV = (userList) => {
    if (!userList || userList.length === 0) {
      showToast('No users available to export', 'error');
      return;
    }
    const headers = ['Full Name', 'Email', 'Phone Number', 'Account Role', 'Listings Count', 'Verified', 'Created At'];
    const rows = userList.map((u) => [
      `"${(u.displayName || u.username || u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phoneNumber || u.phone || '').replace(/"/g, '""')}"`,
      `"${(u.accountType || u.role || 'user').replace(/"/g, '""')}"`,
      u.listingsCount || 0,
      u.verified || u.emailVerified ? 'Yes' : 'No',
      `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chento100_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported users directory to CSV!', 'success');
  };

  // -------------------------------------------------------------
  // Data Filtering
  // -------------------------------------------------------------

  // Separated Guesthouses
  const guesthouseListings = useMemo(() => {
    return allListings.filter(
      (item) => item.type === 'guesthouse' || item.category === 'guesthouse' || item.type === 'rent'
    );
  }, [allListings]);

  const filteredGuesthouses = useMemo(() => {
    return guesthouseListings.filter((item) => {
      if (ghStatusFilter !== 'all' && (item.status || 'pending') !== ghStatusFilter) return false;
      if (ghBedroomFilter !== 'all' && Number(item.bedrooms || 0) < Number(ghBedroomFilter)) return false;
      if (ghSearchQuery.trim()) {
        const q = ghSearchQuery.toLowerCase().trim();
        const title = String(item?.title || item?.name || '').toLowerCase();
        const loc = String(item?.location || item?.address || item?.city || '').toLowerCase();
        const host = String(item?.ownerName || item?.ownerEmail || '').toLowerCase();
        if (!title.includes(q) && !loc.includes(q) && !host.includes(q)) return false;
      }
      return true;
    });
  }, [guesthouseListings, ghStatusFilter, ghBedroomFilter, ghSearchQuery]);

  // Separated Cars & Fleet
  const carListings = useMemo(() => {
    return allListings.filter(
      (item) => item.type === 'car' || item.category === 'car_service' || item.category === 'car' || item.type === 'sale'
    );
  }, [allListings]);

  const filteredCars = useMemo(() => {
    return carListings.filter((item) => {
      if (carStatusFilter !== 'all' && (item.status || 'pending') !== carStatusFilter) return false;
      if (carDriverFilter === 'yes' && item.driverIncluded === false) return false;
      if (carDriverFilter === 'no' && item.driverIncluded !== false) return false;
      if (carTransFilter !== 'all' && item.transmission?.toLowerCase() !== carTransFilter.toLowerCase()) return false;
      if (carSearchQuery.trim()) {
        const q = carSearchQuery.toLowerCase().trim();
        const title = String(item?.title || item?.name || '').toLowerCase();
        const make = String(item?.make || item?.model || '').toLowerCase();
        const driver = String(item?.driverName || item?.driverContact || '').toLowerCase();
        if (!title.includes(q) && !make.includes(q) && !driver.includes(q)) return false;
      }
      return true;
    });
  }, [carListings, carStatusFilter, carDriverFilter, carTransFilter, carSearchQuery]);

  // Users & Hosts categorized
  const { allCount, hostsCount, guestsCount, verifiedCount } = useMemo(() => {
    let hosts = 0;
    let guests = 0;
    let verified = 0;
    users.forEach((u) => {
      const isHost = u.accountType === 'host' || u.role === 'host' || (u.listingsCount && u.listingsCount > 0);
      if (isHost) hosts++;
      else if (!u.isAdmin) guests++;
      if (u.verified || u.emailVerified) verified++;
    });
    return { allCount: users.length, hostsCount: hosts, guestsCount: guests, verifiedCount: verified };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isHost = u.accountType === 'host' || u.role === 'host' || (u.listingsCount && u.listingsCount > 0);
      if (userRoleFilter === 'hosts' && !isHost) return false;
      if (userRoleFilter === 'users' && (isHost || u.isAdmin)) return false;
      if (userRoleFilter === 'admins' && !u.isAdmin && u.role !== 'admin') return false;

      if (userStatusFilter === 'verified' && !u.verified && !u.emailVerified) return false;
      if (userStatusFilter === 'disabled' && !u.disabled) return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const name = String(u.displayName || u.username || u.name || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const phone = String(u.phoneNumber || u.phone || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [users, userRoleFilter, userStatusFilter, userSearchQuery]);

  // Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (enquiryStatusFilter !== 'all' && e.status !== enquiryStatusFilter) return false;
      if (enquirySearchQuery.trim()) {
        const q = enquirySearchQuery.toLowerCase().trim();
        const name = String(e.guestName || '').toLowerCase();
        const email = String(e.guestEmail || '').toLowerCase();
        const title = String(e.listingTitle || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !title.includes(q)) return false;
      }
      return true;
    });
  }, [enquiries, enquiryStatusFilter, enquirySearchQuery]);

  const availabilityRequests = useMemo(
    () => allListings.filter((listing) => listing.availabilityRequest?.status === 'pending'),
    [allListings]
  );

  // All unified listings
  const filteredAllListings = useMemo(() => {
    return allListings.filter((item) => {
      if (allStatusFilter !== 'all' && (item.status || 'pending') !== allStatusFilter) return false;
      if (allActiveFilter === 'active' && item.active === false) return false;
      if (allActiveFilter === 'inactive' && item.active !== false) return false;
      if (allSearchQuery.trim()) {
        const q = allSearchQuery.toLowerCase().trim();
        const title = String(item?.title || item?.name || '').toLowerCase();
        const loc = String(item?.location || item?.address || item?.city || '').toLowerCase();
        if (!title.includes(q) && !loc.includes(q)) return false;
      }
      return true;
    });
  }, [allListings, allStatusFilter, allActiveFilter, allSearchQuery]);

  const handleConfirmUnavailable = async (listing) => {
    const request = listing.availabilityRequest;
    if (!request || request.status !== 'pending') return;
    const id = listing._id || listing.id;
    setAvailabilityActionId(id);
    try {
      const resolvedAt = new Date().toISOString();
      const response = await fetch(`/api/admin/listings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
            resolvedBy: user.uid || user.id || user._id,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Could not confirm request (${response.status}).`);
      setAllListings((previous) => previous.map((item) => (item._id || item.id) === id ? data : item));
      showToast(`"${listing.title || listing.name || 'Listing'}" is now unavailable.`);
    } catch (error) {
      showToast(error.message || 'Could not confirm the availability request.');
    } finally {
      setAvailabilityActionId(null);
    }
  };

  return (
    <div className='min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800'>
      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Listing Inspection Modal */}
      <ListingModal
        listing={inspectListing}
        onClose={() => setInspectListing(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onToggleActive={handleToggleActive}
        onDelete={(item) => setDeletingListing(item)}
        onEdit={(item) => setEditingListing(item)}
        actionLoading={actionLoading}
        isTogglingActive={inspectListing && toggleLoadingId === inspectListing._id}
      />

      {/* Edit Listing Modal */}
      <EditListingModal
        isOpen={!!editingListing}
        listing={editingListing}
        onClose={() => setEditingListing(null)}
        onSaved={handleListingUpdated}
        authHeaders={getAuthHeaders}
      />

      {/* Add New Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleListingCreated}
        authHeaders={getAuthHeaders}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingListing}
        listing={deletingListing}
        onClose={() => setDeletingListing(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      {/* Quick Concierge Contact Modal (WhatsApp, Phone, Email) */}
      <QuickContactModal
        isOpen={quickContact.isOpen}
        contact={quickContact.contact}
        onClose={() => setQuickContact({ isOpen: false, contact: null })}
      />

      {/* Top Navbar */}
      <header className='bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-20 shadow-xs'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-lg bg-slate-900 text-amber-400 font-bold text-sm flex items-center justify-center shadow-xs'>
              C
            </div>
            <div>
              <span className='font-bold text-slate-900 text-base tracking-tight'>
                Chento100
              </span>
              <span className='ml-2 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 rounded border border-slate-200'>
                Admin Console
              </span>
            </div>
          </div>

          <div className='flex items-center gap-3 sm:gap-4'>
            <button
              type='button'
              id='admin-add-listing-header-btn'
              onClick={() => setIsCreateModalOpen(true)}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors'
            >
              <span>+ Add Listing</span>
            </button>

            {user && (
              <div className='flex items-center gap-2.5 text-sm'>
                <div className='w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center border border-slate-200'>
                  {(user.username || user.email || 'A')[0].toUpperCase()}
                </div>
                <div className='hidden sm:flex flex-col text-left'>
                  <span className='font-semibold text-slate-800 text-xs'>
                    {user.username || 'Admin User'}
                  </span>
                  <span className='text-slate-500 text-[11px]'>{user.email}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              id='admin-signout-btn'
              className='text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors'
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6'>
        {/* Navigation Tabs Header */}
        <div className='bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-1.5'>
            {/* GUEST HOUSES TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('guesthouses')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'guesthouses'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaHome />
              <span>Guest Houses</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'guesthouses'
                    ? 'bg-emerald-900 text-emerald-100'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {guesthouseListings.length}
              </span>
            </button>

            {/* CARS & DRIVERS TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('cars')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'cars'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaCar />
              <span>Cars &amp; Drivers</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'cars'
                    ? 'bg-sky-900 text-sky-100'
                    : 'bg-sky-50 text-sky-800'
                }`}
              >
                {carListings.length}
              </span>
            </button>

            {/* USERS & HOSTS TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaUsers />
              <span>Users &amp; Hosts</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'users'
                    ? 'bg-purple-900 text-purple-100'
                    : 'bg-purple-50 text-purple-800'
                }`}
              >
                {users.length}
              </span>
            </button>

            {/* BOOKINGS & LEADS TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('enquiries')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaConciergeBell />
              <span>Bookings &amp; Leads</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'enquiries'
                    ? 'bg-amber-800 text-amber-100'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {enquiries.length}
              </span>
            </button>

            {/* PENDING REVIEW TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('pending')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaClock />
              <span>Pending Review</span>
              {pendingListings.length > 0 && (
                <span className='px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse'>
                  {pendingListings.length}
                </span>
              )}
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('availabilityRequests')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'availabilityRequests'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaExclamationTriangle />
              <span>Unavailable Requests</span>
              {availabilityRequests.length > 0 && (
                <span className='px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white'>
                  {availabilityRequests.length}
                </span>
              )}
            </button>

            {/* ALL DIRECTORY TAB */}
            <button
              type='button'
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FaListUl />
              <span>All Inventory</span>
              <span className='px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold'>
                {allListings.length}
              </span>
            </button>
          </div>

          <div className='flex items-center gap-2 px-3 text-xs text-slate-500'>
            <span>Platform Moderation:</span>
            <span className='font-bold text-emerald-600 flex items-center gap-1'>
              <FaCheckCircle className='text-[10px]' /> Online
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB: GUEST HOUSES SEPARATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'guesthouses' && (
          <div className='space-y-6'>
            {/* Header Card */}
            <div className='bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-1.5'>
                  <FaHome /> Guest House Rentals Management
                </div>
                <h1 className='text-2xl font-black'>Boutique Guest Houses &amp; Apartments</h1>
                <p className='text-xs text-slate-300 mt-1 max-w-xl'>
                  Direct oversight of short-stay villas, private apartments, and suites. Verify host ownership, inspect rooms, and adjust availability.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setIsCreateModalOpen(true)}
                  className='px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs'
                >
                  + Add Guest House
                </button>
                <button
                  onClick={() => fetchAllListings(false)}
                  disabled={allLoading}
                  className='p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs'
                  title='Refresh'
                >
                  <FaRedo className={allLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Total Properties</span>
                <span className='text-xl font-black text-slate-900 block mt-1'>{guesthouseListings.length}</span>
                <span className='text-[10px] text-emerald-600 font-bold'>Dedicated accommodations</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Active / Published</span>
                <span className='text-xl font-black text-emerald-600 block mt-1'>
                  {guesthouseListings.filter((i) => i.active !== false).length}
                </span>
                <span className='text-[10px] text-slate-400'>Available for booking</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Pending Review</span>
                <span className='text-xl font-black text-amber-600 block mt-1'>
                  {guesthouseListings.filter((i) => i.status === 'pending' || !i.isApproved).length}
                </span>
                <span className='text-[10px] text-slate-400'>Awaiting approval</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Average Rate / Night</span>
                <span className='text-xl font-black text-slate-900 block mt-1'>
                  $
                  {guesthouseListings.length > 0
                    ? Math.round(
                        guesthouseListings.reduce((acc, curr) => acc + Number(curr.price || curr.regularPrice || 0), 0) /
                          guesthouseListings.length
                      )
                    : 120}
                </span>
                <span className='text-[10px] text-slate-400'>Market baseline</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs'>
              <div className='flex flex-wrap items-center gap-2'>
                <select
                  value={ghStatusFilter}
                  onChange={(e) => setGhStatusFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Statuses</option>
                  <option value='approved'>Approved</option>
                  <option value='pending'>Pending</option>
                  <option value='rejected'>Rejected</option>
                </select>

                <select
                  value={ghBedroomFilter}
                  onChange={(e) => setGhBedroomFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Bedrooms</option>
                  <option value='1'>1+ Bedroom</option>
                  <option value='2'>2+ Bedrooms</option>
                  <option value='3'>3+ Bedrooms</option>
                </select>
              </div>

              <div className='relative flex-1 max-w-sm'>
                <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={ghSearchQuery}
                  onChange={(e) => setGhSearchQuery(e.target.value)}
                  placeholder='Search by property title, city, or host...'
                  className='w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs'
                />
              </div>
            </div>

            {/* Guesthouses Grid / Table */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs'>
              {filteredGuesthouses.length === 0 ? (
                <div className='p-12 text-center text-xs text-slate-400'>
                  No guest house listings matched your filters.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-4'>Property</th>
                        <th className='py-3.5 px-4'>Location</th>
                        <th className='py-3.5 px-4'>Specs</th>
                        <th className='py-3.5 px-4'>Nightly Rate</th>
                        <th className='py-3.5 px-4'>Host Contact</th>
                        <th className='py-3.5 px-4'>Status</th>
                        <th className='py-3.5 px-4 text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {filteredGuesthouses.map((item) => {
                        const title = item.title || item.name || 'Untitled Property';
                        const price = item.price || item.regularPrice || 0;
                        const thumb =
                          item.images?.[0] ||
                          item.imageUrls?.[0] ||
                          '/images/airbnb_apartment_living.jpg';
                        const isActive = item.active !== false && item.isActive !== false;
                        const hostPhone = item.contactPhone || item.ownerPhone || '';
                        const hostName = item.ownerName || item.ownerEmail || 'Host';

                        return (
                          <tr key={item._id || item.id} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-3'>
                                <img
                                  src={thumb}
                                  alt={title}
                                  className='w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer'
                                  onClick={() => setInspectListing(item)}
                                />
                                <div>
                                  <button
                                    onClick={() => setInspectListing(item)}
                                    className='font-bold text-slate-900 hover:text-emerald-700 text-left line-clamp-1 block'
                                  >
                                    {title}
                                  </button>
                                  <span className='text-[10px] text-slate-400'>ID: {(item._id || item.id).slice(0, 10)}</span>
                                </div>
                              </div>
                            </td>

                            <td className='py-3 px-4 text-slate-600 font-medium'>
                              {item.city || item.location || item.address || '—'}
                            </td>

                            <td className='py-3 px-4 text-slate-600'>
                              <div className='flex items-center gap-2'>
                                <span className='inline-flex items-center gap-1'>
                                  <FaBed className='text-emerald-600 text-[10px]' /> {item.bedrooms || 1} Bed
                                </span>
                                <span className='inline-flex items-center gap-1'>
                                  <FaBath className='text-sky-600 text-[10px]' /> {item.bathrooms || 1} Bath
                                </span>
                              </div>
                            </td>

                            <td className='py-3 px-4 font-bold text-slate-900'>
                              ${price} <span className='text-[10px] font-normal text-slate-400'>/night</span>
                            </td>

                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() =>
                                    setQuickContact({
                                      isOpen: true,
                                      contact: {
                                        name: hostName,
                                        phone: hostPhone,
                                        email: item.ownerEmail || '',
                                        role: 'Guesthouse Host',
                                        context: title,
                                      },
                                    })
                                  }
                                  className='inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] transition'
                                >
                                  <FaWhatsapp className='text-emerald-600' />
                                  <span>{hostPhone || 'Contact'}</span>
                                </button>
                              </div>
                            </td>

                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  item.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status || 'Pending'}
                              </span>
                            </td>

                            <td className='py-3 px-4 text-right'>
                              <div className='flex items-center justify-end gap-1.5'>
                                <button
                                  type='button'
                                  onClick={() => handleToggleActive(item._id || item.id, item.active, title)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                  title='Toggle Visibility'
                                >
                                  {isActive ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setInspectListing(item)}
                                  className='px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold'
                                >
                                  View
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setEditingListing(item)}
                                  className='px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold'
                                  title='Edit Property Info'
                                >
                                  Edit
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setDeletingListing(item)}
                                  className='p-1 text-slate-400 hover:text-rose-600 rounded'
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: CARS & PRIVATE DRIVERS SEPARATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'cars' && (
          <div className='space-y-6'>
            {/* Header Card */}
            <div className='bg-gradient-to-r from-sky-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-1.5'>
                  <FaCar /> Chauffeur Fleet &amp; Vehicle Services
                </div>
                <h1 className='text-2xl font-black'>Private Cars, Safari Cruisers &amp; Chauffeurs</h1>
                <p className='text-xs text-slate-300 mt-1 max-w-xl'>
                  Separate management for chauffeured vehicles, city sedans, airport transfers, and luxury safari SUVs with verified drivers.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setIsCreateModalOpen(true)}
                  className='px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs'
                >
                  + Add Vehicle
                </button>
                <button
                  onClick={() => fetchAllListings(false)}
                  disabled={allLoading}
                  className='p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs'
                  title='Refresh'
                >
                  <FaRedo className={allLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Total Vehicles</span>
                <span className='text-xl font-black text-slate-900 block mt-1'>{carListings.length}</span>
                <span className='text-[10px] text-sky-600 font-bold'>Dedicated fleet entries</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Active / Available</span>
                <span className='text-xl font-black text-emerald-600 block mt-1'>
                  {carListings.filter((i) => i.active !== false).length}
                </span>
                <span className='text-[10px] text-slate-400'>Ready for dispatch</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>With Chauffeur</span>
                <span className='text-xl font-black text-sky-600 block mt-1'>
                  {carListings.filter((i) => i.driverIncluded !== false).length}
                </span>
                <span className='text-[10px] text-slate-400'>Professional driver included</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Average Daily Rate</span>
                <span className='text-xl font-black text-slate-900 block mt-1'>
                  $
                  {carListings.length > 0
                    ? Math.round(
                        carListings.reduce((acc, curr) => acc + Number(curr.price || curr.regularPrice || 0), 0) /
                          carListings.length
                      )
                    : 85}
                </span>
                <span className='text-[10px] text-slate-400'>Per 24h service</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs'>
              <div className='flex flex-wrap items-center gap-2'>
                <select
                  value={carStatusFilter}
                  onChange={(e) => setCarStatusFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Statuses</option>
                  <option value='approved'>Approved</option>
                  <option value='pending'>Pending</option>
                  <option value='rejected'>Rejected</option>
                </select>

                <select
                  value={carDriverFilter}
                  onChange={(e) => setCarDriverFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Driver Types</option>
                  <option value='yes'>Driver Included</option>
                  <option value='no'>Self-Drive / No Driver</option>
                </select>

                <select
                  value={carTransFilter}
                  onChange={(e) => setCarTransFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Transmissions</option>
                  <option value='automatic'>Automatic</option>
                  <option value='manual'>Manual</option>
                </select>
              </div>

              <div className='relative flex-1 max-w-sm'>
                <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={carSearchQuery}
                  onChange={(e) => setCarSearchQuery(e.target.value)}
                  placeholder='Search by make, model, driver name...'
                  className='w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs'
                />
              </div>
            </div>

            {/* Cars Table */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs'>
              {filteredCars.length === 0 ? (
                <div className='p-12 text-center text-xs text-slate-400'>
                  No car &amp; driver listings matched your filters.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-4'>Vehicle</th>
                        <th className='py-3.5 px-4'>Driver / Chauffeur</th>
                        <th className='py-3.5 px-4'>Specs</th>
                        <th className='py-3.5 px-4'>Daily Rate</th>
                        <th className='py-3.5 px-4'>Driver Contact</th>
                        <th className='py-3.5 px-4'>Status</th>
                        <th className='py-3.5 px-4 text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {filteredCars.map((item) => {
                        const title = item.title || item.name || `${item.make || ''} ${item.model || ''}`.trim() || 'Vehicle';
                        const price = item.price || item.regularPrice || 0;
                        const thumb =
                          item.images?.[0] ||
                          item.imageUrls?.[0] ||
                          '/images/prado_chauffeur_suv.jpg';
                        const isActive = item.active !== false && item.isActive !== false;
                        const driverName = item.driverName || item.ownerName || 'Designated Driver';
                        const driverPhone = item.driverContact || item.contactPhone || item.ownerPhone || '';

                        return (
                          <tr key={item._id || item.id} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-3'>
                                <img
                                  src={thumb}
                                  alt={title}
                                  className='w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer'
                                  onClick={() => setInspectListing(item)}
                                />
                                <div>
                                  <button
                                    onClick={() => setInspectListing(item)}
                                    className='font-bold text-slate-900 hover:text-sky-700 text-left line-clamp-1 block'
                                  >
                                    {title}
                                  </button>
                                  <span className='text-[10px] text-slate-400'>
                                    {item.make} {item.model} • {item.year || 2024}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-1.5'>
                                <FaUserTie className='text-sky-600 text-xs' />
                                <span className='font-semibold text-slate-800'>{driverName}</span>
                              </div>
                              <span className='text-[10px] text-emerald-600 font-bold block'>
                                {item.driverIncluded !== false ? 'Driver Included' : 'Self-Drive'}
                              </span>
                            </td>

                            <td className='py-3 px-4 text-slate-600'>
                              <div className='capitalize text-[11px] font-medium'>
                                {item.transmission || 'Automatic'} • {item.seats || 4} Seats
                              </div>
                              <span className='text-[10px] text-slate-400'>{item.fuel || 'Petrol'}</span>
                            </td>

                            <td className='py-3 px-4 font-bold text-slate-900'>
                              ${price} <span className='text-[10px] font-normal text-slate-400'>/day</span>
                            </td>

                            <td className='py-3 px-4'>
                              <button
                                type='button'
                                onClick={() =>
                                  setQuickContact({
                                    isOpen: true,
                                    contact: {
                                      name: driverName,
                                      phone: driverPhone,
                                      email: item.ownerEmail || '',
                                      role: 'Chauffeur / Operator',
                                      context: title,
                                    },
                                  })
                                }
                                className='inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg font-bold text-[11px] transition'
                              >
                                <FaWhatsapp className='text-emerald-600' />
                                <span>{driverPhone || 'Contact'}</span>
                              </button>
                            </td>

                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  item.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status || 'Pending'}
                              </span>
                            </td>

                            <td className='py-3 px-4 text-right'>
                              <div className='flex items-center justify-end gap-1.5'>
                                <button
                                  type='button'
                                  onClick={() => handleToggleActive(item._id || item.id, item.active, title)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                  title='Toggle Visibility'
                                >
                                  {isActive ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setInspectListing(item)}
                                  className='px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold'
                                >
                                  View
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setEditingListing(item)}
                                  className='px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold'
                                  title='Edit Vehicle Info'
                                >
                                  Edit
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setDeletingListing(item)}
                                  className='p-1 text-slate-400 hover:text-rose-600 rounded'
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: USERS & HOSTS DIRECTORY (SEPARATED HOSTS VS USERS) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className='space-y-6'>
            {/* Header Banner */}
            <div className='bg-gradient-to-r from-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-1.5'>
                  <FaUsers /> Client &amp; Host Management Center
                </div>
                <h1 className='text-2xl font-black'>Registered Users &amp; Host Directory</h1>
                <p className='text-xs text-slate-300 mt-1 max-w-xl'>
                  Segmented list of property hosts, private fleet operators, and registered travelers with complete contact details (names, emails, phone numbers) and 1-click concierge messaging.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => exportUsersCSV(filteredUsers)}
                  className='px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs'
                >
                  <FaFileCsv className='text-amber-400' />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => fetchUsers(false)}
                  disabled={usersLoading}
                  className='p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-xs'
                  title='Refresh Directory'
                >
                  <FaRedo className={usersLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Total Registered</span>
                <span className='text-xl font-black text-slate-900 block mt-1'>{allCount}</span>
                <span className='text-[10px] text-purple-600 font-bold'>All account profiles</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Hosts &amp; Fleet Operators</span>
                <span className='text-xl font-black text-emerald-600 block mt-1'>{hostsCount}</span>
                <span className='text-[10px] text-slate-400'>Listing owners &amp; chauffeurs</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Travelers &amp; Guests</span>
                <span className='text-xl font-black text-sky-600 block mt-1'>{guestsCount}</span>
                <span className='text-[10px] text-slate-400'>Registered clients</span>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
                <span className='text-slate-500 font-semibold'>Verified Users</span>
                <span className='text-xl font-black text-amber-600 block mt-1'>{verifiedCount}</span>
                <span className='text-[10px] text-slate-400'>Verified phone/email</span>
              </div>
            </div>

            {/* Role Switcher & Filter Controls */}
            <div className='bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                {/* Segments */}
                <div className='inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold'>
                  <button
                    type='button'
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Members ({allCount})
                  </button>
                  <button
                    type='button'
                    onClick={() => setUserRoleFilter('hosts')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      userRoleFilter === 'hosts'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FaHome className='text-emerald-600' />
                    <span>Hosts ({hostsCount})</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setUserRoleFilter('users')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      userRoleFilter === 'users'
                        ? 'bg-white text-sky-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FaUsers className='text-sky-600' />
                    <span>Travelers &amp; Guests ({guestsCount})</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setUserRoleFilter('admins')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'admins'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admins
                  </button>
                </div>

                <div className='flex items-center gap-2'>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='verified'>Verified Only</option>
                    <option value='disabled'>Disabled Only</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className='relative'>
                <FaSearch className='absolute left-3.5 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder='Search by full name, email address, or phone number...'
                  className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-400'
                />
              </div>
            </div>

            {/* Users Directory Table */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs'>
              {filteredUsers.length === 0 ? (
                <div className='p-12 text-center text-xs text-slate-400'>
                  No registered users matched your criteria.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-4'>Full Name &amp; Email</th>
                        <th className='py-3.5 px-4'>Phone Number &amp; Contact</th>
                        <th className='py-3.5 px-4'>Account Role</th>
                        <th className='py-3.5 px-4'>Inventory / Activity</th>
                        <th className='py-3.5 px-4'>Verification</th>
                        <th className='py-3.5 px-4'>Status</th>
                        <th className='py-3.5 px-4 text-right'>Concierge Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {filteredUsers.map((u) => {
                        const name = u.displayName || u.username || u.name || 'Member';
                        const phone = u.phoneNumber || u.phone || '';
                        const cleanPhone = phone.replace(/[^\d+]/g, '');
                        const isHost = u.accountType === 'host' || u.role === 'host' || (u.listingsCount && u.listingsCount > 0);

                        return (
                          <tr key={u.uid || u._id || u.id} className='hover:bg-slate-50 transition-colors'>
                            {/* Name & Email */}
                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-3'>
                                <div
                                  className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                                    u.isAdmin
                                      ? 'bg-amber-400 text-slate-950 font-black'
                                      : isHost
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {(name[0] || 'U').toUpperCase()}
                                </div>
                                <div className='min-w-0 max-w-xs'>
                                  <span className='font-bold text-slate-900 truncate block'>{name}</span>
                                  <span className='text-[11px] text-slate-400 truncate block flex items-center gap-1'>
                                    <span>{u.email}</span>
                                    <button
                                      type='button'
                                      onClick={() => copyToClipboard(u.email, (u.uid || u._id) + '_email')}
                                      className='text-slate-400 hover:text-slate-600'
                                      title='Copy Email'
                                    >
                                      {copiedId === (u.uid || u._id) + '_email' ? (
                                        <FaCheck className='text-[9px] text-emerald-500' />
                                      ) : (
                                        <FaCopy className='text-[9px]' />
                                      )}
                                    </button>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Phone Number */}
                            <td className='py-3 px-4'>
                              {phone ? (
                                <div className='flex items-center gap-2'>
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs'
                                    title='Direct Dial'
                                  >
                                    <FaPhoneAlt className='text-[10px] text-emerald-600' />
                                    <span>{phone}</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                                      `Hello ${name}, this is Chento100 administration.`
                                    )}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                    title='Chat on WhatsApp'
                                  >
                                    <FaWhatsapp className='text-xs' />
                                  </a>
                                </div>
                              ) : (
                                <span className='text-slate-400 italic text-[11px]'>No phone registered</span>
                              )}
                            </td>

                            {/* Role */}
                            <td className='py-3 px-4'>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.isAdmin
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isHost
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                                }`}
                              >
                                {u.isAdmin
                                  ? 'Administrator'
                                  : isHost
                                  ? u.hostType === 'car_service'
                                    ? 'Chauffeur Operator'
                                    : 'Property Host'
                                  : 'Traveler / Guest'}
                              </span>
                            </td>

                            {/* Inventory / Activity */}
                            <td className='py-3 px-4'>
                              {isHost ? (
                                <span className='font-bold text-slate-800 text-xs'>
                                  {u.listingsCount || 0} Listed Items
                                </span>
                              ) : (
                                <span className='text-slate-500 text-xs'>
                                  {u.bookingsCount || 1} Bookings Made
                                </span>
                              )}
                            </td>

                            {/* Verification */}
                            <td className='py-3 px-4'>
                              {u.verified || u.emailVerified ? (
                                <span className='inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]'>
                                  <FaCheckCircle className='text-[10px]' /> Verified
                                </span>
                              ) : (
                                <span className='text-amber-500 font-semibold text-[11px]'>Unverified</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className='py-3 px-4'>
                              {u.disabled ? (
                                <span className='px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]'>
                                  Suspended
                                </span>
                              ) : (
                                <span className='px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]'>
                                  Active
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className='py-3 px-4 text-right'>
                              <div className='flex items-center justify-end gap-1.5'>
                                <button
                                  type='button'
                                  onClick={() =>
                                    setQuickContact({
                                      isOpen: true,
                                      contact: {
                                        name,
                                        phone,
                                        email: u.email,
                                        role: isHost ? 'Host' : 'Guest',
                                        context: isHost ? 'Host Operations' : 'Traveler Booking',
                                      },
                                    })
                                  }
                                  className='px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px]'
                                  title='Quick Contact'
                                >
                                  Contact
                                </button>
                                <button
                                  type='button'
                                  onClick={() => handleToggleUserDisabled(u)}
                                  className={`p-1.5 rounded-lg ${
                                    u.disabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-rose-600'
                                  }`}
                                  title={u.disabled ? 'Enable Account' : 'Suspend Account'}
                                >
                                  {u.disabled ? <FaUserCheck /> : <FaBan />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: BOOKINGS & LEADS CONCIERGE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'enquiries' && (
          <div className='space-y-6'>
            {/* Header Card */}
            <div className='bg-gradient-to-r from-amber-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-1.5'>
                  <FaConciergeBell /> Concierge Booking Requests &amp; Ride Dispatch
                </div>
                <h1 className='text-2xl font-black'>Guest Enquiries &amp; Chauffeur Bookings</h1>
                <p className='text-xs text-slate-300 mt-1 max-w-xl'>
                  Coordinate travelers with guest house hosts and private drivers. Track inquiry progress and follow up directly via WhatsApp.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  onClick={() => fetchEnquiries(false)}
                  disabled={enquiriesLoading}
                  className='p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs'
                  title='Refresh'
                >
                  <FaRedo className={enquiriesLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs'>
              <div className='flex flex-wrap items-center gap-2'>
                <select
                  value={enquiryStatusFilter}
                  onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Statuses</option>
                  <option value='new'>New / Uncontacted</option>
                  <option value='contacted'>Contacted</option>
                  <option value='confirmed'>Confirmed</option>
                  <option value='completed'>Completed</option>
                </select>
              </div>

              <div className='relative flex-1 max-w-sm'>
                <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={enquirySearchQuery}
                  onChange={(e) => setEnquirySearchQuery(e.target.value)}
                  placeholder='Search by guest name, email, or listing title...'
                  className='w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs'
                />
              </div>
            </div>

            {/* Enquiries Table */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs'>
              {filteredEnquiries.length === 0 ? (
                <div className='p-12 text-center text-xs text-slate-400'>
                  No booking inquiries found.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-4'>Client / Traveler</th>
                        <th className='py-3.5 px-4'>Target Service</th>
                        <th className='py-3.5 px-4'>Dates &amp; Specs</th>
                        <th className='py-3.5 px-4'>Provider / Host</th>
                        <th className='py-3.5 px-4'>Status</th>
                        <th className='py-3.5 px-4 text-right'>Concierge Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {filteredEnquiries.map((enq) => {
                        const isCar = enq.serviceType === 'car_service' || enq.category === 'car';
                        const clientPhone = enq.guestPhone || enq.phone || '';

                        return (
                          <tr key={enq.id} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-3 px-4'>
                              <div className='font-bold text-slate-900'>{enq.guestName || 'Traveler'}</div>
                              <div className='text-[11px] text-slate-400'>{enq.guestEmail}</div>
                              {clientPhone && (
                                <a href={`tel:${clientPhone}`} className='text-[10px] text-emerald-600 font-bold block'>
                                  {clientPhone}
                                </a>
                              )}
                            </td>

                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-1.5'>
                                {isCar ? <FaCar className='text-sky-600' /> : <FaHome className='text-emerald-600' />}
                                <span className='font-bold text-slate-800 line-clamp-1'>{enq.listingTitle}</span>
                              </div>
                              <span className='text-[10px] text-slate-400 capitalize'>{enq.serviceType?.replace('_', ' ')}</span>
                            </td>

                            <td className='py-3 px-4 text-slate-600'>
                              <div>{enq.checkIn || enq.pickupDate || 'Dates upon request'}</div>
                              <span className='text-[10px] text-slate-400'>{enq.guests || 2} Persons</span>
                            </td>

                            <td className='py-3 px-4'>
                              <div className='font-semibold text-slate-800'>{enq.hostName || enq.driverName || 'Operator'}</div>
                              <span className='text-[10px] text-slate-400'>{enq.hostPhone || enq.driverPhone || ''}</span>
                            </td>

                            <td className='py-3 px-4'>
                              <select
                                value={enq.status || 'new'}
                                onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value)}
                                className={`text-[10px] font-bold p-1 rounded-lg border ${
                                  enq.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : enq.status === 'contacted'
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value='new'>New</option>
                                <option value='contacted'>Contacted</option>
                                <option value='confirmed'>Confirmed</option>
                                <option value='completed'>Completed</option>
                              </select>
                            </td>

                            <td className='py-3 px-4 text-right'>
                              <button
                                type='button'
                                onClick={() =>
                                  setQuickContact({
                                    isOpen: true,
                                    contact: {
                                      name: enq.guestName,
                                      phone: clientPhone,
                                      email: enq.guestEmail,
                                      role: 'Traveler Inquiry',
                                      context: enq.listingTitle,
                                    },
                                  })
                                }
                                className='px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs'
                              >
                                Contact Guest
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PENDING LISTINGS MODERATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pending' && (
          <section id='section-pending-moderation' aria-label='Pending Listings Moderation'>
            {/* Summary Header Card */}
            <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-2.5'>
                    <h1 className='text-2xl font-bold text-slate-900'>Listing Moderation</h1>
                    <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200'>
                      {pendingListings.length} Pending
                    </span>
                  </div>
                  <p className='text-sm text-slate-500 mt-1'>
                    Review, inspect, approve, or reject newly submitted guest houses and chauffeured vehicles.
                  </p>
                </div>

                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    id='refresh-pending-listings-btn'
                    onClick={() => fetchPendingListings(false)}
                    disabled={pendingLoading}
                    className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs disabled:opacity-50'
                  >
                    <span>{pendingLoading ? 'Refreshing...' : 'Refresh List'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Section: Table / Cards */}
            <div className='bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden'>
              {pendingLoading ? (
                <div className='p-12 flex flex-col items-center justify-center text-center'>
                  <div className='w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3'></div>
                  <p className='text-sm text-slate-600 font-medium'>Loading pending listings...</p>
                </div>
              ) : pendingListings.length === 0 ? (
                <div className='p-16 flex flex-col items-center justify-center text-center'>
                  <div className='w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4'>
                    <FaCheck className='text-xl' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-800 mb-1'>All Caught Up!</h3>
                  <p className='text-sm text-slate-500 max-w-sm'>
                    There are currently no pending listings awaiting administrative review.
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table id='pending-listings-table' className='w-full text-left text-sm text-slate-700'>
                    <thead className='bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-5 font-semibold'>Listing</th>
                        <th className='py-3.5 px-4 font-semibold'>Category</th>
                        <th className='py-3.5 px-4 font-semibold'>Location</th>
                        <th className='py-3.5 px-4 font-semibold'>Rate</th>
                        <th className='py-3.5 px-5 font-semibold text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {pendingListings.map((item) => {
                        const isCar = item.category === 'car' || item.type === 'car' || item.type === 'sale';
                        const title = item.title || item.name || 'Untitled Listing';
                        const price = item.regularPrice || item.price || 0;
                        const thumb =
                          item.images?.[0] ||
                          item.imageUrls?.[0] ||
                          (isCar ? '/images/prado_chauffeur_suv.jpg' : '/images/airbnb_apartment_living.jpg');
                        const isActing = actionLoading && actionLoading.id === (item._id || item.id);

                        return (
                          <tr key={item._id || item.id} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-4 px-5'>
                              <div className='flex items-center gap-3.5'>
                                <img
                                  src={thumb}
                                  alt={title}
                                  className='w-14 h-12 rounded-lg object-cover border border-slate-200 shrink-0 cursor-pointer'
                                  onClick={() => setInspectListing(item)}
                                />
                                <div className='max-w-xs'>
                                  <button
                                    type='button'
                                    onClick={() => setInspectListing(item)}
                                    className='font-semibold text-slate-900 hover:text-slate-700 text-left line-clamp-1'
                                  >
                                    {title}
                                  </button>
                                  <p className='text-xs text-slate-400 line-clamp-1 mt-0.5'>
                                    {item.description || 'No description provided.'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className='py-4 px-4 whitespace-nowrap'>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isCar
                                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isCar ? 'Chauffeur Car' : 'Guest House'}
                              </span>
                            </td>

                            <td className='py-4 px-4 text-xs text-slate-600 max-w-xs truncate'>
                              {item.location || item.city || item.address || '—'}
                            </td>

                            <td className='py-4 px-4 font-bold text-slate-900'>
                              ${price} <span className='text-[10px] font-normal text-slate-400'>{isCar ? '/day' : '/night'}</span>
                            </td>

                            <td className='py-4 px-5 text-right'>
                              <div className='flex items-center justify-end gap-2'>
                                <button
                                  type='button'
                                  onClick={() => setInspectListing(item)}
                                  className='px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                  Inspect
                                </button>
                                <button
                                  type='button'
                                  disabled={isActing}
                                  onClick={() => handleReject(item._id || item.id, title)}
                                  className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 disabled:opacity-50'
                                >
                                  Reject
                                </button>
                                <button
                                  type='button'
                                  disabled={isActing}
                                  onClick={() => handleApprove(item._id || item.id, title)}
                                  className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs disabled:opacity-50'
                                >
                                  Approve
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'availabilityRequests' && (
          <section aria-label='Partner availability requests' className='space-y-4'>
            <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs'>
              <h1 className='text-2xl font-bold text-slate-900'>Partner Unavailable Requests</h1>
              <p className='text-sm text-slate-500 mt-1'>
                Review partner requests before removing an approved listing from public search.
              </p>
            </div>

            {availabilityRequests.length === 0 ? (
              <div className='bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-500'>
                There are no pending availability requests.
              </div>
            ) : (
              <div className='space-y-3'>
                {availabilityRequests.map((listing) => {
                  const request = listing.availabilityRequest;
                  const id = listing._id || listing.id;
                  return (
                    <article key={id} className='bg-white rounded-xl border border-rose-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div>
                        <h2 className='font-bold text-slate-900'>{listing.title || listing.name || 'Untitled listing'}</h2>
                        <p className='text-xs text-slate-500 mt-1'>
                          {listing.address || listing.location || listing.city || 'Location not provided'}
                        </p>
                        <p className='text-xs text-slate-600 mt-2'>
                          Requested by {request.requestedByEmail || request.requestedBy || 'Partner'}
                          {request.requestedAt ? ` on ${new Date(request.requestedAt).toLocaleString()}` : ''}
                        </p>
                        {request.availabilityNotes && (
                          <p className='text-sm text-slate-700 mt-2'>{request.availabilityNotes}</p>
                        )}
                        {(request.availableFrom || request.availableUntil) && (
                          <p className='text-xs text-slate-500 mt-1'>
                            Requested dates: {request.availableFrom || '—'} to {request.availableUntil || '—'}
                          </p>
                        )}
                      </div>
                      <button
                        type='button'
                        disabled={availabilityActionId === id}
                        onClick={() => handleConfirmUnavailable(listing)}
                        className='shrink-0 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-50'
                      >
                        {availabilityActionId === id ? 'Confirming...' : 'Confirm unavailable'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ALL LISTINGS DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'all' && (
          <section id='section-all-listings' aria-label='All Listings Directory'>
            <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold text-slate-900'>All Inventory Directory</h1>
                <p className='text-sm text-slate-500 mt-1'>
                  Comprehensive view of both guest houses and private cars. Toggle active status to control public search visibility.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setIsCreateModalOpen(true)}
                  className='px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold'
                >
                  + Add Listing
                </button>
                <button
                  onClick={() => fetchAllListings(false)}
                  disabled={allLoading}
                  className='p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold'
                >
                  <FaRedo className={allLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mb-6'>
              <div className='flex items-center gap-2'>
                <select
                  value={allStatusFilter}
                  onChange={(e) => setAllStatusFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Statuses</option>
                  <option value='approved'>Approved</option>
                  <option value='pending'>Pending</option>
                  <option value='rejected'>Rejected</option>
                </select>

                <select
                  value={allActiveFilter}
                  onChange={(e) => setAllActiveFilter(e.target.value)}
                  className='p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                >
                  <option value='all'>All Visibility</option>
                  <option value='active'>Active Only</option>
                  <option value='inactive'>Hidden Only</option>
                </select>
              </div>

              <div className='relative flex-1 max-w-sm'>
                <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={allSearchQuery}
                  onChange={(e) => setAllSearchQuery(e.target.value)}
                  placeholder='Search by title or location...'
                  className='w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs'
                />
              </div>
            </div>

            {/* All Listings Table */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs'>
              {filteredAllListings.length === 0 ? (
                <div className='p-12 text-center text-xs text-slate-400'>
                  No listings found.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200'>
                      <tr>
                        <th className='py-3.5 px-4'>Item</th>
                        <th className='py-3.5 px-4'>Service Type</th>
                        <th className='py-3.5 px-4'>Location</th>
                        <th className='py-3.5 px-4'>Rate</th>
                        <th className='py-3.5 px-4'>Moderation</th>
                        <th className='py-3.5 px-4'>Live Visibility</th>
                        <th className='py-3.5 px-4 text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {filteredAllListings.map((item) => {
                        const isCar = item.category === 'car' || item.type === 'car' || item.type === 'sale';
                        const title = item.title || item.name || 'Listing';
                        const price = item.price || item.regularPrice || 0;
                        const thumb =
                          item.images?.[0] ||
                          item.imageUrls?.[0] ||
                          (isCar ? '/images/prado_chauffeur_suv.jpg' : '/images/airbnb_apartment_living.jpg');
                        const isActive = item.active !== false && item.isActive !== false;

                        return (
                          <tr key={item._id || item.id} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-3 px-4'>
                              <div className='flex items-center gap-3'>
                                <img
                                  src={thumb}
                                  alt={title}
                                  className='w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer'
                                  onClick={() => setInspectListing(item)}
                                />
                                <div>
                                  <button
                                    onClick={() => setInspectListing(item)}
                                    className='font-bold text-slate-900 text-left line-clamp-1 block'
                                  >
                                    {title}
                                  </button>
                                  <span className='text-[10px] text-slate-400'>ID: {(item._id || item.id).slice(0, 10)}</span>
                                </div>
                              </div>
                            </td>

                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isCar ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {isCar ? 'Car & Driver' : 'Guest House'}
                              </span>
                            </td>

                            <td className='py-3 px-4 text-slate-600'>
                              {item.city || item.location || '—'}
                            </td>

                            <td className='py-3 px-4 font-bold text-slate-900'>
                              ${price} <span className='text-[10px] font-normal text-slate-400'>{isCar ? '/day' : '/night'}</span>
                            </td>

                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  item.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status || 'Pending'}
                              </span>
                            </td>

                            <td className='py-3 px-4'>
                              <button
                                type='button'
                                onClick={() => handleToggleActive(item._id || item.id, item.active, title)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isActive ? 'Published (Active)' : 'Hidden (Inactive)'}
                              </button>
                            </td>

                            <td className='py-3 px-4 text-right'>
                              <div className='flex items-center justify-end gap-1.5'>
                                <button
                                  type='button'
                                  onClick={() => setInspectListing(item)}
                                  className='px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold'
                                >
                                  Inspect
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setEditingListing(item)}
                                  className='px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold'
                                  title='Edit Listing Info'
                                >
                                  Edit
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setDeletingListing(item)}
                                  className='p-1 text-slate-400 hover:text-rose-600 rounded'
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

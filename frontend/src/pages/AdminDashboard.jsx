import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { adminApi } from '../services/api/adminApi';
import { feedsApi } from '../services/api/feedsApi';
import { cattleApi } from '../services/api/cattleApi';
import { reportApi } from '../services/api/reportApi';
import { toastService } from '../services/toastService';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Users,
  ClipboardList,
  Trash2,
  Edit,
  Plus,
  X,
  Tag,
  IndianRupee,
  Layers,
  Eye,
  EyeOff,
  ShieldAlert,
  Package,
  Calendar,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, feeds, orders, users, cattle, moderation
  const [stats, setStats] = useState({
    usersCount: 0,
    feedsCount: 0,
    activeFeedsCount: 0,
    productsCount: 0,
    ordersCount: 0,
    pendingOrdersCount: 0,
    cattleCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [feedsList, setFeedsList] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Form states (Feed Add/Edit)
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [feedFormData, setFeedFormData] = useState({
    name: '',
    price: '',
    unit: '50 kg',
    description: '',
    category: 'Dairy',
    stock_quantity: 100,
    image: '',
    is_hidden: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      toastService.error('Unauthorized. Admin access only.');
      navigate('/home');
      return;
    }
    loadData();
  }, [authLoading, isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [
        statsRes,
        usersRes,
        ordersRes,
        feedsRes,
        cattleRes,
        reportsRes,
      ] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getOrders(),
        feedsApi.getAdminFeeds(),
        adminApi.getCattle(),
        reportApi.getReports(),
      ]);

      if (statsRes.status === 'rejected') console.warn('[AdminDashboard] statsRes rejected:', statsRes.reason);
      if (usersRes.status === 'rejected') console.warn('[AdminDashboard] usersRes rejected:', usersRes.reason);
      if (ordersRes.status === 'rejected') console.warn('[AdminDashboard] ordersRes rejected:', ordersRes.reason);
      if (feedsRes.status === 'rejected') console.warn('[AdminDashboard] feedsRes rejected:', feedsRes.reason);
      if (cattleRes.status === 'rejected') console.warn('[AdminDashboard] cattleRes rejected:', cattleRes.reason);
      if (reportsRes.status === 'rejected') console.warn('[AdminDashboard] reportsRes rejected:', reportsRes.reason);

      const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null;
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      let feedsDataRes = feedsRes.status === 'fulfilled' ? feedsRes.value : [];
      const cattleData = cattleRes.status === 'fulfilled' ? cattleRes.value : [];
      const reportsData = reportsRes.status === 'fulfilled' ? reportsRes.value : [];

      if (!feedsDataRes || (Array.isArray(feedsDataRes) && feedsDataRes.length === 0)) {
        try {
          const fallbackFeeds = await adminApi.getFeeds();
          if (Array.isArray(fallbackFeeds) && fallbackFeeds.length > 0) {
            feedsDataRes = fallbackFeeds;
          }
        } catch {}
      }

      const statsObj = statsData && statsData.data ? statsData.data : statsData;

      const parsedUsers = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
      const parsedOrders = Array.isArray(ordersData) ? ordersData : (Array.isArray(ordersData?.data) ? ordersData.data : []);
      const parsedFeeds = Array.isArray(feedsDataRes) ? feedsDataRes : (Array.isArray(feedsDataRes?.data) ? feedsDataRes.data : []);
      const parsedCattle = Array.isArray(cattleData) ? cattleData : (Array.isArray(cattleData?.data) ? cattleData.data : []);
      const parsedReports = Array.isArray(reportsData) ? reportsData : (Array.isArray(reportsData?.data) ? reportsData.data : []);

      const activeFeedsCalculated = parsedFeeds.filter(f => !f.is_hidden).length;

      setStats({
        usersCount: statsObj?.usersCount ?? parsedUsers.length,
        feedsCount: statsObj?.feedsCount ?? activeFeedsCalculated,
        activeFeedsCount: statsObj?.activeFeedsCount ?? activeFeedsCalculated,
        productsCount: statsObj?.productsCount ?? parsedFeeds.length,
        ordersCount: statsObj?.ordersCount ?? parsedOrders.length,
        pendingOrdersCount: statsObj?.pendingOrdersCount ?? parsedOrders.filter(o => (o.status || o.order_status) === 'pending').length,
        cattleCount: statsObj?.cattleCount ?? parsedCattle.length,
        totalRevenue: statsObj?.totalRevenue ?? parsedOrders.reduce((sum, o) => sum + (o.totalPrice || o.total_amount || 0), 0),
      });

      setUsersList(parsedUsers);
      setOrdersList(parsedOrders);
      setFeedsList(parsedFeeds);
      setCattleList(parsedCattle);
      setReportsList(parsedReports);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoadError('Unable to load admin dashboard data. Please try again.');
      toastService.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminRole = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionWord = targetRole === 'admin' ? 'promote to Admin' : 'demote to User';

    if (!window.confirm(`Are you sure you want to ${actionWord} this user?`)) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, targetRole);
      toastService.success(`User role successfully changed to ${targetRole}.`);
      loadData();
    } catch (err) {
      toastService.error(err.message || "Failed to update user role.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toastService.success(`Order ${orderId} status set to ${newStatus}`);
      loadData();
    } catch (e) {
      toastService.error('Failed to update order status.');
    }
  };

  const openAddFeed = () => {
    setEditingFeed(null);
    setFeedFormData({
      name: '',
      price: '',
      unit: '50 kg',
      description: '',
      category: 'Dairy',
      stock_quantity: 100,
      image: '',
      is_hidden: false,
    });
    setIsFeedModalOpen(true);
  };

  const openEditFeed = (feed) => {
    setEditingFeed(feed);
    setFeedFormData({
      name: feed.name || feed.title || '',
      price: (feed.price || '').toString(),
      unit: feed.unit || '50 kg',
      description: feed.description || '',
      category: feed.category || 'Dairy',
      stock_quantity: feed.stock_quantity ?? 100,
      image: feed.image || feed.image_url || '',
      is_hidden: feed.is_hidden || false,
    });
    setIsFeedModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedFormData(prev => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeedSubmit = async (e) => {
    e.preventDefault();
    if (!feedFormData.name.trim() || !feedFormData.price) {
      toastService.error('Please enter product name and price.');
      return;
    }

    try {
      if (editingFeed) {
        await feedsApi.updateFeed(editingFeed.id, feedFormData);
        toastService.success('Feed product updated.');
      } else {
        await feedsApi.createFeed(feedFormData);
        toastService.success('New feed product added to catalog.');
      }
      setIsFeedModalOpen(false);
      loadData();
    } catch (e) {
      toastService.error(e.message || 'Operation failed.');
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (!window.confirm('Delete this feed product item from catalog?')) return;
    try {
      const res = await feedsApi.deleteFeed(feedId);
      toastService.success(res?.message || 'Product removed.');
      loadData();
    } catch (e) {
      toastService.error(e.message || 'Failed to delete feed.');
    }
  };

  const handleToggleHideFeed = async (feed) => {
    try {
      await feedsApi.updateFeed(feed.id, {
        name: feed.name || feed.title,
        price: feed.price,
        unit: feed.unit || '50 kg',
        description: feed.description,
        category: feed.category,
        image: feed.image || feed.image_url,
        is_hidden: !feed.is_hidden,
      });
      toastService.success(feed.is_hidden ? 'Product is now visible to customers.' : 'Product is now hidden from customers.');
      loadData();
    } catch (e) {
      toastService.error('Failed to toggle visibility.');
    }
  };

  const handleDeleteCattle = async (id) => {
    if (!window.confirm('Delete this cattle listing from Sante marketplace?')) return;
    try {
      await adminApi.deleteCattle(id);
      toastService.success('Cattle listing removed.');
      loadData();
    } catch (e) {
      toastService.error('Failed to delete listing.');
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      const res = await reportApi.dismissReport(reportId);
      if (res && res.success) {
        toastService.success('Report dismissed.');
        loadData();
      } else {
        toastService.error(res?.message || 'Failed to dismiss report.');
      }
    } catch (e) {
      toastService.error('Failed to dismiss report.');
    }
  };

  const handleActionReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to remove this reported listing?')) return;
    try {
      const res = await reportApi.actionReport(reportId);
      if (res && res.success) {
        toastService.success('Report actioned and listing removed.');
        loadData();
      } else {
        toastService.error(res?.message || 'Failed to action report.');
      }
    } catch (e) {
      toastService.error('Failed to action report.');
    }
  };

  const handleSuspendUser = async (phone) => {
    if (!window.confirm(`Are you sure you want to suspend user ${phone}? This will delete all their listings.`)) return;
    try {
      const res = await reportApi.suspendUser(phone);
      if (res && res.success) {
        toastService.success('User account suspended.');
        loadData();
      } else {
        toastService.error(res?.message || 'Failed to suspend user.');
      }
    } catch (e) {
      toastService.error('Failed to suspend user.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'feeds', label: 'Products / Feeds', icon: Layers },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'cattle', label: 'Cattle Listings', icon: Tag },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm text-text-light">Loading Admin Panel...</p>
      </div>
    );
  }

  const activeFeedsCount = feedsList.filter(f => !f.is_hidden).length;
  const hiddenFeedsCount = feedsList.filter(f => f.is_hidden).length;

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-text-dark text-white py-8 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <span className="bg-primary/20 text-primary border border-primary/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Control panel & live Supabase database management</p>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>↻</span>
            <span>Refresh Live Data</span>
          </button>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-text-dark shadow-xs'
                      : 'bg-white text-text-light hover:bg-white/60 hover:text-text-dark border border-border-light'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-4">
            {loading ? (
              <Card padding="lg" className="flex flex-col items-center justify-center py-20 text-text-light border border-border-light">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-semibold text-sm">Loading live database records...</p>
              </Card>
            ) : loadError ? (
              <Card padding="lg" className="flex flex-col items-center justify-center py-16 text-center border border-red-200 bg-red-50/50">
                <p className="text-red-700 font-bold mb-2">{loadError}</p>
                <p className="text-xs text-text-light mb-4">Check server connection and try again.</p>
                <Button variant="primary" size="sm" onClick={loadData}>
                  Retry Loading
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Live Stats Blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Total Revenue</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                      </Card>
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Active Feeds</p>
                        <p className="text-xl font-black text-primary-dark mt-1">{stats.activeFeedsCount ?? 0}</p>
                        <p className="text-[10px] text-text-light mt-0.5">{stats.productsCount ?? 0} total in catalog</p>
                      </Card>
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Total Products</p>
                        <p className="text-xl font-black text-text-dark mt-1">{stats.productsCount ?? 0}</p>
                        <p className="text-[10px] text-text-light mt-0.5">{hiddenFeedsCount} hidden</p>
                      </Card>
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Total Orders</p>
                        <p className="text-xl font-black text-text-dark mt-1">{stats.ordersCount ?? 0}</p>
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{stats.pendingOrdersCount ?? 0} pending</p>
                      </Card>
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Registered Users</p>
                        <p className="text-xl font-black text-text-dark mt-1">{stats.usersCount ?? 0}</p>
                        <p className="text-[10px] text-text-light mt-0.5">in public.profiles</p>
                      </Card>
                      <Card className="border border-border-light" padding="sm">
                        <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Cattle Listings</p>
                        <p className="text-xl font-black text-text-dark mt-1">{stats.cattleCount ?? 0}</p>
                        <p className="text-[10px] text-text-light mt-0.5">Sante marketplace</p>
                      </Card>
                    </div>

                    {/* Quick Navigation Card */}
                    <Card padding="lg" className="border border-border-light">
                      <h3 className="text-base font-bold text-text-dark mb-3">Quick Navigation</h3>
                      <div className="flex flex-wrap gap-2.5">
                        <Button variant="primary" size="sm" onClick={openAddFeed}>
                          + Add Feed
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('orders')}>
                          View Orders ({stats.ordersCount ?? 0})
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('users')}>
                          View Users ({stats.usersCount ?? 0})
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('feeds')}>
                          Manage Products ({stats.productsCount ?? 0})
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('cattle')}>
                          Cattle Listings ({stats.cattleCount ?? 0})
                        </Button>
                      </div>
                    </Card>

                    {/* Recent Orders Preview */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="text-base font-bold text-text-dark">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-primary-dark hover:underline">
                          View All ({ordersList.length}) →
                        </button>
                      </div>
                      <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                        {ordersList.length === 0 ? (
                          <div className="text-center py-10 text-text-light text-xs">No orders yet.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-bg-light border-b border-border-light font-bold text-text-light uppercase text-[10px]">
                                  <th className="p-3">Order ID</th>
                                  <th className="p-3">Customer</th>
                                  <th className="p-3">Total</th>
                                  <th className="p-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-light text-text-dark">
                                {ordersList.slice(0, 5).map((ord) => (
                                  <tr key={ord.id} className="hover:bg-bg-light/40">
                                    <td className="p-3 font-mono font-bold text-primary-dark">{ord.id}</td>
                                    <td className="p-3 font-semibold">{ord.customerName || 'Farmer'}</td>
                                    <td className="p-3 font-black">₹{(ord.totalPrice ?? ord.total_amount ?? 0).toLocaleString()}</td>
                                    <td className="p-3">
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        (ord.status || ord.order_status) === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                        (ord.status || ord.order_status) === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {ord.status || ord.order_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FEEDS CATALOG TAB */}
                {activeTab === 'feeds' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-1">
                      <div>
                        <h3 className="text-lg font-bold text-text-dark">Products / Feeds ({feedsList.length})</h3>
                        <p className="text-xs text-text-light">
                          Active (visible in shop): <span className="font-bold text-emerald-600">{activeFeedsCount}</span> | Hidden: <span className="font-bold text-amber-600">{hiddenFeedsCount}</span>
                        </p>
                      </div>
                      <Button variant="primary" size="sm" onClick={openAddFeed}>
                        + Add Feed
                      </Button>
                    </div>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {feedsList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <Layers className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                          <h4 className="text-base font-bold text-text-dark mb-1">No products have been added yet.</h4>
                          <p className="text-xs text-text-light mb-4">Start your live feed catalog by adding your first product.</p>
                          <Button variant="primary" size="sm" onClick={openAddFeed}>
                            + Add Your First Feed
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-text-dark border-collapse">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Product</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {feedsList.map((feed) => (
                                <tr key={feed.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 font-bold flex items-center gap-3">
                                    {(feed.image || feed.image_url) ? (
                                      <img src={feed.image || feed.image_url} alt={feed.name || feed.title} className="w-10 h-10 rounded-lg object-cover border border-border-light" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-bg-light flex items-center justify-center text-xs font-bold text-text-light">
                                        No img
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-black">{feed.name || feed.title}</p>
                                      <p className="text-xs text-text-light font-normal line-clamp-1">{feed.description || 'No description'}</p>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="bg-bg-light text-text-dark border border-border-light px-2.5 py-1 rounded-md text-xs font-semibold">
                                      {feed.category || 'Dairy'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs font-bold text-text-light">
                                    {feed.unit || '50 kg'}
                                  </td>
                                  <td className="p-4 font-extrabold text-primary-dark">₹{feed.price}</td>
                                  <td className="p-4">
                                    {feed.is_hidden ? (
                                      <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-flex items-center gap-1">
                                        Hidden
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-flex items-center gap-1">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <button
                                        onClick={() => openEditFeed(feed)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-border-light rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
                                        title="Edit Product"
                                      >
                                        <Edit size={13} className="text-gray-500" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleToggleHideFeed(feed)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shadow-2xs active:scale-95 cursor-pointer ${
                                          feed.is_hidden 
                                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' 
                                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                        }`}
                                        title={feed.is_hidden ? 'Make visible to customers' : 'Hide from customers'}
                                      >
                                        {feed.is_hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                                        <span>{feed.is_hidden ? 'Unhide' : 'Hide'}</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFeed(feed.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
                                        title="Delete Product"
                                      >
                                        <Trash2 size={13} />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. ORDERS LIST TAB */}
                {activeTab === 'orders' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center px-1">
                      <div>
                        <h3 className="text-lg font-bold text-text-dark">Orders ({ordersList.length})</h3>
                        <p className="text-xs text-text-light">Live & historical customer feed dispatches</p>
                      </div>
                    </div>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {ordersList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <ClipboardList className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                          <h4 className="text-base font-bold text-text-dark mb-1">No orders yet.</h4>
                          <p className="text-xs text-text-light">Customer feed orders will appear here automatically.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Order ID & Date</th>
                                <th className="p-4">Customer Info</th>
                                <th className="p-4">Delivery Address</th>
                                <th className="p-4">Products / Cart Items</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light text-text-dark">
                              {ordersList.map((order) => (
                                <tr key={order.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 align-top">
                                    <p className="font-extrabold text-xs text-primary-dark font-mono">{order.id}</p>
                                    <p className="text-[11px] text-text-light mt-0.5">
                                      {(order.createdAt || order.created_at) ? new Date(order.createdAt || order.created_at).toLocaleDateString() : '-'}
                                    </p>
                                  </td>
                                  <td className="p-4 align-top">
                                    <p className="font-extrabold text-sm">{order.customerName || order.customer_name || order.name || (order.profile?.name) || 'Farmer'}</p>
                                    {(order.customerEmail || order.email || order.customer_email || (order.profile?.email)) ? (
                                      <p className="text-xs text-text-light">{order.customerEmail || order.email || order.customer_email || (order.profile?.email)}</p>
                                    ) : null}
                                    <p className="text-xs text-text-light font-medium">{order.phoneNumber || order.phone_number || order.phone || (order.profile?.phone) || '-'}</p>
                                  </td>
                                  <td className="p-4 align-top max-w-[200px]">
                                    {(order.villageName || order.village_name || order.village) && (
                                      <p className="text-xs font-semibold text-text-dark">{order.villageName || order.village_name || order.village}</p>
                                    )}
                                    <p className="text-xs text-text-light mt-0.5 line-clamp-2">{order.address || order.delivery_address || (order.profile?.address) || '-'}</p>
                                  </td>
                                  <td className="p-4 align-top text-xs">
                                    <div className="space-y-1">
                                      {order.items && order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                          <p key={idx}>
                                            <span className="font-bold text-text-dark">{item.name || item.title || (item.feed?.title) || (item.feed?.name) || 'Feed Product'}</span>
                                            <span className="bg-primary-light text-text-dark font-black px-1 py-0.5 rounded ml-1 text-[10px]">
                                              ×{item.quantity}
                                            </span>
                                            {item.price ? (
                                              <span className="text-[11px] text-text-light ml-1">
                                                (₹{item.price})
                                              </span>
                                            ) : null}
                                          </p>
                                        ))
                                      ) : (
                                        <p className="text-text-light italic text-xs">Standard cattle feed</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 align-top font-black text-primary-dark">
                                    ₹{(order.totalPrice ?? order.total_amount ?? 0).toLocaleString()}
                                  </td>
                                  <td className="p-4 align-top">
                                    <select
                                      value={order.status || order.order_status || 'pending'}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      className={`text-xs font-bold rounded-lg border-2 p-1.5 outline-none transition-colors ${
                                        (order.status || order.order_status) === 'delivered'
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : (order.status || order.order_status) === 'pending'
                                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                                          : (order.status || order.order_status) === 'confirmed'
                                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                                          : (order.status || order.order_status) === 'processing'
                                          ? 'border-purple-200 bg-purple-50 text-purple-700'
                                          : (order.status || order.order_status) === 'shipped'
                                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                          : 'border-red-200 bg-red-50 text-red-700'
                                      }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="confirmed">Confirmed</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. USERS TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 px-1">
                      <div>
                        <h3 className="text-lg font-bold text-text-dark">Registered Users ({usersList.length})</h3>
                        <p className="text-xs text-text-light">Real authenticated users from public.profiles</p>
                      </div>
                      <span className="text-xs text-text-light font-medium">
                        {isSuperAdmin ? 'Super Admin Mode: You can manage administrator privileges' : 'Admin Mode (View Only)'}
                      </span>
                    </div>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {usersList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <Users className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                          <h4 className="text-base font-bold text-text-dark mb-1">No registered users yet.</h4>
                          <p className="text-xs text-text-light">Users will appear here as they register on MilkMaatu.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse text-text-dark">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Name & Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Address</th>
                                <th className="p-4">Registration Date</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {usersList.map((usr) => (
                                <tr key={usr.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 font-bold">
                                    <p className="text-sm font-black">{usr.name || usr.full_name || 'Farmer'}</p>
                                    {usr.email ? (
                                      <a href={`mailto:${usr.email}`} className="text-xs text-primary-dark hover:underline font-normal">
                                        {usr.email}
                                      </a>
                                    ) : (
                                      <p className="text-xs text-text-light font-normal">No email</p>
                                    )}
                                  </td>
                                  <td className="p-4 text-xs font-bold">
                                    {(usr.phone || usr.phone_number) ? (
                                      <a href={`tel:${usr.phone || usr.phone_number}`} className="text-text-dark hover:underline">
                                        {usr.phone || usr.phone_number}
                                      </a>
                                    ) : (
                                      <span className="text-text-light">-</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                      usr.role === 'super_admin'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : usr.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                      {usr.role === 'super_admin' ? 'Super Admin' : usr.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs">{usr.address || '-'}</td>
                                  <td className="p-4 text-xs text-text-light">
                                    {(usr.created_at || usr.createdAt) ? new Date(usr.created_at || usr.createdAt).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="p-4 text-right">
                                    {isSuperAdmin && usr.id !== currentUser?.id && usr.role !== 'super_admin' && (
                                      <button
                                        onClick={() => handleToggleAdminRole(usr.id, usr.role)}
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors ${
                                          usr.role === 'admin'
                                            ? 'text-purple-600 border-purple-200 hover:bg-purple-50'
                                            : 'text-amber-600 border-amber-200 hover:bg-amber-50'
                                        }`}
                                      >
                                        {usr.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                                      </button>
                                    )}
                                    {usr.role === 'super_admin' && (
                                      <span className="text-[11px] text-amber-600 font-bold">Super Admin</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. CATTLE TAB */}
                {activeTab === 'cattle' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center px-1">
                      <div>
                        <h3 className="text-lg font-bold text-text-dark">Cattle Listings ({cattleList.length})</h3>
                        <p className="text-xs text-text-light">Real Sante marketplace postings</p>
                      </div>
                    </div>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {cattleList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <Tag className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                          <h4 className="text-base font-bold text-text-dark mb-1">No cattle listings available.</h4>
                          <p className="text-xs text-text-light">Farmer Sante cattle postings will appear here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse text-text-dark">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Breed & Listing</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Seller Contact</th>
                                <th className="p-4">Location / Sante</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {cattleList.map((post) => (
                                <tr key={post.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 font-bold flex items-center gap-3">
                                    {(post.image || post.image_url) ? (
                                      <img src={post.image || post.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-bg-light flex items-center justify-center text-xs text-text-light font-bold">
                                        🐄
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-black">{post.animalName || post.animal_name}</p>
                                      <p className="text-xs text-text-light font-normal">
                                        ID #{post.id} • {post.age} yrs old • {post.milkCapacity || post.milk_capacity}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-4 font-extrabold text-primary-dark">₹{(post.price ?? 0).toLocaleString()}</td>
                                  <td className="p-4 text-xs font-bold">
                                    <p>{post.sellerName || 'Farmer'}</p>
                                    <p className="text-text-light font-normal">{post.contactNumber || post.phone_number || post.phone}</p>
                                  </td>
                                  <td className="p-4 text-xs">
                                    <p className="font-semibold">{post.villageName || post.village}</p>
                                    <p className="text-text-light text-[11px]">{post.santeName || post.sante_name || 'Local Sante'}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                      post.status === 'expired' || post.isExpired
                                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {post.status === 'expired' || post.isExpired ? 'Expired' : 'Active'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right whitespace-nowrap">
                                    <button
                                      onClick={() => handleDeleteCattle(post.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
                                      title="Delete Cattle Post"
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. MODERATION TAB */}
                {activeTab === 'moderation' && (
                  <div className="space-y-4 animate-slide-up">
                    <h3 className="text-lg font-bold text-text-dark px-1">Compliance & Content Moderation ({reportsList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {reportsList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                          <h4 className="text-base font-bold text-text-dark mb-1">No reports filed yet.</h4>
                          <p className="text-xs text-text-light">Flagged cattle listings will appear here for review.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse text-text-dark">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Reported Listing</th>
                                <th className="p-4">Reporter</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {reportsList.map((report) => (
                                <tr key={report.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 align-top">
                                    <p className="font-bold text-sm">{report.cattleName || report.cattle_name || 'Listing'}</p>
                                    <p className="text-xs text-text-light">Listing ID: {report.cattleId || report.cattle_id}</p>
                                    {(report.sellerPhone || report.seller_phone) && (report.sellerPhone || report.seller_phone) !== 'N/A' && (
                                      <p className="text-xs font-semibold mt-1">Seller: {report.sellerPhone || report.seller_phone}</p>
                                    )}
                                  </td>
                                  <td className="p-4 align-top">
                                    <p className="font-semibold text-xs">{report.reporterName || report.reporter_name || 'Anonymous'}</p>
                                    <p className="text-xs text-text-light">{report.reporterPhone || report.reporter_phone || 'N/A'}</p>
                                  </td>
                                  <td className="p-4 align-top text-xs font-semibold max-w-[200px] break-words">
                                    {t(`compliance.${report.reason}`) || report.reason}
                                  </td>
                                  <td className="p-4 align-top">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                      report.status === 'pending'
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                        : report.status === 'dismissed'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                      {report.status}
                                    </span>
                                  </td>
                                  <td className="p-4 align-top text-right">
                                    {report.status === 'pending' ? (
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => handleDismissReport(report.id)}
                                          className="text-xs font-bold text-text-light hover:text-text-dark bg-bg-light hover:bg-border-light border border-border-light px-2.5 py-1.5 rounded-lg transition-all"
                                        >
                                          Dismiss
                                        </button>
                                        <button
                                          onClick={() => handleActionReport(report.id)}
                                          className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-all"
                                        >
                                          Take Action
                                        </button>
                                        {(report.sellerPhone || report.seller_phone) && (report.sellerPhone || report.seller_phone) !== 'N/A' && (
                                          <button
                                            onClick={() => handleSuspendUser(report.sellerPhone || report.seller_phone)}
                                            className="text-xs font-bold text-red-800 hover:text-white hover:bg-red-800 border border-red-800/20 hover:border-red-800 px-2.5 py-1.5 rounded-lg transition-all"
                                          >
                                            Suspend
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-text-light italic">No action needed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEED PRODUCT ADD/EDIT MODAL */}
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-text-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-border-light shadow-2xl relative" padding="lg">
            <button
              onClick={() => setIsFeedModalOpen(false)}
              className="absolute top-4 right-4 text-text-light hover:text-text-dark p-1 rounded-full hover:bg-bg-light transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-text-dark mb-6">
              {editingFeed ? 'Edit Feed Product' : 'Add Feed Product'}
            </h3>

            <form onSubmit={handleFeedSubmit} className="space-y-4">
              <Input
                label="Product Name"
                placeholder="e.g. Dairy Cattle Feed"
                value={feedFormData.name}
                onChange={(e) => setFeedFormData({ ...feedFormData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (₹)"
                  placeholder="e.g. 850"
                  type="number"
                  value={feedFormData.price}
                  onChange={(e) => setFeedFormData({ ...feedFormData, price: e.target.value })}
                  required
                />
                <Input
                  label="Unit"
                  placeholder="e.g. 50 kg / 25 kg"
                  value={feedFormData.unit}
                  onChange={(e) => setFeedFormData({ ...feedFormData, unit: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">Category</label>
                  <select
                    value={feedFormData.category}
                    onChange={(e) => setFeedFormData({ ...feedFormData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none text-sm bg-white"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Fodder">Fodder</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Hay">Hay</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Protein">Protein</option>
                  </select>
                </div>
                <Input
                  label="Stock Quantity"
                  placeholder="e.g. 100"
                  type="number"
                  value={feedFormData.stock_quantity}
                  onChange={(e) => setFeedFormData({ ...feedFormData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-xs text-text-light font-bold uppercase mb-1">Product Image</label>
                {feedFormData.image ? (
                  <div className="relative w-full max-w-[200px] aspect-[4/5] overflow-hidden rounded-lg mt-1 border-2 border-border-light">
                    <img
                      src={feedFormData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFeedFormData({ ...feedFormData, image: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-primary hover:bg-primary-light/20 rounded-lg cursor-pointer transition-colors bg-bg-light text-center mt-1">
                    <Plus className="w-6 h-6 text-primary-dark mb-1" />
                    <span className="text-xs text-text-dark font-bold">Upload Product Image</span>
                    <span className="text-[10px] text-text-light mt-0.5">JPEG, PNG allowed</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center gap-2.5 py-1 bg-bg-light/40 px-3 rounded-lg border border-border-light">
                <input
                  type="checkbox"
                  id="is_hidden"
                  checked={feedFormData.is_hidden}
                  onChange={(e) => setFeedFormData({ ...feedFormData, is_hidden: e.target.checked })}
                  className="w-4.5 h-4.5 accent-primary-dark cursor-pointer rounded"
                />
                <label htmlFor="is_hidden" className="text-xs text-text-dark font-extrabold cursor-pointer select-none">
                  Hide this product from customer shop
                </label>
              </div>

              <div>
                <label className="block text-xs text-text-light font-bold uppercase mb-1">Description</label>
                <textarea
                  value={feedFormData.description}
                  onChange={(e) => setFeedFormData({ ...feedFormData, description: e.target.value })}
                  placeholder="High nutrition dairy cattle feed enriched with minerals and vitamins..."
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none resize-none text-sm"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-4 font-bold">
                {editingFeed ? 'Update Feed Product' : 'Add Feed Product'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

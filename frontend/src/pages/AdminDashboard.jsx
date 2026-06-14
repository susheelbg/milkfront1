import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { adminApi } from '../services/api/adminApi';
import { feedsApi } from '../services/api/feedsApi';
import { orderApi } from '../services/api/orderApi';
import { cattleApi } from '../services/api/cattleApi';
import { reportApi } from '../services/api/reportApi';
import { toastService } from '../services/toastService';
import { authApi } from '../services/api/authApi';
import { BarChart3, Users, ClipboardList, Trash2, Edit, Plus, X, Tag, IndianRupee, Layers, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, feeds, users, orders, cattle
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    description: '',
    category: 'Dairy',
    image: '',
    is_hidden: false,
  });

  useEffect(() => {
    // Admin check
    const currentUser = authApi.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      toastService.error('Unauthorized. Admin access only.');
      navigate('/home');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, ordersData, feedsDataRes, cattleData, reportsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        orderApi.getOrders(),
        feedsApi.getAdminFeeds(),
        cattleApi.getCattleListings(),
        reportApi.getReports(),
      ]);

      setStats(statsData);
      setUsersList(usersData);
      setOrdersList(ordersData);
      setFeedsList(feedsDataRes);
      setCattleList(cattleData);
      if (reportsData && reportsData.success) {
        setReportsList(reportsData.data || []);
      } else {
        setReportsList(reportsData || []);
      }
    } catch (err) {
      toastService.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      const res = await reportApi.dismissReport(reportId);
      if (res && res.success) {
        toastService.success('Report dismissed successfully.');
        loadData();
      } else {
        toastService.error(res?.message || 'Failed to dismiss report.');
      }
    } catch (e) {
      toastService.error('Failed to dismiss report.');
    }
  };

  const handleActionReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
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

  const handleUnsuspendUser = async (phone) => {
    try {
      const res = await reportApi.unsuspendUser(phone);
      if (res && res.success) {
        toastService.success('User account restored.');
        loadData();
      } else {
        toastService.error(res?.message || 'Failed to restore user.');
      }
    } catch (e) {
      toastService.error('Failed to restore user.');
    }
  };

  // Status updates
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      toastService.success(`Order ${orderId} status set to ${newStatus}`);
      loadData();
    } catch (e) {
      toastService.error('Failed to update status.');
    }
  };

  // Feed Actions
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

  const openAddFeed = () => {
    setEditingFeed(null);
    setFeedFormData({ name: '', price: '', description: '', category: 'Dairy', image: '', is_hidden: false });
    setIsFeedModalOpen(true);
  };

  const openEditFeed = (feed) => {
    setEditingFeed(feed);
    setFeedFormData({
      name: feed.name,
      price: feed.price.toString(),
      description: feed.description,
      category: feed.category,
      image: feed.image,
      is_hidden: feed.is_hidden || false,
    });
    setIsFeedModalOpen(true);
  };

  const handleFeedSubmit = async (e) => {
    e.preventDefault();
    if (!feedFormData.name || !feedFormData.price) {
      toastService.error('Please enter name and price');
      return;
    }

    try {
      if (editingFeed) {
        await feedsApi.updateFeed(editingFeed.id, feedFormData);
        toastService.success('Feed item updated.');
      } else {
        await feedsApi.createFeed(feedFormData);
        toastService.success('New feed catalog item added.');
      }
      setIsFeedModalOpen(false);
      loadData();
    } catch (e) {
      toastService.error('Operation failed.');
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (!window.confirm('Delete this feed product item?')) return;
    try {
      await feedsApi.deleteFeed(feedId);
      toastService.success('Product deleted.');
      loadData();
    } catch (e) {
      toastService.error('Failed to delete feed.');
    }
  };

  const handleToggleHideFeed = async (feed) => {
    try {
      await feedsApi.updateFeed(feed.id, {
        name: feed.name,
        price: feed.price,
        description: feed.description,
        category: feed.category,
        image: feed.image,
        is_hidden: !feed.is_hidden,
      });
      toastService.success(feed.is_hidden ? 'Feed product is now visible to customers.' : 'Feed product has been hidden from customers.');
      loadData();
    } catch (e) {
      toastService.error('Failed to toggle visibility.');
    }
  };

  // Cattle Delete
  const handleDeleteCattle = async (id) => {
    if (!window.confirm('Delete this cattle listing?')) return;
    try {
      await cattleApi.deleteCattleListing(id);
      toastService.success('Cattle listing deleted.');
      loadData();
    } catch (e) {
      toastService.error('Failed to delete listing.');
    }
  };

  const tabs = [
    { id: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { id: 'feeds', label: t('admin.products'), icon: Layers },
    { id: 'orders', label: t('admin.orders'), icon: ClipboardList },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'cattle', label: t('admin.cattle'), icon: Users },
    { id: 'moderation', label: t('compliance.adminModeration'), icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-text-dark text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('admin.dashboard')}</h1>
            <p className="text-gray-400 text-sm mt-0.5">Control panel & analytics</p>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl border border-white/20 transition-all"
          >
            Refresh Database
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
                <p className="font-semibold text-sm">{t('common.loading')}</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && stats && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Stats Blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">{t('admin.totalRevenue')}</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">{t('admin.activeFeeds')}</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.feedsCount}</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">{t('admin.pendingOrders')}</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.ordersCount}</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">{t('admin.activeCattle')}</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.cattleCount}</p>
                      </Card>
                    </div>

                    {/* Stats Info */}
                    <Card padding="lg" className="border border-border-light">
                      <h3 className="text-lg font-bold text-text-dark mb-3">Quick Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="primary" size="md" onClick={openAddFeed}>
                          + {t('admin.addProduct')}
                        </Button>
                        <Button variant="secondary" size="md" onClick={() => setActiveTab('orders')}>
                          View Orders List
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 2. FEEDS CATALOG TAB */}
                {activeTab === 'feeds' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-lg font-bold text-text-dark">{t('admin.products')} ({feedsList.length})</h3>
                      <Button variant="primary" size="sm" onClick={openAddFeed}>
                        + {t('admin.addProduct')}
                      </Button>
                    </div>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-dark border-collapse">
                          <thead>
                            <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                              <th className="p-4">Product</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Price</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-light">
                            {feedsList.map((feed) => (
                              <tr key={feed.id} className="hover:bg-bg-light/40 transition-colors">
                                <td className="p-4 font-bold flex items-center gap-3">
                                  <img src={feed.image} alt="" className="w-9 h-9 rounded object-cover" />
                                  <div>
                                    <p className="text-sm font-black">{feed.name}</p>
                                    <p className="text-xs text-text-light font-normal line-clamp-1">{feed.description}</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="bg-bg-light text-text-dark border border-border-light px-2.5 py-1 rounded text-xs font-semibold">
                                    {feed.category}
                                  </span>
                                  {feed.is_hidden && (
                                    <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black uppercase ml-1.5" title="Hidden from customers">
                                      Hidden
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 font-bold text-primary-dark">₹{feed.price}</td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleToggleHideFeed(feed)}
                                    className={`p-1.5 rounded transition-colors inline-block ${
                                      feed.is_hidden 
                                        ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' 
                                        : 'text-text-light hover:text-text-dark hover:bg-bg-light'
                                    }`}
                                    title={feed.is_hidden ? 'Make visible to customers' : 'Hide from customers'}
                                  >
                                    {feed.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                  <button
                                    onClick={() => openEditFeed(feed)}
                                    className="p-1.5 text-text-light hover:text-text-dark hover:bg-bg-light rounded transition-colors inline-block"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFeed(feed.id)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-block"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ORDERS LIST TAB */}
                {activeTab === 'orders' && (
                  <div className="space-y-4 animate-slide-up">
                    <h3 className="text-lg font-bold text-text-dark px-1">{t('admin.orders')} ({ordersList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {ordersList.length === 0 ? (
                        <p className="text-center text-text-light text-sm py-12">{t('admin.noOrders')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Buyer Info</th>
                                <th className="p-4">Address</th>
                                <th className="p-4">Cart items</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light text-text-dark">
                              {ordersList.map((order) => (
                                <tr key={order.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 align-top">
                                    <p className="font-extrabold text-sm">{order.customerName}</p>
                                    <p className="text-xs text-text-light">{order.phoneNumber}</p>
                                  </td>
                                  <td className="p-4 align-top max-w-[200px]">
                                    <p className="text-xs font-semibold">{order.villageName}</p>
                                    <p className="text-xs text-text-light mt-0.5 line-clamp-2">{order.address}</p>
                                  </td>
                                  <td className="p-4 align-top text-xs">
                                    <div className="space-y-1">
                                      {order.items?.map((item, idx) => (
                                        <p key={idx}>
                                          <span className="font-bold text-text-dark">{item.name}</span>
                                          <span className="bg-primary-light text-text-dark font-black px-1 py-0.5 rounded ml-1 text-[10px]">
                                            ×{item.quantity}
                                          </span>
                                        </p>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-4 align-top font-bold text-primary-dark">
                                    ₹{order.totalPrice?.toLocaleString()}
                                  </td>
                                  <td className="p-4 align-top">
                                    <select
                                      value={order.status}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      className={`text-xs font-bold rounded-lg border-2 p-1.5 outline-none transition-colors ${
                                        order.status === 'delivered'
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : order.status === 'pending'
                                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                                          : 'border-blue-200 bg-blue-50 text-blue-700'
                                      }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="confirmed">Confirmed</option>
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
                    <h3 className="text-lg font-bold text-text-dark px-1">{t('admin.users')} ({usersList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse text-text-dark">
                          <thead>
                            <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                              <th className="p-4">Full name</th>
                              <th className="p-4">Phone number</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Village</th>
                              <th className="p-4">Registered Date</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-light">
                            {usersList.map((usr, idx) => (
                              <tr key={idx} className="hover:bg-bg-light/40 transition-colors">
                                <td className="p-4 font-bold">{usr.name}</td>
                                <td className="p-4 text-xs font-bold">{usr.phone}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    usr.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                    {usr.role || 'user'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    (usr.accountStatus || usr.account_status) === 'suspended'
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : (usr.accountStatus || usr.account_status) === 'deleted'
                                      ? 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {usr.accountStatus || usr.account_status || 'active'}
                                  </span>
                                </td>
                                <td className="p-4 text-xs">{usr.villageName || '-'}</td>
                                <td className="p-4 text-xs text-text-light">{usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : '-'}</td>
                                <td className="p-4 text-right">
                                  {usr.role !== 'admin' && (usr.accountStatus || usr.account_status) !== 'deleted' && (
                                    (usr.accountStatus || usr.account_status) === 'suspended' ? (
                                      <button
                                        onClick={() => handleUnsuspendUser(usr.phone)}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                                      >
                                        {t('compliance.unsuspend')}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSuspendUser(usr.phone)}
                                        className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded border border-red-200 transition-colors"
                                      >
                                        {t('compliance.suspend')}
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. CATTLE TAB */}
                {activeTab === 'cattle' && (
                  <div className="space-y-4 animate-slide-up">
                    <h3 className="text-lg font-bold text-text-dark px-1">{t('admin.cattle')} ({cattleList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {cattleList.length === 0 ? (
                        <p className="text-center text-text-light text-sm py-12">{t('admin.noCattle')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse text-text-dark">
                            <thead>
                              <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                                <th className="p-4">Breed/Cattle</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Village</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                              {cattleList.map((post) => (
                                <tr key={post.id} className="hover:bg-bg-light/40 transition-colors">
                                  <td className="p-4 font-bold flex items-center gap-3">
                                    <img src={post.image} alt="" className="w-10 h-10 rounded object-cover" />
                                    <div>
                                      <p className="text-sm font-black">{post.animalName}</p>
                                      <p className="text-xs text-text-light font-normal">{post.age} yrs old • {post.milkCapacity}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 font-extrabold text-primary-dark">₹{post.price.toLocaleString()}</td>
                                  <td className="p-4 text-xs">{post.villageName}</td>
                                  <td className="p-4 text-xs font-bold">{post.contactNumber}</td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => handleDeleteCattle(post.id)}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-block"
                                      title="Delete Post"
                                    >
                                      <Trash2 size={16} />
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
                    <h3 className="text-lg font-bold text-text-dark px-1">{t('compliance.adminModeration')} ({reportsList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {reportsList.length === 0 ? (
                        <p className="text-center text-text-light text-sm py-12">{t('compliance.noReports')}</p>
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
                                    <p className="font-bold text-sm">{report.cattleName}</p>
                                    <p className="text-xs text-text-light">Listing ID: {report.cattleId}</p>
                                    {report.sellerPhone && report.sellerPhone !== 'N/A' && (
                                      <p className="text-xs font-semibold mt-1">Seller: {report.sellerPhone}</p>
                                    )}
                                  </td>
                                  <td className="p-4 align-top">
                                    <p className="font-semibold text-xs">{report.reporterName}</p>
                                    <p className="text-xs text-text-light">{report.reporterPhone}</p>
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
                                          {t('compliance.dismiss')}
                                        </button>
                                        <button
                                          onClick={() => handleActionReport(report.id)}
                                          className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-all"
                                        >
                                          {t('compliance.takeAction')}
                                        </button>
                                        {report.sellerPhone && report.sellerPhone !== 'N/A' && (
                                          <button
                                            onClick={() => handleSuspendUser(report.sellerPhone)}
                                            className="text-xs font-bold text-red-800 hover:text-white hover:bg-red-800 border border-red-800/20 hover:border-red-800 px-2.5 py-1.5 rounded-lg transition-all"
                                          >
                                            {t('compliance.suspend')}
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
              className="absolute top-4 right-4 text-text-light hover:text-text-dark"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-text-dark mb-6">
              {editingFeed ? t('admin.editProduct') : t('admin.addProduct')}
            </h3>

            <form onSubmit={handleFeedSubmit} className="space-y-4">
              <Input
                label={t('admin.productName')}
                placeholder={t('admin.productNamePlaceholder')}
                value={feedFormData.name}
                onChange={(e) => setFeedFormData({ ...feedFormData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('admin.price')}
                  placeholder="e.g. 500"
                  type="number"
                  value={feedFormData.price}
                  onChange={(e) => setFeedFormData({ ...feedFormData, price: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('admin.category')}</label>
                  <select
                    value={feedFormData.category}
                    onChange={(e) => setFeedFormData({ ...feedFormData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none text-sm"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Fodder">Fodder</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Hay">Hay</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Protein">Protein</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('admin.image')}</label>
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
              <div className="flex items-center gap-2.5 py-1 bg-bg-light/40 px-1 rounded">
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
                <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('admin.description')}</label>
                <textarea
                  value={feedFormData.description}
                  onChange={(e) => setFeedFormData({ ...feedFormData, description: e.target.value })}
                  placeholder="Details of feed ingredients..."
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none resize-none text-sm"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-4 font-bold">
                {editingFeed ? t('admin.update') : t('admin.add')}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

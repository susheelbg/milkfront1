import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { adminApi } from '../services/api/adminApi';
import { feedsApi } from '../services/api/feedsApi';
import { orderApi } from '../services/api/orderApi';
import { cattleApi } from '../services/api/cattleApi';
import { toastService } from '../services/toastService';
import { authApi } from '../services/api/authApi';
import { BarChart3, Users, ClipboardList, Trash2, Edit, Plus, X, Tag, IndianRupee, Layers } from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, feeds, users, orders, cattle
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [feedsList, setFeedsList] = useState([]);
  const [cattleList, setCattleList] = useState([]);

  // Form states (Feed Add/Edit)
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [feedFormData, setFeedFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Dairy',
    image: '',
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
      const [statsData, usersData, ordersData, feedsDataRes, cattleData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        orderApi.getOrders(),
        feedsApi.getFeeds(),
        cattleApi.getCattleListings(),
      ]);

      setStats(statsData);
      setUsersList(usersData);
      setOrdersList(ordersData);
      setFeedsList(feedsDataRes);
      setCattleList(cattleData);
    } catch (err) {
      toastService.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
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
  const openAddFeed = () => {
    setEditingFeed(null);
    setFeedFormData({ name: '', price: '', description: '', category: 'Dairy', image: '' });
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
    { id: 'overview', label: 'Stats Overview', icon: BarChart3 },
    { id: 'feeds', label: 'Feeds Catalog', icon: Layers },
    { id: 'orders', label: 'Orders List', icon: ClipboardList },
    { id: 'users', label: 'Users Base', icon: Users },
    { id: 'cattle', label: 'Cattle Sante', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-text-dark text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage MilkMaatu feed supply, sante ads, and customer orders</p>
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
                <p className="font-semibold text-sm">Refreshing dashboard data...</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && stats && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Stats Blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">Total Revenue</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">Feed Catalog Size</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.feedsCount} Items</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">Placed Orders</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.ordersCount} Orders</p>
                      </Card>
                      <Card className="border border-border-light" padding="md">
                        <p className="text-[10px] text-text-light font-bold uppercase">Sante Cattle Ads</p>
                        <p className="text-2xl font-black text-text-dark mt-1">{stats.cattleCount} Active</p>
                      </Card>
                    </div>

                    {/* Stats Info */}
                    <Card padding="lg" className="border border-border-light">
                      <h3 className="text-lg font-bold text-text-dark mb-3">Quick Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="primary" size="md" onClick={openAddFeed}>
                          + Add Feed Product
                        </Button>
                        <Button variant="secondary" size="md" onClick={() => setActiveTab('orders')}>
                          View Unconfirmed Orders
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 2. FEEDS CATALOG TAB */}
                {activeTab === 'feeds' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-lg font-bold text-text-dark">Feeds catalog ({feedsList.length})</h3>
                      <Button variant="primary" size="sm" onClick={openAddFeed}>
                        + Add Feed Product
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
                                </td>
                                <td className="p-4 font-bold text-primary-dark">₹{feed.price}</td>
                                <td className="p-4 text-right space-x-2">
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
                                    title="Delete"
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
                    <h3 className="text-lg font-bold text-text-dark px-1">Orders Tracker ({ordersList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {ordersList.length === 0 ? (
                        <p className="text-center text-text-light text-sm py-12">No orders recorded yet.</p>
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
                                    <p className="text-[10px] text-text-light font-bold mt-1 uppercase">{order.id}</p>
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
                    <h3 className="text-lg font-bold text-text-dark px-1">Registered Users ({usersList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse text-text-dark">
                          <thead>
                            <tr className="bg-bg-light border-b border-border-light text-xs font-bold text-text-light uppercase">
                              <th className="p-4">Full name</th>
                              <th className="p-4">Phone number</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Village</th>
                              <th className="p-4">Registered Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-light">
                            {usersList.map((usr, idx) => (
                              <tr key={idx} className="hover:bg-bg-light/40 transition-colors">
                                <td className="p-4 font-bold">{usr.name}</td>
                                <td className="p-4 text-xs font-bold">{usr.phone}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    usr.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="p-4 text-xs">{usr.villageName || '-'}</td>
                                <td className="p-4 text-xs text-text-light">{new Date(usr.createdAt).toLocaleDateString()}</td>
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
                    <h3 className="text-lg font-bold text-text-dark px-1">Active Cattle Marketplace Posts ({cattleList.length})</h3>

                    <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-xs">
                      {cattleList.length === 0 ? (
                        <p className="text-center text-text-light text-sm py-12">No active cattle posts found.</p>
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
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEED PRODUCT ADD/EDIT MODAL */}
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-text-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md border border-border-light shadow-2xl relative" padding="lg">
            <button
              onClick={() => setIsFeedModalOpen(false)}
              className="absolute top-4 right-4 text-text-light hover:text-text-dark"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-text-dark mb-6">
              {editingFeed ? 'Edit Feed Product' : 'Add Feed Product'}
            </h3>

            <form onSubmit={handleFeedSubmit} className="space-y-4">
              <Input
                label="Product Name"
                placeholder="e.g. Premium Cow Supplement"
                value={feedFormData.name}
                onChange={(e) => setFeedFormData({ ...feedFormData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (₹ per bag)"
                  placeholder="e.g. 500"
                  type="number"
                  value={feedFormData.price}
                  onChange={(e) => setFeedFormData({ ...feedFormData, price: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">Category</label>
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

              <Input
                label="Image URL (Optional)"
                placeholder="https://..."
                value={feedFormData.image}
                onChange={(e) => setFeedFormData({ ...feedFormData, image: e.target.value })}
              />

              <div>
                <label className="block text-xs text-text-light font-bold uppercase mb-1">Description</label>
                <textarea
                  value={feedFormData.description}
                  onChange={(e) => setFeedFormData({ ...feedFormData, description: e.target.value })}
                  placeholder="Details of feed ingredients..."
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none resize-none text-sm"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-4 font-bold">
                {editingFeed ? 'Update Product' : 'Add Catalog Product'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

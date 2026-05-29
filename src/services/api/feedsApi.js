import { apiClient, mockDelay } from './apiClient';

export const feedsApi = {
  // Retrieve list of feeds
  getFeeds: async () => {
    try {
      return await apiClient.get('/feeds');
    } catch (err) {
      await mockDelay(600);
      return JSON.parse(localStorage.getItem('mock_feeds') || '[]');
    }
  },

  // Create new feed (Admin action)
  createFeed: async (feedData) => {
    try {
      return await apiClient.post('/feeds', feedData);
    } catch (err) {
      await mockDelay(800);
      const feeds = JSON.parse(localStorage.getItem('mock_feeds') || '[]');
      
      const newFeed = {
        id: feeds.length > 0 ? Math.max(...feeds.map(f => f.id)) + 1 : 1,
        name: feedData.name,
        price: parseFloat(feedData.price),
        description: feedData.description,
        image: feedData.image || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
        category: feedData.category || 'General',
      };

      feeds.push(newFeed);
      localStorage.setItem('mock_feeds', JSON.stringify(feeds));
      return newFeed;
    }
  },

  // Update existing feed (Admin action)
  updateFeed: async (id, feedData) => {
    try {
      return await apiClient.put(`/feeds/${id}`, feedData);
    } catch (err) {
      await mockDelay(800);
      const feeds = JSON.parse(localStorage.getItem('mock_feeds') || '[]');
      const index = feeds.findIndex(f => f.id === parseInt(id));
      
      if (index !== -1) {
        feeds[index] = {
          ...feeds[index],
          name: feedData.name || feeds[index].name,
          price: feedData.price !== undefined ? parseFloat(feedData.price) : feeds[index].price,
          description: feedData.description || feeds[index].description,
          image: feedData.image || feeds[index].image,
          category: feedData.category || feeds[index].category,
        };
        localStorage.setItem('mock_feeds', JSON.stringify(feeds));
        return feeds[index];
      }
      throw new Error(`Feed with ID ${id} not found`);
    }
  },

  // Delete feed (Admin action)
  deleteFeed: async (id) => {
    try {
      return await apiClient.delete(`/feeds/${id}`);
    } catch (err) {
      await mockDelay(600);
      const feeds = JSON.parse(localStorage.getItem('mock_feeds') || '[]');
      const filtered = feeds.filter(f => f.id !== parseInt(id));
      localStorage.setItem('mock_feeds', JSON.stringify(filtered));
      return { success: true, message: 'Feed deleted successfully' };
    }
  },
};

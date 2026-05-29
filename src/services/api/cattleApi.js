import { apiClient, mockDelay } from './apiClient';

export const cattleApi = {
  // Get active cattle posts
  getCattleListings: async (santeName = null) => {
    try {
      const url = santeName ? `/cattle?sante=${encodeURIComponent(santeName)}` : '/cattle';
      return await apiClient.get(url);
    } catch (err) {
      await mockDelay(600);
      const posts = JSON.parse(localStorage.getItem('mock_cattle') || '[]');
      
      // Filter out posts that are expired (e.g. older than 24 hours)
      const validPosts = posts.filter(post => {
        return new Date(post.expiresAt) > new Date();
      });

      if (santeName) {
        return validPosts.filter(p => p.santeName === santeName);
      }
      return validPosts;
    }
  },

  // Create cattle listing
  createCattleListing: async (cattleData) => {
    try {
      return await apiClient.post('/cattle', cattleData);
    } catch (err) {
      await mockDelay(800);
      const posts = JSON.parse(localStorage.getItem('mock_cattle') || '[]');
      
      const newPost = {
        id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
        animalName: cattleData.animalName,
        price: parseInt(cattleData.price),
        age: parseInt(cattleData.age),
        milkCapacity: cattleData.milkCapacity,
        contactNumber: cattleData.contactNumber,
        villageName: cattleData.villageName,
        santeName: cattleData.santeName,
        description: cattleData.description,
        image: cattleData.image || 'https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop',
        postedDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // expires in 24 hours
      };

      posts.push(newPost);
      localStorage.setItem('mock_cattle', JSON.stringify(posts));
      return newPost;
    }
  },

  // Search cattle posts
  searchCattleListings: async (query, santeName = null) => {
    try {
      const url = `/cattle/search?q=${encodeURIComponent(query)}` + (santeName ? `&sante=${encodeURIComponent(santeName)}` : '');
      return await apiClient.get(url);
    } catch (err) {
      await mockDelay(400);
      const posts = await cattleApi.getCattleListings(santeName);
      const lowerQuery = query.toLowerCase();
      
      return posts.filter(post => 
        post.animalName.toLowerCase().includes(lowerQuery) ||
        post.villageName.toLowerCase().includes(lowerQuery) ||
        post.description.toLowerCase().includes(lowerQuery)
      );
    }
  },

  // Delete cattle post (Admin/Owner action)
  deleteCattleListing: async (id) => {
    try {
      return await apiClient.delete(`/cattle/${id}`);
    } catch (err) {
      await mockDelay(600);
      const posts = JSON.parse(localStorage.getItem('mock_cattle') || '[]');
      const filtered = posts.filter(p => p.id !== parseInt(id));
      localStorage.setItem('mock_cattle', JSON.stringify(filtered));
      return { success: true, message: 'Listing deleted successfully' };
    }
  },
};

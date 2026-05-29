// Service for managing orders
export const orderService = {
  createOrder: (orderData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const order = {
          id: 'ORD-' + Date.now(),
          ...orderData,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        
        // Save to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        resolve(order);
      }, 1000);
    });
  },

  getOrders: () => {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
  },

  getOrderById: (id) => {
    const orders = orderService.getOrders();
    return orders.find(order => order.id === id);
  },
};

// Service for managing cattle posts
export const cattleService = {
  createPost: (postData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const post = {
          id: 'POST-' + Date.now(),
          ...postData,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        // Save to localStorage
        const posts = JSON.parse(localStorage.getItem('cattlePosts') || '[]');
        posts.push(post);
        localStorage.setItem('cattlePosts', JSON.stringify(posts));
        
        resolve(post);
      }, 800);
    });
  },

  getPosts: (santeName = null) => {
    const posts = JSON.parse(localStorage.getItem('cattlePosts') || '[]');
    
    // Filter out expired posts
    const validPosts = posts.filter(post => {
      return new Date(post.expiresAt) > new Date();
    });
    
    // Filter by sante if provided
    if (santeName) {
      return validPosts.filter(post => post.santeName === santeName);
    }
    
    return validPosts;
  },

  searchPosts: (query, santeName = null) => {
    let posts = cattleService.getPosts(santeName);
    
    const lowerQuery = query.toLowerCase();
    return posts.filter(post =>
      post.animalName.toLowerCase().includes(lowerQuery) ||
      post.villageName.toLowerCase().includes(lowerQuery) ||
      post.description.toLowerCase().includes(lowerQuery)
    );
  },

  getPostById: (id) => {
    const posts = JSON.parse(localStorage.getItem('cattlePosts') || '[]');
    return posts.find(post => post.id === id);
  },
};

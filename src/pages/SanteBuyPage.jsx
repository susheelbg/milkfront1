import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Card, Input } from '../components';
import { cattlePostsData } from '../data/dummyData';
import { Search, Filter } from 'lucide-react';

export const SanteBuyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const santeName = location.state?.santeName;

  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [showFilter, setShowFilter] = useState(false);

  // Filter posts by sante and search/price criteria
  const filteredPosts = useMemo(() => {
    let filtered = cattlePostsData.filter(post => post.santeName === santeName);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        post =>
          post.animalName.toLowerCase().includes(query) ||
          post.villageName.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
      );
    }

    filtered = filtered.filter(
      post => post.price >= priceRange.min && post.price <= priceRange.max
    );

    return filtered;
  }, [santeName, searchQuery, priceRange]);

  if (!santeName) {
    navigate('/sante');
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Header showBack onBack={() => navigate('/sante-action', { state: { santeName } })} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark mb-1">Buy Cattle</h1>
          <p className="text-text-dark opacity-90">{santeName}</p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-border-light sticky top-20 z-30 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-3 text-text-light" />
              <input
                type="text"
                placeholder="Search by animal name, village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-text-dark rounded-lg hover:opacity-80 transition-opacity"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="mt-4 p-4 bg-bg-light rounded-lg border border-border-light">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Min Price: ₹{priceRange.min}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        min: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Max Price: ₹{priceRange.max}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-text-dark mb-2">No Listings Found</h2>
            <p className="text-text-light mb-6">
              Try adjusting your search filters or check back later
            </p>
            <Button variant="primary" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <Card key={post.id} padding="0" hover className="overflow-hidden flex flex-col">
                {/* Image */}
                <img
                  src={post.image}
                  alt={post.animalName}
                  className="w-full h-48 object-cover"
                />

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-text-dark">
                      {post.animalName}
                    </h3>
                    <span className="bg-primary-light text-text-dark px-3 py-1 rounded-full text-sm font-bold">
                      {post.age} yrs
                    </span>
                  </div>

                  <p className="text-text-light text-sm mb-3">{post.villageName}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-bg-light p-2 rounded">
                      <p className="text-text-light text-xs">Milk Capacity</p>
                      <p className="font-bold text-text-dark">{post.milkCapacity}</p>
                    </div>
                    <div className="bg-bg-light p-2 rounded">
                      <p className="text-text-light text-xs">Price</p>
                      <p className="font-bold text-primary">₹{post.price}</p>
                    </div>
                  </div>

                  <p className="text-text-light text-sm mb-4 line-clamp-2">
                    {post.description}
                  </p>

                  {/* Contact Button */}
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full mb-2"
                    onClick={() => {
                      alert(
                        `Contact: ${post.contactNumber}\n\nPlease use this number to discuss the cattle details with the seller.`
                      );
                    }}
                  >
                    Contact Seller
                  </Button>

                  {/* Posted Date */}
                  <p className="text-text-light text-xs text-center">
                    Posted: {new Date(post.postedDate).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Info Banner */}
      <section className="bg-yellow-50 border-t border-border-light py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-text-dark">
            <span className="font-bold">⏰ Note:</span> Posts automatically delete after 24 hours. 
            Make sure to contact the seller quickly!
          </p>
        </div>
      </section>
    </div>
  );
};

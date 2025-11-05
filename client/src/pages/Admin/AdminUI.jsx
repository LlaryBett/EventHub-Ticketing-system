import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Image,
  BookOpen,
  Filter,
  Search,
  Monitor,
  ArrowUpDown
} from 'lucide-react';
import { uiService } from '../../services/uiService';

const AdminUI = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-slides');
  const [discoverData, setDiscoverData] = useState({
    heroSlides: [],
    categories: [],
    collections: [],
    quickFilters: []
  });

  // New item states - only empty templates
  const [newHeroSlide, setNewHeroSlide] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Explore Events',
    ctaLink: '/events',
    backgroundColor: 'from-blue-600 via-purple-600 to-pink-500',
    isActive: true,
    displayOrder: 0
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    icon: 'Music',
    colorGradient: 'from-purple-500 to-pink-500',
    image: '',
    isActive: true,
    displayOrder: 0
  });

  const [newCollection, setNewCollection] = useState({
    title: '',
    description: '',
    slug: '',
    icon: 'Heart',
    color: 'bg-pink-100 text-pink-600',
    isActive: true,
    displayOrder: 0
  });

  const [newFilter, setNewFilter] = useState({
    label: '',
    value: '',
    isActive: true,
    displayOrder: 0
  });

  // Available options for dropdowns only
  const availableIcons = [
    'Music', 'Trophy', 'Briefcase', 'Palette', 'UtensilsCrossed', 
    'Monitor', 'HeartPulse', 'Users', 'Heart', 'Users2', 
    'Handshake', 'Gift', 'Calendar', 'MapPin', 'Sparkles',
    'Flame', 'Target', 'Lightbulb'
  ];

  const colorGradients = [
    { value: 'from-purple-500 to-pink-500', label: 'Purple to Pink' },
    { value: 'from-green-500 to-teal-500', label: 'Green to Teal' },
    { value: 'from-blue-500 to-indigo-500', label: 'Blue to Indigo' },
    { value: 'from-orange-500 to-red-500', label: 'Orange to Red' },
    { value: 'from-yellow-500 to-orange-500', label: 'Yellow to Orange' },
    { value: 'from-cyan-500 to-blue-500', label: 'Cyan to Blue' },
    { value: 'from-green-400 to-emerald-500', label: 'Green to Emerald' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink to Rose' }
  ];

  const backgroundColors = [
    { value: 'from-blue-600 via-purple-600 to-pink-500', label: 'Blue-Purple-Pink' },
    { value: 'from-green-500 to-teal-500', label: 'Green to Teal' },
    { value: 'from-purple-600 to-blue-600', label: 'Purple to Blue' },
    { value: 'from-orange-500 to-red-500', label: 'Orange to Red' },
    { value: 'from-indigo-500 to-purple-600', label: 'Indigo to Purple' }
  ];

  const collectionColors = [
    { value: 'bg-pink-100 text-pink-600', label: 'Pink' },
    { value: 'bg-blue-100 text-blue-600', label: 'Blue' },
    { value: 'bg-purple-100 text-purple-600', label: 'Purple' },
    { value: 'bg-green-100 text-green-600', label: 'Green' },
    { value: 'bg-yellow-100 text-yellow-600', label: 'Yellow' },
    { value: 'bg-indigo-100 text-indigo-600', label: 'Indigo' }
  ];

  // Load discover data from backend only
  useEffect(() => {
    loadDiscoverData();
  }, []);

  const loadDiscoverData = async () => {
    try {
      setLoading(true);
      const response = await uiService.getDiscoverContent();
      if (response.success) {
        setDiscoverData(response.data);
      } else {
        console.error('Failed to load discover data:', response.error);
        alert('Failed to load discover page data from server');
      }
    } catch (error) {
      console.error('Error loading discover data:', error);
      alert('Error loading discover page data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const response = await uiService.updateDiscoverConfig(discoverData);
      if (response.success) {
        alert('Discover page updated successfully!');
        loadDiscoverData(); // Reload to get confirmed data from server
      } else {
        alert('Failed to update discover page: ' + response.error);
      }
    } catch (error) {
      console.error('Error saving discover data:', error);
      alert('Error saving discover page');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section) => {
    try {
      setSaving(true);
      const response = await uiService.updateSection(section, discoverData[section]);
      if (response.success) {
        alert(`${section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated successfully!`);
        loadDiscoverData(); // Reload to get confirmed data from server
      } else {
        alert(`Failed to update ${section}: ` + response.error);
      }
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      alert(`Error saving ${section}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeConfig = async () => {
    if (confirm('This will create a new discover configuration. Continue?')) {
      try {
        setLoading(true);
        // Create empty configuration - let backend handle defaults if needed
        const response = await uiService.createDiscoverConfig({
          heroSlides: [],
          categories: [],
          collections: [],
          quickFilters: []
        });
        
        if (response.success) {
          alert('Discover page configuration created successfully!');
          loadDiscoverData();
        } else {
          alert('Failed to create configuration: ' + response.error);
        }
      } catch (error) {
        console.error('Failed to create discover config:', error);
        alert('Failed to create discover page configuration');
      } finally {
        setLoading(false);
      }
    }
  };

  // Generic handlers for all sections
  const addItem = (section, newItem) => {
    setDiscoverData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { 
        ...newItem, 
        displayOrder: prev[section]?.length || 0 
      }]
    }));
  };

  const updateItem = (section, index, field, value) => {
    setDiscoverData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (section, index) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setDiscoverData(prev => ({
        ...prev,
        [section]: prev[section].filter((_, i) => i !== index)
      }));
    }
  };

  const toggleItemStatus = (section, index) => {
    setDiscoverData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, isActive: !item.isActive } : item
      )
    }));
  };

  const moveItem = (section, index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === discoverData[section].length - 1)) {
      return;
    }

    const newItems = [...discoverData[section]];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update display orders
    newItems.forEach((item, i) => {
      item.displayOrder = i;
    });

    setDiscoverData(prev => ({
      ...prev,
      [section]: newItems
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading discover page configuration...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'hero-slides', label: 'Hero Slides', icon: Image, description: 'Manage background images and content for the hero section' },
    { id: 'categories', label: 'Categories', icon: LayoutGrid, description: 'Manage event categories for the 3D carousel' },
    { id: 'collections', label: 'Collections', icon: BookOpen, description: 'Manage curated event collections' },
    { id: 'quick-filters', label: 'Quick Filters', icon: Filter, description: 'Manage search filters' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discover Page Manager</h1>
              <p className="text-gray-600">Manage the discover page content and layout</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInitializeConfig}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New Config
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex -mb-px">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {discoverData[section.id.replace('-', '')]?.length || 0}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Hero Slides Section */}
            {activeSection === 'hero-slides' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Hero Slides</h3>
                    <p className="text-gray-600">Manage the rotating hero section background images and content</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('heroSlides')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Slides'}
                  </button>
                </div>

                {/* Add New Hero Slide */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4">Add New Hero Slide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newHeroSlide.title}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Slide Title"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newHeroSlide.subtitle}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Slide Subtitle"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newHeroSlide.imageUrl}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Image URL"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newHeroSlide.backgroundColor}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {backgroundColors.map(color => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newHeroSlide.ctaText}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, ctaText: e.target.value }))}
                      placeholder="CTA Text"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newHeroSlide.ctaLink}
                      onChange={(e) => setNewHeroSlide(prev => ({ ...prev, ctaLink: e.target.value }))}
                      placeholder="CTA Link"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      addItem('heroSlides', newHeroSlide);
                      setNewHeroSlide({
                        title: '',
                        subtitle: '',
                        imageUrl: '',
                        ctaText: 'Explore Events',
                        ctaLink: '/events',
                        backgroundColor: 'from-blue-600 via-purple-600 to-pink-500',
                        isActive: true,
                        displayOrder: discoverData.heroSlides.length
                      });
                    }}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Hero Slide
                  </button>
                </div>

                {/* Existing Hero Slides */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Existing Hero Slides ({discoverData.heroSlides.length})</h4>
                  {discoverData.heroSlides.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hero slides configured yet. Add your first slide above.
                    </div>
                  ) : (
                    discoverData.heroSlides.map((slide, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateItem('heroSlides', index, 'title', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={slide.subtitle}
                            onChange={(e) => updateItem('heroSlides', index, 'subtitle', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={slide.imageUrl}
                            onChange={(e) => updateItem('heroSlides', index, 'imageUrl', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={slide.backgroundColor}
                            onChange={(e) => updateItem('heroSlides', index, 'backgroundColor', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {backgroundColors.map(color => (
                              <option key={color.value} value={color.value}>{color.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={slide.ctaText}
                            onChange={(e) => updateItem('heroSlides', index, 'ctaText', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={slide.ctaLink}
                            onChange={(e) => updateItem('heroSlides', index, 'ctaLink', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Order: {slide.displayOrder}</span>
                            <button
                              onClick={() => toggleItemStatus('heroSlides', index)}
                              className={`flex items-center gap-1 text-sm ${
                                slide.isActive ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {slide.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveItem('heroSlides', index, 'up')}
                              disabled={index === 0}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem('heroSlides', index, 'down')}
                              disabled={index === discoverData.heroSlides.length - 1}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem('heroSlides', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Categories Section */}
            {activeSection === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Categories</h3>
                    <p className="text-gray-600">Manage event categories for the 3D carousel</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('categories')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Categories'}
                  </button>
                </div>

                {/* Add New Category */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4">Add New Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Category Name"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="Category Slug"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <select
                      value={newCategory.colorGradient}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, colorGradient: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {colorGradients.map(gradient => (
                        <option key={gradient.value} value={gradient.value}>{gradient.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newCategory.image}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Image URL"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                    />
                  </div>
                  <button
                    onClick={() => {
                      addItem('categories', {
                        ...newCategory,
                        slug: newCategory.slug.toLowerCase().replace(/\s+/g, '-')
                      });
                      setNewCategory({
                        name: '',
                        slug: '',
                        icon: 'Music',
                        colorGradient: 'from-purple-500 to-pink-500',
                        image: '',
                        isActive: true,
                        displayOrder: discoverData.categories.length
                      });
                    }}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                </div>

                {/* Existing Categories */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Existing Categories ({discoverData.categories.length})</h4>
                  {discoverData.categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No categories configured yet. Add your first category above.
                    </div>
                  ) : (
                    discoverData.categories.map((category, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateItem('categories', index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={category.slug}
                            onChange={(e) => updateItem('categories', index, 'slug', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={category.icon}
                            onChange={(e) => updateItem('categories', index, 'icon', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {availableIcons.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                          <select
                            value={category.colorGradient}
                            onChange={(e) => updateItem('categories', index, 'colorGradient', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {colorGradients.map(gradient => (
                              <option key={gradient.value} value={gradient.value}>{gradient.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={category.image}
                            onChange={(e) => updateItem('categories', index, 'image', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Order: {category.displayOrder}</span>
                            <button
                              onClick={() => toggleItemStatus('categories', index)}
                              className={`flex items-center gap-1 text-sm ${
                                category.isActive ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {category.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveItem('categories', index, 'up')}
                              disabled={index === 0}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem('categories', index, 'down')}
                              disabled={index === discoverData.categories.length - 1}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem('categories', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Continue with similar structure for Collections and Quick Filters sections */}
            {/* Collections Section */}
            {activeSection === 'collections' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Collections</h3>
                    <p className="text-gray-600">Manage curated event collections</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('collections')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Collections'}
                  </button>
                </div>

                {/* Add New Collection */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4">Add New Collection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newCollection.title}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Collection Title"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newCollection.slug}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="Collection Slug"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newCollection.description}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Collection Description"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newCollection.icon}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, icon: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <select
                      value={newCollection.color}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {collectionColors.map(color => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      addItem('collections', {
                        ...newCollection,
                        slug: newCollection.slug.toLowerCase().replace(/\s+/g, '-')
                      });
                      setNewCollection({
                        title: '',
                        description: '',
                        slug: '',
                        icon: 'Heart',
                        color: 'bg-pink-100 text-pink-600',
                        isActive: true,
                        displayOrder: discoverData.collections.length
                      });
                    }}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Collection
                  </button>
                </div>

                {/* Existing Collections */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Existing Collections ({discoverData.collections.length})</h4>
                  {discoverData.collections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No collections configured yet. Add your first collection above.
                    </div>
                  ) : (
                    discoverData.collections.map((collection, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            value={collection.title}
                            onChange={(e) => updateItem('collections', index, 'title', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={collection.slug}
                            onChange={(e) => updateItem('collections', index, 'slug', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={collection.description}
                            onChange={(e) => updateItem('collections', index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={collection.icon}
                            onChange={(e) => updateItem('collections', index, 'icon', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {availableIcons.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                          <select
                            value={collection.color}
                            onChange={(e) => updateItem('collections', index, 'color', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {collectionColors.map(color => (
                              <option key={color.value} value={color.value}>{color.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Order: {collection.displayOrder}</span>
                            <button
                              onClick={() => toggleItemStatus('collections', index)}
                              className={`flex items-center gap-1 text-sm ${
                                collection.isActive ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {collection.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {collection.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveItem('collections', index, 'up')}
                              disabled={index === 0}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem('collections', index, 'down')}
                              disabled={index === discoverData.collections.length - 1}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem('collections', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quick Filters Section */}
            {activeSection === 'quick-filters' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Quick Filters</h3>
                    <p className="text-gray-600">Manage search filters for the discover page</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('quickFilters')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Filters'}
                  </button>
                </div>

                {/* Add New Filter */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4">Add New Filter</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newFilter.label}
                      onChange={(e) => setNewFilter(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Filter Label"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newFilter.value}
                      onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Filter Value"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      addItem('quickFilters', newFilter);
                      setNewFilter({
                        label: '',
                        value: '',
                        isActive: true,
                        displayOrder: discoverData.quickFilters.length
                      });
                    }}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Filter
                  </button>
                </div>

                {/* Existing Filters */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Existing Filters ({discoverData.quickFilters.length})</h4>
                  {discoverData.quickFilters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No filters configured yet. Add your first filter above.
                    </div>
                  ) : (
                    discoverData.quickFilters.map((filter, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            value={filter.label}
                            onChange={(e) => updateItem('quickFilters', index, 'label', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateItem('quickFilters', index, 'value', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Order: {filter.displayOrder}</span>
                            <button
                              onClick={() => toggleItemStatus('quickFilters', index)}
                              className={`flex items-center gap-1 text-sm ${
                                filter.isActive ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {filter.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {filter.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveItem('quickFilters', index, 'up')}
                              disabled={index === 0}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem('quickFilters', index, 'down')}
                              disabled={index === discoverData.quickFilters.length - 1}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem('quickFilters', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUI;
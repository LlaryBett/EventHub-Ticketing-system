import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  FileText,
  Settings,
  Users,
  HelpCircle,
  Building
} from 'lucide-react';

// Import services
import {
  getCompleteConfiguration,
  updateContactInfo,
  updateContactPageContent,
  updateContactFormConfig,
  updateBusinessRules,
  initializeConfiguration,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getContactCategories
} from '../../services/contactService';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('contact-info');
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);

  // Form states
  const [contactInfo, setContactInfo] = useState({});
  const [pageContent, setPageContent] = useState({});
  const [formConfig, setFormConfig] = useState({});
  const [businessRules, setBusinessRules] = useState({});
  const [faqs, setFaqs] = useState([]);

  // New FAQ state
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: 'general',
    order: 0,
    isActive: true
  });

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await getCompleteConfiguration();
      if (response.success) {
        setConfig(response.data);
        setContactInfo(response.data.contactConfig || {});
        setPageContent(response.data.pageContent || {});
        setFormConfig(response.data.formConfig || {});
        setBusinessRules(response.data.businessRules || {});
        setFaqs(response.data.faqConfig?.faqs || []);
      }

      // Load categories
      const categoriesData = await getContactCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      let response;

      switch (section) {
        case 'contact-info':
          response = await updateContactInfo(contactInfo);
          break;
        case 'page-content':
          response = await updateContactPageContent(pageContent);
          break;
        case 'form-config':
          response = await updateContactFormConfig(formConfig);
          break;
        case 'business-rules':
          response = await updateBusinessRules(businessRules);
          break;
        default:
          return;
      }

      if (response.success) {
        alert(`${section.replace('-', ' ')} updated successfully!`);
        loadConfiguration(); // Reload to get latest data
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeConfig = async () => {
    if (confirm('This will reset all configurations to default values. Continue?')) {
      try {
        setLoading(true);
        const response = await initializeConfiguration();
        if (response.success) {
          alert('Configuration initialized successfully!');
          loadConfiguration();
        }
      } catch (error) {
        console.error('Failed to initialize configuration:', error);
        alert('Failed to initialize configuration');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    try {
      setSaving(true);
      const response = await createFAQ(newFAQ);
      if (response.success) {
        setNewFAQ({
          question: '',
          answer: '',
          category: 'general',
          order: faqs.length,
          isActive: true
        });
        alert('FAQ added successfully!');
        loadConfiguration();
      }
    } catch (error) {
      console.error('Failed to add FAQ:', error);
      alert('Failed to add FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFAQ = async (index, updatedFAQ) => {
    try {
      setSaving(true);
      const response = await updateFAQ(index, updatedFAQ);
      if (response.success) {
        alert('FAQ updated successfully!');
        loadConfiguration();
      }
    } catch (error) {
      console.error('Failed to update FAQ:', error);
      alert('Failed to update FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (index) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      try {
        setSaving(true);
        const response = await deleteFAQ(index);
        if (response.success) {
          alert('FAQ deleted successfully!');
          loadConfiguration();
        }
      } catch (error) {
        console.error('Failed to delete FAQ:', error);
        alert('Failed to delete FAQ');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddCategory = () => {
    const newCategory = {
      value: '',
      label: '',
      description: '',
      isActive: true,
      order: formConfig.categories?.length || 0
    };

    setFormConfig(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCategory]
    }));
  };

  const handleUpdateCategory = (index, field, value) => {
    setFormConfig(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const handleRemoveCategory = (index) => {
    setFormConfig(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'contact-info', label: 'Contact Info', icon: Building },
    { id: 'page-content', label: 'Page Content', icon: FileText },
    { id: 'form-config', label: 'Form Config', icon: Settings },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'business-rules', label: 'Business Rules', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Settings</h1>
              <p className="text-gray-600">Manage contact page configuration and content</p>
            </div>
            <button
              onClick={handleInitializeConfig}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex -mb-px">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Contact Info Tab */}
            {activeTab === 'contact-info' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email || ''}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="hello@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone || ''}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={contactInfo.address || ''}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Main Street, City, State 12345"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Hours
                    </label>
                    <input
                      type="text"
                      value={contactInfo.businessHours || ''}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, businessHours: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Monday - Friday, 9 AM - 6 PM EST"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('contact-info')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Contact Info'}
                  </button>
                </div>
              </div>
            )}

            {/* Page Content Tab */}
            {activeTab === 'page-content' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Page Content</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: 'heroTitle', label: 'Hero Title', placeholder: 'Get in Touch' },
                    { key: 'heroDescription', label: 'Hero Description', placeholder: 'Have questions, feedback, or need help? We\'re here for you...', textarea: true },
                    { key: 'formTitle', label: 'Form Title', placeholder: 'Send us a Message' },
                    { key: 'sidebarTitle', label: 'Sidebar Title', placeholder: 'Other Ways to Reach Us' },
                    { key: 'faqTitle', label: 'FAQ Title', placeholder: 'Frequently Asked Questions' },
                    { key: 'mapTitle', label: 'Map Title', placeholder: 'Visit Our Office' },
                    { key: 'mapDescription', label: 'Map Description', placeholder: 'We\'re located in the heart of the city...', textarea: true }
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.textarea ? (
                        <textarea
                          value={pageContent[field.key] || ''}
                          onChange={(e) => setPageContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={pageContent[field.key] || ''}
                          onChange={(e) => setPageContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('page-content')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Page Content'}
                  </button>
                </div>
              </div>
            )}

            {/* Form Config Tab */}
            {activeTab === 'form-config' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Form Configuration</h3>
                
                {/* Success Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Success Message
                  </label>
                  <input
                    type="text"
                    value={formConfig.successMessage || ''}
                    onChange={(e) => setFormConfig(prev => ({ ...prev, successMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message sent successfully! We'll get back to you within 24 hours."
                  />
                </div>

                {/* Categories */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Categories
                    </label>
                    <button
                      onClick={handleAddCategory}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Add Category
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formConfig.categories?.map((category, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={category.value}
                            onChange={(e) => handleUpdateCategory(index, 'value', e.target.value)}
                            placeholder="Category value (e.g., general)"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={category.label}
                            onChange={(e) => handleUpdateCategory(index, 'label', e.target.value)}
                            placeholder="Category label (e.g., General Inquiry)"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveCategory(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('form-config')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Form Config'}
                  </button>
                </div>
              </div>
            )}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Manage FAQs</h3>
                
                {/* Add New FAQ */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-4">Add New FAQ</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newFAQ.question}
                      onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter question"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="Enter answer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-4">
                      <select
                        value={newFAQ.category}
                        onChange={(e) => setNewFAQ(prev => ({ ...prev, category: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="billing">Billing</option>
                        <option value="technical">Technical</option>
                        <option value="events">Events</option>
                      </select>
                      <input
                        type="number"
                        value={newFAQ.order}
                        onChange={(e) => setNewFAQ(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                        placeholder="Order"
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleAddFAQ}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add FAQ'}
                    </button>
                  </div>
                </div>

                {/* Existing FAQs */}
                <div className="space-y-4">
                  <h4 className="font-medium">Existing FAQs ({faqs.length})</h4>
                  {faqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateFAQ(index, { ...faq, question: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                        <button
                          onClick={() => handleDeleteFAQ(index)}
                          className="text-red-600 hover:text-red-800 ml-3"
                        >
                          Delete
                        </button>
                      </div>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleUpdateFAQ(index, { ...faq, answer: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      />
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Category: {faq.category}</span>
                        <span>Order: {faq.order}</span>
                        <span>Status: {faq.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Rules Tab */}
            {activeTab === 'business-rules' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Business Rules</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={businessRules.autoResponder?.enabled || false}
                      onChange={(e) => setBusinessRules(prev => ({
                        ...prev,
                        autoResponder: { ...prev.autoResponder, enabled: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Enable Auto-Responder
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={businessRules.notification?.enabled || false}
                      onChange={(e) => setBusinessRules(prev => ({
                        ...prev,
                        notification: { ...prev.notification, enabled: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Enable Admin Notifications
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notification Email
                    </label>
                    <input
                      type="email"
                      value={businessRules.notification?.adminEmail || ''}
                      onChange={(e) => setBusinessRules(prev => ({
                        ...prev,
                        notification: { ...prev.notification, adminEmail: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Time Promise
                    </label>
                    <input
                      type="text"
                      value={businessRules.responseTime || ''}
                      onChange={(e) => setBusinessRules(prev => ({ ...prev, responseTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="24 hours"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={businessRules.workingHours || ''}
                      onChange={(e) => setBusinessRules(prev => ({ ...prev, workingHours: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Monday - Friday, 9 AM - 6 PM EST"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('business-rules')}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Business Rules'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
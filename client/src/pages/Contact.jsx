import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Contact = () => {
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Message sent successfully! We\'ll get back to you within 24 hours.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
      showError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email Us',
      content: 'hello@eventhub.com',
      description: 'We typically respond within 24 hours'
    },
    {
      icon: '📞',
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: 'Monday - Friday, 9 AM - 6 PM EST'
    },
    {
      icon: '📍',
      title: 'Visit Us',
      content: '123 Event Street, San Francisco, CA 94102',
      description: 'Our headquarters in the heart of SF'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      content: 'Available 24/7',
      description: 'Get instant help from our support team'
    }
  ];

  const faqItems = [
    {
      question: 'How do I create an event?',
      answer: 'Simply sign up for an account, go to the "Create Event" page, fill out the event details, and publish. Our team will review and approve within 24 hours.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.'
    },
    {
      question: 'Can I get a refund for my ticket?',
      answer: 'Refund policies depend on the event organizer. You can check the refund policy on each event\'s detail page before purchasing.'
    },
    {
      question: 'How do I receive my tickets?',
      answer: 'After successful payment, you\'ll receive an email with your e-tickets. You can also access them from your dashboard.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto container-padding text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Have questions, feedback, or need help? We're here for you. 
            Reach out and we'll respond as quickly as possible.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto container-padding py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Ways to Reach Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl mb-3">{info.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                    <p className="text-primary-600 font-medium mb-1">{info.content}</p>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="bg-white rounded-lg shadow-md divide-y">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Office Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday:</span>
                  <span className="font-medium">10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * Live chat support is available 24/7
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
            <p className="text-gray-600">
              We're located in the heart of San Francisco. Drop by for a coffee and chat!
            </p>
          </div>
          
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-500">
              🗺️ Interactive map would be displayed here
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <Link to="/" className="text-primary-100 hover:text-white mb-4 inline-flex items-center">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-primary-100">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We collect information in various ways:</p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">A. Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-6">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, profile picture</li>
              <li><strong>Payment Information:</strong> Credit card details (processed securely by third-party providers)</li>
              <li><strong>Event Information:</strong> Event preferences, saved events, attendee information</li>
              <li><strong>Communication:</strong> Messages, reviews, ratings, and feedback you provide</li>
              <li><strong>Organizer Information:</strong> Business details, tax ID, website, bank account information</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">B. Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Device Information:</strong> Browser type, IP address, device type, operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, events viewed, searches performed</li>
              <li><strong>Cookies and Tracking:</strong> Analytics and marketing cookies for improved Service experience</li>
              <li><strong>Location Data:</strong> General location based on IP address (with your permission for location-based features)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process ticket purchases and payments</li>
              <li>Send order confirmations and receipts</li>
              <li>Respond to your inquiries and customer support requests</li>
              <li>Send marketing emails and promotional offers (with your consent)</li>
              <li>Personalize your experience and recommend events</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Comply with legal obligations</li>
              <li>Enforce our Terms and Conditions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share your information in the following cases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Event Organizers:</strong> Your name and email for event registration and communication</li>
              <li><strong>Payment Processors:</strong> Payment information for transaction processing</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in our operations (email, analytics, hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or bankruptcy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure password hashing and authentication</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to sensitive information</li>
              <li>Secure payment processing through PCI-DSS compliant providers</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings. Please note that disabling cookies may affect the functionality of our Service.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We use analytics tools such as Google Analytics to understand user behavior and improve our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-600 leading-relaxed mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              To exercise these rights, please contact us at support@eventhub.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete such information and terminate the child's account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. Please review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. You can request deletion of your account at any time, though we may retain certain information as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using EventHub, you consent to the transfer of your information to countries outside your country of residence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of EventHub after such modifications constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="text-gray-700"><strong>Email:</strong> privacy@eventhub.com</p>
              <p className="text-gray-700"><strong>Support Email:</strong> support@eventhub.com</p>
              <p className="text-gray-700"><strong>Address:</strong> EventHub Privacy Team, [Your Address]</p>
            </div>
          </section>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link to="/terms-and-conditions" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Terms and Conditions
            </Link>
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
              Back to Home →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

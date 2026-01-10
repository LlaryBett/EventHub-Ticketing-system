import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <Link to="/" className="text-primary-100 hover:text-white mb-4 inline-flex items-center">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-primary-100">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By accessing and using EventHub ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to abide by these Terms and Conditions, please do not use this Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on EventHub for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on EventHub</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              <li>Violating any applicable laws or regulations related to access to or use of EventHub</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The materials on EventHub are provided on an 'as is' basis. EventHub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              In no event shall EventHub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on EventHub, even if EventHub or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The materials appearing on EventHub could include technical, typographical, or photographic errors. EventHub does not warrant that any of the materials on its website are accurate, complete, or current. EventHub may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Materials License</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub grants you a revocable, non-exclusive, non-transferable license to download and use the materials for personal use only. This is the grant of a license, not a transfer of title. Under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for commercial or public display</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Transfer the materials to another person or server</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Accounts</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you create an account on EventHub, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify EventHub immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ticket Purchases and Refunds</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All ticket purchases are final. Refund policies are determined by individual event organizers. EventHub does not process refunds but facilitates the request between attendees and organizers. Please review the event-specific refund policy before purchasing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Payment Processing</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub uses secure third-party payment processors to handle all transactions. By making a purchase, you agree to the terms set by our payment processors. EventHub is not liable for any payment issues or disputes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. User Conduct</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You agree not to use EventHub for any unlawful purposes or in any way that could damage, disable, or impair the Service. Prohibited behavior includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Harassment, abuse, or threatening language</li>
              <li>Spam, phishing, or fraudulent activities</li>
              <li>Unauthorized access to accounts or systems</li>
              <li>Copyright or intellectual property infringement</li>
              <li>Distribution of malware or viruses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Organizer Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Event organizers are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Providing accurate event information</li>
              <li>Ensuring compliance with all applicable laws</li>
              <li>Obtaining necessary permits and insurance</li>
              <li>Managing attendee safety and security</li>
              <li>Honoring stated refund policies</li>
              <li>Responding to attendee inquiries and complaints</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service, even if EventHub has been advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifications to Terms</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EventHub may revise these Terms and Conditions at any time without notice. By using the Service, you are agreeing to be bound by the then current version of these Terms and Conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms and Conditions are governed by and construed in accordance with the laws of the jurisdiction in which EventHub operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="text-gray-700"><strong>Email:</strong> support@eventhub.com</p>
              <p className="text-gray-700"><strong>Address:</strong> EventHub Support Team, [Your Address]</p>
            </div>
          </section>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Home
            </Link>
            <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700 font-medium">
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

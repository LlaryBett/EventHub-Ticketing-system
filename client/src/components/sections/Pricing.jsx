import React from 'react';
import Button from '../components/common/Button';

const Pricing = () => {
  const plans = [
    {
      name: 'Attendee',
      price: 'Free',
      description: 'Perfect for event attendees',
      features: [
        'Browse all events',
        'Book unlimited tickets',
        'Mobile app access',
        'Email notifications',
        'Basic support'
      ],
      recommended: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline'
    },
    {
      name: 'Organizer',
      price: '$29',
      period: '/month',
      description: 'For professional event organizers',
      features: [
        'Create unlimited events',
        'Advanced analytics',
        'Custom branding',
        'Marketing tools',
        'Priority support',
        'Payment processing'
      ],
      recommended: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary'
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large organizations',
      features: [
        'All Organizer features',
        'Multi-user accounts',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'White-label solution'
      ],
      recommended: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto container-padding text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Choose the plan that's right for you. All plans include our core features with no hidden fees.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto container-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative card p-8 ${plan.recommended ? 'ring-2 ring-primary-600 scale-105' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}
                  {plan.period && (
                    <span className="text-lg text-gray-500 font-normal">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                fullWidth
                size="large"
                variant={plan.buttonVariant}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600">
                Absolutely! You can upgrade, downgrade, or cancel your plan at any time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-gray-600">
                Yes! We offer a 30-day money-back guarantee on all plans.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-6">
            Join EventHub today and start creating amazing events or discovering new experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="large">
              Start Free Trial
            </Button>
            <Button variant="outline" size="large">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
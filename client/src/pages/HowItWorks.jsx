import React, { useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  CreditCard, 
  Users, 
  BarChart3, 
  CheckCircle,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Shield,
  Headphones,
  FileText,
  Building2,
  Zap,
  TrendingUp,
  MessageSquare,
  QrCode
} from 'lucide-react';

const HowItWorks = () => {
  const [expandedStep, setExpandedStep] = useState(null);

  const organizerSteps = [
    {
      icon: UserCheck,
      title: "Apply & Get Approved",
      description: "Submit your organizer application with business information. Our team reviews and approves qualified organizers within 2-3 business days.",
      details: [
        "Complete the multi-step registration form",
        "Provide personal and business information",
        "Verify your identity and business credentials",
        "Receive approval notification via email"
      ],
      timeline: "2-3 business days",
      color: "purple"
    },
    {
      icon: Calendar,
      title: "Create Your Events",
      description: "Use our intuitive event builder to create professional event pages with custom branding, flexible pricing, and detailed descriptions.",
      details: [
        "Build event pages with rich media content",
        "Set flexible pricing (free, paid, tiered pricing)",
        "Configure event settings and capacity",
        "Add custom branding and promotional materials"
      ],
      timeline: "15-30 minutes",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "Promote & Market",
      description: "Leverage our marketing tools and promotional features to reach your target audience and maximize event attendance.",
      details: [
        "SEO-optimized event listings",
        "Social media sharing tools",
        "Email marketing integration",
        "Discount codes and early bird pricing"
      ],
      timeline: "Ongoing",
      color: "green"
    },
    {
      icon: Users,
      title: "Manage Attendees",
      description: "Track registrations in real-time, communicate with attendees, and handle check-ins seamlessly on event day.",
      details: [
        "Real-time registration dashboard",
        "Automated confirmation emails",
        "Attendee communication tools",
        "QR code check-in system"
      ],
      timeline: "Real-time",
      color: "orange"
    },
    {
      icon: CreditCard,
      title: "Get Paid",
      description: "Receive secure payments through integrated payment processing with automatic payouts and detailed financial reporting.",
      details: [
        "Secure payment processing",
        "Automatic payout scheduling",
        "Transaction fee transparency",
        "Financial reporting and tax documents"
      ],
      timeline: "3-5 business days",
      color: "indigo"
    },
    {
      icon: BarChart3,
      title: "Analyze & Improve",
      description: "Access comprehensive analytics to understand your audience, track performance, and optimize future events.",
      details: [
        "Detailed attendance analytics",
        "Revenue and conversion tracking",
        "Audience demographic insights",
        "Performance comparison reports"
      ],
      timeline: "Post-event",
      color: "pink"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with PCI-compliant payment processing"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated organizer support team available around the clock"
    },
    {
      icon: Zap,
      title: "Easy Setup",
      description: "Get your first event live in under 30 minutes"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Audience",
      description: "Built-in marketing tools to reach more potential attendees"
    }
  ];

  const features = [
    {
      category: "Event Creation",
      items: [
        "Unlimited event creation",
        "Custom event pages with branding",
        "Flexible pricing options",
        "Rich media support (images, videos)",
        "Event templates and themes"
      ]
    },
    {
      category: "Attendee Management",
      items: [
        "Real-time registration tracking",
        "Automated email confirmations",
        "Check-in and QR code scanning",
        "Waitlist management",
        "Attendee communication tools"
      ]
    },
    {
      category: "Payment & Payouts",
      items: [
        "Integrated payment processing",
        "Multiple payment methods accepted",
        "Automatic payout scheduling",
        "Transaction fee transparency",
        "Financial reporting"
      ]
    },
    {
      category: "Marketing & Promotion",
      items: [
        "SEO-optimized event listings",
        "Social media integration",
        "Email marketing tools",
        "Discount codes and promotions",
        "Affiliate marketing support"
      ]
    },
    {
      category: "Analytics & Reporting",
      items: [
        "Advanced event analytics",
        "Revenue and sales tracking",
        "Audience demographic data",
        "Performance benchmarking",
        "Exportable reports"
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: "bg-purple-50 border-purple-200 text-purple-900",
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-green-50 border-green-200 text-green-900",
      orange: "bg-orange-50 border-orange-200 text-orange-900",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
      pink: "bg-pink-50 border-pink-200 text-pink-900"
    };
    return colors[color] || colors.purple;
  };

  const getIconColorClasses = (color) => {
    const colors = {
      purple: "bg-purple-100 text-purple-600",
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      indigo: "bg-indigo-100 text-indigo-600",
      pink: "bg-pink-100 text-pink-600"
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="min-h-screen bg-gray-50">
     

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How EventHub Works for Organizers
          </h1>
          <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
            From application to analytics, learn how EventHub empowers you to create, manage, 
            and grow successful events with our comprehensive platform.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>2-3 Day Approval Process</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Unlimited Events</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

     <div className="py-12 relative">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Your Journey as an EventHub Organizer
      </h2>
      <p className="text-base text-gray-600 max-w-xl mx-auto">
        Follow these simple steps to start creating and managing successful events
      </p>
    </div>

    {/* Vertical connecting line for desktop */}
    <div className="hidden lg:block absolute left-1/2 top-32 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 via-green-200 via-orange-200 via-indigo-200 to-pink-200 transform -translate-x-px"></div>

    <div className="relative">
      {organizerSteps.map((step, index) => {
        const Icon = step.icon;
        const isExpanded = expandedStep === index;
        const isEven = index % 2 === 0;

        return (
          <div
            key={index}
            className={`relative flex items-center mb-2 lg:mb-3 ${
              isEven ? "lg:flex-row" : "lg:flex-row-reverse"
            }`}
          >
            {/* Step Number Circle - Desktop Center */}
            <div className="hidden lg:block absolute left-1/2 top-4 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div
                className={`w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center font-bold text-xs ${
                  step.color === "purple"
                    ? "border-purple-300 text-purple-600"
                    : step.color === "blue"
                    ? "border-blue-300 text-blue-600"
                    : step.color === "green"
                    ? "border-green-300 text-green-600"
                    : step.color === "orange"
                    ? "border-orange-300 text-orange-600"
                    : step.color === "indigo"
                    ? "border-indigo-300 text-indigo-600"
                    : "border-pink-300 text-pink-600"
                }`}
              >
                {index + 1}
              </div>
            </div>

            {/* Content Card */}
            <div
              className={`w-full lg:w-5/12 ${
                isEven ? "lg:mr-auto lg:pr-4" : "lg:ml-auto lg:pl-4"
              }`}
            >
              <div
                className={`relative bg-white rounded-lg shadow border transition-all duration-300 cursor-pointer hover:scale-105 ${
                  isExpanded ? "border-purple-200 shadow-md" : "border-gray-100"
                } 
                before:content-[''] before:absolute before:top-8 before:w-0 before:h-0 
                ${
                  isEven
                    ? "before:-right-3 before:border-y-[10px] before:border-l-[12px] before:border-y-transparent before:border-l-white"
                    : "before:-left-3 before:border-y-[10px] before:border-r-[12px] before:border-y-transparent before:border-r-white"
                }`}
                onClick={() => setExpandedStep(isExpanded ? null : index)}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3 lg:space-x-2">
                    {/* Step Number - Mobile */}
                    <div className="lg:hidden flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center font-bold text-sm ${
                          step.color === "purple"
                            ? "border-purple-300 text-purple-600"
                            : step.color === "blue"
                            ? "border-blue-300 text-blue-600"
                            : step.color === "green"
                            ? "border-green-300 text-green-600"
                            : step.color === "orange"
                            ? "border-orange-300 text-orange-600"
                            : step.color === "indigo"
                            ? "border-indigo-300 text-indigo-600"
                            : "border-pink-300 text-pink-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Icon - Desktop */}
                    <div className="hidden lg:block flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColorClasses(
                          step.color
                        )}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-500">
                            STEP {index + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getColorClasses(
                              step.color
                            )}`}
                          >
                            {step.timeline}
                          </span>
                        </div>
                        <ArrowRight
                          className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      {/* Icon - Mobile */}
                      <div className="lg:hidden flex items-center space-x-2 mb-2">
                        <div
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${getIconColorClasses(
                            step.color
                          )}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {step.title}
                        </h3>
                      </div>

                      {/* Title - Desktop */}
                      <h3 className="hidden lg:block text-xl font-bold text-gray-900 mb-1">
                        {step.title}
                      </h3>

                      <p className="text-gray-600 text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 lg:pl-12">
                      <div className="grid md:grid-cols-2 gap-2">
                        {step.details.map((detail, detailIndex) => (
                          <div
                            key={detailIndex}
                            className="flex items-start space-x-2"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-base">
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decorative Arrow Between Steps (optional, can remove now) */}
            {index < organizerSteps.length - 1 && (
              <div
                className={`hidden lg:block absolute top-10 ${
                  isEven ? "right-3" : "left-3"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-gradient-to-br ${
                    step.color === "purple"
                      ? "from-purple-400 to-blue-400"
                      : step.color === "blue"
                      ? "from-blue-400 to-green-400"
                      : step.color === "green"
                      ? "from-green-400 to-orange-400"
                      : step.color === "orange"
                      ? "from-orange-400 to-indigo-400"
                      : step.color === "indigo"
                      ? "from-indigo-400 to-pink-400"
                      : "from-pink-400 to-purple-400"
                  } flex items-center justify-center text-white shadow`}
                >
                  <ArrowRight
                    className={`h-2 w-2 ${isEven ? "" : "rotate-180"}`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>




     

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Feature Set
            </h2>
            <p className="text-lg text-gray-600">
              All the tools you need to manage successful events
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Creating Events?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of successful event organizers on EventHub. 
            Apply today and get approved within 2-3 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register?type=organizer"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Apply to Become an Organizer
            </a>
            <a 
              href="/organizer/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              Sign In to Your Account
            </a>
          </div>
          <p className="text-sm text-purple-200 mt-6">
            Already have an account? <a href="/organizer/login" className="underline hover:text-white">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
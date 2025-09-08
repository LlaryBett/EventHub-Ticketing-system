export const cartService = {
  processCheckout: async (cartItems, paymentData, userInfo) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful payment
    const order = {
      id: Date.now(),
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'confirmed',
      paymentMethod: paymentData.method,
      userInfo,
      createdAt: new Date().toISOString(),
      confirmationCode: `EVT-${Date.now().toString().slice(-6)}`
    };
    
    return order;
  },

  getOrderHistory: async (userId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Return mock order history
    return [
      {
        id: 1,
        confirmationCode: 'EVT-123456',
        date: '2024-12-20',
        total: 299,
        status: 'confirmed',
        items: [
          {
            id: 1,
            title: 'Tech Conference 2025',
            price: 299,
            quantity: 1
          }
        ]
      }
    ];
  },

  applyDiscount: async (code) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const discountCodes = {
      'SAVE10': { percentage: 10, description: '10% off your order' },
      'WELCOME': { percentage: 15, description: 'Welcome discount 15% off' },
      'STUDENT': { percentage: 20, description: 'Student discount 20% off' }
    };
    
    const discount = discountCodes[code.toUpperCase()];
    if (!discount) {
      throw new Error('Invalid discount code');
    }
    
    return discount;
  }
};
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Debug: Log the connection string (hide password in production)
    if (process.env.NODE_ENV !== 'production') {
      const uri = process.env.MONGODB_URI;
      console.log(`\n🔍 DEBUG: Checking environment variables...`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`   MONGODB_URI exists: ${uri ? '✅ YES' : '❌ NO'}`);
      console.log(`   MONGODB_URI length: ${uri ? uri.length : 0}`);
      
      if (uri) {
        const maskedUri = uri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)/, '$1$2:*****');
        console.log(`   Masked URI: ${maskedUri}`);
        console.log(`   Raw URI (first 50 chars): ${uri.substring(0, 50)}...`);
      } else {
        console.error(`   ❌ MONGODB_URI is undefined or empty!`);
        console.error(`   Available env keys: ${Object.keys(process.env).filter(k => k.includes('MONGO')).join(', ') || 'None found'}`);
      }
      console.log(`🔧 Attempting to connect to MongoDB...\n`);
    }

    // Remove deprecated options - they cause issues in newer versions
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Optional modern options (not required but good for production):
      maxPoolSize: 10, // Maximum number of sockets in the connection pool
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    // Connection successful
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Set up event listeners for connection monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 Mongoose reconnected to MongoDB');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ FATAL: MongoDB Connection Failed!');
    console.error(`   Error: ${error.message}`);
    
    // Provide helpful error messages based on error type
    if (error.code === 'ENOTFOUND') {
      console.error('   🔍 Issue: DNS lookup failed.');
      console.error('   💡 Solution: Check your MongoDB Atlas cluster URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   🔍 Issue: Connection timeout.');
      console.error('   💡 Solution: Check network/firewall or whitelist IP in MongoDB Atlas');
    } else if (error.name === 'MongoServerError') {
      if (error.code === 8000) {
        console.error('   🔍 Issue: Authentication failed.');
        console.error('   💡 Solution: Check username/password in connection string');
      } else if (error.code === 13) {
        console.error('   🔍 Issue: Unauthorized access.');
        console.error('   💡 Solution: Check user permissions in MongoDB Atlas');
      }
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('   🔍 Issue: Cannot connect to any MongoDB server.');
      console.error('   💡 Solution: Check if MongoDB Atlas cluster is running');
    }
    
    console.error('\n📋 Troubleshooting Checklist:');
    console.error('   1. ✅ Check .env file has correct MONGODB_URI');
    console.error('   2. ✅ Whitelist IP in MongoDB Atlas → Network Access');
    console.error('   3. ✅ Verify username/password in MongoDB Atlas → Database Access');
    console.error('   4. ✅ Ensure MongoDB Atlas cluster is running (not paused)');
    
    process.exit(1);
  }
};

module.exports = connectDB;
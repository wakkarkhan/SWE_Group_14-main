const mongoose = require('mongoose');
const seedUsers = require('./userSeeder');
const seedBusinesses = require('./businessSeeder');
const seedServices = require('./serviceSeeder');
const seedBookings = require('./bookingSeeder');

require('dotenv').config();

// Function to establish a connection to the MongoDB database
async function connectDB() {
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000
  });
}

// Function to seed the database with initial data
async function seedDatabase() {
  try {
    // Define the number of entities to seed
    const businessUserCount = 1;
    const maxServicesPerBusiness = 3;
    const customerCount = 2;
    const bookingCount = 5;

    // Seed users, businesses, services, bookings
    await seedUsers(customerCount, businessUserCount);
    await seedBusinesses(businessUserCount);
    await seedServices(maxServicesPerBusiness);
    await seedBookings(bookingCount);

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Database seeding error', error);
  } finally {
    // Uncomment to close the connection after seeding
    // mongoose.connection.close();
  }
}

module.exports = seedDatabase;
// Call the seedDatabase function to execute seeding
// seedDatabase();

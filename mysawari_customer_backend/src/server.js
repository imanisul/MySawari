require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, async () => {
  await connectDB();
  console.log(`================================`);
  console.log(`🚀 JS Server running on port ${PORT}`);
  console.log(`================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

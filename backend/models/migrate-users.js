const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/bge-coordinet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrate = async () => {
  try {
    await User.updateMany(
      { accessPermissions: { $exists: false } },
      {
        $set: {
          accessPermissions: {
            dashboard: true,
            members: false,
            settings: false,
            pendingApprovals: false,
            superadminDashboard: false,
          },
        },
      }
    );
    console.log('Migration completed: accessPermissions added to all users.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.connection.close();
  }
};

migrate();
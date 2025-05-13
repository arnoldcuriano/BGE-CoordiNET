const mongoose = require('mongoose');
const User = require('./models/User');


async function updateUserPermissions() {
  const users = await User.find();
  for (const user of users) {
    if (!user.accessPermissions || Object.keys(user.accessPermissions).length === 0) {
      const roleDefaults = {
        viewer: { help: true, patchNotes: true, settings: true, dashboard: true },
        admin: { help: true, patchNotes: true, settings: true, dashboard: true, members: true, 'pending-users': true },
        superadmin: { help: true, patchNotes: true, settings: true, dashboard: true, members: true, 'pending-users': true, partners: true, hrManagement: true, projects: true, itInventory: true, quickTools: true, superadminDashboard: true },
      };
      user.accessPermissions = roleDefaults[user.role] || { help: true, patchNotes: true, settings: true };
      await user.save();
    }
  }
  console.log('Permissions updated for all users.');
}

updateUserPermissions().catch(console.error);
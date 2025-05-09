const express = require('express');
const router = express.Router();

// Import sub-routers
const authGoogle = require('./authGoogle');
const authLocal = require('./authLocal');
const userManagement = require('./userManagement');
const passwordReset = require('./passwordReset');
const test = require('./test');

// Mount sub-routers
router.use(authGoogle);
router.use(authLocal);
router.use(userManagement);
router.use(passwordReset);
router.use(test);

module.exports = router;
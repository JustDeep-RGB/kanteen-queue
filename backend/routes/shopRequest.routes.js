const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth.middleware');
const resolveUser = require('../middleware/resolveUser.middleware');
const ctrl       = require('../controllers/shopRequest.controller');

// Admin: list all requests (default: pending). ?status=approved|rejected also works.
router.get('/',              auth, ctrl.getShopRequests);

// Cafe owner: submit a new shop registration request
router.post('/',             auth, resolveUser, ctrl.createShopRequest);

// Admin: approve / reject a specific request
router.post('/:id/approve',  auth, ctrl.approveShopRequest);
router.post('/:id/reject',   auth, ctrl.rejectShopRequest);

module.exports = router;

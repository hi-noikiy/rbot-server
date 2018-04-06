const auth = require('./authentication');
const caddies = require('./order_caddies');
const exchanges = require('./exchanges');
const pairs = require('./currency_pairs');
const router = require('express').Router();

router.post('/authenticate', auth.authenticate);
router.get('/caddies', auth.verifyToken, caddies.fetchAll);
router.get('/caddies/:id', auth.verifyToken, caddies.fetchOne);
router.delete('/caddies/:id', auth.verifyToken, caddies.deleteOne);
router.post('/caddies', auth.verifyToken, caddies.create);
router.get('/exchanges', exchanges.fetchAll);
router.get('/pairs', pairs.fetchAll);

module.exports = router;
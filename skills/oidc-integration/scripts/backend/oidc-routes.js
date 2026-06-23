const express = require('express')
const { startOidcLogin, handleOidcCallback } = require('../controllers/oidc-controller')

const router = express.Router()

router.get('/', startOidcLogin)
router.get('/callback', handleOidcCallback)

module.exports = router

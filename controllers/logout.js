const router = require('express').Router()

router.post('/', async (request, response) => {
  response
    .status(200)
    .send({ role: 'guest' })
})

module.exports = router
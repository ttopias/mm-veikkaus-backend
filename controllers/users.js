const bcrypt = require('bcrypt')
const router = require('express').Router()
const User = require('../models/user')

router.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('guesses')

  response.json(users.map(u => u.toJSON()))
})

router.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id)
  if (user) {
    return response.json(user.toJSON())
  } else {
    return response.status(404).end()
  }
})

router.put('/:id', async (request, response) => {
  const user = request.body
  const updatedUser = await User.findByIdAndUpdate(request.params.id, user, { new: true })
  return response.json(updatedUser)
})

router.delete('/:id', async (request, response) => {
  await User.findByIdAndRemove({ _id: request.params.id })
  response.status(204).end()
})

router.post('/', async (request, response) => {
  const {username, password, password2} = request.body

  if ( !password || password.length<3 ) {
    return response.status(400).send({
      error: 'password must min length 3'
    })
  }

  if ( password !== password2 ) {
    return response.status(400).send({
      error: 'passwords do not match'
    })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username, 
    passwordHash,
    role: 'guesser',
    guesses: [],
  })

  const savedUser = await user.save()

  response.json(savedUser)
})

module.exports = router
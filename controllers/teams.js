const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Team = require('../models/team')
const User = require('../models/user')

router.get('/', async (request, response) => {
  const teams = await Team.find({})
  response.json(teams.map(t => t.toJSON()))
})

router.get('/:id', async (request, response) => {
  const team = await Team.findById(request.params.id)
  if (team) {
    return response.json(team.toJSON())
  } else {
    return response.status(404).end()
  }
})

router.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)
  if (user.role.toString() !== 'admin') {
    return response.status(401).json({ error: 'only admin can delete teams' })
  }
  
  await Team.findByIdAndRemove(request.params.id)

  response.status(204).end()
})

router.put('/:id', async (request, response) => {
  const { team } = request.body
  let updatedTeam = await Team.findOneAndUpdate(request.params.id, team, { new: true })
  if (updatedTeam) {
    await updatedTeam.save()
    return response.json(updatedTeam.toJSON())
  }
  return response.status(404).end()
})

router.post('/', async (request, response) => {
  const team = new Team(request.body)

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'Token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  if (!team.name || !team.group) {
    return response.status(400).send({ error: 'Name or group missing' })
  }

  const savedTeam = await team.save()

  response.status(201).json(savedTeam)
})

module.exports = router
const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Match = require('../models/match')
const Team = require('../models/team')

router.get('/', async (request, response) => {
  const matches = await Match
    .find({})
    .populate('homeTeam')
    .populate('awayTeam')
  return response.json(matches)
})

router.get('/:id', async (request, response) => {
  const match = await Match
    .findById(request.params.id)
    .populate('homeTeam')
  if (match) {
    return response.json(match)
  } else {
    return response.status(404).end()
  }
})

router.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const match = await Match.findByIdAndRemove(request.params.id)
  await match.remove()

  response.status(204).end()
})

router.put('/:id', async (request, response) => {
  const match = request.body
  console.log('match :>> ', match);
  const homeTeam = await Team.findById(match.homeTeam)
  const awayTeam = await Team.findById(match.awayTeam)

  console.log('homeTeam backend@matches.js PUT :>> ', homeTeam);
  console.log('awayTeam backend@matches.js PUT:>> ', awayTeam);

  if (match.homeGoals > match.awayGoals) {
    homeTeam.wins = homeTeam.wins + 1
    awayTeam.losses = awayTeam.losses + 1
  } else if (match.homeGoals < match.awayGoals) {
    homeTeam.losses = homeTeam.losses + 1
    awayTeam.wins = awayTeam.wins + 1
  } else {
    homeTeam.draws = homeTeam.draws + 1
    awayTeam.draws = awayTeam.draws + 1
  }
  homeTeam.goalsFor = homeTeam.goalsFor + match.homeGoals
  homeTeam.goalsAgainst = homeTeam.goalsAgainst + match.awayGoals
  awayTeam.goalsFor = awayTeam.goalsFor + match.awayGoals
  awayTeam.goalsAgainst = awayTeam.goalsAgainst + match.homeGoals
  await homeTeam.save()
  await awayTeam.save()

  Match.findByIdAndUpdate(request.params.id, match, { new: true })
        .then(updatedMatch => {
            response.json(updatedMatch)
        })
        .catch(error => next(error))
})

router.post('/', async (request, response) => {
  const body = request.body
  const homeTeam = await Team.find({ _id: body.homeTeamId})
  const awayTeam = await Team.find({ _id: body.awayTeamId})
  const newMatch = new Match({
    date: body.date,
    time: body.time,
    homeTeam: body.homeTeamId,
    awayTeam: body.homeTeamId,
  })

  const savedMatch = await newMatch.save()
  response.status(201).json(savedMatch)
})

module.exports = router
const router = require('express').Router()
const Match = require('../models/match')
const Team = require('../models/team')

router.get('/', async (request, response) => {
  const matches = await Match
    .find({})
    .populate('homeTeam', { name: 1, group: 1, url: 1 })
    .populate('awayTeam', { name: 1, group: 1, url: 1 })
  return response.json(matches)
})

router.post('/', async (request, response) => {
  const body = request.body

  const newMatch = new Match({
    date: body.date,
    time: body.time,
    homeTeam: body.homeTeamId,
    awayTeam: body.homeTeamId,
  })

  const savedMatch = await newMatch.save()
  response.status(201).json(savedMatch)
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
  const match = await Match.findByIdAndRemove(request.params.id)
  await match.remove()

  response.status(204).end()
})

router.put('/:id', async (request, response) => {
  const match = request.body

  const homeTeam = await Team.findOne({ name: match.homeTeam.name })
  const awayTeam = await Team.findOne({ name: match.awayTeam.name })

  const matchToUpdate = {
    ...match,
    homeTeam: homeTeam._id,
    awayTeam: awayTeam._id,
  }

  homeTeam.matches = homeTeam.matches + 1
  awayTeam.matches = awayTeam.matches + 1
  if (parseInt(match.homeGoals) > parseInt(match.awayGoals)) {
    console.log('kotivoitto :' + match.homeGoals + ' - ' + match.awayGoals)
    homeTeam.wins = homeTeam.wins + 1
    awayTeam.losses = awayTeam.losses + 1
  } else if (parseInt(match.homeGoals) < parseInt(match.awayGoals)) {
    console.log('vierasvoitto :' + match.homeGoals + ' - ' + match.awayGoals)
    homeTeam.losses = homeTeam.losses + 1
    awayTeam.wins = awayTeam.wins + 1
  } else {
    console.log('tasapeli :' + match.homeGoals + ' - ' + match.awayGoals)
    homeTeam.draws = homeTeam.draws + 1
    awayTeam.draws = awayTeam.draws + 1
  }
  homeTeam.goalsFor = homeTeam.goalsFor + match.homeGoals
  homeTeam.goalsAgainst = homeTeam.goalsAgainst + match.awayGoals
  awayTeam.goalsFor = awayTeam.goalsFor + match.awayGoals
  awayTeam.goalsAgainst = awayTeam.goalsAgainst + match.homeGoals

  await homeTeam.save()
  await awayTeam.save()

  const updatedMatch = await Match.findOneAndUpdate({ _id: match.id }, matchToUpdate, { new: true })
  return response.json(matchToUpdate)
})

module.exports = router
const router = require('express').Router()
const Guess = require('../models/guess')
const Match = require('../models/match')
const Team = require('../models/team')
const User = require('../models/user')

router.get('/', async (request, response) => {
  const matches = await Match
    .find({})
    .populate('homeTeam')
    .populate('awayTeam')
  return response.json(matches)
})

router.post('/', async (request, response) => {
  const body = request.body

  const newMatch = new Match({
    date: body.date,
    time: body.time,
    homeTeam: body.homeTeamId,
    awayTeam: body.awayTeamId,
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
  const oldMatch = await Match.findOne({ _id: match.id })
  const homeTeam = await Team.findOne({ name: match.homeTeam.name })
  const awayTeam = await Team.findOne({ name: match.awayTeam.name })

  let result = '';

  const matchToUpdate = {
    ...match,
    homeTeam: homeTeam._id,
    awayTeam: awayTeam._id,
  }
  const guessesToUpdate = await Guess.find({ match: match.id })

  /* match finished, update guesspoints accordingly */
  if (match.finished) {
    if (parseInt(match.homeGoals) > parseInt(match.awayGoals)) {
      result = 'home'
      homeTeam.wins = parseInt(homeTeam.wins + 1)
      awayTeam.losses = parseInt(awayTeam.losses + 1)
    } else if (parseInt(match.homeGoals) < parseInt(match.awayGoals)) {
      result = 'away'
      homeTeam.losses = parseInt(homeTeam.losses) + 1
      awayTeam.wins = parseInt(awayTeam.wins) + 1
    } else {
      result = 'draw'
      homeTeam.draws = parseInt(homeTeam.draws) + 1
      awayTeam.draws = parseInt(awayTeam.draws) + 1
    }
    homeTeam.goalsFor = parseInt(homeTeam.goalsFor) + parseInt(match.homeGoals)
    homeTeam.goalsAgainst = parseInt(homeTeam.goalsAgainst) + parseInt(match.awayGoals)
    awayTeam.goalsFor = parseInt(awayTeam.goalsFor) + parseInt(match.awayGoals)
    awayTeam.goalsAgainst = parseInt(awayTeam.goalsAgainst) + parseInt(match.homeGoals)

    for await (guess of guessesToUpdate) {
      guessResult = ''
      if (parseInt(guess.homeTeamScore) > parseInt(guess.awayTeamScore)) {
        guessResult = 'home'
      } else if (parseInt(guess.homeTeamScore) < parseInt(guess.awayTeamScore)) {
        guessResult = 'away'
      } else {
        guessResult = 'draw'
      }

      // check if guess is correct
      if (parseInt(guess.homeTeamScore) === parseInt(match.homeGoals)) {
        guess.points += 1
      }
      if (parseInt(guess.awayTeamScore) === parseInt(match.awayGoals)) {
        guess.points += 1
      }
      if (parseInt(guess.awayTeamScore) === parseInt(match.awayGoals) && parseInt(guess.homeTeamScore) === parseInt(match.homeGoals)) {
        guess.points += 1
      }
      if (guessResult === result) {
        guess.points += 3
      }
      else if (guessResult === 'draw' && result === 'draw') {
        guess.points += 1
      } else if ((guessResult === 'draw' && result !== 'draw') || (guessResult !== 'draw' && result === 'draw')) {
        guess.points += -2
      } else {
        guess.points = -4 + guess.points
      }
      const userToUpdate = await User.findById(guess.user)
      userToUpdate.points = parseInt(guess.points) + parseInt(userToUpdate.points)
      await userToUpdate.save()
      await guess.save()
    }
  }

  /* situation: deleting match result */
  else {
    if (parseInt(oldMatch.homeGoals) > parseInt(oldMatch.awayGoals)) {
      homeTeam.wins = parseInt(homeTeam.wins) - 1
      awayTeam.losses = parseInt(awayTeam.losses) - 1
    }
    else if (parseInt(oldMatch.homeGoals) < parseInt(oldMatch.awayGoals)) {
      homeTeam.losses = parseInt(homeTeam.losses) - 1
      awayTeam.wins = parseInt(awayTeam.wins) - 1
    }
    else {
      homeTeam.draws = parseInt(homeTeam.draws) - 1
      awayTeam.draws = parseInt(awayTeam.draws) - 1
    }
    homeTeam.goalsFor = parseInt(homeTeam.goalsFor) - parseInt(oldMatch.homeGoals)
    homeTeam.goalsAgainst = parseInt(homeTeam.goalsAgainst) - parseInt(oldMatch.awayGoals)
    awayTeam.goalsFor = parseInt(awayTeam.goalsFor) - parseInt(oldMatch.awayGoals)
    awayTeam.goalsAgainst = parseInt(awayTeam.goalsAgainst) - parseInt(oldMatch.homeGoals)
    
    for await (guess of guessesToUpdate) {
      const userToUpdate = await User.findOne({ _id: guess.user })
      userToUpdate.points = parseInt(userToUpdate.points) - parseInt(guess.points)
      await userToUpdate.save()
      guess.points = 0
      await guess.save()
    }
  }
  await homeTeam.save()
  await awayTeam.save()

  const updatedMatch = await Match
    .findOneAndUpdate({ _id: match.id }, matchToUpdate, { new: true })
    .populate('homeTeam')
    .populate('awayTeam')
  return response.json(updatedMatch)
})

module.exports = router
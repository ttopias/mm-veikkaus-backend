const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Guess = require('../models/guess')
const Match = require('../models/match')
const User = require('../models/user')

const getGuessResult = (g) => {
    if (g.homeTeamScore > g.awayTeamScore) {
      return '1'
    } else if (g.homeTeamScore < g.awayTeamScore) {
      return '2'
    } else {
      return 'X'
    }
}

const getMatchResult = (g) => {
  console.log('g :>> ', g);
    if (g.homeGoals > g.awayGoals) {
      return '1'
    } else if (g.homeGoals < g.awayGoals) {
      return '2'
    } else {
      return 'X'
    }
}

router.get('/', async (request, response) => {
  const guesses = await Guess
        .find({})
        .populate('match', { homeTeam: 1, awayTeam: 1, })
        .populate('user', { username: 1 })
  return response.json(guesses)
})

router.get('/:id', async (request, response) => {
    const guess = await Guess.findById(request.params.id)
    if (guess) {
        return response.json(guess)
    } else {
        return response.status(404).end()
    }
})

router.post('/', async (request, response) => {
    const body = request.body
    console.log('body bend @guesses :>> ', body);
    const user = await User.findById(body.userId)
    const match = await Match.findById(body.matchId)
    const notFound = await Guess.find({ matchId: match._id, userId: user._id }).count()

    const newGuess = new Guess({
        match: body.matchId,
        user: body.userId,
        homeTeamScore: body.homeTeamScore,
        awayTeamScore: body.awayTeamScore,
    })

    const savedGuess = await newGuess.save()
    console.log('user.guesses :>> ', user.guesses);
    await User.findByIdAndUpdate(body.userId, { guesses: user.guesses.concat(savedGuess._id) }, { new: true })
    return response.status(201).json(savedGuess)
    // }
})

router.delete('/:id', async (request, response) => {
    console.log('body :>> ', body);
    const userId = await Guess.findById(request.params.id).user._id
    await Guess.findByIdAndRemove(request.params.id)

    return response.status(204).end()
})

router.put('/:id', async (request, response) => {
    const body = request.body
    console.log('body :>> ', body);
    const guess = {
        ...body.guess,
        homeTeamScore: body.homeTeamScore,
        awayTeamScore: body.awayTeamScore,
    }
    const match = await Match.findById(body.matchId)
    const matchResult = getMatchResult(match)
    const guessResult = getGuessResult(guess)

    if (guessResult === matchResult) {
      guess.points = guess.points + 3
    }
    if ((guessResult === '1' && matchResult === '2') ||
      (guessResult === '2' && matchResult === '1')) {
      guess.points = guess.points - 4
    }
    if (guessResult === 'X' && matchResult === 'X') {
      guess.points = guess.points + 4
    }
    if (guessResult === 'X' && matchResult !== 'X') {
      guess.points = guess.points - 2
    }
    if (guessResult !== 'X' && matchResult === 'X') {
      guess.points = guess.points - 2
    }
    if (guess.homeTeamScore === match.homeGoals || match.awayTeamScore === match.awayGoals) {
      guess.points = guess.points + 1
    }
    if (guess.homeTeamScore === match.homeGoals && guess.awayTeamScore === match.awayGoals) {
      guess.points = 6
    }

    Guess.findByIdAndUpdate(request.params.id, guess, { new: true })
        .then(updatedGuess => {
            response.json(updatedGuess)
        })
        .catch(error => next(error))
})

module.exports = router

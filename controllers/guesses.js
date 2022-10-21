const router = require('express').Router()
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
        .populate('match')
        .populate('user')
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
    const user = await User.findOne({ _id: body.userId })
    const match = await Match.findOne({ _id: body.matchId })

    const newGuess = new Guess({
        match: user,
        user: match,
        homeTeamScore: body.homeTeamScore,
        awayTeamScore: body.awayTeamScore,
    })
    
    const savedGuess = await newGuess.save()
    await User.findByIdAndUpdate(body.userId, { guesses: user.guesses.concat(savedGuess._id) }, { new: true })
    return response.status(201).json(savedGuess)
})

router.delete('/:id', async (request, response) => {
    const guess = await Guess.findOne({ id: request.params.id })
    const user = await User.findOne({ id: guess.user._id })
    if (!user || !guess) {
        return response.status(404).end()
    }
    user.guesses = user.guesses.filter(g => g.toString() !== guess._id.toString())
    await user.save()
    await guess.remove()
    return response.status(204).end()
})

router.put('/:id', async (request, response) => {
    const body = request.body
    const guess = {
        ...body.guess,
        homeTeamScore: body.homeTeamScore,
        awayTeamScore: body.awayTeamScore,
    }
    console.log('body :>> ', body);
    const match = await Match.findById(body.matchId)
    const matchResult = getMatchResult(match)
    const guessResult = getGuessResult(guess)

    console.log('guess :>> ', guess);
    Guess.findByIdAndUpdate(request.params.id, guess, { new: true })
        .then(updatedGuess => {
            response.json(updatedGuess)
        })
        .catch(error => next(error))
})

module.exports = router

const router = require('express').Router()
const Guess = require('../models/guess')
const Match = require('../models/match')
const User = require('../models/user')

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
    const user = await User.findById(body.userId)
    const match = await Match.findById(body.matchId)

    const newGuess = new Guess({
        match: match._id,
        user: user._id,
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
    user.points = user.points - guess.points
    await user.save()
    await guess.remove()
    return response.status(204).end()
})

router.put('/:id', async (request, response) => {
  const guess = request.body
  const updatedGuess = await Guess.findByIdAndUpdate(request.params.id, guess, { new: true })
  return response.json(updatedGuess)
})

module.exports = router

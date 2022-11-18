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
    const match = await Match.findById(body.matchId)
    const user = await User.findById(body.userId)

    const newGuess = new Guess({
        match: match._id,
        user: user._id,
        homeTeamScore: body.homeTeamScore,
        awayTeamScore: body.awayTeamScore,
    })
    
    const savedGuess = await newGuess.save()
    savedGuess.populate('match')
    savedGuess.populate('user')
    await User.findByIdAndUpdate(body.userId, { guesses: user.guesses.concat(savedGuess._id) }, { new: true })
    return response.status(201).json(savedGuess)
})

router.delete('/:id', async (request, response) => {
    const guess = await Guess.findById(request.params.id)
    console.log('guess.user._id :>> ', guess.user._id);
    const user = await User.findById(guess.user._id)
    if (!user || !guess) {
        return response.status(404).end()
    }
    user.guesses = user.guesses.filter(g => g.toString() !== guess._id.toString())
    if (guess.points > 0) {
        console.log('user.points @guess>0 :>> ', user.points);
        user.points = user.points - guess.points
        console.log('user.points @guess>0 :>> ', user.points);
    }
    else {
        console.log('user.points @guess<=0 :>> ', user.points);
        user.points = guess.points + user.points
        console.log('user.points @guess<=0 :>> ', user.points);
    }
    await user.save()
    await guess.remove()
    return response.status(204).end()
})

router.put('/:id', async (request, response) => {
    const guess = request.body
    const updatedGuess = await Guess.findByIdAndUpdate(request.params.id, guess, { new: true })
    await updatedGuess.populate('match')
    await updatedGuess.populate('user')
    return response.json(updatedGuess)
})

module.exports = router

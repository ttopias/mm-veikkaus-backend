const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  homeTeamScore: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
  },
  awayTeamScore: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
  },
  points: {
    type: Number,
    default: 0,
  }
})

schema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Guess', schema)
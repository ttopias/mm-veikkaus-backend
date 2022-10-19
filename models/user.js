const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    minlength: 3,
  },
  passwordHash: String,
  role: {
    type: String,
    default: 'guesser'
  },
  points: {
    type: Number,
    default: 0
  },
  guesses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guess'
    }
  ],
})

userSchema.plugin(uniqueValidator, { error: 'Only unique usernames are accepted'})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

module.exports = mongoose.model('User', userSchema)
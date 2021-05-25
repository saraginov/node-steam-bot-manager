'use strict'

/**
 * 
 */
const registerAccountQuestions = [
    {
        type: 'input',
        name: 'username',
        message: 'What is the bot username?'
    },
    {
        type: 'password',
        name: 'password',
        message: 'What is the bot password?'
    },
    {
        type: 'input',
        name: 'email',
        message: 'What is the email to register with?'
    }
]

module.exports = registerAccountQuestions

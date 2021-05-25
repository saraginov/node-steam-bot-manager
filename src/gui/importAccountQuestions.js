'use strict'

/**
 * 
 */
const importAccountQuestions = [
    {
        type: 'input',
        name: 'username',
        message: 'What is the bot username? [Required]'
    },
    {
        type: 'password',
        name: 'password',
        message: 'What is the bot password? [Required]'
    },
    {
        type: 'input',
        name: 'shared_secret',
        message: 'What is the shared_secret? (Optional)'
    },
    {
        type: 'input',
        name: 'identity_secret',
        message: 'What is the identity_secret? (Optional)'
    },
    {
        type: 'input',
        name: 'revocation',
        message: 'What is the revocation code? (Optional)'
    }
]


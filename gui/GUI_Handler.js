const inquirer = require("inquirer");
const EResult = require("../enums/EResult");

GUI_Handler.prototype.__proto__ = require('events').EventEmitter.prototype;

/**
 * Creates a new GUI_Handler instance.
 * @class
 */
function GUI_Handler(main) {
    var self = this;
    self.main = main;
    self.logger = main.logger;
    // self.ui = new inquirer.ui.BottomBar();
}


GUI_Handler.prototype.displayBotMenu = function () {
    var self = this;
    var tempList = [];
    var accounts = self.main.getAccounts();
    for (var accountIndex in accounts) {
        if (accounts.hasOwnProperty(accountIndex)) {
            tempList.push(accounts[accountIndex].getAccountName() + "[{0}]".format(accounts[accountIndex].getDisplayName()));
        }
    }
    tempList.push(new inquirer.Separator());
    tempList.push("register");
    tempList.push("exit");
    var botList = [
        {
            type: 'list',
            name: 'username',
            message: 'Choose the bot you would like to operate:',
            choices: tempList
        }
    ];
    inquirer.prompt(botList).then(function (result) {
        switch (result.username) {
            case 'register':
                var tempList = [];
                // ????? botList is hardcoded above with a single object...
                // why are you checking botList len?!
                if (botList.length > 0) { 
                    tempList.push("create new steam account");
                    tempList.push(new inquirer.Separator());
                }
                tempList.push("import account");
                var optionList = [
                    {
                        type: 'list',
                        name: 'registerOption',
                        message: 'Choose how you would like to register?:',
                        choices: tempList
                    }
                ];
                inquirer.prompt(optionList).then(function (result) {
                    switch (result.registerOption) {
                        case 'create new steam account':
                            var accountQuestions = [
                                {
                                    type: 'input',
                                    name: 'username',
                                    message: 'What\'s the bot username?'
                                },
                                {
                                    type: 'password',
                                    name: 'password',
                                    message: 'What\'s the bot password?'
                                },
                                {
                                    type: 'input',
                                    name: 'email',
                                    message: 'What\'s the email to register with?'
                                }
                            ];
                            inquirer.prompt(accountQuestions).then(function (result) {
                                if (result.username.length == 0 
                                    || result.password.length == 0 
                                    || result.email.length == 0 )
                                {
                                    self.displayBotMenu();
                                    self.main.errorDebug("One or more fields that are required are empty.");
                                } else {
                                    self.main.randomBot({}).createAccount(result.username,
                                        result.password,  result.email,
                                        function (eresult, steamid) {
                                            if (eresult != EResult.OK) {
                                                self.main.errorDebug("Failed to create account due to error: " + EResult[eresult]);
                                                self.displayBotMenu();
                                            } else {
                                                self.main.registerAccount(result.username, result.password, [], 
                                                    function (err) {
                                                        if (err)
                                                            self.main.errorDebug("Invalid username/password, either edit data file or try to register again..");
                                                        else
                                                            self.main.infoDebug("Successfully added new account to node-steam-bot-manager.");
                                                        self.displayBotMenu();
                                            });
                                        }
                                    });
                                }
                            });
                            break;

                        case 'import account':
                            accountQuestions = [
                                {
                                    type: 'input',
                                    name: 'username',
                                    message: 'What\'s the bot username? [Required]'
                                },
                                {
                                    type: 'password',
                                    name: 'password',
                                    message: 'What\'s the bot password? [Required]'
                                },
                                {
                                    type: 'input',
                                    name: 'shared_secret',
                                    message: 'What\'s the shared_secret? (Optional)'
                                },
                                {
                                    type: 'input',
                                    name: 'identity_secret',
                                    message: 'What\'s the identity_secret? (Optional)'
                                },
                                {
                                    type: 'input',
                                    name: 'revocation',
                                    message: 'What\'s the revocation code? (Optional)'
                                }
                            ];

                            inquirer.prompt(accountQuestions).then(function (result) {
                                // self.registerAccount()
                                if (result.username.length == 0 || result.password.length == 0){
                                    self.displayBotMenu();
                                    self.main.errorDebug("One or more fields that are required are empty.");
                                }
                                else {
                                    var details = {};
                                    if (result.shared_secret.length > 0)
                                        details.shared_secret = result.shared_secret;
                                    if (result.identity_secret.length > 0)
                                        details.identity_secret = result.identity_secret;
                                    if (result.revocation.length > 0)
                                        details.revocation = result.revocation;
                                    
                                    self.main.registerAccount(result.username, result.password, details, function (err) {
                                        self.displayBotMenu();
                                        if (err)
                                            self.main.errorDebug("The following details are incorrect: \nusername: {0}\npassword: {1}".format(result.username, result.password));
                                    });
                                }
                            });
                            break;
                    }
                });
                break;

            case 'exit':
                process.exit();

            default:
                self.main.findBot(result.username.split("\[")[0], function (err, accountDetails) {
                    // Check if bot is online or offline
                    if (err) {
                        self.main.errorDebug(err);
                    }
                    else {
                        self.displayMenu(accountDetails);
                    }
                });
                break;
        }
    });
};

GUI_Handler.prototype.processChat = function (botAccount, target) {
    var self = this;
    var chatMessage = [
        {
            message: 'Enter your message (\'quit\' to leave): ',
            type: 'input',
            name: 'message'
        }
    ];
    inquirer.prompt(chatMessage)
    .then(function (result) {
        if (result.message.toLowerCase() == "quit" || result.message.toLowerCase() == "exit") {
            botAccount.setChatting(null);
            self.displayMenu(botAccount);
        } else {
            // todo  why isn't err handled below?
            botAccount.Friends.sendMessage(target, result.message, function (err) {
                self.processChat(botAccount, target);
            });
        }
    });
};

GUI_Handler.prototype.tradeMenu = function (botAccount, tradeMenuOption) {
    var self = this;
    botAccount.Friends.getFriends(function (err, friendsList) {
        if (err) {
            self.main.errorDebug(err.toString());
            self.displayMenu(botAccount);
        } else {
            friendsList.unshift({username: "Back"});// Add to first pos
            var nameList = [];
            // friendId in friendsList doesn't make sense! because unshift is an array method
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
            // meaning friendId is the index...
            for (var friendId in friendsList) {
                if (friendsList.hasOwnProperty(friendId)) { // ... always true, check comment above
                    nameList.push(friendsList[friendId].username);
                }
            }
            var tradeMenu = [
                {
                    type: 'list',
                    name: 'tradeOption',
                    message: 'Who would you like to trade with?',
                    choices: nameList
                }
            ];

            // so if user inputs invalid option, does inquirer automatically take
            // care of that or do we have to manually account for this scenario?
            inquirer.prompt(tradeMenu).then(function (result) {
                var menuEntry = nameList.indexOf(result.tradeOption);
                // We will open chat with...
                var partner = friendsList[menuEntry];
                switch (menuEntry) {
                    case 0:
                        // Go back
                        self.initTradeMenu(botAccount);
                        break;
                    default:
                        // Trade with user selected.
                        botAccount.Trade.createOffer(partner.accountSid, function (err, currentOffer) {
                            if (err) {
                                self.main.errorDebug("Failed to create offer due to " + err);
                                return self.displayMenu(botAccount);
                            }

                            switch (tradeMenuOption) {
                                case 0:
                                    botAccount.getUserInventory(partner.accountSid, self.main.getAppID(), 2, true, function (err, inventory, currencies) {
                                        if (err) {
                                            self.main.errorDebug("User does not have game - " + err);
                                            self.displayMenu(botAccount);
                                        } else {
                                            if (inventory == null || inventory.length < 1) {
                                                self.main.infoDebug("Other user has no items in inventory. Redirecting to menu...");
                                                self.initTradeMenu(botAccount);
                                                return;
                                            }

                                            var nameList = [];
                                            for (var id in inventory) {
                                                // is inventory an object or an array?!
                                                if (inventory.hasOwnProperty(id)) {
                                                    nameList.push(inventory[id].name);
                                                }
                                            }
                                            var tradeMenu = [{
                                                    type: 'checkbox',
                                                    name: 'tradeOption',
                                                    message: 'What would you like to take? (\'Enter\' to send trade)',
                                                    choices: nameList,
                                            }];
                                            
                                            inquirer.prompt(tradeMenu).then(function (result) {
                                                if (result.tradeOption.length > 0) {
                                                    for (var itemNameIndex in result.tradeOption) {
                                                        if (result.tradeOption.hasOwnProperty(itemNameIndex)) {
                                                            var itemName = result.tradeOption[itemNameIndex];
                                                            currentOffer.addTheirItem(inventory[nameList.indexOf(itemName)]);
                                                            nameList[nameList.indexOf(itemName)] = {
                                                                name: itemName,
                                                                displayed: true
                                                            };
                                                        }
                                                    }
                                                    currentOffer.setMessage("Manual offer triggered by Bot Manager.");
                                                    currentOffer.send(function (err, status) {
                                                        if (err) {
                                                            self.main.errorDebug(err);
                                                            self.displayMenu(botAccount);
                                                        } else {
                                                            botAccount.Trade.confirmOutstandingTrades(function (err, confirmedTrades) {
                                                                self.main.infoDebug("Sent trade offer to %s." + partner.username);
                                                                self.displayMenu(botAccount);
                                                            });
                                                        }
                                                    });
                                                } else {
                                                    self.tradeMenu(botAccount, tradeMenuOption);
                                                }
                                            });
                                        }
                                    });

                                    break;
                                case 1:
                                    botAccount.getInventory(self.main.getAppID(), 2, true, function (err, inventory, currencies) {
                                        if (inventory == null || inventory.length < 1) {
                                            self.main.infoDebug("Bot has no items in inventory. Redirecting to menu...");
                                            self.initTradeMenu(botAccount);
                                            return;
                                        }

                                        var nameList = [];
                                        for (var id in inventory) {
                                            if (inventory.hasOwnProperty(id)) {
                                                nameList.push(inventory[id].name);
                                            }
                                        }


                                        var tradeMenu = [
                                            {
                                                type: 'checkbox',
                                                name: 'tradeOption',
                                                message: 'What would you like to offer? (\'Enter\' to send trade)',
                                                choices: nameList
                                            }

                                        ];
                                        inquirer.prompt(tradeMenu).then(function (result) {
                                            if (result.tradeOption.length > 0) {

                                                for (var itemNameIndex in result.tradeOption) {
                                                    if (result.tradeOption.hasOwnProperty(itemNameIndex)) {
                                                        var itemName = result.tradeOption[itemNameIndex];
                                                        currentOffer.addMyItem(inventory[nameList.indexOf(itemName)]);
                                                        nameList[nameList.indexOf(itemName)] = {
                                                            name: itemName,
                                                            displayed: true
                                                        };
                                                    }
                                                }
                                                currentOffer.setMessage("Manual offer triggered by Bot Manager.");
                                                currentOffer.send(function (err, status) {
                                                    if (err) {
                                                        self.main.errorDebug(err);
                                                        self.displayMenu(botAccount);
                                                    } else {
                                                        botAccount.Trade.confirmOutstandingTrades(function (err, confirmedTrades) {
                                                            self.main.infoDebug("Sent trade offer to %s, and confirmed %s.", partner.username, confirmedTrades.length);
                                                            self.displayMenu(botAccount);
                                                        });
                                                    }
                                                });
                                            } else {
                                                self.tradeMenu(botAccount, tradeMenuOption);
                                            }
                                        });
                                    });
                                    break;
                                default:
                                    self.tradeMenu(botAccount, tradeMenuOption);
                                    break;
                            }
                        });
                        break;
                }
            });
        }
    });
};

GUI_Handler.prototype.initTradeMenu = function (botAccount) {
    var self = this;
    var tradeOptions = [
        "Request Items",
        "Give Items",
        "Back"
    ];

    var tradeMenuOptions = [
        {
            type: 'list',
            name: 'tradeOption',
            message: 'What trade action would you like?',
            choices: tradeOptions
        }
    ];
    inquirer.prompt(tradeMenuOptions).then(function (result) {
        var tradeMenuEntry = tradeOptions.indexOf(result.tradeOption);
        switch (tradeMenuEntry) {
            case 0:
                self.tradeMenu(botAccount, 0);
                break;
            case 1:
                self.tradeMenu(botAccount, 1);
                break;
            default:
                self.displayMenu(botAccount);
                break;
        }
    });

};

GUI_Handler.prototype.displayMenu = function (botAccount) {
    var self = this;
    var menuOptions = [
        "Chat",
        "Send trade offer",
        //"Calculate Inventory", This option was temporary, but may maybe added later.
        new inquirer.Separator(),
        botAccount.loggedIn ? "Logout" : "Login",
        new inquirer.Separator(),
        "Manage",
        "Delete",
        "Back"
    ];
    // Disabled chat and trade systems..
    if (self.main.config.api_key == undefined){
        menuOptions[0] = "Chat [Disabled - missing 'api_key' in config]";
        menuOptions[1] = "Send trade offer [Disabled - missing 'api_key' in config]";
    }

    var mainMenu = [
        {
            type: 'list',
            name: 'menuOption',
            message: 'What would you like to do:',
            choices: menuOptions
        }
    ];
    inquirer.prompt(mainMenu).then(function (result) {
        var menuEntry = menuOptions.indexOf(result.menuOption);
        switch (menuEntry) {
            case 0:
                if (self.main.config.api_key == undefined){
                    self.displayMenu(botAccount);
                } else {
                    botAccount.Friends.getFriends(function (err, friendsList) {
                        if (err) {
                            self.main.errorDebug(err.toString());
                            self.displayMenu(botAccount);
                        }
                        else {
                            friendsList.unshift({username: "Back"});
                            var nameList = [];
                            for (var friendId in friendsList) {
                                if (friendsList.hasOwnProperty(friendId)) {
                                    nameList.push(friendsList[friendId].username);
                                }
                            }

                            var chatMenu = [
                                {
                                    type: 'list',
                                    name: 'chatOption',
                                    message: 'Who would you like to chat with?',
                                    choices: nameList
                                }
                            ];
                            inquirer.prompt(chatMenu).then(function (result) {
                                var menuEntry = nameList.indexOf(result.chatOption);
                                // We will open chat with...
                                switch (menuEntry) {
                                    case 0:
                                        self.displayMenu(botAccount);
                                        break;
                                    default:
                                        // User wants to actually chat with someone...
                                        botAccount.setChatting({
                                            username: friendsList[menuEntry].username,
                                            sid: friendsList[menuEntry].accountSid
                                        });
                                        self.processChat(botAccount, friendsList[menuEntry].accountSid);
                                        break;
                                }
                            });
                        }
                    });
                }


                break;
            case 1:
                if (self.main.config.api_key == undefined){
                    self.displayMenu(botAccount);
                } else {
                    self.initTradeMenu(botAccount);
                }
                break;
            case 3:
                // Handle logout/login logic and return to menu.
                if (!botAccount.loggedIn) {
                    self.main.infoDebug("Trying to authenticate into {0}".format(botAccount.getAccountName()));
                    botAccount.Auth.loginAccount(null, function (err) {
                        if (err) {
                            if (err.hasOwnProperty("emaildomain")) {
                                var authenticator = [
                                    {
                                        type: 'input',
                                        name: 'code',
                                        message: "Enter the authenticator code sent to your " + err["emaildomain"] + " email account for " + botAccount.username + ": "
                                    }
                                ];

                                inquirer.prompt(authenticator).then(function (result) {
                                    botAccount.Auth.loginAccount({twoFactorCode: result.code, authCode: result.code}, function (err) {

                                        self.displayBotMenu();

                                    });
                                });
                            } else {
                                self.main.errorDebug("Failed to login due to " + err);
                                self.displayBotMenu();

                            }
                        } else {
                            self.displayBotMenu();
                        }
                    });
                } else {
                    botAccount.logoutAccount();
                    self.displayBotMenu();
                }
                break;
            case 5:
                var authOptions = [];
                authOptions.push("Edit Display name");
                authOptions.push(new inquirer.Separator());
                authOptions.push((botAccount.Auth.has_shared_secret() ? "[ON]" : "[OFF]") + " 2-Factor Authentication");
                authOptions.push( (!botAccount.Auth.has_shared_secret() ? "[Disabled]" : "")  + "Generate 2-Factor Authentication code");
                authOptions.push("Back");

                var authMenu = [
                    {
                        type: 'list',
                        name: 'authOption',
                        message: 'Choose the authentication option you would like to activate.',
                        choices: authOptions
                    }
                ];
                inquirer.prompt(authMenu).then(function (result) {
                    var optionIndex = authOptions.indexOf(result.authOption);
                    switch (optionIndex) {
                        case 0:
                            var questions = [
                                {
                                    type: 'input',
                                    name: 'newName',
                                    message: "Enter the new name of the bot: "
                                },
                                {
                                    type: 'confirm',
                                    name: 'prefix',
                                    default: true,
                                    message: "Give default prefix of '{0}'?".format(self.main.config.bot_prefix)
                                }
                            ];

                            inquirer.prompt(questions).then(function (result) {
                                botAccount.Profile.changeDisplayName(result.newName, result.prefix ? self.main.config.bot_prefix : undefined, function (err) {
                                    self.displayMenu(botAccount);
                                    if (err) {
                                        self.main.errorDebug("Failed to change name. Error: {0}".format(err));
                                    }
                                    else {
                                        self.main.infoDebug("Successfully changed display name");
                                    }
                                })
                            });


                            break;
                        case 2:
                            if (!botAccount.shared_secret) {
                                // Enable 2FA
                                self.enableTwoFactor(botAccount);
                            } else {
                                // TODO: Move to BotAccount class
                                var questions = [
                                    {
                                        type: 'confirm',
                                        name: 'askDelete',
                                        default: false,
                                        message: 'Are you sure you want to disable 2-Factor Authentication on \'' + botAccount.username + '\' account?'
                                    }
                                ];
                                inquirer.prompt(questions).then(function (answers) {
                                    if (answers.askDelete) {
                                        botAccount.Auth.disableTwoFactor(function (err) {
                                            self.displayMenu(botAccount);
                                            if (err) {
                                                self.main.errorDebug("Encountered error while disabling 2-Factor Authentication: " + err.toString());
                                            } else {
                                                self.main.infoDebug("2-Factor Authentication has been successfully disabled.");
                                            }
                                        });
                                    }
                                    else {
                                        self.displayMenu(botAccount);
                                    }
                                });

                            }
                            break;
                        case 3:
                            self.displayMenu(botAccount);
                            if (botAccount.Auth.has_shared_secret()) {
                                // Send the auth key.
                                self.main.infoDebug("\nYour 2-Factor Authentication code for {0} is {1}".format(botAccount.getAccountName(), botAccount.Auth.generateMobileAuthenticationCode()));
                            } else {
                                // Auth not enabled?
                                self.main.errorDebug("2-Factor Authentication is not enabled. Check your email.");
                            }
                            break;
                        default:
                            self.displayMenu(botAccount);
                            break;
                    }
                });


                break;
            case 6:
                var botAccountName = botAccount.getAccountName();
                var questions = [
                    {
                        type: 'confirm',
                        name: 'askDelete',
                        message: 'Are you sure you want to delete \'{0}\' account?'.format(botAccountName)
                    }
                ];
                inquirer.prompt(questions).then(function (answers) {
                    if (answers.askDelete) {
                        self.main.deleteAccount(botAccount, function (err) {
                            if (err) {
                                // Failed...
                                self.main.errorDebug("Failed to delete account data due to " + err);
                            }
                            else {
                                self.main.infoDebug("Successfully deleted {0} from node-steam-bot-manager. A backup of account info was saved under 'deleted'.".format(botAccountName));
                                self.displayBotMenu();
                            }
                        });
                    }
                    else {
                        self.displayMenu(botAccount);
                    }
                });

                break;
            case 7:
                self.displayBotMenu();
                break;
        }

    });
};

/**
 * Start the two-factor-authentication process using the GUI
 * @param {BotAccount} botAccount - The bot chosen to enable two-factor authentication for.
 */
GUI_Handler.prototype.enableTwoFactor = function (botAccount) {
    var self = this;
    botAccount.hasPhone(function (err, hasPhone, lastDigits) {
        if (hasPhone) {
            botAccount.Auth.enableTwoFactor(function (err, response) {
                if (status == 84) {
                    // Rate limit exceeded. So delay the next request
                    self.main.infoDebug("Please wait 5 seconds to continue... Possibly blocked by Steam for sending out too many SMS's. Retry in 24 hours, please.");
                    setTimeout(function () {
                        self.enableTwoFactor(botAccount);
                    }, 5000);
                }
                else if (status == 1) {
                    self.main.infoDebug("Make sure to save the following code saved somewhere secure: {0}".format(response.revocation_code));
                    var questions = [
                        {
                            type: 'input',
                            name: 'code',
                            message: "Enter the code texted to the phone number associated (-{0}) to the account: ".format(lastDigits)
                        }
                    ];

                    inquirer.prompt(questions).then(function (result) {
                        if (result.code) {
                            var steamCode = result.code;
                            botAccount.Auth.finalizeTwoFactor(steamCode, function (err, accountDetails) {
                                if (err) {
                                    self.main.errorDebug("Failed to enable 2 factor auth - " + err);
                                }
                                else {
                                    self.main.AccountsManager.saveAccount(accountDetails, function (err) {
                                        if (err) {
                                            self.main.errorDebug("Failed to save accounts during 2 factor auth enable - " + err);
                                        }
                                        self.displayBotMenu();
                                    });
                                }
                            });
                        }
                    });
                }
                else {
                    self.main.errorDebug("Error encountered while trying to enable two-factor-authentication, error code: " + response);
                    self.displayBotMenu();
                }
            });
        }
        else {
            var questions = [
                {
                    type: 'confirm',
                    name: 'confirmAddition',
                    message: "A phone number is required to activate 2-factor-authentication. Would you like to set your phone number?",
                    default: false
                }
            ];

            inquirer.prompt(questions).then(function (result) {
                if (result.confirmAddition) {

                    var questions = [
                        {
                            type: 'input',
                            name: 'phoneNumber',
                            message: "Enter the number you would like to link to the account (ex. +18885550123)",
                            validate: function (value) {
                                var pass = value.match(/\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/i);
                                if (pass) {
                                    return true;
                                }
                                return 'Please enter a valid phone number (ex. +18885550123)';
                            }
                        }
                    ];

                    inquirer.prompt(questions).then(function (result) {
                        botAccount.addPhoneNumber(result.phoneNumber, function (err) {
                            if (err) {
                                self.main.errorDebug("Error while adding phone number: " + err);
                                self.displayMenu(botAccount);
                            }
                            else {
                                var questions = [
                                    {
                                        type: 'input',
                                        name: 'code',
                                        message: "Enter the code sent to your phone number at " + result.phoneNumber
                                    }
                                ];

                                inquirer.prompt(questions).then(function (result) {
                                    botAccount.verifyPhoneNumber(result.code, function (err) {
                                        if (err) {
                                            self.main.errorDebug("Error while verifying phone number: " + err);
                                            self.displayMenu(botAccount);
                                        }
                                        else {
                                            // Verified phone number...
                                            self.enableTwoFactor(botAccount);
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
                else {
                    // Take back to main menu.
                    self.main.errorDebug("Declined addition of phone number.");
                    self.displayMenu(botAccount);
                }
            });
        }
    });
};

/**
 * Format the string based on arguments provided after the string
 * @returns {String}
 */
String.prototype.format = function () {
    var content = this;
    for (var i = 0; i < arguments.length; i++) {
        var replacement = '{' + i + '}';
        content = content.replace(replacement, arguments[i]);
    }
    return content;
};

module.exports = GUI_Handler;

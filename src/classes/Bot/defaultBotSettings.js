'use strict'

const defaultBotSettings = {
    api_key: "",
    tradeCancelTime: 60 * 60 * 24 * 1000,
    tradePendingCancelTime: 60 * 60 * 24 * 1000,
    language: "en",
    tradePollInterval: 5000,
    tradeCancelOfferCount: 30,
    tradeCancelOfferCountMinAge: 60 * 60 * 1000,
    cancelTradeOnOverflow: true
}

module.exports = defaultBotSettings

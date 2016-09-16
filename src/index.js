/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get tide data from NOAA CO-OPS API (http://tidesandcurrents.noaa.gov/api/)
 * - Multiple optional slots: has 2 slots (city and date), where the user can provide 0, 1, or 2 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 * - Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, ask Tide Pooler when is the high tide in Seattle on Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 * Dialog model:
 *  User:  "Alexa, open Tide Pooler"
 *  Alexa: "Welcome to Tide Pooler. Which city would you like tide information for?"
 *  User:  "Seattle"
 *  Alexa: "For which date?"
 *  User:  "this Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');
    cheerio = require('cheerio');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * TidePooler is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MollyMoon = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MollyMoon.prototype = Object.create(AlexaSkill.prototype);
MollyMoon.prototype.constructor = MollyMoon;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

// MollyMoon.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
//     console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
//         + ", sessionId: " + session.sessionId);
//     // any initialization logic goes here
// };

// MollyMoon.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
//     console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
//     handleWelcomeRequest(response);
// };

// MollyMoon.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
//     console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
//         + ", sessionId: " + session.sessionId);
//     // any cleanup logic goes here
// };

/**
 * override intentHandlers to map intent handling functions.
 */
MollyMoon.prototype.intentHandlers = {
    "OneshotMollyMoonIntent": function (intent, session, response) {
        handleOneshotMollyMoonRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- TidePooler Domain Specific Business Logic --------------------------

// example city to NOAA station mapping. Can be found on: http://tidesandcurrents.noaa.gov/map/

function handleHelpRequest(response) {
    var repromptText = "Which city would you like tide information for?";
    var speechOutput = "I can lead you through providing a city and "
        + "day of the week to get tide information, "
        + "or you can simply open Tide Pooler and ask a question like, "
        + "get tide information for Seattle on Saturday. "
        + "For a list of supported cities, ask what cities are supported. "
        + "Or you can say exit. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotMollyMoonRequest(intent, session, response) {
    var endpoint = 'http://www.mollymoon.com/flavors/seasonal';

    http.get(endpoint, function (res) {
        var noaaResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            // tideResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            noaaResponseString += data;
        });

        res.on('end', function () {
            $ = cheerio.load(noaaResponseString);
            flavors = $('.product > strong');
            flavs = flavors.text().split(' ');
            flavs = flavs.filter(String);
            flavs = flavs.filter(function(n){ return n != "\n" });
            flavs = flavs.join(' ');
            console.log(flavs);

            response.tell(flavs, "MollyMoon", flavs);
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var mollyMoon = new MollyMoon();
    mollyMoon.execute(event, context);
};



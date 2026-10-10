"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Types_1 = require("@civ-clone/civ1-unit/Types");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const level_1 = require("@civ-clone/civ1-difficulty/level");
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const isHuman_1 = require("@civ-clone/civ1-difficulty/isHuman");
// v474.05 (OpenCivOne `CityWorker.cs` L422-L460): a unit with an attack makes its home city unhappy when it's away, or
//  wherever it is if it's an aircraft. Unarmed units (a Transport, Settlers) never do, and Diplomats and Caravans are
//  skipped before the check.
const causesUnhappiness = (unit, city) => !(unit instanceof Types_1.Diplomatic) &&
    unit.attack().value() > 0 &&
    (unit instanceof Types_1.Air || unit.tile() !== city.tile());
// v474.05 (OpenCivOne `CityWorker.cs` L1433-L1437) groups the governments in pairs for the empire size: Anarchy and
//  Despotism, Monarchy and Communism, Republic and Democracy.
const empireSizeFactors = [
    [Governments_1.Anarchy, 2],
    [Governments_1.Despotism, 2],
    [Governments_1.Monarchy, 3],
    [Governments_1.Communism, 3],
    [Governments_1.Republic, 4],
    [Governments_1.Democracy, 4],
];
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, cityRegistry = CityRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => {
    const size = (city) => cityGrowthRegistry.getByCity(city).size(), 
    // Citizens beyond those born content are born unhappy, up to the whole city: 6 - level are content in the human's
    //  cities, and 3 in the computer players'.
    bornUnhappy = (city, extra = 0) => Math.min(Math.max(size(city) -
        (0, level_1.contentCitizens)((0, level_1.levelOf)(gameDifficultyRegistry), (0, isHuman_1.default)(city.player(), clientRegistry)) +
        extra, 0), size(city)), 
    // A large empire makes one more citizen unhappy in each of the human's cities per E cities, where
    //  E = (government pair + 2) × (7 - level) (v474.05 `CityWorker.cs` L1433-L1437). The city's number staggers it:
    //  with E + 1 cities one of them gets the extra unhappy citizen, with E + 2 two of them, and so on. Civ1 numbers its
    //  cities across the game; this uses the order the player's cities were founded in, which staggers them the same
    //  way.
    empireSize = (city) => {
        var _a;
        const player = city.player();
        if (!(0, isHuman_1.default)(player, clientRegistry)) {
            return 0;
        }
        let factor = 2;
        try {
            const playerGovernment = playerGovernmentRegistry.getByPlayer(player), [, governmentFactor] = (_a = empireSizeFactors.find(([GovernmentType]) => playerGovernment.is(GovernmentType))) !== null && _a !== void 0 ? _a : [null, 2];
            factor = governmentFactor;
        }
        catch (e) {
            // A player with no government counts as Despotism.
        }
        const limit = factor * (7 - (0, level_1.levelOf)(gameDifficultyRegistry)), cities = cityRegistry.getByPlayer(player, true), cityNumber = Math.max(cities.indexOf(city), 0), cityCount = cityRegistry.getByPlayer(player).length;
        return Math.max(Math.floor(((cityNumber % limit) + cityCount - limit) / limit), 0);
    };
    return [
        new Yield_1.default('civ1-city-happiness:city/yield/population', new Criterion_1.default((city) => bornUnhappy(city) > 0), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(bornUnhappy(city)))),
        // What the empire's size adds to the citizens already born unhappy, within the city's size. Below the content
        //  limit it makes a content citizen unhappy only once the extra takes the city past it, as Civ1 counts it.
        new Yield_1.default('civ1-city-happiness:city/yield/empire-size', new Criterion_1.default((city) => empireSize(city) > 0), new Criterion_1.default((city) => bornUnhappy(city, empireSize(city)) > bornUnhappy(city)), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(bornUnhappy(city, empireSize(city)) - bornUnhappy(city)))),
        ...[
            [Governments_1.Republic, 1],
            [Governments_1.Democracy, 2],
        ].map(([GovernmentType, discontent]) => new Yield_1.default(new Criterion_1.default((city) => {
            try {
                return playerGovernmentRegistry
                    .getByPlayer(city.player())
                    .is(GovernmentType);
            }
            catch (e) {
                return false;
            }
        }), new Criterion_1.default((city) => unitRegistry
            .getByCity(city)
            .filter((unit) => causesUnhappiness(unit, city)).length > 0), new Effect_1.default((city) => unitRegistry
            .getByCity(city)
            .filter((unit) => causesUnhappiness(unit, city))
            .map((unit) => new Yields_1.MilitaryUnhappiness(discontent, unit))))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map
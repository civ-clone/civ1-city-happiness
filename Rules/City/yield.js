"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Types_1 = require("@civ-clone/civ1-unit/Types");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
// v474.05 (OpenCivOne `CityWorker.cs` L422-L460): a unit with an attack makes its home city unhappy when it's away, or
//  wherever it is if it's an aircraft. Unarmed units (a Transport, Settlers) never do, and Diplomats and Caravans are
//  skipped before the check.
const causesUnhappiness = (unit, city) => !(unit instanceof Types_1.Diplomatic) &&
    unit.attack().value() > 0 &&
    (unit instanceof Types_1.Air || unit.tile() !== city.tile());
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Yield_1.default(
    // TODO: factor in difficulty levels
    new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() - 5 > 0), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0)))),
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
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map
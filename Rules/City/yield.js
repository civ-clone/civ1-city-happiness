"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Types_1 = require("@civ-clone/civ1-unit/Types");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Yields_1 = require("../../Yields");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Yield_1.default(
    // TODO: factor in difficulty levels
    new Effect_1.default((city) => new Yields_1.Unhappiness(Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0), 'Population'))),
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
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length > 0), new Effect_1.default((city) => new Yields_1.Unhappiness(unitRegistry
        .getByCity(city)
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length * discontent, 'MilitaryDiscontent')))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map
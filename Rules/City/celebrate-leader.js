"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../../Yields");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new CelebrateLeader_1.default(new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() > 2), new Criterion_1.default((city, yields = city.yields()) => {
        const happiness = yields
            .filter((citizenState) => citizenState instanceof Yields_1.Happiness)
            .reduce((total, happiness) => total + happiness.value(), 0), unhappiness = yields
            .filter((citizenState) => citizenState instanceof Yields_1.Unhappiness)
            .reduce((total, unhappiness) => total + unhappiness.value(), 0);
        return (!unhappiness &&
            Math.floor(happiness) >= cityGrowthRegistry.getByCity(city).size() / 2);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebrate-leader.js.map
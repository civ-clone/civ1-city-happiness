"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../../Yields");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new CelebrateLeader_1.default(new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() > 2), new Criterion_1.default((city, yields = city.yields()) => {
        const [happiness, unhappiness] = (0, reduceYields_1.reduceYields)(yields, Yields_1.Happiness, Yields_1.Unhappiness);
        // TODO: This might not have to be 0, it needs to be worked out properly based on the city size
        return (unhappiness === 0 &&
            Math.floor(happiness) >= cityGrowthRegistry.getByCity(city).size() / 2);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebrate-leader.js.map
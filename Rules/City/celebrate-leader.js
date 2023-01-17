"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const calculateCitizenState_1 = require("../../lib/calculateCitizenState");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new CelebrateLeader_1.default(new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() > 2), new Criterion_1.default((city, yields = city.yields()) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), citizenState = (0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, yields), [unhappiness, , happiness] = (0, calculateCitizenState_1.citizenSummary)(citizenState);
        return (unhappiness === 0 && Math.floor(happiness) >= cityGrowth.size() / 2);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebrate-leader.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Yields_1 = require("../../Yields");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const getRules = () => [
    new CivilDisorder_1.default(new Criterion_1.default((city, yields = city.yields()) => {
        const happiness = yields
            .filter((citizenState) => citizenState instanceof Yields_1.Happiness)
            .reduce((total, happiness) => total + happiness.value(), 0), unhappiness = yields
            .filter((citizenState) => citizenState instanceof Yields_1.Unhappiness)
            .reduce((total, unhappiness) => total + unhappiness.value(), 0);
        return unhappiness > happiness;
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=civil-disorder.js.map
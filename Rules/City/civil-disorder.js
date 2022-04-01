"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Yields_1 = require("../../Yields");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const getRules = () => [
    new CivilDisorder_1.default(new Criterion_1.default((city, yields = city.yields()) => {
        const [happiness, unhappiness] = (0, reduceYields_1.reduceYields)(yields, Yields_1.Happiness, Yields_1.Unhappiness);
        return unhappiness > happiness;
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=civil-disorder.js.map
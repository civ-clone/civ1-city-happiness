"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Action_1 = require("@civ-clone/core-player/Rules/Action");
const CivilDisorder_1 = require("../../PlayerActions/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const turn_start_1 = require("./turn-start");
const getRules = (cityRegistry = CityRegistry_1.instance) => [
    new Action_1.default(new Effect_1.default((player) => cityRegistry
        .getByPlayer(player)
        .filter((city) => turn_start_1.hasCivilDisorder.has(city))
        .map((city) => new CivilDisorder_1.default(player, city)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=action.js.map
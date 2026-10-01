"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepsMartialLaw = exports.martialLawUnitLimit = exports.martialLawGovernments = void 0;
// Civ1's martial law, as v474.05 has it (OpenCivOne's decompile, `src/Game/CodeObjects/CityWorker.cs`, the city
//  happiness routine, L1527–1575): under these governments, each unit in a city whose type has an attack strength makes
//  one of the city's unhappy citizens content, up to `martialLawUnitLimit` units, after its Temple, Colosseum,
//  Cathedral and Wonders have calmed what they can. `Rules/City/cost.ts` applies it; exported so that other packages
//  (the computer players' production, for one) don't repeat it.
const Governments_1 = require("@civ-clone/civ1-government/Governments");
exports.martialLawGovernments = [
    Governments_1.Anarchy,
    Governments_1.Communism,
    Governments_1.Despotism,
    Governments_1.Monarchy,
];
exports.martialLawUnitLimit = 3;
// A unit that martial law can use: any whose attack isn't 0, so not Settlers, Diplomats, Caravans or Transports, but
//  a ship or an aircraft in the city counts.
const keepsMartialLaw = (unit) => unit.attack().value() > 0;
exports.keepsMartialLaw = keepsMartialLaw;
//# sourceMappingURL=martialLaw.js.map
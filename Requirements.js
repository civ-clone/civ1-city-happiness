"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describedRequirements = exports.templeEnhancedByMysticism = void 0;
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Requirement_1 = require("@civ-clone/core-requirement/Requirement");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
// What makes Civilization's happiness improvements work better, as entries for the civilopedia
//  (civ-clone/web-renderer#37). `Rules/City/cost`'s table plays them, as an entry can't say by how much.
/** A Temple makes one more citizen content once its player has Mysticism. */
exports.templeEnhancedByMysticism = new Requirement_1.Requirement({
    id: 'civ1-city-happiness:city/cost/enhanced-by/Temple',
    subject: CityImprovements_1.Temple,
    relation: 'enhancedBy',
    targets: [Advances_1.Mysticism],
});
/** The entries that only describe: no rule is made from them. */
exports.describedRequirements = [exports.templeEnhancedByMysticism];
exports.default = exports.describedRequirements;
//# sourceMappingURL=Requirements.js.map
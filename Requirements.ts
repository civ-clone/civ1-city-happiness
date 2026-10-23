import { Mysticism } from '@civ-clone/civ1-science/Advances';
import { Requirement } from '@civ-clone/core-requirement/Requirement';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';

// What makes Civilization's happiness improvements work better, as entries for the civilopedia
//  (civ-clone/web-renderer#37). `Rules/City/cost`'s table plays them, as an entry can't say by how much.

/** A Temple makes one more citizen content once its player has Mysticism. */
export const templeEnhancedByMysticism = new Requirement({
  id: 'civ1-city-happiness:city/cost/enhanced-by/Temple',
  subject: Temple,
  relation: 'enhancedBy',
  targets: [Mysticism],
});

/** The entries that only describe: no rule is made from them. */
export const describedRequirements: Requirement[] = [templeEnhancedByMysticism];

export default describedRequirements;

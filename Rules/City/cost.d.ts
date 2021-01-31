import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Cost from '@civ-clone/core-city/Rules/Cost';
export declare const getRules: (
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry
) => Cost[];
export default getRules;

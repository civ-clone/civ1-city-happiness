import City from '@civ-clone/core-city/City';
import { IRuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Rule from '@civ-clone/core-rule/Rule';
import Yield from '@civ-clone/core-yield/Yield';
declare type CelebrateLeaderArgs = [City, Yield[]?];
export declare class CelebrateLeader extends Rule<CelebrateLeaderArgs, void> {}
export default CelebrateLeader;
export interface ICelebrateLeaderRegistry
  extends IRuleRegistry<CelebrateLeader, CelebrateLeaderArgs, void> {}

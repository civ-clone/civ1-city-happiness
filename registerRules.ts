import { instance as ruleRegistryInstance } from '@civ-clone/core-rule/RuleRegistry';
import celebrateLeader from './Rules/City/celebrate-leader';
import cityYield from './Rules/City/yield';
import civilDisorder from './Rules/City/civil-disorder';
import cost from './Rules/City/cost';
import turnStart from './Rules/Player/turn-start';

ruleRegistryInstance.register(
  ...celebrateLeader(),
  ...cityYield(),
  ...civilDisorder(),
  ...cost(),
  ...turnStart()
);

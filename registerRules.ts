import cityCelebrateLeader from './Rules/City/celebrate-leader';
import cityCivilDisorder from './Rules/City/civil-disorder';
import cityCost from './Rules/City/cost';
import cityYield from './Rules/City/yield';
import { instance as ruleRegistryInstance } from '@civ-clone/core-rule/RuleRegistry';
import playerAction from './Rules/Player/action';
import playerTurnStart from './Rules/Player/turn-start';

ruleRegistryInstance.register(
  ...cityCelebrateLeader(),
  ...cityYield(),
  ...cityCivilDisorder(),
  ...cityCost(),
  ...playerAction(),
  ...playerTurnStart()
);

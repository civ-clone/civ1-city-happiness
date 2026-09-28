import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import Action from '@civ-clone/core-player/Rules/Action';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '../../PlayerActions/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import { civilDisorder } from '../../lib/cityStatus';

export const getRules = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): Action[] => [
  new Action(
    new Effect((player: Player) =>
      cityRegistry
        .getByPlayer(player)
        .filter((city: City) => civilDisorder(city, pendingEffects) !== null)
        .map((city: City) => new CivilDisorder(player, city))
    )
  ),
];

export default getRules;

import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import Action from '@civ-clone/core-player/Rules/Action';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '../../PlayerActions/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import { hasCivilDisorder } from './turn-start';

export const getRules = (
  cityRegistry: CityRegistry = cityRegistryInstance
): Action[] => [
  new Action(
    new Effect((player: Player) =>
      cityRegistry
        .getByPlayer(player)
        .filter((city: City) => hasCivilDisorder.has(city))
        .map((city: City) => new CivilDisorder(player, city))
    )
  ),
];

export default getRules;

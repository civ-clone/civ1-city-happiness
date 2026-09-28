import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import { CIVIL_DISORDER, LEADER_CELEBRATION } from '../../lib/cityStatus';
import City from '@civ-clone/core-city/City';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';

export const getRules = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): Destroyed[] => [
  // Dropped rather than discharged: a razed city isn't owed "order restored",
  // and keeping the effect would keep the city in the save.
  new Destroyed(
    'civ1-city-happiness:city/destroyed/forget-status',
    new Effect((city: City): void =>
      pendingEffects
        .getByTarget(city)
        .filter((pendingEffect: PendingEffect): boolean =>
          [CIVIL_DISORDER, LEADER_CELEBRATION].includes(pendingEffect.handler())
        )
        .forEach((pendingEffect: PendingEffect): void =>
          pendingEffects.unregister(pendingEffect)
        )
    )
  ),
];

export default getRules;

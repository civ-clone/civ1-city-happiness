import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CivilDisorder,
  ICivilDisorderRegistry,
} from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { High, Low } from '@civ-clone/core-rule/Priorities';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Production, Trade } from '@civ-clone/base-terrain-civ1/Yields';
import { Unhappiness } from '../../Yields';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry
) => CityYield[] = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): CityYield[] => [
  new CityYield(
    new High(),
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    // TODO: factor in difficulty levels
    new Effect((cityYield: Yield, city: City): void =>
      cityYield.add(
        Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0),
        'population'
      )
    )
  ),
  new CityYield(
    new Low(),
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Production
    ),
    new Criterion((cityYield: Yield, city: City, yields: Yield[]): boolean =>
      (ruleRegistry as ICivilDisorderRegistry)
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city, yields))
    ),
    new Effect((cityYield: Yield): void => cityYield.set(0))
  ),
  new CityYield(
    new Low(),
    new Criterion((cityYield: Yield) => cityYield instanceof Trade),
    new Criterion((cityYield: Yield, city: City, yields: Yield[]): boolean =>
      (ruleRegistry as ICivilDisorderRegistry)
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city, yields))
    ),
    new Effect((cityYield: Yield): void => cityYield.set(0))
  ),
];

export default getRules;

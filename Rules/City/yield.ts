import {
  Cathedral,
  Colosseum,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CivilDisorder,
  ICivilDisorderRegistry,
} from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { High, Low } from '@civ-clone/core-rule/Priorities';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Gold } from '@civ-clone/civ1-city/Yields';
import { Research } from '@civ-clone/civ1-science/Yields';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import { Production } from '@civ-clone/civ1-world/Yields';
import { Unhappiness } from '../../Yields';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry,
  playerResearchRegistry?: PlayerResearchRegistry
) => CityYield[] = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance
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
        'Population'
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
    new Effect((cityYield: Yield): void => cityYield.set(0, CivilDisorder.name))
  ),
  new CityYield(
    new Low(),
    new Criterion(
      (cityYield: Yield): boolean =>
        cityYield instanceof Gold || cityYield instanceof Research
    ),
    new Criterion((cityYield: Yield, city: City, yields: Yield[]): boolean =>
      (ruleRegistry as ICivilDisorderRegistry)
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city, yields))
    ),
    new Effect((cityYield: Yield): void => cityYield.set(0, CivilDisorder.name))
  ),
  ...(
    [
      [Temple, 1],
      [Colosseum, 2],
      [Cathedral, 3],
    ] as [typeof CityImprovement, number][]
  ).map(
    ([Improvement, reduction]) =>
      new CityYield(
        new Low(),
        new Criterion(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        ),
        new Criterion((cityYield: Yield, city: City): boolean =>
          cityImprovementRegistry
            .getByCity(city)
            .some(
              (cityImprovement: CityImprovement): boolean =>
                cityImprovement instanceof Improvement
            )
        ),
        new Effect((cityYield: Yield): void =>
          cityYield.subtract(reduction, Improvement.name)
        )
      )
  ),
  new CityYield(
    new Low(),
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    new Criterion((cityYield: Yield, city: City): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (cityImprovement: CityImprovement): boolean =>
            cityImprovement instanceof Temple
        )
    ),
    new Criterion((cityYield: Yield, city: City): boolean =>
      playerResearchRegistry.getByPlayer(city.player()).completed(Mysticism)
    ),
    new Effect((cityYield: Yield): void =>
      cityYield.subtract(1, Mysticism.name)
    )
  ),
];

export default getRules;

import {
  Anarchy,
  Communism,
  Despotism,
  Monarchy,
} from '@civ-clone/civ1-government/Governments';
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
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';
import { Gold } from '@civ-clone/civ1-city/Yields';
import { Low } from '@civ-clone/core-rule/Priorities';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import { Production } from '@civ-clone/civ1-world/Yields';
import { Research } from '@civ-clone/civ1-science/Yields';
import { Unhappiness } from '../../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  playerResearchRegistry?: PlayerResearchRegistry,
  unitRegistry?: UnitRegistry
) => CityYield[] = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance
): Cost[] => [
  new Cost(
    new Low(),
    new Criterion(
      (cityYield: Yield): boolean =>
        cityYield instanceof Gold ||
        cityYield instanceof Research ||
        cityYield instanceof Production
    ),
    new Criterion(
      (
        cityYield: Yield,
        city: City,
        yields: Yield[] = city.yields()
      ): boolean =>
        (ruleRegistry as ICivilDisorderRegistry)
          .get(CivilDisorder)
          .some((rule: CivilDisorder): boolean => rule.validate(city, yields))
    ),
    new Effect((cityYield: Yield): void =>
      cityYield.subtract(cityYield, CivilDisorder.name)
    )
  ),

  new Cost(
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    new Criterion((cityYield: Yield, city: City): boolean =>
      playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Anarchy, Communism, Despotism, Monarchy)
    ),
    new Effect((cityYield: Yield, city: City): void =>
      cityYield.subtract(
        Math.min(
          4,
          Math.min(
            cityYield.value(),
            unitRegistry
              .getByTile(city.tile())
              .filter((unit: Unit): boolean => unit instanceof Fortifiable)
              .length
          )
        ),
        'MartialLaw'
      )
    )
  ),

  ...(
    [
      [Temple, 1],
      [Colosseum, 3],
      [Cathedral, 4],
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
          cityYield.subtract(
            Math.min(reduction, cityYield.value()),
            Improvement.name
          )
        )
      )
  ),

  new Cost(
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
      cityYield.subtract(Math.min(1, cityYield.value()), Mysticism.name)
    )
  ),
];

export default getRules;

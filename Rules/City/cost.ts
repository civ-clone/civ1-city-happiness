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
  Gold,
  Happiness,
  Luxuries,
  Production,
  Research,
  Unhappiness,
} from '../../Yields';
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
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';
import High from '@civ-clone/core-rule/Priorities/High';
import { Low } from '@civ-clone/core-rule/Priorities';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import Priority from '@civ-clone/core-rule/Priority';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

export const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  playerResearchRegistry?: PlayerResearchRegistry,
  unitRegistry?: UnitRegistry
) => Cost[] = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance
): Cost[] => [
  // Martial Law
  new Cost(
    new Criterion((city: City): boolean =>
      playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Anarchy, Communism, Despotism, Monarchy)
    ),
    new Effect((city: City, yields: Yield[]): Yield[] =>
      unitRegistry
        .getByTile(city.tile())
        .filter((unit: Unit): boolean => unit instanceof Fortifiable)
        .slice(0, Math.min(4, reduceYield(yields, Unhappiness)))
        .map((unit) => new Unhappiness(-1, unit.id()))
    )
  ),

  new Cost(
    new Low(),
    new Criterion((city: City): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (cityImprovement: CityImprovement): boolean =>
            cityImprovement instanceof Temple
        )
    ),
    new Criterion(
      (city: City): boolean =>
        !playerResearchRegistry.getByPlayer(city.player()).completed(Mysticism)
    ),
    new Effect(
      (city: City, yields: Yield[]): Yield =>
        new Unhappiness(
          -Math.min(1, reduceYield(yields, Unhappiness)),
          Temple.name
        )
    )
  ),

  new Cost(
    new Low(),
    new Criterion((city: City): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (cityImprovement: CityImprovement): boolean =>
            cityImprovement instanceof Temple
        )
    ),
    new Criterion((city: City): boolean =>
      playerResearchRegistry.getByPlayer(city.player()).completed(Mysticism)
    ),
    new Effect(
      (city: City, yields: Yield[]): Yield =>
        new Unhappiness(
          -Math.min(2, reduceYield(yields, Unhappiness)),
          Temple.name
        )
    )
  ),

  ...(
    [
      [Colosseum, 3],
      [Cathedral, 4],
    ] as [typeof CityImprovement, number][]
  ).map(
    ([Improvement, reduction]) =>
      new Cost(
        new Low(),
        new Criterion((city: City, yields: Yield[]): boolean =>
          cityImprovementRegistry
            .getByCity(city)
            .some(
              (cityImprovement: CityImprovement): boolean =>
                cityImprovement instanceof Improvement
            )
        ),
        new Effect(
          (city: City, yields: Yield[]): Yield =>
            new Unhappiness(
              -Math.min(reduction, reduceYield(yields, Unhappiness)),
              Improvement.name
            )
        )
      )
  ),

  new Cost(
    new High(),
    new Criterion(
      (city: City, yields: Yield[]) =>
        !yields.some(
          (cityYield) =>
            cityYield instanceof Happiness &&
            cityYield
              .values()
              .some(([, provider]) => provider === Luxuries.name)
        )
    ),
    new Effect(
      (city: City, yields: Yield[]): Yield =>
        new Happiness(
          Math.floor(reduceYield(yields, Luxuries) / 2),
          Luxuries.name
        )
    )
  ),
];

export default getRules;

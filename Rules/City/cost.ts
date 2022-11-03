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
  CityImprovementContent,
  Happiness,
  Luxuries,
  LuxuryHappiness,
  MartialLaw,
  Unhappiness,
} from '../../Yields';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
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
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';
import High from '@civ-clone/core-rule/Priorities/High';
import { Low } from '@civ-clone/core-rule/Priorities';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import Or from '@civ-clone/core-rule/Criteria/Or';
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
        .map((unit) => new MartialLaw(1, unit) as Yield)
    )
  ),

  ...(
    [
      [Temple, 1],
      [Temple, 1, Mysticism],
      [Colosseum, 3],
      [Cathedral, 4],
    ] as [typeof CityImprovement, number, ...typeof Advance[]][]
  ).map(
    ([CityImprovementType, value, ...advances]) =>
      new Cost(
        new Low(),
        new Criterion((city: City): boolean =>
          cityImprovementRegistry
            .getByCity(city)
            .some(
              (cityImprovement: CityImprovement): boolean =>
                cityImprovement instanceof CityImprovementType
            )
        ),
        new Or(
          new Criterion((city: City): boolean => advances.length === 0),
          new Criterion((city: City): boolean =>
            advances.every((AdvanceType) =>
              playerResearchRegistry
                .getByPlayer(city.player())
                .completed(AdvanceType)
            )
          )
        ),
        new Criterion(
          (city: City, yields: Yield[]) => reduceYield(yields, Unhappiness) > 0
        ),
        new Effect(
          (city: City, yields: Yield[]): Yield =>
            new CityImprovementContent(
              Math.min(value, reduceYield(yields, Unhappiness)),
              cityImprovementRegistry
                .getByCity(city)
                .filter(
                  (cityImprovement) =>
                    cityImprovement instanceof CityImprovementType
                )[0]
            ) as Yield
        )
      )
  ),

  new Cost(
    new High(),
    new Effect(
      (city: City, yields: Yield[]): Yield =>
        new LuxuryHappiness(
          Math.floor(reduceYield(yields, Luxuries) / 2),
          Luxuries.name
        )
    )
  ),
];

export default getRules;

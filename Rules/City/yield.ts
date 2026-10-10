import { Air, Diplomatic } from '@civ-clone/civ1-unit/Types';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { contentCitizens, levelOf } from '@civ-clone/civ1-difficulty/level';
import { MilitaryUnhappiness, PopulationUnhappiness } from '../../Yields';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import Yield from '@civ-clone/core-yield/Yield';
import Unit from '@civ-clone/core-unit/Unit';
import isHuman from '@civ-clone/civ1-difficulty/isHuman';

// v474.05 (OpenCivOne `CityWorker.cs` L422-L460): a unit with an attack makes its home city unhappy when it's away, or
//  wherever it is if it's an aircraft. Unarmed units (a Transport, Settlers) never do, and Diplomats and Caravans are
//  skipped before the check.
const causesUnhappiness = (unit: Unit, city: City): boolean =>
  !(unit instanceof Diplomatic) &&
  unit.attack().value() > 0 &&
  (unit instanceof Air || unit.tile() !== city.tile());

// v474.05 (OpenCivOne `CityWorker.cs` L1433-L1437) groups the governments in pairs for the empire size: Anarchy and
//  Despotism, Monarchy and Communism, Republic and Democracy.
const empireSizeFactors: [typeof Government, number][] = [
  [Anarchy, 2],
  [Despotism, 2],
  [Monarchy, 3],
  [Communism, 3],
  [Republic, 4],
  [Democracy, 4],
];

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry,
  cityRegistry?: CityRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => CityYield[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  cityRegistry: CityRegistry = cityRegistryInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): CityYield[] => {
  const size = (city: City): number =>
      cityGrowthRegistry.getByCity(city).size(),
    // Citizens beyond those born content are born unhappy, up to the whole city: 6 - level are content in the human's
    //  cities, and 3 in the computer players'.
    bornUnhappy = (city: City, extra: number = 0): number =>
      Math.min(
        Math.max(
          size(city) -
            contentCitizens(
              levelOf(gameDifficultyRegistry),
              isHuman(city.player(), clientRegistry)
            ) +
            extra,
          0
        ),
        size(city)
      ),
    // A large empire makes one more citizen unhappy in each of the human's cities per E cities, where
    //  E = (government pair + 2) × (7 - level) (v474.05 `CityWorker.cs` L1433-L1437). The city's number staggers it:
    //  with E + 1 cities one of them gets the extra unhappy citizen, with E + 2 two of them, and so on. Civ1 numbers its
    //  cities across the game; this uses the order the player's cities were founded in, which staggers them the same
    //  way.
    empireSize = (city: City): number => {
      const player = city.player();

      if (!isHuman(player, clientRegistry)) {
        return 0;
      }

      let factor = 2;

      try {
        const playerGovernment = playerGovernmentRegistry.getByPlayer(player),
          [, governmentFactor] = empireSizeFactors.find(([GovernmentType]) =>
            playerGovernment.is(GovernmentType)
          ) ?? [null, 2];

        factor = governmentFactor;
      } catch (e) {
        // A player with no government counts as Despotism.
      }

      const limit = factor * (7 - levelOf(gameDifficultyRegistry)),
        cities = cityRegistry.getByPlayer(player, true),
        cityNumber = Math.max(cities.indexOf(city), 0),
        cityCount = cityRegistry.getByPlayer(player).length;

      return Math.max(
        Math.floor(((cityNumber % limit) + cityCount - limit) / limit),
        0
      );
    };

  return [
    new CityYield(
      'civ1-city-happiness:city/yield/population',
      new Criterion((city: City): boolean => bornUnhappy(city) > 0),
      new Effect(
        (city: City): Yield => new PopulationUnhappiness(bornUnhappy(city))
      )
    ),

    // What the empire's size adds to the citizens already born unhappy, within the city's size. Below the content
    //  limit it makes a content citizen unhappy only once the extra takes the city past it, as Civ1 counts it.
    new CityYield(
      'civ1-city-happiness:city/yield/empire-size',
      new Criterion((city: City): boolean => empireSize(city) > 0),
      new Criterion(
        (city: City): boolean =>
          bornUnhappy(city, empireSize(city)) > bornUnhappy(city)
      ),
      new Effect(
        (city: City): Yield =>
          new PopulationUnhappiness(
            bornUnhappy(city, empireSize(city)) - bornUnhappy(city)
          )
      )
    ),

    ...(
      [
        [Republic, 1],
        [Democracy, 2],
      ] as [typeof Government, number][]
    ).map(
      ([GovernmentType, discontent]) =>
        new CityYield(
          new Criterion((city: City): boolean => {
            try {
              return playerGovernmentRegistry
                .getByPlayer(city.player())
                .is(GovernmentType);
            } catch (e) {
              return false;
            }
          }),
          new Criterion(
            (city: City): boolean =>
              unitRegistry
                .getByCity(city)
                .filter((unit) => causesUnhappiness(unit, city)).length > 0
          ),
          new Effect((city: City): Yield[] =>
            unitRegistry
              .getByCity(city)
              .filter((unit) => causesUnhappiness(unit, city))
              .map((unit) => new MilitaryUnhappiness(discontent, unit) as Yield)
          )
        )
    ),
  ];
};

export default getRules;

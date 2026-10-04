import { Happiness, Unhappiness } from '../Yields';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistRegistry from '@civ-clone/core-city/SpecialistRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import getAdditionalData, { Citizens } from '../AdditionalData/citizens';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('citizens', (): void => {
  // The `citizens` data for a size 6 city with the given yields and one specialist.
  const citizensFor = async (yields: Yield[]) => {
    const cityGrowthRegistry = new CityGrowthRegistry(),
      specialistRegistry = new SpecialistRegistry(),
      city = await setUpCity({
        size: 6,
        ruleRegistry: new RuleRegistry(),
        playerWorldRegistry: new PlayerWorldRegistry(),
        tileImprovementRegistry: new TileImprovementRegistry(),
        cityGrowthRegistry,
      });

    specialistRegistry.register(new Specialist(city));
    city.yields = () => yields;

    const [citizens] = getAdditionalData(
      cityGrowthRegistry,
      specialistRegistry
    );

    return citizens.data(city) as Citizens;
  };

  it('sends the mood of each working citizen', async (): Promise<void> => {
    const { moods } = await citizensFor([new Unhappiness(2), new Happiness(2)]);

    expect(moods).eql(['happy', 'happy', 'content', 'unhappy', 'unhappy']);
  });

  it('sends the moods after each Happiness and Unhappiness yield', async (): Promise<void> => {
    const unhappiness = new Unhappiness(2),
      happiness = new Happiness(2),
      { causes } = await citizensFor([
        new Yield(4),
        unhappiness,
        new Happiness(0),
        happiness,
      ]);

    expect(causes.map((cause) => cause.yield)).eql([unhappiness, happiness]);
    expect(causes.map((cause) => cause.moods)).eql([
      ['content', 'content', 'content', 'unhappy', 'unhappy'],
      ['happy', 'happy', 'content', 'unhappy', 'unhappy'],
    ]);
  });
});

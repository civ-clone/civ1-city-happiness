import { Happiness, Unhappiness } from '../Yields';
import {
  calculateCitizenState,
  citizenSummary,
} from '../lib/calculateCitizenState';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistRegistry from '@civ-clone/core-city/SpecialistRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('calculateCitizenState', (): void => {
  // [unhappy, content, happy] for a size 6 city with the given yields and number of specialists.
  const summarise = async (
    yields: Yield[],
    specialists: number
  ): Promise<[number, number, number]> => {
    const cityGrowthRegistry = new CityGrowthRegistry(),
      specialistRegistry = new SpecialistRegistry(),
      city = await setUpCity({
        size: 6,
        ruleRegistry: new RuleRegistry(),
        playerWorldRegistry: new PlayerWorldRegistry(),
        tileImprovementRegistry: new TileImprovementRegistry(),
        cityGrowthRegistry,
      });

    for (let i = 0; i < specialists; i++) {
      specialistRegistry.register(new Specialist(city));
    }

    return citizenSummary(
      calculateCitizenState(
        cityGrowthRegistry.getByCity(city),
        yields,
        specialistRegistry
      )
    );
  };

  it('counts every citizen when there are no specialists', async (): Promise<void> => {
    expect(await summarise([new Unhappiness(2), new Happiness(2)], 0)).eql([
      2, 2, 2,
    ]);
  });

  it('draws specialists from the content citizens first', async (): Promise<void> => {
    expect(await summarise([new Unhappiness(2), new Happiness(2)], 1)).eql([
      2, 1, 2,
    ]);
  });

  // civ-clone/web-renderer#224: v474.05 takes specialists out before any Happiness is applied, so never from the happy
  //  citizens. Here 3 of the 4 content citizens become specialists, and the Happiness makes the last one happy and an
  //  unhappy one content.
  it('then from the unhappy citizens, before any are made happy', async (): Promise<void> => {
    expect(await summarise([new Unhappiness(2), new Happiness(2)], 3)).eql([
      1, 1, 1,
    ]);
  });

  it('from the unhappy citizens when there are no content ones', async (): Promise<void> => {
    expect(await summarise([new Unhappiness(6)], 2)).eql([4, 0, 0]);
  });

  // 3 content citizens made happy, then an unhappy one made content with the last point: not made happy as well.
  it('spends each point of Happiness once', async (): Promise<void> => {
    expect(await summarise([new Unhappiness(3), new Happiness(4)], 0)).eql([
      2, 1, 3,
    ]);
  });
});

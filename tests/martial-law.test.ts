import { CityImprovementContent, MartialLaw, Unhappiness } from '../Yields';
import {
  Diplomat,
  Settlers,
  Trireme,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import { Monarchy, Republic } from '@civ-clone/civ1-government/Governments';
import { martialLawGovernments, martialLawUnitLimit } from '../martialLaw';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import City from '@civ-clone/core-city/City';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import unitYield from '@civ-clone/civ1-unit/Rules/Unit/yield';

// civ-clone/web-renderer#224: martial law as v474.05 has it.
describe('city:cost martial law', (): void => {
  // A size 8 city with `unhappy` unhappy citizens, under `GovernmentType`, with one of each of `UnitTypes` in it.
  const setUp = async (
    unhappy: number,
    UnitTypes: (typeof Unit)[],
    GovernmentType: typeof Government = Monarchy
  ): Promise<{
    city: City;
    cityImprovementRegistry: CityImprovementRegistry;
    playerResearch: PlayerResearch;
    ruleRegistry: RuleRegistry;
    units: Unit[];
  }> => {
    const ruleRegistry = new RuleRegistry(),
      cityGrowthRegistry = new CityGrowthRegistry(),
      cityImprovementRegistry = new CityImprovementRegistry(),
      playerGovernmentRegistry = new PlayerGovernmentRegistry(),
      playerResearchRegistry = new PlayerResearchRegistry(),
      unitRegistry = new UnitRegistry(),
      city = await setUpCity({
        size: 8,
        ruleRegistry,
        playerWorldRegistry: new PlayerWorldRegistry(),
        tileImprovementRegistry: new TileImprovementRegistry(),
        cityGrowthRegistry,
      }),
      playerGovernment = new PlayerGovernment(city.player()),
      playerResearch = new PlayerResearch(
        city.player(),
        new AdvanceRegistry(),
        ruleRegistry
      ),
      units = UnitTypes.map(
        (UnitType): Unit =>
          new UnitType(null, city.player(), city.tile(), ruleRegistry)
      );

    playerGovernment.set(new GovernmentType());
    playerGovernmentRegistry.register(playerGovernment);
    playerResearchRegistry.register(playerResearch);
    unitRegistry.register(...units);

    ruleRegistry.register(
      ...unitYield(undefined, ruleRegistry),
      ...cost(
        ruleRegistry,
        cityGrowthRegistry,
        cityImprovementRegistry,
        playerGovernmentRegistry,
        playerResearchRegistry,
        unitRegistry
      ),
      new YieldRule(new Effect((): Yield => new Unhappiness(unhappy)))
    );

    return {
      city,
      cityImprovementRegistry,
      playerResearch,
      ruleRegistry,
      units,
    };
  };

  const martialLaw = (city: City): MartialLaw[] =>
    city
      .yields()
      .filter(
        (cityYield: Yield): cityYield is MartialLaw =>
          cityYield instanceof MartialLaw
      );

  it('should be under Anarchy, Communism, Despotism and Monarchy, for up to 3 units', (): void => {
    expect(martialLawGovernments.map((GovernmentType) => GovernmentType.name))
      .members(['Anarchy', 'Communism', 'Despotism', 'Monarchy'])
      .length(4);
    expect(martialLawUnitLimit).equal(3);
  });

  it('should make one unhappy citizen content for each of up to 3 units', async (): Promise<void> => {
    const { city } = await setUp(8, [Warrior, Warrior, Warrior, Warrior]);

    expect(martialLaw(city).length).equal(3);
    expect(reduceYield(city.yields(), Unhappiness)).equal(5);
  });

  it('should not use more units than there are unhappy citizens', async (): Promise<void> => {
    const { city } = await setUp(2, [Warrior, Warrior, Warrior]);

    expect(martialLaw(city).length).equal(2);
    expect(reduceYield(city.yields(), Unhappiness)).equal(0);
  });

  it('should use only units that can attack: a ship, not Settlers or a Diplomat', async (): Promise<void> => {
    const {
      city,
      units: [, , trireme],
    } = await setUp(8, [Settlers, Diplomat, Trireme]);

    expect(martialLaw(city).length).equal(1);
    expect(martialLaw(city)[0].unit() === trireme).true;
  });

  it('should not apply under a Republic', async (): Promise<void> => {
    const { city } = await setUp(8, [Warrior], Republic);

    expect(martialLaw(city).length).equal(0);
  });

  it("should calm what the city's Temple leaves, not take the citizens the Temple would have calmed", async (): Promise<void> => {
    const { city, cityImprovementRegistry, playerResearch, ruleRegistry } =
      await setUp(4, [Warrior, Warrior, Warrior]);

    // A Temple makes 2 content with Mysticism.
    playerResearch.addAdvance(Mysticism);
    cityImprovementRegistry.register(new Temple(city, ruleRegistry));

    const yields = city.yields();

    expect(
      reduceYield(
        yields.filter(
          (cityYield: Yield): boolean =>
            cityYield instanceof CityImprovementContent
        ),
        Unhappiness
      )
    ).equal(-2);
    expect(martialLaw(city).length).equal(2);
    expect(reduceYield(yields, Unhappiness)).equal(0);
  });
});

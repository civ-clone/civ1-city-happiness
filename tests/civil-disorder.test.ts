import {
  Gold,
  Happiness,
  Luxuries,
  Production,
  Research,
  Unhappiness,
} from '../Yields';
import {
  reduceYield,
  reduceYields,
} from '@civ-clone/core-yield/lib/reduceYields';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import cityCost from '../Rules/City/cost';
import cityYield from '../Rules/City/yield';
import civilDisorder from '../Rules/City/civil-disorder';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import High from '@civ-clone/core-rule/Priorities/High';

describe('city:civil-disorder', (): void => {
  const tileImprovementRegistry = new TileImprovementRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    unitRegistry = new UnitRegistry();

  availableGovernmentRegistry.register(Despotism);

  it('should not be triggered in a city with no Unhappiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(...civilDisorder());

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  it('should be triggered in a city with Unhappiness and no Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.true;
  });

  it('should be not triggered in a city with the same amount of Unhappiness and Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      new YieldRule(new Effect(() => new Happiness(1))),
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  it('should be triggered in a city with more Unhappiness than Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      new YieldRule(new Effect(() => new Happiness(2))),
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    );
  });

  [Production, Research, Gold].forEach((YieldType) =>
    it(`should halt ${YieldType.name} when in civil disorder`, async (): Promise<void> => {
      const ruleRegistry = new RuleRegistry(),
        city = await setUpCity({
          ruleRegistry,
          playerWorldRegistry,
          cityGrowthRegistry,
          tileImprovementRegistry,
        });

      playerGovernmentRegistry.register(
        new PlayerGovernment(
          city.player(),
          availableGovernmentRegistry,
          ruleRegistry
        )
      );

      ruleRegistry.register(
        new YieldRule(new Effect(() => new Unhappiness(1))),
        new YieldRule(new Effect(() => new YieldType(2))),
        ...civilDisorder(),
        ...cityCost(
          ruleRegistry,
          cityGrowthRegistry,
          cityImprovementRegistry,
          playerGovernmentRegistry,
          playerResearchRegistry,
          unitRegistry
        )
      );

      expect(reduceYield(city.yields(), YieldType)).to.equal(0);

      ruleRegistry.register(new YieldRule(new Effect(() => new Happiness(1))));

      expect(reduceYield(city.yields(), YieldType)).to.equal(2);
    })
  );

  it('should not halt production if  Unhappiness is eradicated by martial law', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        size: 5,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      playerGovernment = new PlayerGovernment(
        city.player(),
        availableGovernmentRegistry,
        ruleRegistry
      ),
      cityGrowth = cityGrowthRegistry.getByCity(city),
      player = city.player(),
      tile = city.tile();

    playerGovernmentRegistry.register(playerGovernment);

    playerGovernment.set(new Despotism());

    ruleRegistry.register(
      ...civilDisorder(),
      ...cityCost(
        ruleRegistry,
        cityGrowthRegistry,
        cityImprovementRegistry,
        playerGovernmentRegistry,
        playerResearchRegistry,
        unitRegistry
      ),
      ...cityYield(cityGrowthRegistry, playerGovernmentRegistry, unitRegistry),
      new YieldRule(new Effect(() => new Production(2))),
      new YieldRule(new Effect(() => new Research(2))),
      new YieldRule(new Effect(() => new Gold(2)))
    );

    expect(
      reduceYields(city.yields(), Unhappiness, Production, Research, Gold)
    ).deep.equal([0, 2, 2, 2]);

    cityGrowth.grow();

    expect(
      reduceYields(city.yields(), Unhappiness, Production, Research, Gold)
    ).deep.equal([1, 0, 0, 0]);

    unitRegistry.register(new Fortifiable(city, player, tile, ruleRegistry));

    expect(
      reduceYields(city.yields(), Unhappiness, Production, Research, Gold)
    ).deep.equal([0, 2, 2, 2]);
  });

  it('should not halt production if  Unhappiness is balanced by Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      playerGovernment = new PlayerGovernment(
        city.player(),
        availableGovernmentRegistry,
        ruleRegistry
      );

    playerGovernmentRegistry.register(playerGovernment);

    playerGovernment.set(new Despotism());

    ruleRegistry.register(
      ...civilDisorder(),
      ...cityCost(
        ruleRegistry,
        cityGrowthRegistry,
        cityImprovementRegistry,
        playerGovernmentRegistry,
        playerResearchRegistry,
        unitRegistry
      ),
      ...cityYield(cityGrowthRegistry, playerGovernmentRegistry, unitRegistry),
      new YieldRule(new Effect(() => new Production(2))),
      new YieldRule(new Effect(() => new Research(2))),
      new YieldRule(new Effect(() => new Gold(2)))
    );

    expect(
      reduceYields(
        city.yields(),
        Happiness,
        Unhappiness,
        Production,
        Research,
        Gold
      )
    ).deep.equal([0, 1, 0, 0, 0]);

    ruleRegistry.register(new YieldRule(new Effect(() => new Luxuries(2))));

    expect(
      reduceYields(
        city.yields(),
        Happiness,
        Unhappiness,
        Production,
        Research,
        Gold
      )
    ).deep.equal([1, 1, 2, 2, 2]);
  });
});

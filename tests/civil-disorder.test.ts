import { Happiness, Unhappiness } from '../Yields';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { Production } from '@civ-clone/civ1-world/Yields';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRegistry from '@civ-clone/core-yield/YieldRegistry';
import civilDisorder from '../Rules/City/civil-disorder';
import cityYield from '../Rules/City/yield';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:civil-disorder', (): void => {
  const ruleRegistry = new RuleRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityRegistry = new CityRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    yieldRegistry = new YieldRegistry();

  yieldRegistry.register(Production, Happiness, Unhappiness);

  ruleRegistry.register(
    ...cityCreated(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    ),
    ...cityYield(
      ruleRegistry,
      cityGrowthRegistry,
      cityImprovementRegistry,
      playerResearchRegistry
    ),
    ...civilDisorder()
  );

  it('should be triggered in a city with Unhappiness and no Happiness', async (): Promise<void> => {
    const city = await setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
      yieldRegistry,
    });

    city.tile().yields = (): Yield[] => [new Unhappiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.true;
  });

  it('should be triggered in a city with more Unhappiness than Happiness', async (): Promise<void> => {
    const city = await setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
      yieldRegistry,
    });

    city.tile().yields = (): Yield[] => [new Unhappiness(2), new Happiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    );
  });

  it('should be not triggered in a city with the same amount of Unhappiness and Happiness', async (): Promise<void> => {
    const city = await setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
      yieldRegistry,
    });

    city.tile().yields = (): Yield[] => [new Unhappiness(1), new Happiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  it('should not be triggered in a city with no Unhappiness', async (): Promise<void> => {
    const city = await setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
      yieldRegistry,
    });

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  // TODO: check effects of civil disorder
  it('should halt production when in civil disorder', async (): Promise<void> => {
    const city = await setUpCity({
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
        ruleRegistry,
        yieldRegistry,
      }),
      yields = [new Unhappiness(1), new Production(2)];

    city.tile().yields = (): Yield[] => yields;

    const [production] = city
      .yields()
      .filter((cityYield: Yield): boolean => cityYield instanceof Production);

    expect(production.value()).to.equal(0);

    yields.push(new Happiness(1));

    const updatedYields = city.yields([], yieldRegistry),
      [updatedProduction] = updatedYields.filter(
        (cityYield: Yield): boolean => cityYield instanceof Production
      );

    expect(updatedProduction.value()).to.equal(2);
  });
});

import {
  Anarchy,
  Democracy,
  Monarchy,
} from '@civ-clone/civ1-government/Governments';
import {
  pendingRevolution,
  turnsUntilChoice,
} from '@civ-clone/civ1-government/lib/revolution';
import AnarchyDuration from '@civ-clone/civ1-government/Rules/AnarchyDuration';
import City from '@civ-clone/core-city/City';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import * as spies from 'chai-spies';
import anarchyDuration from '@civ-clone/civ1-government/Rules/Player/anarchy-duration';
import { expect, spy, use } from 'chai';
import turnStart from '../Rules/Player/turn-start';

use(spies);

const setUp = (GovernmentType: typeof Government = Democracy) => {
  const game = new Game(),
    player = new Player(game.rules),
    // Only what the turn-start rules ask of a city.
    city = { player: () => player, yields: () => [] } as unknown as City,
    cityRegistry = {
      getByPlayer: (): City[] => [city],
    } as unknown as CityRegistry,
    playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    ),
    collapsed: [Player, City][] = [];

  let disorder = false;

  game.availableGovernments.register(Anarchy, Democracy, Monarchy);
  playerGovernment.set(new GovernmentType());
  game.playerGovernments.register(playerGovernment);

  game.rules.register(
    new CivilDisorder(new Effect((): boolean => disorder)),
    ...anarchyDuration(() => 0.5),
    ...turnStart(
      cityRegistry,
      game.rules,
      game.engine,
      game.cityGrowth,
      game.playerGovernments,
      game.pendingEffects,
      game.turn
    )
  );

  game.engine.on(
    'player:government:collapsed',
    (player: Player, city: City): void => {
      collapsed.push([player, city]);
    }
  );

  // A turn starts with the city in disorder, or not.
  const turn = (inDisorder: boolean): void => {
    disorder = inDisorder;
    game.turn.increment();
    game.rules.process(TurnStart, player);
  };

  return { city, collapsed, game, player, playerGovernment, turn };
};

describe('player:government:collapsed', (): void => {
  it('should overthrow a Democracy on the second turn of civil disorder', (): void => {
    const { city, collapsed, game, player, playerGovernment, turn } = setUp();

    turn(true);

    expect(playerGovernment.is(Democracy)).true;
    expect(collapsed).to.be.empty;

    turn(true);

    expect(playerGovernment.is(Anarchy)).true;
    expect(
      turnsUntilChoice(playerGovernment, game.pendingEffects, game.turn)
    ).to.equal(5);
    expect(collapsed).to.deep.equal([[player, city]]);
  });

  it('should not overthrow a Democracy when order is restored in between', (): void => {
    const { collapsed, playerGovernment, turn } = setUp();

    turn(true);
    turn(false);
    turn(true);

    expect(playerGovernment.is(Democracy)).true;
    expect(collapsed).to.be.empty;
  });

  it('should not overthrow any other government', (): void => {
    const { collapsed, playerGovernment, turn } = setUp(Monarchy);

    turn(true);
    turn(true);
    turn(true);

    expect(playerGovernment.is(Monarchy)).true;
    expect(collapsed).to.be.empty;
  });

  it('should fall into Anarchy with the Pyramids, with the choice due at once, and fall only once (civ-clone/web-renderer#1018)', (): void => {
    const { collapsed, game, playerGovernment, turn } = setUp();

    // The Pyramids: no Anarchy to wait out, but a collapse still falls into it, as v474.05's `set_government(..., 0)`.
    game.rules.register(new AnarchyDuration(new Effect((): number => 0)));

    turn(true);
    turn(true);

    expect(playerGovernment.is(Anarchy)).true;
    expect(
      turnsUntilChoice(playerGovernment, game.pendingEffects, game.turn)
    ).to.equal(0);

    turn(true);

    expect(pendingRevolution(playerGovernment, game.pendingEffects)).not.null;
    expect(collapsed).to.have.length(1);
  });

  it('should judge the cities after the collapsing one under Anarchy, with the Pyramids (civ-clone/web-renderer#1018)', (): void => {
    const game = new Game(),
      player = new Player(game.rules),
      [first, collapsing, last] = ['first', 'collapsing', 'last'].map(
        (name: string): City =>
          ({
            name: () => name,
            player: () => player,
            yields: () => [],
          } as unknown as City)
      ),
      cityRegistry = {
        getByPlayer: (): City[] => [first, collapsing, last],
      } as unknown as CityRegistry,
      playerGovernment = new PlayerGovernment(
        player,
        game.availableGovernments,
        game.rules
      ),
      judged: [string, boolean][] = [];

    game.availableGovernments.register(Anarchy, Democracy, Monarchy);
    playerGovernment.set(new Democracy());
    game.playerGovernments.register(playerGovernment);

    game.rules.register(
      new CivilDisorder(
        new Effect((city: City): boolean => {
          judged.push([city.name(), playerGovernment.is(Anarchy)]);

          return city === collapsing;
        })
      ),
      ...anarchyDuration(() => 0.5),
      new AnarchyDuration(new Effect((): number => 0)),
      ...turnStart(
        cityRegistry,
        game.rules,
        game.engine,
        game.cityGrowth,
        game.playerGovernments,
        game.pendingEffects,
        game.turn
      )
    );

    [1, 2].forEach((): void => {
      game.turn.increment();
      game.rules.process(TurnStart, player);
    });

    // Under the Democracy throughout the first turn, and the last city alone in Anarchy on the second.
    expect(judged).to.deep.equal([
      ['first', false],
      ['collapsing', false],
      ['last', false],
      ['first', false],
      ['collapsing', false],
      ['last', true],
    ]);
    expect(playerGovernment.is(Anarchy)).true;
    // The Pyramids' rule held: no Anarchy to wait out.
    expect(
      turnsUntilChoice(playerGovernment, game.pendingEffects, game.turn)
    ).to.equal(0);
  });
});

describe('player:turn-start', (): void => {
  // civ-clone/web-renderer#315: working out a city's yields isn't cheap, and the disorder and celebration checks read
  //  the same ones.
  it("should work out each city's yields once", (): void => {
    const { city, turn } = setUp(Monarchy);

    spy.on(city, ['yields']);

    turn(false);

    expect(city.yields).to.have.been.called.once;
  });
});

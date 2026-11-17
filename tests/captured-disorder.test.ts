import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { CIVIL_DISORDER, civilDisorder } from '../lib/cityStatus';
import { Food, Production } from '@civ-clone/civ1-city/Yields';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Client from '@civ-clone/core-client/Client';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import { High } from '@civ-clone/core-rule/Priorities';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import { Unhappiness } from '../Yields';
import Yield from '@civ-clone/core-yield/Yield';
import cityProcessYield from '@civ-clone/civ1-city/Rules/City/process-yield';
import { expect } from 'chai';
import register from '../registerRules';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

// A size 5 city taken by `captor` (governed by `CaptorGovernment`, played by a person or by the computer), with the
//  rules as `registerRules` hands them out, and its shields and food processed at `High` `TurnStart` by civ1-city's own
//  `ProcessYield` rules, as `civ1-player` does (unless `processed` is unset): 3 shields and 2 food a turn. Its citizens
//  are content unless `unhappy` is set (civ-clone/web-renderer#1014).
const setUp = async (
  CaptorGovernment: typeof Government = Monarchy,
  { human = true, owned = false, processed = true } = {}
) => {
  const game = new Game(),
    owner = new Player(game.rules),
    captor = new Player(game.rules),
    // The shields added to the build each turn: none are while the city is in civil disorder.
    shields: number[] = [],
    // Whether the city was in civil disorder once its production had been processed, as its taxes and science are.
    disorderAfterProduction: boolean[] = [],
    events: string[] = [],
    state = { unhappy: false };

  register(game);

  game.availableGovernments.register(
    Anarchy,
    Communism,
    Democracy,
    Despotism,
    Monarchy,
    Republic
  );

  [
    [owner, Monarchy],
    [captor, CaptorGovernment],
  ].forEach(([player, GovernmentType]): void => {
    const playerGovernment = new PlayerGovernment(
      player as Player,
      game.availableGovernments,
      game.rules
    );

    playerGovernment.set(new (GovernmentType as typeof Government)());
    game.playerGovernments.register(playerGovernment);
  });

  game.clients.register(
    new AIClient(owner),
    human ? new Client(captor) : new AIClient(captor)
  );

  const city = await setUpCity({
    size: 5,
    player: owned ? captor : owner,
    ruleRegistry: game.rules,
    playerWorldRegistry: new PlayerWorldRegistry(),
    cityGrowthRegistry: game.cityGrowth,
    tileImprovementRegistry: game.tileImprovements,
  });

  city.yields = (): Yield[] => (state.unhappy ? [new Unhappiness(5)] : []);

  game.cities.register(city);

  if (processed) {
    game.rules.register(
      ...cityProcessYield(
        {
          getByCity: () =>
            ({
              add: (production: Yield): void => {
                shields.push(production.value());
              },
              check: (): void => {},
            } as unknown as CityBuild),
        } as unknown as CityBuildRegistry,
        game.cityGrowth,
        game.units,
        game.rules
      ),
      new TurnStart(
        new High(),
        new Effect((player: Player): void =>
          game.cities.getByPlayer(player).forEach((city: City): void => {
            [new Food(2), new Production(3)].forEach((cityYield: Yield): void =>
              game.rules.process(ProcessYield, cityYield, city, city.yields())
            );

            disorderAfterProduction.push(inDisorder(city));
          })
        )
      )
    );
  }

  ['city:civil-disorder', 'city:order-restored'].forEach(
    (event: string): void =>
      game.engine.on(event, (): void => {
        events.push(event);
      })
  );

  const inDisorder = (city: City): boolean =>
      game.rules
        .process(CivilDisorder, city, city.yields())
        .some((result: boolean): boolean => result),
    food = (): number => game.cityGrowth.getByCity(city).progress().value(),
    // The captor's turn starts.
    turn = (): void => {
      shields.length = 0;
      disorderAfterProduction.length = 0;
      events.length = 0;
      game.turn.increment();
      game.rules.process(TurnStart, captor);
    };

  return {
    captor,
    city,
    disorderAfterProduction,
    events,
    food,
    game,
    inDisorder,
    owner,
    shields,
    state,
    turn,
  };
};

describe('a city the human captures', (): void => {
  [Anarchy, Despotism, Monarchy, Communism].forEach(
    (GovernmentType: typeof Government): void => {
      it(`should start in civil disorder under ${GovernmentType.name}, losing its next shields, until order is restored`, async (): Promise<void> => {
        const {
          captor,
          city,
          disorderAfterProduction,
          events,
          food,
          game,
          inDisorder,
          shields,
          turn,
        } = await setUp(GovernmentType);

        city.capture(captor);

        // Recorded, so buying a unit there is refused (civ1-treasury's `Spend` asks for this record), and the city is
        //  in disorder as soon as it's taken, but nothing is announced.
        expect(civilDisorder(city, game.pendingEffects)?.handler()).to.equal(
          CIVIL_DISORDER
        );
        expect(inDisorder(city)).true;
        expect(events).to.be.empty;

        turn();

        // No shields, but the food is stored, and once the production is lost the city is judged by its citizens.
        expect(shields).to.be.empty;
        expect(food()).to.equal(2);
        expect(disorderAfterProduction).to.deep.equal([false]);
        expect(events).to.deep.equal(['city:order-restored']);
        expect(civilDisorder(city, game.pendingEffects)).null;
        expect(inDisorder(city)).false;

        turn();

        expect(shields).to.deep.equal([3]);
        expect(food()).to.equal(4);
        expect(events).to.be.empty;
      });
    }
  );

  it('should stay in civil disorder while its citizens are unhappy, and not be told order was restored', async (): Promise<void> => {
    const { captor, city, events, game, shields, state, turn } = await setUp();

    state.unhappy = true;
    city.capture(captor);

    expect(civilDisorder(city, game.pendingEffects)).not.null;

    turn();

    expect(shields).to.be.empty;
    expect(events).to.deep.equal(['city:civil-disorder']);
    expect(civilDisorder(city, game.pendingEffects)).not.null;

    state.unhappy = false;
    turn();

    // Order came back before its production was processed this time.
    expect(shields).to.deep.equal([3]);
    expect(events).to.deep.equal(['city:order-restored']);
    expect(civilDisorder(city, game.pendingEffects)).null;
  });

  it('should be judged by its citizens on the human’s next turn even if no production is processed', async (): Promise<void> => {
    const { captor, city, events, game, inDisorder, turn } = await setUp(
      Monarchy,
      { processed: false }
    );

    city.capture(captor);
    turn();

    expect(events).to.deep.equal(['city:order-restored']);
    expect(civilDisorder(city, game.pendingEffects)).null;
    expect(inDisorder(city)).false;
  });

  it('should still lose its next shields after a save and load', async (): Promise<void> => {
    const saved = await setUp();

    saved.city.capture(saved.captor);

    // What loading the save gives a fresh game: its own city, already the captor's, and the saved effects pointing at
    //  it. The rules, and anything they held in memory, are new.
    const loaded = await setUp(Monarchy, { owned: true });

    saved.game.pendingEffects
      .getByTarget(saved.city)
      .forEach((pendingEffect: PendingEffect): void =>
        loaded.game.pendingEffects.register(
          new PendingEffect(
            pendingEffect.handler(),
            loaded.city,
            pendingEffect.data()
          )
        )
      );

    expect(civilDisorder(loaded.city, loaded.game.pendingEffects)).not.null;
    expect(loaded.inDisorder(loaded.city)).true;

    loaded.turn();

    expect(loaded.shields).to.be.empty;
    expect(loaded.events).to.deep.equal(['city:order-restored']);
  });

  it('should forget its disorder when a computer player takes it from the human before the human’s next turn', async (): Promise<void> => {
    const { captor, city, game, owner } = await setUp(),
      events: string[] = [];

    city.capture(captor);
    game.engine.on('city:order-restored', (): void => {
      events.push('city:order-restored');
    });
    city.capture(owner);

    expect(civilDisorder(city, game.pendingEffects)).null;
    expect(events).to.be.empty;
  });

  it('should leave nothing behind for a city destroyed by its capture', async (): Promise<void> => {
    const { captor, city, game } = await setUp();

    // As civ1-city's `shrink` does to a captured city of size 1, after this package's `High` `Captured` rules.
    game.rules.register(
      new Captured(new Effect((city: City): void => city.destroy()))
    );

    city.capture(captor);

    expect(game.pendingEffects.getByTarget(city)).to.be.empty;
  });

  [Republic, Democracy].forEach((GovernmentType: typeof Government): void => {
    it(`should not start in civil disorder under ${GovernmentType.name}`, async (): Promise<void> => {
      const { captor, city, events, game, inDisorder, shields, turn } =
        await setUp(GovernmentType);

      city.capture(captor);

      expect(civilDisorder(city, game.pendingEffects)).null;
      expect(inDisorder(city)).false;

      turn();

      expect(shields).to.deep.equal([3]);
      expect(events).to.be.empty;
    });
  });
});

describe('a city a computer player captures', (): void => {
  [Anarchy, Despotism, Monarchy, Communism].forEach(
    (GovernmentType: typeof Government): void => {
      it(`should not start in civil disorder under ${GovernmentType.name}`, async (): Promise<void> => {
        const { captor, city, events, game, inDisorder, shields, turn } =
          await setUp(GovernmentType, { human: false });

        city.capture(captor);

        expect(civilDisorder(city, game.pendingEffects)).null;
        expect(inDisorder(city)).false;

        turn();

        expect(shields).to.deep.equal([3]);
        expect(events).to.be.empty;
      });
    }
  );
});

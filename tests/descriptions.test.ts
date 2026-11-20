import {
  Cathedral,
  Colosseum,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { Unhappiness } from '../Yields';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import Yield from '@civ-clone/core-yield/Yield';
import cost from '../Rules/City/cost';
import { expect } from 'chai';

// What the improvements say they do, for the Civilopedia (civ-clone/web-renderer#1196), checked against what they do.
describe('descriptions', (): void => {
  it('each improvement makes as many content as it says it does', (): void => {
    const described = cost()
      .flatMap((rule) => rule.descriptions())
      .map(({ type, subject, value, with: advances, step }) => [
        type,
        subject,
        value,
        advances ?? null,
        step ?? null,
      ]);

    expect(described).to.eql([
      ['content', Temple, 1, null, null],
      ['content', Temple, 1, [Mysticism], 'more'],
      ['content', Colosseum, 3, null, null],
      ['content', Cathedral, 4, null, null],
    ]);

    cost(undefined, undefined, {
      getByCity: (): unknown[] => [
        Object.create(Temple.prototype),
        Object.create(Colosseum.prototype),
        Object.create(Cathedral.prototype),
      ],
    } as any)
      .filter((rule) => rule.descriptions().length > 0)
      .forEach((rule): void => {
        const [description] = rule.descriptions(),
          result = rule.process({} as any, [new Unhappiness(10)]) as Yield;

        // Content is counted against the unhappiness, below 0.
        expect(result.value()).to.equal(-(description.value as number));
      });
  });
});

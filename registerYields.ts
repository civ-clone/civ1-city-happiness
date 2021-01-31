import { Happiness, Unhappiness } from './Yields';
import { instance as yieldRegistryInstance } from '@civ-clone/core-yield/YieldRegistry';

yieldRegistryInstance.register(Happiness, Unhappiness);

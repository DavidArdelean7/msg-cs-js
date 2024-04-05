import { CardModel } from '../domain/card.model';
import { InMemoryDbClient } from './clients/in-memory-db.client';

export const CardsRepository = new InMemoryDbClient<CardModel>();

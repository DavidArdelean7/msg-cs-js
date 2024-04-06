import { AccountsRepository } from '../repository/accounts.repository';
import { CardsRepository } from '../repository/cards.repository';
import {
  checkingAccountA,
  checkingAccountB,
  checkingAccountC,
  checkingAccountD,
  checkingAccountE,
  checkingAccountF,
  savingsAccountA,
  savingsAccountB,
} from './accounts.seed';
import { card1, card2, card3, card4, card5, card6 } from './cards.seed';

export function seedInitializer(): void {
  console.log('[Seeder]', '-------------Seeding data----------------\n');
  AccountsRepository.add(savingsAccountA.id, savingsAccountA);
  AccountsRepository.add(savingsAccountB.id, savingsAccountB);
  AccountsRepository.add(checkingAccountA.id, checkingAccountA);
  AccountsRepository.add(checkingAccountB.id, checkingAccountB);
  AccountsRepository.add(checkingAccountC.id, checkingAccountC);
  AccountsRepository.add(checkingAccountD.id, checkingAccountD);
  AccountsRepository.add(checkingAccountE.id, checkingAccountE);
  AccountsRepository.add(checkingAccountF.id, checkingAccountF);

  // CardsRepository.add(card1.cardNumber.toString(), card1);
  // CardsRepository.add(card2.cardNumber.toString(), card2);
  // CardsRepository.add(card3.cardNumber.toString(), card3);
  // CardsRepository.add(card4.cardNumber.toString(), card4);
  // CardsRepository.add(card4.cardNumber.toString(), card5);
  // CardsRepository.add(card4.cardNumber.toString(), card6);
}

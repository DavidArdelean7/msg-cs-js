import { CardModel } from '../domain/card.model';

export const card1 = new CardModel({
  cardNumber: 1234567890123456,
  cardHolderName: 'John Doe',
  cvv: 123,
  expirationDate: new Date('2026-12-31'),
  issueDate: new Date('2021-01-01'),
  contactless: true,
  active: true,
  dailyWithdrawalLimit: 5000,
  dailyTransactionLimit: 10000,
  pin: 1234,
});

export const card2 = new CardModel({
  cardNumber: 2345678901234567,
  cardHolderName: 'Jane Smith',
  cvv: 456,
  expirationDate: new Date('2027-11-30'),
  issueDate: new Date('2022-02-15'),
  contactless: false,
  active: true,
  dailyWithdrawalLimit: 3000,
  dailyTransactionLimit: 7000,
  pin: 2345,
});

export const card3 = new CardModel({
  cardNumber: 3456789012345678,
  cardHolderName: 'Alex Johnson',
  cvv: 789,
  expirationDate: new Date('2028-10-30'),
  issueDate: new Date('2023-03-20'),
  contactless: true,
  active: false,
  dailyWithdrawalLimit: 2000,
  dailyTransactionLimit: 5000,
  pin: 3456,
});

export const card4 = new CardModel({
  cardNumber: 4567890123456789,
  cardHolderName: 'Chris Lee',
  cvv: 101,
  expirationDate: new Date('2025-09-25'),
  issueDate: new Date('2020-04-25'),
  contactless: true,
  active: true,
  dailyWithdrawalLimit: 4000,
  dailyTransactionLimit: 8000,
  pin: 4567,
});

export const card5 = new CardModel({
  cardNumber: 5678901234567890,
  cardHolderName: 'Jack Black',
  cvv: 232,
  expirationDate: new Date('2023-02-20'),
  issueDate: new Date('2019-05-29'),
  contactless: false,
  active: false,
  dailyTransactionLimit: 1000,
  dailyWithdrawalLimit: 500,
  pin: 5678,
});

export const card6 = new CardModel({
  cardNumber: 6789012345678901,
  cardHolderName: 'Jim Bill',
  cvv: 421,
  expirationDate: new Date('2025-02-25'),
  issueDate: new Date('2012-05-03'),
  contactless: false,
  active: true,
  dailyTransactionLimit: 900,
  dailyWithdrawalLimit: 500,
  pin: 6789,
});

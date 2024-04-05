import { CheckingAccountModel } from './domain/checking-account.model';
import { CurrencyType } from './domain/currency-type.enum';
import { MoneyModel } from './domain/money.model';
import {
  checkingAccountA,
  checkingAccountB,
  checkingAccountD,
  checkingAccountE,
  checkingAccountF,
  savingsAccountA,
  savingsAccountB,
} from './seed/accounts.seed';
import { TransactionManagerServiceInstance } from './services/transaction-manager.service';
import { seedInitializer } from './seed/seed-initializer';
import { SavingsManagerServiceInstance } from './services/savings-manager.service';
import { card4 } from './seed/cards.seed';

const errorTypes = {
  balance: 'Insufficient balance',
  transaction: 'Forbidden transaction',
  card: 'Inactive or expired card',
  currency: 'Withdrawal is only permitted for the same currency as the account',
  dailyTransactionLimit: "This transacion would overcome the daily transaction limit for the account's associated card",
  dailyWithdrawalLimit: "This withdrawal would overcome the daily withdrawal limit for the account's associated card",
};
let months = 0;

function transact(
  client1: CheckingAccountModel,
  client2: CheckingAccountModel,
  amount: number,
  currency: CurrencyType
) {
  TransactionManagerServiceInstance.transfer(
    client1.id,
    client2.id,
    new MoneyModel({ amount: amount, currency: currency })
  );
}

function withdraw(client: CheckingAccountModel, amount: number, currency: CurrencyType) {
  TransactionManagerServiceInstance.withdraw(client.id, new MoneyModel({ amount: amount, currency: currency }));
}

function passTime() {
  SavingsManagerServiceInstance.passTime();
  months++;
}

//////////////////////////////////TESTS//////////////////////////////////

test('seeding accounts', () => {
  seedInitializer();
  expect(checkingAccountA).toBeDefined();
  expect(checkingAccountB).toBeDefined();
  expect(card4).toBeDefined();
});

test('transaction with insufficient balance', () => {
  function testTransaction() {
    transact(checkingAccountA, checkingAccountB, 150, CurrencyType.RON);
  }
  expect(testTransaction).toThrowError(errorTypes.balance);
});

test('allowed transaction', () => {
  transact(checkingAccountA, checkingAccountB, 100, CurrencyType.RON);

  expect(checkingAccountA.balance.amount).toBe(0);
  expect(checkingAccountB.balance.amount).toBe(400);
});

test('insufficient balance withdrawal', () => {
  function testWithdrawal() {
    withdraw(checkingAccountB, 500, CurrencyType.RON);
  }
  expect(testWithdrawal).toThrowError(errorTypes.balance);
});

test('forbidden currency withdrawal', () => {
  function testWithdrawal() {
    withdraw(checkingAccountB, 50, CurrencyType.EUR);
  }
  expect(testWithdrawal).toThrowError(errorTypes.currency);
});

test('allowed withdrawal', () => {
  withdraw(checkingAccountB, 200, CurrencyType.RON);

  expect(checkingAccountB.balance.amount).toBe(200);
  expect(
    checkingAccountB.transactions.find(
      transaction => transaction.from === transaction.to && transaction.amount.amount === 200
    )
  ).toBeTruthy();
});

test('quarterly capitalization frequency account check after two months', () => {
  expect(savingsAccountB.balance.amount).toBe(2000); // initial value
  passTime();
  passTime(); // only two months
  expect(savingsAccountB.balance.amount).toBe(2000);
});

test('quarterly capitalization frequency', () => {
  expect(savingsAccountB.balance.amount).toBe(2000); // initial value
  passTime(); // third month
  expect(savingsAccountB.balance.amount).toBe(2000 + 2000 * savingsAccountB.interest);
});

test('monthly capitalization frequency ', () => {
  let currentAmount = 1000; // initial value
  for (let i = 0; i < months; i++) currentAmount += currentAmount * savingsAccountA.interest; // current value (after three months)
  expect(savingsAccountA.balance.amount).toBe(currentAmount);
  passTime();
  expect(savingsAccountA.balance.amount).toBe(currentAmount + currentAmount * savingsAccountA.interest);
  currentAmount += currentAmount * savingsAccountA.interest;
  passTime();
  expect(savingsAccountA.balance.amount).toBe(currentAmount + currentAmount * savingsAccountA.interest);
});

test('transfer with currency conversion', () => {
  expect(checkingAccountD.balance.amount).toBe(1000);
  expect(checkingAccountD.balance.currency).toBe(CurrencyType.EUR);

  transact(checkingAccountD, checkingAccountA, 500, CurrencyType.RON);

  const transactionInBothAccounts = checkingAccountA.transactions.some(transactionA =>
    checkingAccountD.transactions.some(transactionD => transactionD.id === transactionA.id)
  );
  expect(transactionInBothAccounts).toBe(true);
  expect(checkingAccountD.balance.amount).toBe(1000 - 500 * 0.2);
  expect(checkingAccountA.balance.amount).toBe(0 + 500);

  transact(checkingAccountA, checkingAccountD, 30, CurrencyType.EUR);

  expect(checkingAccountD.balance.amount).toBe(1000 - 500 * 0.2 + 30);
  expect(checkingAccountA.balance.amount).toBe(0 + 500 - 30 * 4.98);
});

test('forbidden transaction types', () => {
  function testTransaction1() {
    transact(savingsAccountA, checkingAccountA, 439, CurrencyType.RON);
  }

  expect(testTransaction1).toThrowError(errorTypes.transaction);

  function testTransaction2() {
    transact(savingsAccountA, savingsAccountB, 342, CurrencyType.RON);
  }

  expect(testTransaction2).toThrowError(errorTypes.transaction);
});
test('expired card', () => {
  // account's E associated card is expired
  function testTransactionFromExpiredCard() {
    transact(checkingAccountE, checkingAccountA, 239, CurrencyType.EUR);
  }
  expect(testTransactionFromExpiredCard).toThrowError(errorTypes.card);

  function testTransactionToExpiredCard() {
    transact(checkingAccountE, checkingAccountA, 239, CurrencyType.EUR);
  }
  expect(testTransactionToExpiredCard).toThrowError(errorTypes.card);
});

test('daily transaction limit', () => {
  // account's F associated card has a low daily transaction limit: 900
  function testTransactionOutsideDailyLimit() {
    transact(checkingAccountF, checkingAccountA, 950, CurrencyType.RON);
  }
  expect(testTransactionOutsideDailyLimit).toThrowError(errorTypes.dailyTransactionLimit);
  expect(checkingAccountF.balance.amount).toBe(1000);
  function testTransactionWithinDailyLimit() {
    transact(checkingAccountF, checkingAccountA, 300, CurrencyType.RON);
  }
  expect(testTransactionWithinDailyLimit).not.toThrowError(errorTypes.dailyTransactionLimit);
  expect(checkingAccountF.balance.amount).toBe(700);
});

test('daily withdrawal limit', () => {
  // account's F associated card has a low daily withdrawal limit: 500
  function testWithdrawalWithinDailyLimit() {
    withdraw(checkingAccountF, 400, CurrencyType.RON);
  }
  expect(testWithdrawalWithinDailyLimit).not.toThrowError(errorTypes.dailyTransactionLimit);
  expect(checkingAccountF.balance.amount).toBe(300);

  function testWithdrawalOutsideDailyLimit() {
    withdraw(checkingAccountF, 150, CurrencyType.RON);
  }
  expect(testWithdrawalOutsideDailyLimit).toThrowError(errorTypes.dailyWithdrawalLimit);
  expect(checkingAccountF.balance.amount).toBe(300);
});

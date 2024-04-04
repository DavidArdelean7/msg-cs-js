import { TransactionModel } from '../domain/transaction.model';
import { MoneyModel } from '../domain/money.model';
import { AccountsRepository } from '../repository/accounts.repository';
import dayjs from 'dayjs';
import { convert } from '../utils/money.utils';
import { AccountType } from '../domain/account-type.enum';

export class TransactionManagerService {
  public transfer(fromAccountId: string, toAccountId: string, value: MoneyModel): TransactionModel[] {
    const fromAccount = AccountsRepository.get(fromAccountId);
    const toAccount = AccountsRepository.get(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('Specified account does not exist');
    }

    // ban specified type of transactions
    if (
      (fromAccount.accountType === AccountType.SAVINGS && toAccount.accountType === AccountType.CHECKING) ||
      (fromAccount.accountType === AccountType.SAVINGS && toAccount.accountType === AccountType.SAVINGS)
    )
      throw new Error('Forbidden transaction');

    // trying to avoid conditional statements and make the process more generic by converting each time to the value currency
    // this way, if all 3 currencies (from, to, value) are different everything works as expected
    // if it was specified that the value of the transaction always has to be the same currency as the sender or the receiver, things were easier

    const convertedBalanceFrom = convert(fromAccount.balance, value.currency);

    if (convertedBalanceFrom.amount - value.amount < 0) throw new Error('Insufficient balance');

    if (fromAccount.balance.currency !== toAccount.balance.currency) {
      //if the currency of the accounts is different, the transaction is added accordingly
      const transactionId = crypto.randomUUID();
      const amountFrom = convert(value, fromAccount.balance.currency);
      const amountTo = convert(value, toAccount.balance.currency);
      const transactionFrom = new TransactionModel({
        id: transactionId,
        from: fromAccountId,
        to: toAccountId,
        amount: amountFrom,
        timestamp: dayjs().toDate(),
      });

      const transactionTo = new TransactionModel({
        id: transactionId,
        from: fromAccountId,
        to: toAccountId,
        amount: amountTo,
        timestamp: dayjs().toDate(),
      });

      fromAccount.balance.amount -= amountFrom.amount;
      fromAccount.transactions = [...fromAccount.transactions, transactionFrom];
      toAccount.balance.amount += amountTo.amount;
      toAccount.transactions = [...toAccount.transactions, transactionTo];

      return [transactionFrom, transactionTo];
    }

    const transaction = new TransactionModel({
      id: crypto.randomUUID(),
      from: fromAccountId,
      to: toAccountId,
      amount: convertedBalanceFrom,
      timestamp: dayjs().toDate(),
    });

    fromAccount.balance.amount -= value.amount;
    fromAccount.transactions = [...fromAccount.transactions, transaction];
    toAccount.balance.amount += value.amount;
    toAccount.transactions = [...toAccount.transactions, transaction];

    return [transaction];
  }

  public withdraw(accountId: string, amount: MoneyModel): TransactionModel {
    // the result of a withdrawal is visible as a transaction (from and to the same account)
    const account = AccountsRepository.get(accountId);

    if (!account) throw new Error('Specified account does not exist');

    if (account.balance.currency !== amount.currency)
      throw new Error('Withdrawal is only permitted for the same currency as the account');

    // if (account.accountType === AccountType.CHECKING) {
    //   const curentDate = dayjs().toDate();
    //   let checkingAccount = account as CheckingAccountModel;
    //   if (!checkingAccount.associatedCard!.active || curentDate > checkingAccount.associatedCard!.expirationDate)
    //     throw new Error('Inactive or expired card');
    // }

    if (account.balance.amount - amount.amount < 0) throw new Error('Insufficient balance'); //check the balance before allowing any transactions or withdrawals

    const transaction = new TransactionModel({
      id: crypto.randomUUID(),
      from: accountId,
      to: accountId,
      amount: amount,
      timestamp: dayjs().toDate(),
    });

    account.balance.amount -= amount.amount;
    account.transactions = [...account.transactions, transaction];

    return transaction;
  }

  public checkFunds(accountId: string): MoneyModel {
    if (!AccountsRepository.exist(accountId)) {
      throw new Error('Specified account does not exist');
    }
    return AccountsRepository.get(accountId)!.balance;
  }

  public retrieveTransactions(accountId: string): TransactionModel[] {
    if (!AccountsRepository.exist(accountId)) {
      throw new Error('Specified account does not exist');
    }
    return AccountsRepository.get(accountId)!.transactions;
  }
}

export const TransactionManagerServiceInstance = new TransactionManagerService();

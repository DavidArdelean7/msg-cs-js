import { TransactionModel } from '../domain/transaction.model';
import { MoneyModel } from '../domain/money.model';
import { AccountsRepository } from '../repository/accounts.repository';
import dayjs from 'dayjs';
import { convert } from '../utils/money.utils';
import { AccountType } from '../domain/account-type.enum';
import { CheckingAccountModel } from '../domain/checking-account.model';
import { AccountModel } from '../domain/account.model';
import { OperationType } from '../domain/money-operation-type.enum';

export class TransactionManagerService {
  public transfer(fromAccountId: string, toAccountId: string, value: MoneyModel): TransactionModel[] {
    const fromAccount = AccountsRepository.get(fromAccountId);
    const toAccount = AccountsRepository.get(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('Specified account does not exist');
    }
    // ban specified types of transactions
    if (
      (fromAccount.accountType === AccountType.SAVINGS && toAccount.accountType === AccountType.CHECKING) ||
      (fromAccount.accountType === AccountType.SAVINGS && toAccount.accountType === AccountType.SAVINGS)
    )
      throw new Error('Forbidden transaction');
    /*
    trying to avoid conditional statements and make the process more generic by converting each time to the value currency
    this way, if all 3 currencies (from, to, value) are different everything works as expected
    if it was specified that the value of the transaction always has to be the same currency as the sender or the receiver, things were easier
    */
    const amountFrom = convert(value, fromAccount.balance.currency);
    this.checkCard(fromAccount, toAccount, OperationType.TRANSFER, amountFrom);
    if (fromAccount.balance.amount - amountFrom.amount < 0) throw new Error('Insufficient balance');

    const transactionId = crypto.randomUUID();
    if (fromAccount.balance.currency !== toAccount.balance.currency) {
      //if the currency of the accounts is different, the transaction is added accordingly
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
      id: transactionId,
      from: fromAccountId,
      to: toAccountId,
      amount: amountFrom,
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
      throw new Error('Withdrawal is only permitted for the same currency as the account'); // added this restriction
    if (account.balance.amount - amount.amount < 0) throw new Error('Insufficient balance'); //check the balance before allowing any transactions or withdrawals

    this.checkCard(account, account, OperationType.WITHDRAW, amount);

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
  // here I assumed that the dailyTransactionLimit applies to all types of transactions (including withdrawals) and dailyWithdrawalLimit applies only to withdrawals
  public checkCard(fromAccount: AccountModel, toAccount: AccountModel, type: OperationType, value: MoneyModel) {
    if (fromAccount.accountType !== AccountType.CHECKING) return; // apply these checks only for accounts that have associated cards (checking)

    const currentDate = dayjs().toDate();
    const fromCheckingAccount = fromAccount as CheckingAccountModel;
    if (!fromCheckingAccount.associatedCard!.active || currentDate > fromCheckingAccount.associatedCard!.expirationDate)
      throw new Error('Inactive or expired card');
    // also check if the receiver card is active
    if (toAccount !== fromAccount && toAccount.accountType === AccountType.CHECKING)
      if (
        !(toAccount as CheckingAccountModel).associatedCard!.active ||
        currentDate > (toAccount as CheckingAccountModel).associatedCard!.expirationDate
      )
        throw new Error('Inactive or expired card');

    const transactions = this.retrieveTransactions(fromAccount.id);
    const day = currentDate.getDay;
    const month = currentDate.getMonth;
    const year = currentDate.getFullYear;
    let withdrawalsToday = 0, // only withdrawals
      transfersToday = 0; // all transactions
    // get the amount sum of all transfers and withdrawals of today
    transactions.forEach(transaction => {
      if (
        transaction.timestamp.getFullYear === year &&
        transaction.timestamp.getMonth === month &&
        transaction.timestamp.getDay === day
      ) {
        transfersToday += transaction.amount.amount;
        if (transaction.from === transaction.to) withdrawalsToday += transaction.amount.amount;
      }
    });
    // verify if the transaction is under the daily limit
    if (transfersToday + value.amount > fromCheckingAccount.associatedCard!.dailyTransactionLimit)
      throw new Error("This transacion would overcome the daily transaction limit for the account's associated card");
    else if (
      type === OperationType.WITHDRAW &&
      withdrawalsToday + value.amount > fromCheckingAccount.associatedCard!.dailyWithdrawalLimit
    )
      throw new Error("This withdrawal would overcome the daily withdrawal limit for the account's associated card");
  }
}

export const TransactionManagerServiceInstance = new TransactionManagerService();

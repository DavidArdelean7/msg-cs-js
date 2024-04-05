import { AccountsRepository } from '../repository/accounts.repository';
import { AccountType } from '../domain/account-type.enum';
import { SavingsAccountModel } from '../domain/savings-account.model';
import dayjs from 'dayjs';
import { CapitalizationFrequency } from '../domain/capitalization-frequency.enum';
import { CapitalizationInterval } from '../domain/capitalization-interval.map';

export class SavingsManagerService {
  private systemDate = dayjs().toDate();
  public passTime(): void {
    const savingAccounts = AccountsRepository.getAll().filter(
      account => account.accountType === AccountType.SAVINGS
    ) as SavingsAccountModel[];

    const nextSystemDate = dayjs(this.systemDate).add(1, 'months');

    savingAccounts.forEach(savingAccount =>
      this.addIntervalInterest(savingAccount, nextSystemDate, savingAccount.interestFrequency)
    );

    this.systemDate = nextSystemDate.toDate();
  }

  //merged both types of capitalization frequency in the same function to avoid code repetition and unnecessary conditional statements

  private addIntervalInterest(
    savingAccount: SavingsAccountModel,
    currentInterestMonth: dayjs.Dayjs,
    frequency: CapitalizationFrequency
  ): void {
    const interval = CapitalizationInterval.get(frequency);

    if (!interval) throw new Error("This type of capitalization frequency hasn't been set");
    const nextInterestDateForAccount = dayjs(savingAccount.lastInterestAppliedDate).add(interval, 'months');

    const sameMonth = currentInterestMonth.isSame(nextInterestDateForAccount, 'month');
    const sameYear = currentInterestMonth.isSame(nextInterestDateForAccount, 'year');
    const sameDay = currentInterestMonth.isSame(nextInterestDateForAccount, 'day'); //added checking for the day, besides month and year, to prevent erroneously balance increase

    if (sameMonth && sameYear && sameDay) {
      this.addInterest(savingAccount);
      savingAccount.lastInterestAppliedDate = currentInterestMonth.toDate();
    }
  }

  private addInterest(savingAccount: SavingsAccountModel): void {
    savingAccount.balance.amount += savingAccount.balance.amount * savingAccount.interest; // update balance with interest
  }
}

export const SavingsManagerServiceInstance = new SavingsManagerService();

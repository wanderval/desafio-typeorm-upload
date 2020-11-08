// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('This types is incorrect');
    }

    const balance = await transactionRepository.getBalance();

    let category_id;

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('You do not have enough balance');
    }

    if (category) {
      const categoryRepository = getRepository(Category);

      let transactionCategory = await categoryRepository.findOne({
        where: { title: category },
      });

      if (!transactionCategory) {
        transactionCategory = categoryRepository.create({ title: category });

        const { id } = await categoryRepository.save(transactionCategory);

        category_id = id;
      } else {
        category_id = transactionCategory.id;
      }
    } else {
      throw new AppError('Category filed is necessary.');
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

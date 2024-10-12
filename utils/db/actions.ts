import {db} from './dbConfig'
import { Transactions, Users } from './schema'
import {eq, sql, and, desc} from 'drizzle-orm'
import { Notifications } from './schema'

export async function createUser(email:string, name: string) {
    try {
        const [user] = await db.insert(Users).values({email,name}).returning().execute()
        return user
    } catch (error) {
        console.error('Error creating User', error)
        return null
    }
}

export async function getUserByEmail(email:string) {
    try {
        const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute()
        return user;
    } catch (error) {
        console.error('Error fetching User', error)
    }
}

export async function getUnreadNotifications(userId: number) {
    try {
        return await db
            .select()
            .from(Notifications)
            .where(and(eq(Notifications.userId, userId), eq(Notifications.isRead, false)))
            .execute();
    } catch (error) {
        console.error('Error fetching notifications', error);
        return []; // Return an empty array or handle as appropriate
    }
}

export async function getUserBalance(userId: number): Promise<number> {
    const transactions = await getRewardTransactions(userId) || [];
    if (!transactions) return 0;
    const balance = transactions.reduce((acc:number, transaction:any) => {
        return transaction.type.startsWith('earned')
            ? acc + transaction.amount
            : acc - transaction.amount;
    }, 0);

    return Math.max(balance, 0); // Ensures the balance is not negative
}

export async function getRewardTransactions(userId: number){
    try {
        const transactions = await db.select({
            id: Transactions.id,
            type: Transactions.type,
            amount: Transactions.amount,
            description: Transactions.description,
            date: Transactions.date
        }).from(Transactions).where(eq(Transactions.userId, userId)).orderBy(desc(Transactions.date)).limit(10).execute();
        const formattedTransactions = transactions.map(t => ({
            ...t,
            date: t.date.toISOString().split('T')[0]
        }))

        return formattedTransactions
    } catch (error) {
        
    }
}
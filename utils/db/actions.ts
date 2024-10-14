import {db} from './dbConfig'
import { Reports, Rewards, Transactions, Users } from './schema'
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

export async function markNotificationAsRead(notificationId:number) {
    try {
        await db.update(Notifications).set({isRead: true}).where(eq(Notifications.id, notificationId)).execute()
    } catch (error) {
        console.log('Error marking notif ad read', error)
        return null
    }
}

export async function createReport(
    userId: number,
    location: string,
    wasteType: string,
    amount: string,
    imageUrl? : string,
    verificationResult?: any
) {
    try {
        const [report] = await db.insert(Reports).values({
            userId,location,wasteType,amount,imageUrl,verificationResult,status: 'pending'
        }).returning().execute();

        const pointsEarned = 10;
        await updateRewardPoints(userId, pointsEarned)

        await createTransaction(userId, 'earned_report', pointsEarned, 'Points on for reporting waste')

        await createNotifications(userId, `You've earned ${pointsEarned} points!!`, 'reward')

        return report
    } catch (e) {
        console.error('error creating report', e)
    }
}

export async function updateRewardPoints(userId:number, pointsToAdd: number) {
    try {
        const [updatedReward] = await db.update(Rewards).set({
            points: sql`${Rewards.points} + ${pointsToAdd}`
        }).where(eq(Rewards.userId, userId)).returning().execute();
        return updatedReward;
    } catch (e) {
        console.error('Error updting reward points', e)
        return null
    }
}

export async function createTransaction(userId:number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount:number, description: string) {
    try {
        const [transaction] = await db.insert(Transactions).values({
            userId, type, amount, description
        }).returning().execute()
    } catch (e) {
        console.error('error creating transactions', e)
        throw e;
    }
}

export async function createNotifications(userId:number, message: string, type: string) {
    try {
        const [notification] = await db.insert(Notifications).values({
            userId, message, type
        }).returning().execute()
        return notification
    } catch (e) {
        console.error('error creating notification')
    }
}

export async function getRecentReports(limit:number=10) {
    try {
        const report = await db.select().from(Reports).orderBy(desc(Reports.createdAt)).limit(limit).execute()
    } catch (e) {
        console.error('error fetching recent reports', e)
        return [];
    }
}
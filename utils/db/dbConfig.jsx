// postgresql://trash2treasure_owner:eVGcnC9fB4hk@ep-lingering-credit-a5nojf64.us-east-2.aws.neon.tech/trash2treasure?sslmode=require

import {neon} from 'neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle(sql, {schema})
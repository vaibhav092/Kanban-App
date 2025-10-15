import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/db'
import * as schema from "../db/schema"

export const auth = betterAuth({
    database: drizzleAdapter(db, { 
        provider: 'pg',
        schema: schema
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
})

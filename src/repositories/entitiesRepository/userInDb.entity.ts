export interface UserInDbEntity {
    id:string
    accountData: {
        login: string
        email: string
        passwordHash: string
        passwordSalt: string
        createdAt: Date
    },
    emailConfirmation: {
        confirmationCode: string
        expirationDate: Date
        isConfirmed: boolean
        nextSendingConfirmEmail: Date
    }
}
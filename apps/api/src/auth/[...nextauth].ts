import NextAuth from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    // TODO: get variables from config
    KeycloakProvider({
      clientId: 'jwt-headless',
      clientSecret: 'p5B2ujliVB7nIDX38hw4skGV6wozsa9j',
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
})

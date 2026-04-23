import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { data: admin, error } = await supabase
            .from('admins')
            .select('id, email, nome, senha_hash')
            .eq('email', credentials.email.toLowerCase().trim())
            .single()

          if (error || !admin) return null

          const senhaCorreta = await bcrypt.compare(credentials.password, admin.senha_hash)
          if (!senhaCorreta) return null

          return { id: admin.id, email: admin.email, name: admin.nome }
        } catch(e) {
          console.error('Erro auth:', e.message)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/markinvest/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.name = user.name }
      return token
    },
    async session({ session, token }) {
      if (token) { session.user.id = token.id; session.user.name = token.name }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }
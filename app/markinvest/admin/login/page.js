'use client'
import { signIn, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const { status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.push('/markinvest/admin')
  }, [status])

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !senha) { setErro('Preencha email e senha.'); return }
    setLoading(true)
    setErro('')
    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: senha,
        redirect: false
      })
      if (res?.ok) {
        router.push('/markinvest/admin')
      } else {
        setErro('Email ou senha incorretos.')
      }
    } catch(e) {
      setErro('Erro de conexao. Tente novamente.')
    }
    setLoading(false)
  }

  if (status === 'loading') return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f3fa'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1B2F7E 0%, #2a45b0 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:'100%', maxWidth:'400px'}}>

        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <div style={{width:'64px', height:'64px', background:'rgba(255,255,255,0.15)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', border:'1px solid rgba(255,255,255,0.2)'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/></svg>
          </div>
          <h1 style={{color:'#fff', fontSize:'24px', fontWeight:'700', margin:'0 0 4px', letterSpacing:'0.05em'}}>MARKINVEST</h1>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:'13px', margin:0, letterSpacing:'0.1em', textTransform:'uppercase'}}>Painel Administrativo</p>
        </div>

        <div style={{background:'#fff', borderRadius:'20px', padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', color:'#1B2F7E', margin:'0 0 6px'}}>Entrar</h2>
          <p style={{fontSize:'13px', color:'#9ca3af', margin:'0 0 1.5rem'}}>Acesso restrito a equipe Markinvest</p>

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'12px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s'}}
                onFocus={e => e.target.style.borderColor='#1B2F7E'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
            </div>

            <div style={{marginBottom:'20px'}}>
              <label style={{fontSize:'12px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Senha</label>
              <div style={{position:'relative'}}>
                <input
                  type={mostrarSenha?'text':'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  style={{width:'100%', padding:'12px 44px 12px 14px', border:'1.5px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s'}}
                  onFocus={e => e.target.style.borderColor='#1B2F7E'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'16px', padding:'4px'}}
                >
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {erro && (
              <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
                <span style={{fontSize:'16px'}}>⚠️</span>
                <p style={{color:'#dc2626', fontSize:'13px', fontWeight:'600', margin:0}}>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{width:'100%', padding:'13px', background:loading?'#9ca3af':'linear-gradient(135deg, #1B2F7E, #2a45b0)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:loading?'not-allowed':'pointer', letterSpacing:'0.05em', boxShadow:loading?'none':'0 4px 12px rgba(27,47,126,0.35)', transition:'all 0.15s'}}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <p style={{fontSize:'11px', color:'#d1d5db', textAlign:'center', marginTop:'1.5rem', marginBottom:0}}>
            Acesso restrito — Markinvest © 2026
          </p>
        </div>
      </div>
    </main>
  )
}
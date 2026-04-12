'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function Login() {
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/admin' })
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'16px',padding:'3rem 2.5rem',textAlign:'center',maxWidth:'380px',width:'100%'}}>
        <div style={{width:'56px',height:'56px',background:'#1D9E75',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="4" y="4" width="8" height="8" rx="2" fill="#fff"/><rect x="14" y="4" width="8" height="8" rx="2" fill="#fff" opacity="0.6"/><rect x="4" y="14" width="8" height="8" rx="2" fill="#fff" opacity="0.6"/><rect x="14" y="14" width="8" height="8" rx="2" fill="#fff"/></svg>
        </div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'22px',fontWeight:'400',margin:'0 0 8px'}}>Painel da Equipe</h1>
        <p style={{color:'#6b7280',fontSize:'14px',margin:'0 0 2rem',lineHeight:'1.5'}}>Acesse com a conta Google da equipe para gerenciar os agendamentos</p>
        <button onClick={handleLogin} disabled={loading} style={{width:'100%',padding:'12px',background: loading ? '#9ca3af' : '#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor: loading ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>
    </main>
  )
}
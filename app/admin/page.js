'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_COR = { confirmado: '#1D9E75', cancelado: '#dc2626' }

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') buscarAgendamentos()
  }, [status])

  async function buscarAgendamentos() {
    const res = await fetch('/api/agendamentos')
    const data = await res.json()
    setAgendamentos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function atualizarStatus(id, novoStatus) {
    await fetch(`/api/agendamentos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    })
    buscarAgendamentos()
  }

  const filtrados = filtro === 'todos' ? agendamentos : agendamentos.filter(a => a.status === filtro)

  if (status === 'loading' || loading) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'400',margin:0}}>Painel de Agendamentos</h1>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'13px',color:'#6b7280'}}>{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',cursor:'pointer',color:'#6b7280'}}>Sair</button>
        </div>
      </div>
      <div style={{maxWidth:'900px',margin:'0 auto',padding:'2rem 1rem'}}>
        <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem'}}>
          {['todos','confirmado','cancelado'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{padding:'6px 16px',borderRadius:'20px',border:'1px solid #e5e7eb',background: filtro === f ? '#1D9E75' : '#fff',color: filtro === f ? '#fff' : '#6b7280',fontSize:'13px',cursor:'pointer',textTransform:'capitalize'}}>{f}</button>
          ))}
        </div>
        {filtrados.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px'}}>Nenhum agendamento encontrado</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {filtrados.map(a => (
              <div key={a.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'1.25rem 1.5rem'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
                      <span style={{fontSize:'15px',fontWeight:'500'}}>{a.nome}</span>
                      <span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background: a.status==='confirmado'?'#E1F5EE':'#fee2e2',color: STATUS_COR[a.status],fontWeight:'500'}}>{a.status}</span>
                    </div>
                    <div style={{fontSize:'13px',color:'#6b7280'}}>{a.apartamento}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'14px',fontWeight:'500',color:'#1D9E75'}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                    <div style={{fontSize:'13px',color:'#6b7280'}}>{a.horario?.slice(0,5)}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'12px',fontSize:'13px',color:'#6b7280',marginBottom:'12px',flexWrap:'wrap'}}>
                  <span>📧 {a.email}</span>
                  <span>📱 {a.telefone}</span>
                  {a.cpf && <span>🪪 {a.cpf}</span>}
                </div>
                {a.status === 'confirmado' && (
                  <button onClick={() => atualizarStatus(a.id, 'cancelado')} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:'#dc2626',cursor:'pointer'}}>Cancelar agendamento</button>
                )}
                {a.status === 'cancelado' && (
                  <button onClick={() => atualizarStatus(a.id, 'confirmado')} style={{padding:'6px 14px',background:'none',border:'1px solid #9FE1CB',borderRadius:'8px',fontSize:'12px',color:'#1D9E75',cursor:'pointer'}}>Reativar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
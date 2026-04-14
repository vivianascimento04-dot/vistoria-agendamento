'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [popup, setPopup] = useState(null)

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

  function confirmarCancelamento(agendamento) {
    setPopup(agendamento)
  }

  async function executarCancelamento() {
    if (!popup) return
    const res = await fetch('/api/agendamentos/' + popup.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelado' })
    })
    setPopup(null)
    if (res.ok) buscarAgendamentos()
    else alert('Erro ao cancelar. Tente novamente.')
  }

  async function atualizarStatus(id, novoStatus) {
    const res = await fetch('/api/agendamentos/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    })
    if (res.ok) buscarAgendamentos()
    else alert('Erro ao atualizar. Tente novamente.')
  }

  function exportarCSV() {
    const cabecalho = ['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Criado Em']
    const linhas = filtrados.map(a => [
      a.nome, a.cpf || '', a.email, a.telefone, a.apartamento,
      new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR'),
      a.horario?.slice(0,5), a.status,
      a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : ''
    ])
    const csv = [cabecalho, ...linhas].map(l => l.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'agendamentos-' + new Date().toISOString().split('T')[0] + '.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtrados = agendamentos
    .filter(a => filtro === 'todos' || a.status === filtro)
    .filter(a => {
      if (!busca) return true
      const b = busca.toLowerCase()
      return a.nome?.toLowerCase().includes(b) || a.email?.toLowerCase().includes(b) || a.apartamento?.toLowerCase().includes(b) || a.telefone?.includes(b)
    })

  const totalConfirmados = agendamentos.filter(a => a.status === 'confirmado').length
  const totalCancelados = agendamentos.filter(a => a.status === 'cancelado').length

  if (status === 'loading' || loading) return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif"}}>

      {popup && (
        <div onClick={() => setPopup(null)} style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'400px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width:'52px', height:'52px', background:'#fee2e2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{fontSize:'17px', fontWeight:'700', color:'#111', textAlign:'center', margin:'0 0 8px'}}>Cancelar agendamento?</h3>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 6px', lineHeight:'1.6'}}>Voce esta prestes a cancelar o agendamento de</p>
            <p style={{fontSize:'14px', fontWeight:'700', color:'#1B2F7E', textAlign:'center', margin:'0 0 4px'}}>{popup.nome}</p>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 1.25rem'}}>
              {new Date(popup.data+'T12:00:00').toLocaleDateString('pt-BR')} as {popup.horario?.slice(0,5)}
            </p>
            <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'8px', padding:'10px', marginBottom:'1.25rem', fontSize:'12px', color:'#dc2626', textAlign:'center', fontWeight:'600'}}>
              Esta acao nao podera ser desfeita facilmente
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setPopup(null)} style={{flex:1, padding:'11px', background:'#fff', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer'}}>
                NAO, MANTER
              </button>
              <button onClick={executarCancelamento} style={{flex:1, padding:'11px', background:'#dc2626', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>
                SIM, CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:'#1B2F7E', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" alt="Mark Invest" style={{height:'36px', objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
          <span style={{color:'rgba(255,255,255,0.7)', fontSize:'12px', letterSpacing:'0.08em', textTransform:'uppercase'}}>Painel de Agendamentos</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{padding:'6px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#fff', fontWeight:'600'}}>SAIR</button>
        </div>
      </div>

      <div style={{maxWidth:'960px', margin:'0 auto', padding:'1.5rem 1rem'}}>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'1.5rem'}}>
          <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', borderLeft:'4px solid #1B2F7E'}}>
            <p style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px'}}>TOTAL</p>
            <p style={{fontSize:'28px', fontWeight:'700', color:'#1B2F7E', margin:0}}>{agendamentos.length}</p>
          </div>
          <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', borderLeft:'4px solid #1D9E75'}}>
            <p style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px'}}>CONFIRMADOS</p>
            <p style={{fontSize:'28px', fontWeight:'700', color:'#1D9E75', margin:0}}>{totalConfirmados}</p>
          </div>
          <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', borderLeft:'4px solid #dc2626'}}>
            <p style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px'}}>CANCELADOS</p>
            <p style={{fontSize:'28px', fontWeight:'700', color:'#dc2626', margin:0}}>{totalCancelados}</p>
          </div>
        </div>

        <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', marginBottom:'1rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
          <div style={{display:'flex', gap:'6px'}}>
            {['todos','confirmado','cancelado'].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{padding:'6px 14px', borderRadius:'20px', border: filtro===f ? 'none' : '1px solid #e5e7eb', background: filtro===f ? (f==='cancelado' ? '#dc2626' : f==='confirmado' ? '#1D9E75' : '#1B2F7E') : '#fff', color: filtro===f ? '#fff' : '#6b7280', fontSize:'12px', fontWeight:'700', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.04em'}}>{f}</button>
            ))}
          </div>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, email, apartamento..." style={{flex:1, minWidth:'200px', padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
          <button onClick={exportarCSV} style={{padding:'8px 16px', background:'#1B2F7E', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            EXPORTAR CSV
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div style={{textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'14px', background:'#fff', borderRadius:'12px'}}>Nenhum agendamento encontrado</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {filtrados.map(a => {
              const cancelado = a.status === 'cancelado'
              const criadoEm = a.criado_em ? new Date(a.criado_em) : null
              const criadoFormatado = criadoEm
                ? criadoEm.toLocaleDateString('pt-BR') + ' as ' + criadoEm.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
                : null

              return (
                <div key={a.id} style={{background: cancelado ? '#fff5f5' : '#fff', border: cancelado ? '1.5px solid #fca5a5' : '1px solid #e5e7eb', borderRadius:'12px', padding:'1.25rem 1.5rem', boxShadow:'0 1px 4px rgba(27,47,126,0.04)', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', left:0, top:0, bottom:0, width:'4px', background: cancelado ? '#dc2626' : '#1D9E75', borderRadius:'12px 0 0 12px'}}></div>
                  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', paddingLeft:'8px'}}>
                    <div>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap'}}>
                        <span style={{fontSize:'15px', fontWeight:'700', color: cancelado ? '#9ca3af' : '#111', textDecoration: cancelado ? 'line-through' : 'none'}}>{a.nome}</span>
                        <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background: cancelado ? '#dc2626' : '#1D9E75', color:'#fff', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em'}}>{a.status}</span>
                      </div>
                      <div style={{fontSize:'13px', color: cancelado ? '#9ca3af' : '#6b7280', fontWeight:'500'}}>{a.apartamento}</div>
                    </div>
                    <div style={{textAlign:'right', flexShrink:0}}>
                      <div style={{fontSize:'14px', fontWeight:'700', color: cancelado ? '#9ca3af' : '#1B2F7E'}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                      <div style={{fontSize:'13px', color:'#9ca3af', fontWeight:'500'}}>{a.horario?.slice(0,5)}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'16px', fontSize:'12px', color: cancelado ? '#9ca3af' : '#6b7280', marginBottom:'8px', flexWrap:'wrap', paddingLeft:'8px'}}>
                    <span>✉ {a.email}</span>
                    <span>📱 {a.telefone}</span>
                    {a.cpf && <span>🪪 {a.cpf}</span>}
                  </div>
                  {criadoFormatado && (
                    <div style={{paddingLeft:'8px', marginBottom:'12px'}}>
                      <span style={{fontSize:'11px', color:'#9ca3af', background:'#f4f6fb', padding:'3px 10px', borderRadius:'20px', display:'inline-flex', alignItems:'center', gap:'4px'}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
                        Agendado em {criadoFormatado}
                      </span>
                    </div>
                  )}
                  <div style={{paddingLeft:'8px'}}>
                    {!cancelado && (
                      <button onClick={() => confirmarCancelamento(a)} style={{padding:'6px 16px', background:'#dc2626', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', color:'#fff', cursor:'pointer', letterSpacing:'0.03em'}}>
                        CANCELAR AGENDAMENTO
                      </button>
                    )}
                    {cancelado && (
                      <button onClick={() => atualizarStatus(a.id, 'confirmado')} style={{padding:'6px 16px', background:'#1D9E75', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', color:'#fff', cursor:'pointer', letterSpacing:'0.03em'}}>
                        REATIVAR
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{textAlign:'center', fontSize:'12px', color:'#9ca3af', marginTop:'1.5rem'}}>
          Mostrando {filtrados.length} de {agendamentos.length} agendamentos
        </p>
      </div>
    </main>
  )
}

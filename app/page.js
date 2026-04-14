'use client'
import { useState } from 'react'

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const AZUL = '#1B2F7E'
const AZUL_CLARO = '#E8EBF5'
const VERMELHO = '#C0392B'

export default function Home() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dataSel, setDataSel] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [horarioSel, setHorarioSel] = useState(null)
  const [form, setForm] = useState({ nome:'', cpf:'', email:'', telefone:'', empreendimento:'', torre:'', bloco:'', apartamento:'' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [etapa, setEtapa] = useState(1)

  async function selecionarData(ds) {
    setDataSel(ds)
    setHorarioSel(null)
    const res = await fetch('/api/horarios?data=' + ds)
    const data = await res.json()
    setHorarios(data)
  }

  function selecionarHorario(h) {
    setHorarioSel(h)
    setEtapa(2)
  }

  async function confirmar() {
    const { nome, email, telefone, empreendimento, torre, bloco, apartamento } = form
    if (!nome || !email || !telefone || !empreendimento || !torre || !bloco || !apartamento) {
      setErro('Preencha todos os campos obrigatorios.')
      return
    }
    setLoading(true)
    setErro('')
    const aptoCompleto = empreendimento + ' - Torre ' + torre + ', Bloco ' + bloco + ', Apto ' + apartamento
    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, apartamento: aptoCompleto, data: dataSel, horario: horarioSel })
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) setEtapa(3)
    else setErro(data.error === 'Horario ja ocupado' ? 'Este horario acabou de ser reservado. Escolha outro.' : 'Erro ao agendar. Tente novamente.')
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  function prevMes() { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }
  function nextMes() { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }
  const dataFormatada = dataSel ? new Date(dataSel+'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : ''
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif", margin:0, padding:0}}>

      <div style={{background: AZUL, padding:'1.25rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <img src="/logo.png" alt="Mark Invest" style={{height:'52px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'8px'}}/>
        <p style={{color:'rgba(255,255,255,0.7)', fontSize:'12px', letterSpacing:'0.12em', textTransform:'uppercase', margin:0}}>Sistema de Agendamento de Vistoria</p>
      </div>

      <div style={{background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0.875rem 1rem', display:'flex', justifyContent:'center', gap:'0'}}>
        {[{n:1,label:'DATA E HORARIO'},{n:2,label:'SEUS DADOS'},{n:3,label:'CONFIRMACAO'}].map((e,i) => (
          <div key={e.n} style={{display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <div style={{width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', background: etapa>=e.n ? AZUL : '#f3f4f6', color: etapa>=e.n ? '#fff' : '#9ca3af'}}>{etapa>e.n ? 'v' : e.n}</div>
              <span style={{fontSize:'11px', fontWeight:'700', letterSpacing:'0.05em', color: etapa===e.n ? AZUL : '#9ca3af'}}>{e.label}</span>
            </div>
            {i<2 && <div style={{width:'32px', height:'1px', background: etapa>e.n ? AZUL : '#e5e7eb', margin:'0 6px'}}/>}
          </div>
        ))}
      </div>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:'2rem 1rem'}}>

        {etapa === 1 && (
          <div style={{display:'grid', gridTemplateColumns: horarios.length > 0 ? '1fr 1fr' : '600px', gap:'1rem', alignItems:'start', justifyContent:'center'}}>
            <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem'}}>
                <button onClick={prevMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color: AZUL, fontWeight:'bold'}}>&#8249;</button>
                <span style={{fontFamily:'Georgia,serif', fontSize:'16px', color: AZUL, fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em'}}>{MESES[mes]} {ano}</span>
                <button onClick={nextMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color: AZUL, fontWeight:'bold'}}>&#8250;</button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'8px'}}>
                {['D','S','T','Q','Q','S','S'].map((d,i) => (
                  <span key={i} style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', padding:'4px 0'}}>{d}</span>
                ))}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px'}}>
                {Array(primeiroDia).fill(null).map((_,i) => <div key={i}/>)}
                {Array(diasNoMes).fill(null).map((_,i) => {
                  const d = i+1
                  const date = new Date(ano, mes, d)
                  const dow = date.getDay()
                  const isPast = date < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
                  const isWeekend = dow===0||dow===6
                  const ds = ano+'-'+String(mes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                  const isSel = dataSel===ds
                  const isToday = d===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear()
                  if (isPast||isWeekend) return (
                    <div key={d} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#d1d5db', borderRadius:'6px'}}>{d}</div>
                  )
                  return (
                    <div key={d} onClick={() => selecionarData(ds)} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight: isSel?'700':'500', borderRadius:'6px', cursor:'pointer', background: isSel ? VERMELHO : isToday ? AZUL_CLARO : 'transparent', color: isSel ? '#fff' : isToday ? AZUL : '#333', border: isSel ? '1px solid '+VERMELHO : isToday ? '1px solid '+AZUL : '1px solid #e5e7eb', transition:'all 0.15s'}}>{d}</div>
                  )
                })}
              </div>
            </div>

            {horarios.length > 0 && (
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
                <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px'}}>HORARIOS DISPONIVEIS</p>
                <p style={{fontSize:'12px', color:'#6b7280', margin:'0 0 1rem', textTransform:'capitalize'}}>{dataFormatada}</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {horarios.map(h => (
                    <div key={h.horario} onClick={() => h.disponivel && selecionarHorario(h.horario)} style={{padding:'14px', textAlign:'center', borderRadius:'10px', fontSize:'15px', fontWeight:'700', border: horarioSel===h.horario ? '2px solid '+VERMELHO : '1px solid #dde1f0', cursor: h.disponivel?'pointer':'not-allowed', background: horarioSel===h.horario ? VERMELHO : !h.disponivel ? '#f9fafb' : '#fff', color: horarioSel===h.horario ? '#fff' : !h.disponivel ? '#d1d5db' : AZUL, textDecoration: !h.disponivel?'line-through':'none', transition:'all 0.15s'}}>
                      {h.horario}
                      {!h.disponivel && <div style={{fontSize:'10px', fontWeight:'400', marginTop:'2px'}}>Ocupado</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {etapa === 2 && (
          <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'560px', margin:'0 auto'}}>
            <div style={{background: AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'12px 16px', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:'36px', height:'36px', background: AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:'700', color: AZUL, textTransform:'capitalize'}}>{dataFormatada}</div>
                <div style={{fontSize:'12px', color:'#5a6fa8'}}>as {horarioSel} &middot; <span onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{cursor:'pointer', textDecoration:'underline', fontWeight:'600'}}>Alterar</span></div>
              </div>
            </div>

            <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS PESSOAIS</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nome Completo *</label><input value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} placeholder="Joao da Silva" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>CPF</label><input value={form.cpf} onChange={e => setForm({...form,cpf:e.target.value})} placeholder="000.000.000-00" style={inp}/></div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'1.25rem'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>E-mail *</label><input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="joao@email.com" type="email" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Telefone *</label><input value={form.telefone} onChange={e => setForm({...form,telefone:e.target.value})} placeholder="(11) 99999-9999" style={inp}/></div>
            </div>

            <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS DO IMOVEL</p>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Empreendimento *</label>
              <input value={form.empreendimento} onChange={e => setForm({...form,empreendimento:e.target.value})} placeholder="Ex: Residencial Park" style={inp}/>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'1.5rem'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Torre *</label><input value={form.torre} onChange={e => setForm({...form,torre:e.target.value})} placeholder="Ex: A" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Bloco *</label><input value={form.bloco} onChange={e => setForm({...form,bloco:e.target.value})} placeholder="Ex: 2" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Apartamento *</label><input value={form.apartamento} onChange={e => setForm({...form,apartamento:e.target.value})} placeholder="Ex: 142" style={inp}/></div>
            </div>

            {erro && <p style={{color: VERMELHO, fontSize:'13px', fontWeight:'600', marginBottom:'12px'}}>{erro}</p>}
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{flex:1, padding:'12px', background:'#fff', color:'#6b7280', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>VOLTAR</button>
              <button onClick={confirmar} disabled={loading} style={{flex:2, padding:'12px', background: loading?'#9ca3af': AZUL, color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', letterSpacing:'0.05em', cursor: loading?'not-allowed':'pointer'}}>
                {loading ? 'AGUARDE...' : 'CONFIRMAR AGENDAMENTO'}
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div style={{background:'#fff', borderRadius:'16px', padding:'3rem 2rem', textAlign:'center', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'480px', margin:'0 auto'}}>
            <div style={{width:'70px', height:'70px', background: AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M5 16l8 8 14-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'26px', fontWeight:'400', margin:'0 0 8px', color: AZUL}}>VISTORIA AGENDADA!</h2>
            <p style={{color:'#6b7280', fontSize:'14px', lineHeight:'1.7', margin:'0 0 1.5rem'}}>
              Um e-mail de confirmacao foi enviado para <strong>{form.email}</strong>.
            </p>
            <div style={{background: AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'1rem 1.25rem', fontSize:'13px', color:'#374151', textAlign:'left', lineHeight:'2'}}>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Data:</strong> <span style={{fontWeight:'600', textTransform:'capitalize'}}>{dataFormatada}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Horario:</strong> <span style={{fontWeight:'600'}}>{horarioSel}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Empreendimento:</strong> <span style={{fontWeight:'600'}}>{form.empreendimento}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Unidade:</strong> <span style={{fontWeight:'600'}}>Torre {form.torre}, Bloco {form.bloco}, Apto {form.apartamento}</span></div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

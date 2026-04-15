'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const POR_PAGINA = 10

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [popup, setPopup] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [ordem, setOrdem] = useState('mais-antigo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [gerandoPDF, setGerandoPDF] = useState(false)

  useEffect(() => { if (status==='unauthenticated') router.push('/admin/login') }, [status])
  useEffect(() => { if (status==='authenticated') buscarAgendamentos() }, [status])
  useEffect(() => { setPagina(1) }, [filtro, busca, ordem, dataInicio, dataFim])

  async function buscarAgendamentos() {
    try {
      const res = await fetch('/api/agendamentos')
      const data = await res.json()
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch(e) { setAgendamentos([]) }
    setLoading(false)
  }

  function confirmarCancelamento(a) { setPopup(a) }

  async function executarCancelamento() {
    if (!popup) return
    try {
      const res = await fetch('/api/agendamentos/' + popup.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' })
      })
      if (res.ok) buscarAgendamentos()
      else alert('Erro ao cancelar.')
    } catch(e) { alert('Erro de conexao.') }
    setPopup(null)
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const res = await fetch('/api/agendamentos/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      if (res.ok) buscarAgendamentos()
      else alert('Erro ao atualizar.')
    } catch(e) { alert('Erro de conexao.') }
  }

  function exportarCSV() {
    const cabecalho = ['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Criado Em']
    const linhas = filtrados.map(a => [
      a.nome, a.cpf||'', a.email, a.telefone, a.apartamento,
      new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),
      a.horario?.slice(0,5), a.status,
      a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : ''
    ])
    const csv = [cabecalho,...linhas].map(l => l.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-agendamentos-'+new Date().toISOString().split('T')[0]+'.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function gerarPDF() {
    setGerandoPDF(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, M = 15
      let y = 0

      // Header azul
      doc.setFillColor(27, 47, 126)
      doc.rect(0, 0, W, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('MARK INVEST', W/2, 14, {align:'center'})
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Relatorio de Agendamentos de Vistoria', W/2, 22, {align:'center'})
      const hoje = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})
      doc.setFontSize(8)
      doc.text('Gerado em: ' + hoje, W/2, 29, {align:'center'})
      y = 42

      // Filtros aplicados
      doc.setTextColor(80,80,80)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      let filtroTexto = 'Filtros: Status = ' + (filtro==='todos'?'Todos':filtro.charAt(0).toUpperCase()+filtro.slice(1))
      if (dataInicio) filtroTexto += ' | De: ' + new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR')
      if (dataFim) filtroTexto += ' | Ate: ' + new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR')
      filtroTexto += ' | Total: ' + filtrados.length + ' registro(s)'
      doc.text(filtroTexto, M, y)
      y += 8

      // Cabeçalho tabela
      doc.setFillColor(27, 47, 126)
      doc.rect(M, y, W-M*2, 7, 'F')
      doc.setTextColor(255,255,255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      const cols = [
        {x:M+1, w:35, label:'NOME'},
        {x:M+37, w:22, label:'DATA'},
        {x:M+60, w:12, label:'HORA'},
        {x:M+73, w:55, label:'UNIDADE'},
        {x:M+129, w:25, label:'TELEFONE'},
        {x:M+155, w:22, label:'STATUS'},
      ]
      cols.forEach(c => doc.text(c.label, c.x, y+5))
      y += 9

      // Linhas
      doc.setFont('helvetica', 'normal')
      filtrados.forEach((a, idx) => {
        if (y > 270) {
          doc.addPage()
          y = 15
          doc.setFillColor(27, 47, 126)
          doc.rect(M, y, W-M*2, 7, 'F')
          doc.setTextColor(255,255,255)
          doc.setFont('helvetica', 'bold')
          cols.forEach(c => doc.text(c.label, c.x, y+5))
          y += 9
          doc.setFont('helvetica', 'normal')
        }
        if (idx%2===0) { doc.setFillColor(245,247,252); doc.rect(M, y, W-M*2, 7, 'F') }
        doc.setTextColor(a.status==='cancelado'?150:30, a.status==='cancelado'?150:30, a.status==='cancelado'?150:30)
        doc.setFontSize(7.5)
        const nome = (a.nome||'').slice(0,20)
        const data = new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR')
        const hora = (a.horario||'').slice(0,5)
        const unidade = (a.apartamento||'').slice(0,30)
        const tel = (a.telefone||'').slice(0,15)
        const stat = (a.status||'').toUpperCase()
        doc.text(nome, cols[0].x, y+5)
        doc.text(data, cols[1].x, y+5)
        doc.text(hora, cols[2].x, y+5)
        doc.text(unidade, cols[3].x, y+5)
        doc.text(tel, cols[4].x, y+5)
        if (a.status==='cancelado') doc.setTextColor(192,57,43)
        else doc.setTextColor(22,163,74)
        doc.text(stat, cols[5].x, y+5)
        y += 7
      })

      // Rodapé
      const totalPages = doc.getNumberOfPages()
      for (let i=1; i<=totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(27,47,126)
        doc.rect(0, 287, W, 10, 'F')
        doc.setTextColor(255,255,255)
        doc.setFontSize(7)
        doc.text('Mark Invest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo', W/2, 293, {align:'center'})
        doc.text('Pagina '+i+' de '+totalPages, W-M, 293, {align:'right'})
      }

      doc.save('relatorio-vistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e) {
      console.error(e)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
    setGerandoPDF(false)
  }

  const filtrados = agendamentos
    .filter(a => filtro==='todos' || a.status===filtro)
    .filter(a => {
      if (!busca) return true
      const b = busca.toLowerCase()
      return a.nome?.toLowerCase().includes(b) || a.email?.toLowerCase().includes(b) || a.apartamento?.toLowerCase().includes(b) || a.telefone?.includes(b)
    })
    .filter(a => {
      if (dataInicio && a.data < dataInicio) return false
      if (dataFim && a.data > dataFim) return false
      return true
    })
    .sort((a,b) => {
      const da = new Date(a.criado_em||0)
      const db = new Date(b.criado_em||0)
      return ordem==='mais-antigo' ? da-db : db-da
    })

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados = filtrados.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA)
  const totalConfirmados = agendamentos.filter(a => a.status==='confirmado').length
  const totalCancelados = agendamentos.filter(a => a.status==='cancelado').length

  if (status==='loading'||loading) return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif"}}>

      {/* POPUP */}
      {popup && (
        <div onClick={() => setPopup(null)} style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'400px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width:'56px', height:'56px', background:'#fee2e2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{fontSize:'18px', fontWeight:'700', color:'#111', textAlign:'center', margin:'0 0 8px'}}>Cancelar agendamento?</h3>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 6px', lineHeight:'1.6'}}>Voce esta prestes a cancelar o agendamento de</p>
            <p style={{fontSize:'15px', fontWeight:'700', color:'#1B2F7E', textAlign:'center', margin:'0 0 4px'}}>{popup.nome}</p>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 1.25rem'}}>{new Date(popup.data+'T12:00:00').toLocaleDateString('pt-BR')} as {popup.horario?.slice(0,5)}</p>
            <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'8px', padding:'10px', marginBottom:'1.25rem', fontSize:'12px', color:'#dc2626', textAlign:'center', fontWeight:'600'}}>Esta acao nao podera ser desfeita facilmente</div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setPopup(null)} style={{flex:1, padding:'12px', background:'#fff', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer'}}>NAO, MANTER</button>
              <button onClick={executarCancelamento} style={{flex:1, padding:'12px', background:'#dc2626', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>SIM, CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:'#1B2F7E', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" alt="Mark Invest" style={{height:'36px', objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
          <span style={{color:'rgba(255,255,255,0.7)', fontSize:'12px', letterSpacing:'0.08em', textTransform:'uppercase'}}>Painel de Agendamentos</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>{session?.user?.email}</span>
          <button onClick={() => signOut({callbackUrl:'/admin/login'})} style={{padding:'6px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#fff', fontWeight:'600'}}>SAIR</button>
        </div>
      </div>

      <div style={{maxWidth:'960px', margin:'0 auto', padding:'1.5rem 1rem'}}>

        {/* CARDS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'1.5rem'}}>
          {[{label:'TOTAL', val:agendamentos.length, cor:'#1B2F7E'},{label:'CONFIRMADOS', val:totalConfirmados, cor:'#1D9E75'},{label:'CANCELADOS', val:totalCancelados, cor:'#dc2626'}].map(c => (
            <div key={c.label} style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', borderLeft:'4px solid '+c.cor}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px'}}>{c.label}</p>
              <p style={{fontSize:'28px', fontWeight:'700', color:c.cor, margin:0}}>{c.val}</p>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', marginBottom:'1rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)'}}>
          <div style={{display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}}>
            <div style={{display:'flex', gap:'6px'}}>
              {['todos','confirmado','cancelado'].map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{padding:'6px 14px', borderRadius:'20px', border:filtro===f?'none':'1px solid #e5e7eb', background:filtro===f?(f==='cancelado'?'#dc2626':f==='confirmado'?'#1D9E75':'#1B2F7E'):'#fff', color:filtro===f?'#fff':'#6b7280', fontSize:'12px', fontWeight:'700', cursor:'pointer', textTransform:'uppercase'}}>{f}</button>
              ))}
            </div>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, email, apartamento..." style={{flex:1, minWidth:'180px', padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
            <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none', background:'#fff', cursor:'pointer'}}>
              <option value="mais-antigo">Mais antigo primeiro</option>
              <option value="mais-novo">Mais novo primeiro</option>
            </select>
          </div>

          {/* Filtro por data */}
          <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center'}}>
            <span style={{fontSize:'12px', fontWeight:'600', color:'#6b7280'}}>Filtrar por data de vistoria:</span>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <label style={{fontSize:'12px', color:'#6b7280'}}>De:</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <label style={{fontSize:'12px', color:'#6b7280'}}>Ate:</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
            </div>
            {(dataInicio||dataFim) && <button onClick={() => {setDataInicio('');setDataFim('')}} style={{padding:'6px 12px', background:'#f3f4f6', border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#6b7280', fontWeight:'600'}}>Limpar</button>}
          </div>

          {/* Botoes exportar */}
          <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>
            <button onClick={exportarCSV} style={{padding:'8px 16px', background:'#1B2F7E', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              EXPORTAR CSV
            </button>
            <button onClick={gerarPDF} disabled={gerandoPDF} style={{padding:'8px 16px', background:gerandoPDF?'#9ca3af':'#C0392B', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:gerandoPDF?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'6px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14,2 14,8 20,8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {gerandoPDF?'GERANDO...':'EXPORTAR PDF'}
            </button>
          </div>
        </div>

        {/* LISTA */}
        {paginados.length === 0 ? (
          <div style={{textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'14px', background:'#fff', borderRadius:'12px'}}>Nenhum agendamento encontrado</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {paginados.map(a => {
              const cancelado = a.status==='cancelado'
              const criadoEm = a.criado_em ? new Date(a.criado_em) : null
              const criadoFormatado = criadoEm ? criadoEm.toLocaleDateString('pt-BR')+' as '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : null
              return (
                <div key={a.id} style={{background:cancelado?'#fff5f5':'#fff', border:cancelado?'1.5px solid #fca5a5':'1px solid #e5e7eb', borderRadius:'12px', padding:'1.25rem 1.5rem', boxShadow:'0 1px 4px rgba(27,47,126,0.04)', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', left:0, top:0, bottom:0, width:'4px', background:cancelado?'#dc2626':'#1D9E75', borderRadius:'12px 0 0 12px'}}></div>
                  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', paddingLeft:'8px'}}>
                    <div>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap'}}>
                        <span style={{fontSize:'15px', fontWeight:'700', color:cancelado?'#9ca3af':'#111', textDecoration:cancelado?'line-through':'none'}}>{a.nome}</span>
                        <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:cancelado?'#dc2626':'#1D9E75', color:'#fff', fontWeight:'700', textTransform:'uppercase'}}>{a.status}</span>
                      </div>
                      <div style={{fontSize:'13px', color:cancelado?'#9ca3af':'#6b7280', fontWeight:'500'}}>{a.apartamento}</div>
                    </div>
                    <div style={{textAlign:'right', flexShrink:0}}>
                      <div style={{fontSize:'14px', fontWeight:'700', color:cancelado?'#9ca3af':'#1B2F7E'}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                      <div style={{fontSize:'13px', color:'#9ca3af'}}>{a.horario?.slice(0,5)}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'16px', fontSize:'12px', color:cancelado?'#9ca3af':'#6b7280', marginBottom:'8px', flexWrap:'wrap', paddingLeft:'8px'}}>
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
                    {!cancelado && <button onClick={() => confirmarCancelamento(a)} style={{padding:'6px 16px', background:'#dc2626', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', color:'#fff', cursor:'pointer'}}>CANCELAR AGENDAMENTO</button>}
                    {cancelado && <button onClick={() => atualizarStatus(a.id,'confirmado')} style={{padding:'6px 16px', background:'#1D9E75', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', color:'#fff', cursor:'pointer'}}>REATIVAR</button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PAGINACAO */}
        {totalPaginas > 1 && (
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'1.5rem', flexWrap:'wrap'}}>
            <button onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina===1} style={{padding:'6px 14px', background:pagina===1?'#f3f4f6':'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:pagina===1?'not-allowed':'pointer', color:pagina===1?'#9ca3af':'#374151'}}>&#8249; Anterior</button>
            {Array.from({length:totalPaginas},(_,i)=>i+1).map(p => (
              <button key={p} onClick={() => setPagina(p)} style={{width:'36px', height:'36px', borderRadius:'8px', border:pagina===p?'none':'1px solid #e5e7eb', background:pagina===p?'#1B2F7E':'#fff', color:pagina===p?'#fff':'#374151', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>{p}</button>
            ))}
            <button onClick={() => setPagina(p => Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} style={{padding:'6px 14px', background:pagina===totalPaginas?'#f3f4f6':'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:pagina===totalPaginas?'not-allowed':'pointer', color:pagina===totalPaginas?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
          </div>
        )}

        <p style={{textAlign:'center', fontSize:'12px', color:'#9ca3af', marginTop:'1rem'}}>
          Mostrando {filtrados.length===0?0:((pagina-1)*POR_PAGINA)+1} - {Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length} agendamentos
        </p>
      </div>
    </main>
  )
}

'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
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
  const [abaAtiva, setAbaAtiva] = useState('agendamentos')
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [novoEmp, setNovoEmp] = useState('')
  const [salvandoEmp, setSalvandoEmp] = useState(false)
  const [erroEmp, setErroEmp] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status])
  useEffect(() => { if (status === 'authenticated') { buscarAgendamentos(); buscarEmpreendimentos() } }, [status])
  useEffect(() => { setPagina(1) }, [filtro, busca, ordem, dataInicio, dataFim])

  async function buscarAgendamentos() {
    try {
      const res = await fetch('/api/agendamentos')
      const data = await res.json()
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch(e) { setAgendamentos([]) }
    setLoading(false)
  }

  async function buscarEmpreendimentos() {
    try {
      const res = await fetch('/api/empreendimentos')
      const data = await res.json()
      setEmpreendimentos(Array.isArray(data) ? data : [])
    } catch(e) {}
  }

  async function adicionarEmpreendimento() {
    if (!novoEmp.trim()) return
    setSalvandoEmp(true)
    setErroEmp('')
    try {
      const res = await fetch('/api/empreendimentos', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({nome: novoEmp.trim()})
      })
      if (res.ok) { setNovoEmp(''); buscarEmpreendimentos() }
      else { const d = await res.json(); setErroEmp(d.error || 'Erro ao salvar.') }
    } catch(e) { setErroEmp('Erro de conexao.') }
    setSalvandoEmp(false)
  }

  async function removerEmpreendimento(nome) {
    if (!confirm('Remover "' + nome + '"?')) return
    try {
      await fetch('/api/empreendimentos', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({nome})
      })
      buscarEmpreendimentos()
    } catch(e) {}
  }

  function confirmarCancelamento(a) { setPopup(a) }

  async function executarCancelamento() {
    if (!popup) return
    try {
      const res = await fetch('/api/agendamentos/' + popup.id, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({status:'cancelado'})
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
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({status: novoStatus})
      })
      if (res.ok) buscarAgendamentos()
      else alert('Erro ao atualizar.')
    } catch(e) { alert('Erro de conexao.') }
  }

  function exportarCSV() {
    const cab = ['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Criado Em']
    const linhas = filtrados.map(a => [
      a.nome, a.cpf||'', a.email, a.telefone, a.apartamento,
      new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),
      a.horario?.slice(0,5), a.status,
      a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : ''
    ])
    const csv = [cab,...linhas].map(l => l.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-'+new Date().toISOString().split('T')[0]+'.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function gerarPDF() {
    setGerandoPDF(true)
    try {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      document.head.appendChild(script)
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej })
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a4'})
      const W = 297, M = 12
      let y = 0

      doc.setFillColor(27,47,126)
      doc.rect(0,0,W,32,'F')
      doc.setTextColor(255,255,255)
      doc.setFontSize(20); doc.setFont('helvetica','bold')
      doc.text('MARKINVEST', W/2, 13, {align:'center'})
      doc.setFontSize(9); doc.setFont('helvetica','normal')
      doc.text('Relatorio de Agendamentos de Vistoria', W/2, 21, {align:'center'})
      doc.setFontSize(7.5)
      doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), W/2, 28, {align:'center'})
      y = 38

      doc.setFillColor(240,243,250)
      doc.rect(M, y-4, W-M*2, 10, 'F')
      doc.setTextColor(60,60,100); doc.setFontSize(7.5); doc.setFont('helvetica','italic')
      let ftxt = 'Filtros: Status = ' + (filtro==='todos'?'Todos':filtro)
      if (dataInicio) ftxt += ' | De: ' + new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR')
      if (dataFim) ftxt += ' | Ate: ' + new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR')
      ftxt += ' | Total: ' + filtrados.length + ' registro(s)'
      doc.text(ftxt, M+3, y+2)
      y += 12

      const cols = [
        {x:M,      w:38, label:'NOME'},
        {x:M+39,   w:30, label:'EMPREENDIMENTO'},
        {x:M+70,   w:40, label:'UNIDADE'},
        {x:M+111,  w:22, label:'DATA VISTORIA'},
        {x:M+134,  w:14, label:'HORA'},
        {x:M+149,  w:28, label:'TELEFONE'},
        {x:M+178,  w:35, label:'AGENDADO EM'},
        {x:M+214,  w:22, label:'STATUS'},
      ]

      doc.setFillColor(27,47,126)
      doc.rect(M, y, W-M*2, 8, 'F')
      doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
      cols.forEach(c => doc.text(c.label, c.x+1, y+5.5))
      y += 9

      doc.setFont('helvetica','normal')
      filtrados.forEach((a, idx) => {
        if (y > 185) {
          doc.addPage()
          y = 15
          doc.setFillColor(27,47,126); doc.rect(M,y,W-M*2,8,'F')
          doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
          cols.forEach(c => doc.text(c.label, c.x+1, y+5.5))
          y += 9; doc.setFont('helvetica','normal')
        }

        const rowH = 8
        if (idx%2===0) {
          doc.setFillColor(247,249,255)
          doc.rect(M, y, W-M*2, rowH, 'F')
        }
        doc.setDrawColor(220,225,240)
        doc.line(M, y+rowH, W-M, y+rowH)
        doc.setFontSize(7.5)

        doc.setTextColor(30,30,30); doc.setFont('helvetica','bold')
        doc.text((a.nome||'').slice(0,20), cols[0].x+1, y+5.5)

        const aptoStr = a.apartamento || ''
        const partes = aptoStr.split(' - ')
        const empreend = partes[0] || ''
        const apto = partes.slice(1).join(' - ') || aptoStr

        doc.setFont('helvetica','normal'); doc.setTextColor(27,47,126)
        doc.text(empreend.slice(0,20), cols[1].x+1, y+5.5)

        doc.setTextColor(60,60,60)
        doc.text(apto.slice(0,25), cols[2].x+1, y+5.5)

        doc.setTextColor(27,47,126); doc.setFont('helvetica','bold')
        doc.text(new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'), cols[3].x+1, y+5.5)

        doc.text((a.horario||'').slice(0,5), cols[4].x+1, y+5.5)

        doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80)
        doc.text((a.telefone||'').slice(0,16), cols[5].x+1, y+5.5)

        const criadoEm = a.criado_em ? new Date(a.criado_em) : null
        const criadoFmt = criadoEm
          ? criadoEm.toLocaleDateString('pt-BR') + ' ' + criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
          : '-'
        doc.setTextColor(100,100,100)
        doc.text(criadoFmt, cols[6].x+1, y+5.5)

        const cancelado = a.status === 'cancelado'
        if (cancelado) {
          doc.setFillColor(254,226,226); doc.rect(cols[7].x, y+1.5, 22, 5.5, 'F')
          doc.setTextColor(180,30,30)
        } else {
          doc.setFillColor(220,252,231); doc.rect(cols[7].x, y+1.5, 22, 5.5, 'F')
          doc.setTextColor(22,101,52)
        }
        doc.setFont('helvetica','bold'); doc.setFontSize(7)
        doc.text((a.status||'').toUpperCase(), cols[7].x+2, y+5.5)

        y += rowH
      })

      const total = doc.getNumberOfPages()
      for (let i=1;i<=total;i++) {
        doc.setPage(i)
        doc.setFillColor(27,47,126); doc.rect(0,200,W,7,'F')
        doc.setTextColor(255,255,255); doc.setFontSize(6.5); doc.setFont('helvetica','normal')
        doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo', W/2, 204.5, {align:'center'})
        doc.text('Pagina '+i+' de '+total, W-M, 204.5, {align:'right'})
      }

      doc.save('relatorio-vistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e) { console.error(e); alert('Erro ao gerar PDF.') }
    setGerandoPDF(false)
  }

  const filtrados = agendamentos
    .filter(a => filtro==='todos' || a.status===filtro)
    .filter(a => {
      if (!busca) return true
      const b = busca.toLowerCase()
      return a.nome?.toLowerCase().includes(b) || a.email?.toLowerCase().includes(b) || a.apartamento?.toLowerCase().includes(b) || a.telefone?.includes(b) || a.cpf?.includes(b)
    })
    .filter(a => {
      if (dataInicio && a.data < dataInicio) return false
      if (dataFim && a.data > dataFim) return false
      return true
    })
    .sort((a,b) => {
      const da = new Date(a.criado_em||0), db = new Date(b.criado_em||0)
      return ordem==='mais-antigo' ? da-db : db-da
    })

  const totalPaginas = Math.ceil(filtrados.length/POR_PAGINA)
  const paginados = filtrados.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA)
  const totalConf = agendamentos.filter(a=>a.status==='confirmado').length
  const totalCanc = agendamentos.filter(a=>a.status==='cancelado').length

  if (status==='loading'||loading) return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif"}}>

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

      <div style={{background:'#1B2F7E', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" alt="Markinvest" style={{height:'36px', objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
          <span style={{color:'rgba(255,255,255,0.7)', fontSize:'12px', letterSpacing:'0.08em', textTransform:'uppercase'}}>Painel Administrativo</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>{session?.user?.email}</span>
          <button onClick={() => signOut({callbackUrl:'/admin/login'})} style={{padding:'6px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#fff', fontWeight:'600'}}>SAIR</button>
        </div>
      </div>

      <div style={{background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', padding:'0 1.5rem'}}>
        {[{id:'agendamentos',label:'Agendamentos'},{id:'empreendimentos',label:'Empreendimentos'}].map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)} style={{padding:'12px 20px', background:'none', border:'none', borderBottom:abaAtiva===a.id?'3px solid #1B2F7E':'3px solid transparent', fontSize:'13px', fontWeight:'700', cursor:'pointer', color:abaAtiva===a.id?'#1B2F7E':'#6b7280', transition:'all 0.15s'}}>{a.label}</button>
        ))}
      </div>

      <div style={{maxWidth:'960px', margin:'0 auto', padding:'1.5rem 1rem'}}>

        {abaAtiva === 'empreendimentos' && (
          <div style={{background:'#fff', borderRadius:'12px', padding:'1.5rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)'}}>
            <h2 style={{fontSize:'16px', fontWeight:'700', color:'#1B2F7E', margin:'0 0 8px'}}>Gerenciar Empreendimentos</h2>
            <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px', lineHeight:'1.6'}}>Os empreendimentos cadastrados aqui aparecerao na lista suspensa para os clientes ao realizar o agendamento.</p>
            <div style={{display:'flex', gap:'10px', marginBottom:'12px'}}>
              <input value={novoEmp} onChange={e => setNovoEmp(e.target.value)} onKeyDown={e => e.key==='Enter' && adicionarEmpreendimento()} placeholder="Nome do novo empreendimento" style={{flex:1, padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', outline:'none'}}/>
              <button onClick={adicionarEmpreendimento} disabled={salvandoEmp||!novoEmp.trim()} style={{padding:'10px 20px', background:salvandoEmp||!novoEmp.trim()?'#9ca3af':'#1B2F7E', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:salvandoEmp||!novoEmp.trim()?'not-allowed':'pointer', whiteSpace:'nowrap'}}>
                {salvandoEmp?'SALVANDO...':'+ ADICIONAR'}
              </button>
            </div>
            {erroEmp && <p style={{color:'#dc2626', fontSize:'13px', margin:'0 0 12px', fontWeight:'600'}}>{erroEmp}</p>}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {empreendimentos.map(emp => (
                <div key={emp} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f8f9ff', borderRadius:'8px', border:'1px solid #e0e5f5'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#1B2F7E', flexShrink:0}}></div>
                    <span style={{fontSize:'14px', fontWeight:'600', color:'#1B2F7E'}}>{emp}</span>
                  </div>
                  <button onClick={() => removerEmpreendimento(emp)} style={{padding:'5px 14px', background:'none', border:'1px solid #fca5a5', borderRadius:'6px', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600'}}>REMOVER</button>
                </div>
              ))}
              {empreendimentos.length === 0 && <p style={{color:'#9ca3af', fontSize:'13px', textAlign:'center', padding:'2rem'}}>Nenhum empreendimento cadastrado.</p>}
            </div>
          </div>
        )}

        {abaAtiva === 'agendamentos' && (
          <>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'1.5rem'}}>
              {[{label:'TOTAL',val:agendamentos.length,cor:'#1B2F7E'},{label:'CONFIRMADOS',val:totalConf,cor:'#1D9E75'},{label:'CANCELADOS',val:totalCanc,cor:'#dc2626'}].map(c => (
                <div key={c.label} style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)', borderLeft:'4px solid '+c.cor}}>
                  <p style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px'}}>{c.label}</p>
                  <p style={{fontSize:'28px', fontWeight:'700', color:c.cor, margin:0}}>{c.val}</p>
                </div>
              ))}
            </div>

            <div style={{background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', marginBottom:'1rem', boxShadow:'0 1px 4px rgba(27,47,126,0.08)'}}>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}}>
                <div style={{display:'flex', gap:'6px'}}>
                  {['todos','confirmado','cancelado'].map(f => (
                    <button key={f} onClick={() => setFiltro(f)} style={{padding:'6px 14px', borderRadius:'20px', border:filtro===f?'none':'1px solid #e5e7eb', background:filtro===f?(f==='cancelado'?'#dc2626':f==='confirmado'?'#1D9E75':'#1B2F7E'):'#fff', color:filtro===f?'#fff':'#6b7280', fontSize:'12px', fontWeight:'700', cursor:'pointer', textTransform:'uppercase'}}>{f}</button>
                  ))}
                </div>
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, email, CPF, apartamento..." style={{flex:1, minWidth:'180px', padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
                <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none', background:'#fff', cursor:'pointer'}}>
                  <option value="mais-antigo">Mais antigo primeiro</option>
                  <option value="mais-novo">Mais novo primeiro</option>
                </select>
              </div>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}}>
                <span style={{fontSize:'12px', fontWeight:'600', color:'#6b7280'}}>Filtrar por data da vistoria:</span>
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
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
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

            {paginados.length === 0 ? (
              <div style={{textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'14px', background:'#fff', borderRadius:'12px'}}>Nenhum agendamento encontrado</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {paginados.map(a => {
                  const cancelado = a.status==='cancelado'
                  const criadoEm = a.criado_em ? new Date(a.criado_em) : null
                  const criadoFmt = criadoEm ? criadoEm.toLocaleDateString('pt-BR')+' as '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : null
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
                      {criadoFmt && (
                        <div style={{paddingLeft:'8px', marginBottom:'12px'}}>
                          <span style={{fontSize:'11px', color:'#9ca3af', background:'#f4f6fb', padding:'3px 10px', borderRadius:'20px', display:'inline-flex', alignItems:'center', gap:'4px'}}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
                            Agendado em {criadoFmt}
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

            {totalPaginas > 1 && (
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'1.5rem', flexWrap:'wrap'}}>
                <button onClick={() => setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{padding:'6px 14px', background:pagina===1?'#f3f4f6':'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:pagina===1?'not-allowed':'pointer', color:pagina===1?'#9ca3af':'#374151'}}>&#8249; Anterior</button>
                {Array.from({length:totalPaginas},(_,i)=>i+1).map(p => (
                  <button key={p} onClick={() => setPagina(p)} style={{width:'36px', height:'36px', borderRadius:'8px', border:pagina===p?'none':'1px solid #e5e7eb', background:pagina===p?'#1B2F7E':'#fff', color:pagina===p?'#fff':'#374151', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>{p}</button>
                ))}
                <button onClick={() => setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} style={{padding:'6px 14px', background:pagina===totalPaginas?'#f3f4f6':'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:pagina===totalPaginas?'not-allowed':'pointer', color:pagina===totalPaginas?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
              </div>
            )}

            <p style={{textAlign:'center', fontSize:'12px', color:'#9ca3af', marginTop:'1rem'}}>
              Mostrando {filtrados.length===0?0:((pagina-1)*POR_PAGINA)+1} - {Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length} agendamentos
            </p>
          </>
        )}
      </div>
    </main>
  )
}
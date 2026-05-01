'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const POR_PAGINA = 10
const MESES_NOMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const AZUL = '#1B2F7E'
const VERDE = '#1D9E75'
const VERMELHO = '#dc2626'

const MOTIVOS = [
  'Selecione o motivo',
  'Cliente solicitou cancelamento',
  'Reagendamento necessario',
  'Imovel indisponivel',
  'Ausencia do cliente',
  'Outro'
]

function mascaraCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14)
}

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [popup, setPopup] = useState(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [obsCancelamento, setObsCancelamento] = useState('')
  const [erroMotivo, setErroMotivo] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [ordem, setOrdem] = useState('mais-antigo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('agendamentos')
  const [subAbaConfig, setSubAbaConfig] = useState('meses')
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [novoEmp, setNovoEmp] = useState('')
  const [salvandoEmp, setSalvandoEmp] = useState(false)
  const [erroEmp, setErroEmp] = useState('')
  const [mesesBloqueados, setMesesBloqueados] = useState([])
  const [salvandoMes, setSalvandoMes] = useState(false)
  const [horariosConfig, setHorariosConfig] = useState([])
  const [salvandoHorario, setSalvandoHorario] = useState(false)
  const [diasEspeciais, setDiasEspeciais] = useState([])
  const [dataInicioEspecial, setDataInicioEspecial] = useState('')
  const [dataFimEspecial, setDataFimEspecial] = useState('')
  const [obsEspecial, setObsEspecial] = useState('')
  const [salvandoDia, setSalvandoDia] = useState(false)
  const [cpfsAutorizados, setCpfsAutorizados] = useState([])
  const [novoCpf, setNovoCpf] = useState('')
  const [nomeNovoCpf, setNomeNovoCpf] = useState('')
  const [salvandoCpf, setSalvandoCpf] = useState(false)
  const [erroCpf, setErroCpf] = useState('')
  const [buscaCpf, setBuscaCpf] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status])
  useEffect(() => {
    if (status === 'authenticated') {
      buscarAgendamentos()
      buscarEmpreendimentos()
      buscarMesesBloqueados()
      buscarHorariosConfig()
      buscarDiasEspeciais()
      buscarCpfsAutorizados()
    }
  }, [status])
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

  async function buscarMesesBloqueados() {
    try {
      const res = await fetch('/api/meses-bloqueados')
      const data = await res.json()
      setMesesBloqueados(Array.isArray(data) ? data : [])
    } catch(e) {}
  }

  async function buscarHorariosConfig() {
    try {
      const res = await fetch('/api/horarios-config')
      const data = await res.json()
      setHorariosConfig(Array.isArray(data) ? data : [])
    } catch(e) {}
  }

  async function buscarDiasEspeciais() {
    try {
      const res = await fetch('/api/dias-especiais')
      const data = await res.json()
      setDiasEspeciais(Array.isArray(data) ? data : [])
    } catch(e) {}
  }

  async function buscarCpfsAutorizados() {
    try {
      const res = await fetch('/api/cpfs-autorizados')
      const data = await res.json()
      setCpfsAutorizados(Array.isArray(data) ? data : [])
    } catch(e) {}
  }

  async function adicionarCpf() {
    if (!novoCpf.trim()) return
    setSalvandoCpf(true); setErroCpf('')
    try {
      const res = await fetch('/api/cpfs-autorizados', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ cpf: novoCpf, nome: nomeNovoCpf })
      })
      if (res.ok) { setNovoCpf(''); setNomeNovoCpf(''); buscarCpfsAutorizados() }
      else { const d = await res.json(); setErroCpf(d.error || 'Erro ao salvar.') }
    } catch(e) { setErroCpf('Erro de conexao.') }
    setSalvandoCpf(false)
  }

  async function removerCpf(cpf) {
    if (!confirm('Remover CPF ' + cpf + '?')) return
    try {
      await fetch('/api/cpfs-autorizados', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ cpf })
      })
      buscarCpfsAutorizados()
    } catch(e) {}
  }

  async function toggleMes(anoMes) {
    setSalvandoMes(true)
    try {
      const bloqueado = mesesBloqueados.includes(anoMes)
      await fetch('/api/meses-bloqueados', {
        method: bloqueado ? 'DELETE' : 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ano_mes: anoMes})
      })
      buscarMesesBloqueados()
    } catch(e) {}
    setSalvandoMes(false)
  }

  async function toggleHorario(horario, ativo) {
    setSalvandoHorario(true)
    try {
      await fetch('/api/horarios-config', {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({horario, ativo: !ativo})
      })
      buscarHorariosConfig()
    } catch(e) {}
    setSalvandoHorario(false)
  }

  async function adicionarDiaEspecial(tipo) {
    if (!dataInicioEspecial || !dataFimEspecial) return
    setSalvandoDia(true)
    try {
      await fetch('/api/dias-especiais', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ data_inicio: dataInicioEspecial, data_fim: dataFimEspecial, tipo, observacao: obsEspecial })
      })
      setDataInicioEspecial(''); setDataFimEspecial(''); setObsEspecial('')
      buscarDiasEspeciais()
    } catch(e) {}
    setSalvandoDia(false)
  }

  async function removerDiaEspecial(id) {
    try {
      await fetch('/api/dias-especiais', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id})
      })
      buscarDiasEspeciais()
    } catch(e) {}
  }

  async function adicionarEmpreendimento() {
    if (!novoEmp.trim()) return
    setSalvandoEmp(true); setErroEmp('')
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
      await fetch('/api/empreendimentos', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nome}) })
      buscarEmpreendimentos()
    } catch(e) {}
  }

  function confirmarCancelamento(a) {
    setPopup(a); setMotivoCancelamento(''); setObsCancelamento(''); setErroMotivo(false)
  }

  async function executarCancelamento() {
    if (!popup) return
    if (!motivoCancelamento || motivoCancelamento === 'Selecione o motivo') { setErroMotivo(true); return }
    try {
      const res = await fetch('/api/agendamentos/' + popup.id, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status: 'cancelado', motivo_cancelamento: motivoCancelamento, obs_cancelamento: obsCancelamento })
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
    const cab = ['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Motivo Cancelamento','Obs Cancelamento','Criado Em','Acompanhante','CPF Acompanhante']
    const linhas = filtrados.map(a => [
      a.nome, a.cpf||'', a.email, a.telefone, a.apartamento,
      new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),
      a.horario?.slice(0,5), a.status,
      a.motivo_cancelamento||'', a.obs_cancelamento||'',
      a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : '',
      a.nome_acompanhante||'', a.cpf_acompanhante||''
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
      doc.setFillColor(27,47,126); doc.rect(0,0,W,32,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold')
      doc.text('MARKINVEST', W/2, 13, {align:'center'})
      doc.setFontSize(9); doc.setFont('helvetica','normal')
      doc.text('Relatorio de Agendamentos de Vistoria', W/2, 21, {align:'center'})
      doc.setFontSize(7.5)
      doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), W/2, 28, {align:'center'})
      y = 38
      doc.setFillColor(240,243,250); doc.rect(M, y-4, W-M*2, 10, 'F')
      doc.setTextColor(60,60,100); doc.setFontSize(7.5); doc.setFont('helvetica','italic')
      let ftxt = 'Filtros: Status = ' + (filtro==='todos'?'Todos':filtro)
      if (dataInicio) ftxt += ' | De: ' + new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR')
      if (dataFim) ftxt += ' | Ate: ' + new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR')
      ftxt += ' | Total: ' + filtrados.length + ' registro(s)'
      doc.text(ftxt, M+3, y+2); y += 12
      const cols = [
        {x:M,      label:'NOME'},
        {x:M+34,   label:'EMPREENDIMENTO'},
        {x:M+62,   label:'UNIDADE'},
        {x:M+118,  label:'DATA'},
        {x:M+138,  label:'HORA'},
        {x:M+150,  label:'TELEFONE'},
        {x:M+176,  label:'AGENDADO EM'},
        {x:M+206,  label:'STATUS'},
        {x:M+222,  label:'MOTIVO'},
      ]
      doc.setFillColor(27,47,126); doc.rect(M, y, W-M*2, 8, 'F')
      doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
      cols.forEach(c => doc.text(c.label, c.x+1, y+5.5)); y += 9
      doc.setFont('helvetica','normal')
      filtrados.forEach((a, idx) => {
        if (y > 185) {
          doc.addPage(); y = 15
          doc.setFillColor(27,47,126); doc.rect(M,y,W-M*2,8,'F')
          doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
          cols.forEach(c => doc.text(c.label, c.x+1, y+5.5)); y += 9; doc.setFont('helvetica','normal')
        }
        const rowH = 8
        if (idx%2===0) { doc.setFillColor(247,249,255); doc.rect(M, y, W-M*2, rowH, 'F') }
        doc.setDrawColor(220,225,240); doc.line(M, y+rowH, W-M, y+rowH); doc.setFontSize(7.5)
        doc.setTextColor(30,30,30); doc.setFont('helvetica','bold')
        doc.text((a.nome||'').slice(0,17), cols[0].x+1, y+5.5)
        const aptoStr = a.apartamento || ''
        const partes = aptoStr.split(' - ')
        const empreend = partes[0] || ''
        const apto = partes.slice(1).join(' - ') || aptoStr
        doc.setFont('helvetica','normal'); doc.setTextColor(27,47,126)
        doc.text(empreend.slice(0,15), cols[1].x+1, y+5.5)
        doc.setTextColor(60,60,60)
        doc.text(apto.slice(0,42), cols[2].x+1, y+5.5)
        doc.setTextColor(27,47,126); doc.setFont('helvetica','bold')
        doc.text(new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'), cols[3].x+1, y+5.5)
        doc.text((a.horario||'').slice(0,5), cols[4].x+1, y+5.5)
        doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80)
        doc.text((a.telefone||'').slice(0,14), cols[5].x+1, y+5.5)
        const criadoEm = a.criado_em ? new Date(a.criado_em) : null
        const criadoFmt = criadoEm ? criadoEm.toLocaleDateString('pt-BR')+' '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '-'
        doc.setTextColor(100,100,100)
        doc.text(criadoFmt, cols[6].x+1, y+5.5)
        const cancelado = a.status === 'cancelado'
        if (cancelado) { doc.setFillColor(254,226,226); doc.rect(cols[7].x, y+1.5, 15, 5.5, 'F'); doc.setTextColor(180,30,30) }
        else { doc.setFillColor(220,252,231); doc.rect(cols[7].x, y+1.5, 15, 5.5, 'F'); doc.setTextColor(22,101,52) }
        doc.setFont('helvetica','bold'); doc.setFontSize(6.5)
        doc.text(cancelado?'CANCEL.':'CONF.', cols[7].x+1, y+5.5)
        if (cancelado && a.motivo_cancelamento) {
          doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(180,30,30)
          doc.text((a.motivo_cancelamento||'').slice(0,22), cols[8].x+1, y+5.5)
        }
        y += rowH
      })
      const total = doc.getNumberOfPages()
      for (let i=1;i<=total;i++) {
        doc.setPage(i); doc.setFillColor(27,47,126); doc.rect(0,200,W,7,'F')
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

  const hoje = new Date()
  const mesesGrid = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
    mesesGrid.push({ key, nomeMes: MESES_NOMES[d.getMonth()], anoMes: d.getFullYear(), bloqueado: mesesBloqueados.includes(key) })
  }

  const horariosAtivos = horariosConfig.filter(h => h.ativo).length
  const cpfsFiltrados = cpfsAutorizados.filter(c =>
    !buscaCpf || c.cpf?.includes(buscaCpf.replace(/\D/g,'')) || c.nome?.toLowerCase().includes(buscaCpf.toLowerCase())
  )

  if (status==='loading'||loading) return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f3fa'}}>
      <p style={{color:'#6b7280'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#f0f3fa', fontFamily:"'Segoe UI',sans-serif"}}>

      {popup && (
        <div onClick={() => setPopup(null)} style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'420px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width:'56px', height:'56px', background:'#fee2e2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{fontSize:'18px', fontWeight:'700', color:'#111', textAlign:'center', margin:'0 0 8px'}}>Cancelar agendamento?</h3>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 4px', lineHeight:'1.6'}}>Voce esta prestes a cancelar o agendamento de</p>
            <p style={{fontSize:'15px', fontWeight:'700', color:AZUL, textAlign:'center', margin:'0 0 4px'}}>{popup.nome}</p>
            <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0 0 1.25rem'}}>{new Date(popup.data+'T12:00:00').toLocaleDateString('pt-BR')} as {popup.horario?.slice(0,5)}</p>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px', fontWeight:'700', color:erroMotivo?VERMELHO:'#6b7280', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Motivo do cancelamento *</label>
              <select value={motivoCancelamento} onChange={e => {setMotivoCancelamento(e.target.value); setErroMotivo(false)}}
                style={{width:'100%', padding:'10px 12px', border:erroMotivo?'2px solid '+VERMELHO:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none', background:'#fff', cursor:'pointer'}}>
                {MOTIVOS.map(m => <option key={m} value={m === 'Selecione o motivo' ? '' : m}>{m}</option>)}
              </select>
              {erroMotivo && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Selecione o motivo do cancelamento</p>}
            </div>
            <div style={{marginBottom:'1.25rem'}}>
              <label style={{fontSize:'12px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Observacao (opcional)</label>
              <textarea value={obsCancelamento} onChange={e => setObsCancelamento(e.target.value)}
                placeholder="Detalhe o motivo se necessario..."
                style={{width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', outline:'none', resize:'none', height:'72px', boxSizing:'border-box', fontFamily:'inherit'}}/>
            </div>
            <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'8px', padding:'10px', marginBottom:'1.25rem', fontSize:'12px', color:'#dc2626', textAlign:'center', fontWeight:'600'}}>Esta acao nao podera ser desfeita facilmente</div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setPopup(null)} style={{flex:1, padding:'12px', background:'#fff', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer'}}>NAO, MANTER</button>
              <button onClick={executarCancelamento} style={{flex:1, padding:'12px', background:'#dc2626', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>SIM, CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)', padding:'0 2rem', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 20px rgba(27,47,126,0.25)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
          <img src="/logo.png" alt="Markinvest" style={{height:'32px', objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
          <div style={{width:'1px', height:'28px', background:'rgba(255,255,255,0.2)'}}></div>
          <div style={{color:'rgba(255,255,255,0.6)', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase'}}>Painel Administrativo</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'20px', padding:'5px 12px', border:'1px solid rgba(255,255,255,0.2)'}}>
            <div style={{width:'22px', height:'22px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#fff', fontWeight:'700'}}>{session?.user?.email?.charAt(0).toUpperCase()}</div>
            <span style={{fontSize:'12px', color:'rgba(255,255,255,0.8)'}}>{session?.user?.email}</span>
          </div>
          <button onClick={() => signOut({callbackUrl:'/admin/login'})} style={{padding:'6px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#fff', fontWeight:'600'}}>SAIR</button>
        </div>
      </div>

      <div style={{background:'#fff', borderBottom:'2px solid #e8ecf5', display:'flex', padding:'0 2rem', gap:'4px', overflowX:'auto'}}>
        {[
          {id:'agendamentos',label:'📋 Agendamentos'},
          {id:'empreendimentos',label:'🏢 Empreendimentos'},
          {id:'cpfs',label:'🔐 CPFs Autorizados'},
          {id:'configuracoes',label:'⚙️ Configuracoes'}
        ].map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)} style={{padding:'14px 20px', background:'none', border:'none', borderBottom:abaAtiva===a.id?'3px solid '+AZUL:'3px solid transparent', fontSize:'13px', fontWeight:'700', cursor:'pointer', color:abaAtiva===a.id?AZUL:'#9ca3af', transition:'all 0.15s', marginBottom:'-2px', whiteSpace:'nowrap'}}>{a.label}</button>
        ))}
      </div>

      <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1.5rem'}}>

        {abaAtiva === 'cpfs' && (
          <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
            <h2 style={{fontSize:'16px', fontWeight:'700', color:AZUL, margin:'0 0 6px'}}>CPFs Autorizados</h2>
            <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px', lineHeight:'1.6'}}>
              Somente CPFs cadastrados aqui conseguem acessar a agenda de vistoria. A URL de acesso e:
              <span style={{display:'block', marginTop:'4px', fontWeight:'600', color:AZUL}}>https://vistoria-agendamento.vercel.app/markinvest/verificar</span>
            </p>

            <div style={{background:'#f8f9ff', border:'1px solid #e0e5f5', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.5rem'}}>
              <p style={{fontSize:'13px', fontWeight:'700', color:AZUL, margin:'0 0 12px'}}>Adicionar CPF autorizado</p>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                <div style={{flex:1, minWidth:'140px'}}>
                  <label style={{fontSize:'11px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>CPF *</label>
                  <input value={novoCpf} onChange={e => {setNovoCpf(mascaraCPF(e.target.value)); setErroCpf('')}} placeholder="000.000.000-00" maxLength={14}
                    style={{width:'100%', padding:'9px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:2, minWidth:'180px'}}>
                  <label style={{fontSize:'11px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Nome (opcional)</label>
                  <input value={nomeNovoCpf} onChange={e => setNomeNovoCpf(e.target.value)} placeholder="Nome do proprietario"
                    style={{width:'100%', padding:'9px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}}/>
                </div>
                <div style={{display:'flex', alignItems:'flex-end'}}>
                  <button onClick={adicionarCpf} disabled={salvandoCpf||!novoCpf.trim()}
                    style={{padding:'9px 20px', background:salvandoCpf||!novoCpf.trim()?'#9ca3af':AZUL, color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:salvandoCpf||!novoCpf.trim()?'not-allowed':'pointer', whiteSpace:'nowrap'}}>
                    {salvandoCpf?'SALVANDO...':'+ ADICIONAR'}
                  </button>
                </div>
              </div>
              {erroCpf && <p style={{color:'#dc2626', fontSize:'12px', margin:'8px 0 0', fontWeight:'600'}}>{erroCpf}</p>}
            </div>

            <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'12px'}}>
              <div style={{flex:1, position:'relative'}}>
                <span style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px'}}>🔍</span>
                <input value={buscaCpf} onChange={e => setBuscaCpf(e.target.value)} placeholder="Buscar por CPF ou nome..."
                  style={{width:'100%', padding:'8px 12px 8px 34px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'13px', outline:'none', background:'#f9fafb', boxSizing:'border-box'}}/>
              </div>
              <span style={{fontSize:'12px', color:'#9ca3af', whiteSpace:'nowrap'}}>{cpfsFiltrados.length} de {cpfsAutorizados.length} CPFs</span>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {cpfsFiltrados.length === 0 && (
                <p style={{color:'#9ca3af', fontSize:'13px', textAlign:'center', padding:'2rem'}}>
                  {cpfsAutorizados.length === 0 ? 'Nenhum CPF cadastrado.' : 'Nenhum resultado encontrado.'}
                </p>
              )}
              {cpfsFiltrados.map(c => (
                <div key={c.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f8f9ff', borderRadius:'10px', border:'1px solid #e0e5f5'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{width:'36px', height:'36px', borderRadius:'10px', background:AZUL, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'14px', fontWeight:'700', flexShrink:0}}>
                      {(c.nome||'?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {c.nome && <div style={{fontSize:'13px', fontWeight:'600', color:AZUL, marginBottom:'2px'}}>{c.nome}</div>}
                      <div style={{fontSize:'13px', color:'#374151', fontFamily:'monospace'}}>{c.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={{fontSize:'10px', padding:'3px 10px', borderRadius:'20px', background:'#dcfce7', color:'#16a34a', fontWeight:'700'}}>AUTORIZADO</span>
                    <button onClick={() => removerCpf(c.cpf)} style={{padding:'5px 14px', background:'none', border:'1px solid #fca5a5', borderRadius:'6px', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600'}}>REMOVER</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'configuracoes' && (
          <div>
            <div style={{display:'flex', gap:'8px', marginBottom:'1.5rem', flexWrap:'wrap'}}>
              {[{id:'meses',label:'🗓 Bloquear Meses'},{id:'horarios',label:'🕐 Gerenciar Horarios'},{id:'dias',label:'📅 Periodos Especiais'}].map(s => (
                <button key={s.id} onClick={() => setSubAbaConfig(s.id)} style={{padding:'10px 20px', borderRadius:'10px', border:subAbaConfig===s.id?'none':'1px solid #e5e7eb', background:subAbaConfig===s.id?AZUL:'#fff', color:subAbaConfig===s.id?'#fff':'#6b7280', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:subAbaConfig===s.id?'0 4px 12px rgba(27,47,126,0.3)':'none', transition:'all 0.15s'}}>{s.label}</button>
              ))}
            </div>

            {subAbaConfig === 'meses' && (
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px', fontWeight:'700', color:AZUL, margin:'0 0 6px'}}>Bloquear / Liberar Meses</h2>
                <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 16px'}}>Meses bloqueados nao permitem novos agendamentos. Clique para alternar.</p>
                <div style={{display:'flex', gap:'16px', marginBottom:'20px', padding:'10px 14px', background:'#f8f9ff', borderRadius:'8px', border:'1px solid #e0e5f5', flexWrap:'wrap'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#f0fdf4', border:'2px solid #1D9E75'}}></div><span style={{fontSize:'12px', fontWeight:'600', color:'#374151'}}>Liberado</span></div>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#fff5f5', border:'2px solid #dc2626'}}></div><span style={{fontSize:'12px', fontWeight:'600', color:'#374151'}}>Bloqueado</span></div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px'}}>
                  {mesesGrid.map(({ key, nomeMes, anoMes, bloqueado }) => (
                    <button key={key} onClick={() => toggleMes(key)} disabled={salvandoMes} style={{padding:'16px 12px', borderRadius:'12px', border:bloqueado?'2px solid #dc2626':'2px solid #1D9E75', background:bloqueado?'#fff5f5':'#f0fdf4', cursor:'pointer', transition:'all 0.2s', textAlign:'center', opacity:salvandoMes?0.7:1}}>
                      <div style={{fontSize:'14px', fontWeight:'700', color:bloqueado?'#dc2626':'#15803d', marginBottom:'2px'}}>{nomeMes}</div>
                      <div style={{fontSize:'11px', color:bloqueado?'#dc2626':'#15803d', marginBottom:'8px', opacity:0.7}}>{anoMes}</div>
                      <div style={{display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', borderRadius:'20px', background:bloqueado?'#dc2626':'#1D9E75', color:'#fff', fontSize:'10px', fontWeight:'700'}}>{bloqueado ? '🔒 BLOQUEADO' : '✓ LIBERADO'}</div>
                    </button>
                  ))}
                </div>
                {mesesBloqueados.length > 0 && (
                  <div style={{marginTop:'16px', padding:'12px 16px', background:'#fff8e1', border:'1px solid #fde68a', borderRadius:'8px'}}>
                    <p style={{fontSize:'12px', color:'#92400e', margin:0, fontWeight:'600'}}>⚠ {mesesBloqueados.length} mes(es) bloqueado(s).</p>
                  </div>
                )}
              </div>
            )}

            {subAbaConfig === 'horarios' && (
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px', fontWeight:'700', color:AZUL, margin:'0 0 6px'}}>Gerenciar Horarios</h2>
                <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 16px'}}>Ative ou desative horarios. Horarios inativos nao aparecem para os clientes.</p>
                <div style={{background:'#f0f7ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'10px 14px', marginBottom:'20px'}}>
                  <p style={{fontSize:'12px', color:'#1d4ed8', margin:0, fontWeight:'600'}}>{horariosAtivos} de {horariosConfig.length} horarios ativos</p>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px'}}>
                  {horariosConfig.map(h => (
                    <button key={h.horario} onClick={() => toggleHorario(h.horario, h.ativo)} disabled={salvandoHorario}
                      style={{padding:'16px 10px', borderRadius:'12px', border:h.ativo?'2px solid #1D9E75':'2px solid #e5e7eb', background:h.ativo?'#f0fdf4':'#f9fafb', cursor:'pointer', textAlign:'center', transition:'all 0.2s', opacity:salvandoHorario?0.7:1}}>
                      <div style={{fontSize:'20px', fontWeight:'800', color:h.ativo?VERDE:'#d1d5db', marginBottom:'6px'}}>{h.horario}</div>
                      <div style={{display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', borderRadius:'20px', background:h.ativo?VERDE:'#e5e7eb', color:h.ativo?'#fff':'#9ca3af', fontSize:'10px', fontWeight:'700'}}>{h.ativo ? '✓ ATIVO' : '× INATIVO'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {subAbaConfig === 'dias' && (
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px', fontWeight:'700', color:AZUL, margin:'0 0 6px'}}>Periodos Especiais</h2>
                <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px'}}>Libere ou bloqueie periodos especificos, independente da configuracao do mes.</p>
                <div style={{background:'#f8f9ff', border:'1px solid #e0e5f5', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'13px', fontWeight:'700', color:AZUL, margin:'0 0 12px'}}>Adicionar novo periodo</p>
                  <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end'}}>
                    <div>
                      <label style={{fontSize:'11px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Data inicio</label>
                      <input type="date" value={dataInicioEspecial} onChange={e => setDataInicioEspecial(e.target.value)} style={{padding:'8px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:'11px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Data fim</label>
                      <input type="date" value={dataFimEspecial} onChange={e => setDataFimEspecial(e.target.value)} style={{padding:'8px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'13px', outline:'none'}}/>
                    </div>
                    <div style={{flex:1, minWidth:'160px'}}>
                      <label style={{fontSize:'11px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Observacao (opcional)</label>
                      <input value={obsEspecial} onChange={e => setObsEspecial(e.target.value)} placeholder="Ex: Feriado, recesso..." style={{width:'100%', padding:'8px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'13px', outline:'none', boxSizing:'border-box'}}/>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button onClick={() => adicionarDiaEspecial('liberado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia}
                        style={{padding:'8px 16px', background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERDE, color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:!dataInicioEspecial||!dataFimEspecial?'not-allowed':'pointer', whiteSpace:'nowrap'}}>✓ LIBERAR</button>
                      <button onClick={() => adicionarDiaEspecial('bloqueado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia}
                        style={{padding:'8px 16px', background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERMELHO, color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:!dataInicioEspecial||!dataFimEspecial?'not-allowed':'pointer', whiteSpace:'nowrap'}}>🔒 BLOQUEAR</button>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {diasEspeciais.length === 0 && <p style={{color:'#9ca3af', fontSize:'13px', textAlign:'center', padding:'2rem'}}>Nenhum periodo especial cadastrado.</p>}
                  {diasEspeciais.map((d) => (
                    <div key={d.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:d.tipo==='liberado'?'#f0fdf4':'#fff5f5', borderRadius:'10px', border:d.tipo==='liberado'?'1px solid #86efac':'1px solid #fca5a5'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{width:'36px', height:'36px', borderRadius:'10px', background:d.tipo==='liberado'?VERDE:VERMELHO, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#fff', fontWeight:'700', flexShrink:0}}>{d.tipo==='liberado'?'✓':'🔒'}</div>
                        <div>
                          <div style={{fontSize:'14px', fontWeight:'700', color:d.tipo==='liberado'?VERDE:VERMELHO}}>
                            {new Date(d.data_inicio+'T12:00:00').toLocaleDateString('pt-BR')} ate {new Date(d.data_fim+'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div style={{fontSize:'12px', color:'#6b7280'}}>{d.tipo==='liberado'?'Periodo liberado':'Periodo bloqueado'}{d.observacao && ' — ' + d.observacao}</div>
                        </div>
                      </div>
                      <button onClick={() => removerDiaEspecial(d.id)} style={{padding:'6px 14px', background:'none', border:'1px solid #fca5a5', borderRadius:'8px', fontSize:'12px', color:VERMELHO, cursor:'pointer', fontWeight:'600', flexShrink:0}}>REMOVER</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'empreendimentos' && (
          <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
            <h2 style={{fontSize:'16px', fontWeight:'700', color:AZUL, margin:'0 0 8px'}}>Gerenciar Empreendimentos</h2>
            <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px'}}>Os empreendimentos cadastrados aparecerao na lista suspensa para os clientes.</p>
            <div style={{display:'flex', gap:'10px', marginBottom:'12px'}}>
              <input value={novoEmp} onChange={e => setNovoEmp(e.target.value)} onKeyDown={e => e.key==='Enter' && adicionarEmpreendimento()} placeholder="Nome do novo empreendimento" style={{flex:1, padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'10px', fontSize:'14px', outline:'none'}}/>
              <button onClick={adicionarEmpreendimento} disabled={salvandoEmp||!novoEmp.trim()} style={{padding:'10px 20px', background:salvandoEmp||!novoEmp.trim()?'#9ca3af':AZUL, color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:salvandoEmp||!novoEmp.trim()?'not-allowed':'pointer', whiteSpace:'nowrap'}}>
                {salvandoEmp?'SALVANDO...':'+ ADICIONAR'}
              </button>
            </div>
            {erroEmp && <p style={{color:'#dc2626', fontSize:'13px', margin:'0 0 12px', fontWeight:'600'}}>{erroEmp}</p>}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {empreendimentos.map(emp => (
                <div key={emp} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f8f9ff', borderRadius:'10px', border:'1px solid #e0e5f5'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:AZUL, flexShrink:0}}></div>
                    <span style={{fontSize:'14px', fontWeight:'600', color:AZUL}}>{emp}</span>
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
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'1.5rem'}}>
              {[{label:'TOTAL',val:agendamentos.length,cor:AZUL,icon:'📅',bg:'#eff3ff'},{label:'CONFIRMADOS',val:totalConf,cor:VERDE,icon:'✅',bg:'#f0fdf4'},{label:'CANCELADOS',val:totalCanc,cor:VERMELHO,icon:'❌',bg:'#fff5f5'}].map(c => (
                <div key={c.label} style={{background:'#fff', borderRadius:'16px', padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)', borderLeft:'4px solid '+c.cor, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div>
                    <p style={{fontSize:'10px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px'}}>{c.label}</p>
                    <p style={{fontSize:'32px', fontWeight:'800', color:c.cor, margin:0, lineHeight:1}}>{c.val}</p>
                  </div>
                  <div style={{width:'48px', height:'48px', background:c.bg, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>{c.icon}</div>
                </div>
              ))}
            </div>

            <div style={{background:'#fff', borderRadius:'16px', padding:'1rem 1.25rem', marginBottom:'1rem', boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}}>
                <div style={{display:'flex', gap:'4px', background:'#f4f6fb', borderRadius:'10px', padding:'4px'}}>
                  {['todos','confirmado','cancelado'].map(f => (
                    <button key={f} onClick={() => setFiltro(f)} style={{padding:'6px 16px', borderRadius:'8px', border:'none', background:filtro===f?(f==='cancelado'?VERMELHO:f==='confirmado'?VERDE:AZUL):'transparent', color:filtro===f?'#fff':'#9ca3af', fontSize:'12px', fontWeight:'700', cursor:'pointer', textTransform:'uppercase', transition:'all 0.15s'}}>{f}</button>
                  ))}
                </div>
                <div style={{flex:1, position:'relative', minWidth:'180px'}}>
                  <span style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px'}}>🔍</span>
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, email, CPF, apartamento..." style={{width:'100%', padding:'8px 12px 8px 34px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'13px', outline:'none', background:'#f9fafb', boxSizing:'border-box'}}/>
                </div>
                <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'13px', outline:'none', background:'#f9fafb', cursor:'pointer'}}>
                  <option value="mais-antigo">Mais antigo primeiro</option>
                  <option value="mais-novo">Mais novo primeiro</option>
                </select>
              </div>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}}>
                <span style={{fontSize:'12px', fontWeight:'600', color:'#6b7280'}}>Filtrar por data:</span>
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
                <button onClick={exportarCSV} style={{padding:'8px 18px', background:AZUL, color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'700', cursor:'pointer'}}>⬇ EXPORTAR CSV</button>
                <button onClick={gerarPDF} disabled={gerandoPDF} style={{padding:'8px 18px', background:gerandoPDF?'#9ca3af':'#C0392B', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'700', cursor:gerandoPDF?'not-allowed':'pointer'}}>📄 {gerandoPDF?'GERANDO...':'EXPORTAR PDF'}</button>
              </div>
            </div>

            {paginados.length === 0 ? (
              <div style={{textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'14px', background:'#fff', borderRadius:'16px'}}>Nenhum agendamento encontrado</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {paginados.map(a => {
                  const cancelado = a.status==='cancelado'
                  const partes = (a.apartamento||'').split(' - ')
                  const empreend = partes[0]||''
                  const unidade = partes.slice(1).join(' - ')||''
                  const criadoEm = a.criado_em ? new Date(a.criado_em) : null
                  return (
                    <div key={a.id} style={{background:cancelado?'#fff8f8':'#fff', borderRadius:'14px', padding:'1rem 1.25rem', boxShadow:'0 2px 12px rgba(27,47,126,0.06)', border:cancelado?'1px solid #fecaca':'1px solid #e8ecf5', display:'flex', alignItems:'center', gap:'1rem', position:'relative', overflow:'hidden'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:'5px', background:cancelado?'linear-gradient(180deg,#ef4444,#dc2626)':'linear-gradient(180deg,#1D9E75,#16a34a)', borderRadius:'14px 0 0 14px'}}></div>
                      <div style={{width:'44px', height:'44px', borderRadius:'12px', background:cancelado?'#fee2e2':'#eff3ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:cancelado?VERMELHO:AZUL, flexShrink:0, marginLeft:'8px'}}>
                        {(a.nome||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap'}}>
                          <span style={{fontSize:'14px', fontWeight:'700', color:cancelado?'#9ca3af':'#111', textDecoration:cancelado?'line-through':'none'}}>{a.nome}</span>
                          <span style={{fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:cancelado?'#fee2e2':'#dcfce7', color:cancelado?VERMELHO:'#16a34a', fontWeight:'700', textTransform:'uppercase'}}>{a.status}</span>
                        </div>
                        <div style={{fontSize:'12px', color:cancelado?'#d1d5db':'#6b7280', marginBottom:'4px'}}>
                          <span style={{fontWeight:'600', color:cancelado?'#d1d5db':AZUL}}>{empreend}</span>
                          {unidade && <span> · {unidade}</span>}
                        </div>
                        <div style={{display:'flex', gap:'12px', fontSize:'11px', color:'#9ca3af', flexWrap:'wrap'}}>
                          <span>✉ {a.email}</span>
                          <span>📱 {a.telefone}</span>
                          {a.cpf && <span>🪪 {a.cpf}</span>}
                          {a.nome_acompanhante && <span>👤 {a.nome_acompanhante}</span>}
                        </div>
                        {cancelado && a.motivo_cancelamento && (
                          <div style={{marginTop:'6px', background:'#fff5f5', borderRadius:'6px', padding:'5px 10px', borderLeft:'2px solid #dc2626', display:'inline-block'}}>
                            <span style={{fontSize:'11px', color:'#dc2626', fontWeight:'600'}}>Motivo: </span>
                            <span style={{fontSize:'11px', color:'#9ca3af'}}>{a.motivo_cancelamento}</span>
                            {a.obs_cancelamento && <span style={{fontSize:'11px', color:'#9ca3af'}}> — {a.obs_cancelamento}</span>}
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:'center', flexShrink:0, background:cancelado?'#fff5f5':'#f0f7ff', borderRadius:'12px', padding:'10px 16px', border:cancelado?'1px solid #fecaca':'1px solid #bfdbfe'}}>
                        <div style={{fontSize:'18px', fontWeight:'800', color:cancelado?'#d1d5db':AZUL, lineHeight:1}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                        <div style={{fontSize:'10px', color:'#9ca3af', marginTop:'2px'}}>{new Date(a.data+'T12:00:00').getFullYear()}</div>
                        <div style={{fontSize:'13px', fontWeight:'700', color:cancelado?'#d1d5db':'#1d4ed8', marginTop:'4px'}}>{a.horario?.slice(0,5)}</div>
                      </div>
                      <div style={{flexShrink:0, textAlign:'right'}}>
                        {criadoEm && (
                          <div style={{fontSize:'10px', color:'#c4c9d9', marginBottom:'8px', whiteSpace:'nowrap'}}>
                            Agendado em<br/>
                            <span style={{fontWeight:'600', color:'#b0b8d0'}}>{criadoEm.toLocaleDateString('pt-BR')} {criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        )}
                        {!cancelado
                          ? <button onClick={() => confirmarCancelamento(a)} style={{padding:'6px 14px', background:'#fff0f0', border:'1px solid #fca5a5', borderRadius:'8px', fontSize:'11px', fontWeight:'700', color:VERMELHO, cursor:'pointer'}}>CANCELAR</button>
                          : <button onClick={() => atualizarStatus(a.id,'confirmado')} style={{padding:'6px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', fontSize:'11px', fontWeight:'700', color:VERDE, cursor:'pointer'}}>REATIVAR</button>
                        }
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
                  <button key={p} onClick={() => setPagina(p)} style={{width:'36px', height:'36px', borderRadius:'8px', border:pagina===p?'none':'1px solid #e5e7eb', background:pagina===p?AZUL:'#fff', color:pagina===p?'#fff':'#374151', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>{p}</button>
                ))}
                <button onClick={() => setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} style={{padding:'6px 14px', background:pagina===totalPaginas?'#f3f4f6':'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:pagina===totalPaginas?'not-allowed':'pointer', color:pagina===totalPaginas?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
              </div>
            )}

            <p style={{textAlign:'center', fontSize:'12px', color:'#9ca3af', marginTop:'1rem'}}>
              Mostrando {filtrados.length===0?0:((pagina-1)*POR_PAGINA)+1} - {Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length} agendamentos
            </p>
            <p style={{textAlign:'center', fontSize:'11px', color:'#d1d5db', marginTop:'6px', marginBottom:'1rem'}}>
              © 2026 Markinvest. Todos os direitos reservados.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
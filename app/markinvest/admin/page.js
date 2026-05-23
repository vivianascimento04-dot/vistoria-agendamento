'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const POR_PAGINA = 10
const POR_PAGINA_CPF = 10
const POR_PAGINA_REAG = 5
const MESES_NOMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const AZUL = '#1B2F7E'
const VERDE = '#1D9E75'
const VERMELHO = '#dc2626'
const HORARIOS_DISPONIVEIS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
const EMP_CORES = ['#1B2F7E','#6366f1','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777']
const MOTIVOS = ['Selecione o motivo','Cliente solicitou cancelamento','Revistoria necessaria','Imovel indisponivel','Ausencia do cliente','Outro']

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
  const [filtroEmp, setFiltroEmp] = useState('')
  const [popup, setPopup] = useState(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [obsCancelamento, setObsCancelamento] = useState('')
  const [erroMotivo, setErroMotivo] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [paginaCpf, setPaginaCpf] = useState(1)
  const [ordem, setOrdem] = useState('mais-antigo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [gerandoPDFRev, setGerandoPDFRev] = useState(false)
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
  const [horariosBloqueadosData, setHorariosBloqueadosData] = useState([])
  const [novaDataBloqueio, setNovaDataBloqueio] = useState('')
  const [novoUltimoHorario, setNovoUltimoHorario] = useState('')
  const [novoEmpBloqueio, setNovoEmpBloqueio] = useState('todos')
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false)
  const [cpfsAutorizados, setCpfsAutorizados] = useState([])
  const [novoCpf, setNovoCpf] = useState('')
  const [nomeNovoCpf, setNomeNovoCpf] = useState('')
  const [salvandoCpf, setSalvandoCpf] = useState(false)
  const [erroCpf, setErroCpf] = useState('')
  const [buscaCpf, setBuscaCpf] = useState('')
  const [cpfsSelecionados, setCpfsSelecionados] = useState([])
  const [cpfDatas, setCpfDatas] = useState({})
  const [novaDataCpf, setNovaDataCpf] = useState({})
  const [editandoCpf, setEditandoCpf] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [horarioSelecionado, setHorarioSelecionado] = useState({})
  const [revEmp, setRevEmp] = useState('')
  const [revData, setRevData] = useState('')
  const [revHorario, setRevHorario] = useState('')
  const [revUnidades, setRevUnidades] = useState([{unidade:'', nome:''}])
  const [salvandoRev, setSalvandoRev] = useState(false)
  const [erroRev, setErroRev] = useState('')
  const [revistorias, setRevistorias] = useState([])
  const [filtroRevEmp, setFiltroRevEmp] = useState('')
  const [paginaRev, setPaginaRev] = useState(1)
  const [visualizacaoRev, setVisualizacaoRev] = useState('agenda')
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [anoRev, setAnoRev] = useState(new Date().getFullYear())
  const [mesRev, setMesRev] = useState(new Date().getMonth())

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status])
  useEffect(() => {
    if (status === 'authenticated') {
      buscarAgendamentos(); buscarEmpreendimentos(); buscarMesesBloqueados()
      buscarHorariosConfig(); buscarDiasEspeciais(); buscarHorariosBloqueadosData(); buscarCpfsAutorizados()
    }
  }, [status])
  useEffect(() => { setPagina(1) }, [filtro, busca, ordem, dataInicio, dataFim, filtroEmp])
  useEffect(() => { setPaginaCpf(1) }, [buscaCpf])
  useEffect(() => { if (abaAtiva === 'revistorias') buscarRevistorias() }, [abaAtiva])

  async function buscarAgendamentos() {
    try { const res = await fetch('/api/agendamentos'); const data = await res.json(); setAgendamentos(Array.isArray(data)?data:[]) } catch(e) { setAgendamentos([]) }
    setLoading(false)
  }

  async function buscarRevistorias() {
    try {
      const res = await fetch('/api/agendamentos'); const data = await res.json()
      setRevistorias((Array.isArray(data)?data:[]).filter(a => a.tipo==='revistoria'))
    } catch(e) { setRevistorias([]) }
  }

  async function salvarRevistoria() {
    if (!revEmp||!revData||!revHorario) { setErroRev('Preencha empreendimento, data e horario.'); return }
    const unidadesValidas = revUnidades.filter(u => u.unidade.trim()&&u.nome.trim())
    if (unidadesValidas.length===0) { setErroRev('Adicione pelo menos uma unidade com nome.'); return }
    setSalvandoRev(true); setErroRev('')
    try {
      for (const u of unidadesValidas) {
        await fetch('/api/agendamentos', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ nome:u.nome, cpf:'000.000.000-00', email:'revistoria@markinvest.com.br', telefone:'(00) 00000-0000',
            apartamento: revEmp+' - '+u.unidade, data:revData, horario:revHorario,
            nome_acompanhante:'-', cpf_acompanhante:'000.000.000-00', tipo:'revistoria' }) })
      }
      setRevEmp(''); setRevData(''); setRevHorario(''); setRevUnidades([{unidade:'',nome:''}])
      buscarRevistorias(); buscarAgendamentos()
    } catch(e) { setErroRev('Erro ao salvar. Tente novamente.') }
    setSalvandoRev(false)
  }

  async function removerRevistoria(id) {
    if (!confirm('Remover esta revistoria?')) return
    try {
      await fetch('/api/agendamentos/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'cancelado', motivo_cancelamento:'Removido pelo admin'}) })
      buscarRevistorias(); buscarAgendamentos()
    } catch(e) {}
  }

  function adicionarLinhaUnidade() { setRevUnidades(prev => [...prev, {unidade:'',nome:''}]) }
  function removerLinhaUnidade(i) { setRevUnidades(prev => prev.filter((_,idx) => idx!==i)) }
  function atualizarUnidade(i, campo, valor) { setRevUnidades(prev => prev.map((u,idx) => idx===i?{...u,[campo]:valor}:u)) }

  function exportarCSVRevistorias() {
    const cab = ['Nome','Unidade','Empreendimento','Data','Horario','Status','Criado Em']
    const linhas = revFiltradas.map(r => {
      const partes = (r.apartamento||'').split(' - ')
      const emp = partes[0]||''
      const unidade = partes.slice(1).join(' - ')||''
      return [r.nome, unidade, emp, new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'), (r.horario||'').slice(0,5), r.status, r.criado_em?new Date(r.criado_em).toLocaleString('pt-BR'):'']
    })
    const csv = [cab,...linhas].map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const link = document.createElement('a')
    link.href = url; link.download = 'revistorias-'+new Date().toISOString().split('T')[0]+'.csv'; link.click(); URL.revokeObjectURL(url)
  }

  async function gerarPDFRevistorias() {
    setGerandoPDFRev(true)
    try {
      const script = document.createElement('script'); script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(script)
      await new Promise((res,rej)=>{script.onload=res;script.onerror=rej})
      const {jsPDF} = window.jspdf
      const doc = new jsPDF({orientation:'landscape',unit:'mm',format:'a4'})
      const W=297, M=12; let y=0
      doc.setFillColor(27,47,126); doc.rect(0,0,W,32,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('MARKINVEST',W/2,13,{align:'center'})
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text('Relatorio de Revistorias',W/2,21,{align:'center'})
      doc.setFontSize(7.5); doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W/2,28,{align:'center'}); y=38
      doc.setFillColor(240,243,250); doc.rect(M,y-4,W-M*2,10,'F')
      doc.setTextColor(60,60,100); doc.setFontSize(7.5); doc.setFont('helvetica','italic')
      let ftxt = 'Total: '+revFiltradas.length+' revistoria(s)'
      if (filtroRevEmp) ftxt += ' | Empreendimento: '+filtroRevEmp
      doc.text(ftxt,M+3,y+2); y+=12
      const cols = [{x:M,label:'NOME'},{x:M+50,label:'UNIDADE'},{x:M+100,label:'EMPREENDIMENTO'},{x:M+160,label:'DATA'},{x:M+185,label:'HORA'},{x:M+200,label:'STATUS'},{x:M+220,label:'CRIADO EM'}]
      doc.setFillColor(27,47,126); doc.rect(M,y,W-M*2,8,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
      cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5)); y+=9; doc.setFont('helvetica','normal')
      revFiltradas.forEach((r,idx)=>{
        if(y>185){doc.addPage();y=15;doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')}
        const rowH=8; if(idx%2===0){doc.setFillColor(247,249,255);doc.rect(M,y,W-M*2,rowH,'F')}
        doc.setDrawColor(220,225,240); doc.line(M,y+rowH,W-M,y+rowH); doc.setFontSize(7.5)
        const partes=(r.apartamento||'').split(' - '); const emp=partes[0]||''; const unidade=partes.slice(1).join(' - ')||r.apartamento||''
        doc.setTextColor(30,30,30); doc.setFont('helvetica','bold'); doc.text((r.nome||'').slice(0,22),cols[0].x+1,y+5.5)
        doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60); doc.text(unidade.slice(0,24),cols[1].x+1,y+5.5)
        doc.setTextColor(27,47,126); doc.text(emp.slice(0,24),cols[2].x+1,y+5.5)
        doc.setTextColor(27,47,126); doc.setFont('helvetica','bold'); doc.text(new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'),cols[3].x+1,y+5.5)
        doc.text((r.horario||'').slice(0,5),cols[4].x+1,y+5.5)
        const cancelado=r.status==='cancelado'
        if(cancelado){doc.setFillColor(254,226,226);doc.rect(cols[5].x,y+1.5,18,5.5,'F');doc.setTextColor(180,30,30)}else{doc.setFillColor(220,252,231);doc.rect(cols[5].x,y+1.5,18,5.5,'F');doc.setTextColor(22,101,52)}
        doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.text(cancelado?'CANCEL.':'CONF.',cols[5].x+1,y+5.5)
        const criadoEm=r.criado_em?new Date(r.criado_em):null
        if(criadoEm){doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);doc.text(criadoEm.toLocaleDateString('pt-BR')+' '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),cols[6].x+1,y+5.5)}
        y+=rowH
      })
      const total=doc.getNumberOfPages()
      for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(27,47,126);doc.rect(0,200,W,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo',W/2,204.5,{align:'center'});doc.text('Pagina '+i+' de '+total,W-M,204.5,{align:'right'})}
      doc.save('revistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e) { console.error(e); alert('Erro ao gerar PDF.') }
    setGerandoPDFRev(false)
  }

  async function buscarEmpreendimentos() {
    try { const res = await fetch('/api/empreendimentos'); const data = await res.json(); setEmpreendimentos(Array.isArray(data)?data:[]) } catch(e) {}
  }
  async function buscarMesesBloqueados() {
    try { const res = await fetch('/api/meses-bloqueados'); const data = await res.json(); setMesesBloqueados(Array.isArray(data)?data:[]) } catch(e) {}
  }
  async function buscarHorariosConfig() {
    try { const res = await fetch('/api/horarios-config'); const data = await res.json(); setHorariosConfig(Array.isArray(data)?data:[]) } catch(e) {}
  }
  async function buscarDiasEspeciais() {
    try { const res = await fetch('/api/dias-especiais'); const data = await res.json(); setDiasEspeciais(Array.isArray(data)?data:[]) } catch(e) {}
  }
  async function buscarHorariosBloqueadosData() {
    try { const res = await fetch('/api/horarios-bloqueados-data'); const data = await res.json(); setHorariosBloqueadosData(Array.isArray(data)?data:[]) } catch(e) {}
  }
  async function salvarBloqueioData() {
    if (!novaDataBloqueio||!novoUltimoHorario) return; setSalvandoBloqueio(true)
    try { await fetch('/api/horarios-bloqueados-data', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({data:novaDataBloqueio,ultimo_horario:novoUltimoHorario,empreendimento:novoEmpBloqueio||'todos'}) }); setNovaDataBloqueio(''); setNovoUltimoHorario(''); setNovoEmpBloqueio('todos'); buscarHorariosBloqueadosData() } catch(e) {}
    setSalvandoBloqueio(false)
  }
  async function removerBloqueioData(id) {
    try { await fetch('/api/horarios-bloqueados-data', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); buscarHorariosBloqueadosData() } catch(e) {}
  }
  async function buscarCpfsAutorizados() {
    try {
      const res = await fetch('/api/cpfs-autorizados'); const data = await res.json(); setCpfsAutorizados(Array.isArray(data)?data:[])
      const resDatas = await fetch('/api/cpf-datas'); const datas = await resDatas.json()
      const porCpf = {}
      if (Array.isArray(datas)) datas.forEach(d => { if (!porCpf[d.cpf]) porCpf[d.cpf]=[]; porCpf[d.cpf].push({data:d.data, horarios:d.horarios||[]}) })
      setCpfDatas(porCpf)
    } catch(e) {}
  }
  async function adicionarDataCpf(cpf) {
    const data = novaDataCpf[cpf]; if (!data) return
    try { await fetch('/api/cpf-datas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,data}) }); setNovaDataCpf(prev=>({...prev,[cpf]:''})); buscarCpfsAutorizados() } catch(e) {}
  }
  async function removerDataCpf(cpf, data) {
    try { await fetch('/api/cpf-datas', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,data}) }); buscarCpfsAutorizados() } catch(e) {}
  }
  async function adicionarHorarioCpf(cpf, data, horarioInicio, horarioFim) {
    if (!horarioInicio) return
    const entrada = cpfDatas[cpf]?.find(d=>d.data===data); const horariosAtuais = entrada?.horarios||[]
    const idxInicio = HORARIOS_DISPONIVEIS.indexOf(horarioInicio); const idxFim = horarioFim?HORARIOS_DISPONIVEIS.indexOf(horarioFim):idxInicio
    const novosHorarios = [...new Set([...horariosAtuais,...HORARIOS_DISPONIVEIS.slice(idxInicio,idxFim+1)])].sort()
    try { await fetch('/api/cpf-datas', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,data,horarios:novosHorarios}) }); setHorarioSelecionado(prev=>({...prev,[cpf+'_'+data]:'',[cpf+'_'+data+'_fim']:''})); buscarCpfsAutorizados() } catch(e) {}
  }
  async function removerHorarioCpf(cpf, data, horario) {
    const entrada = cpfDatas[cpf]?.find(d=>d.data===data)
    try { await fetch('/api/cpf-datas', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,data,horarios:(entrada?.horarios||[]).filter(h=>h!==horario)}) }); buscarCpfsAutorizados() } catch(e) {}
  }
  async function salvarEdicaoCpf() {
    if (!editandoCpf) return; setSalvandoEdicao(true)
    try { await fetch('/api/cpfs-autorizados', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf:editandoCpf,nome:nomeEditando}) }); setEditandoCpf(null); setNomeEditando(''); buscarCpfsAutorizados() } catch(e) {}
    setSalvandoEdicao(false)
  }
  async function adicionarCpf() {
    if (!novoCpf.trim()) return; setSalvandoCpf(true); setErroCpf('')
    try {
      const res = await fetch('/api/cpfs-autorizados', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf:novoCpf,nome:nomeNovoCpf}) })
      if (res.ok) { setNovoCpf(''); setNomeNovoCpf(''); buscarCpfsAutorizados() } else { const d=await res.json(); setErroCpf(d.error||'Erro ao salvar.') }
    } catch(e) { setErroCpf('Erro de conexao.') }
    setSalvandoCpf(false)
  }
  async function removerCpf(cpf) {
    if (!confirm('Remover CPF '+cpf+'?')) return
    try { await fetch('/api/cpfs-autorizados', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf}) }); await fetch('/api/cpf-datas', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,todos_cpf:true}) }); buscarCpfsAutorizados() } catch(e) {}
  }
  async function removerCpfsSelecionados() {
    if (!cpfsSelecionados.length) return; if (!confirm('Remover '+cpfsSelecionados.length+' CPF(s)?')) return
    try {
      await fetch('/api/cpfs-autorizados', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpfs:cpfsSelecionados}) })
      for (const cpf of cpfsSelecionados) await fetch('/api/cpf-datas', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,todos_cpf:true}) })
      setCpfsSelecionados([]); buscarCpfsAutorizados()
    } catch(e) {}
  }
  async function removerTodosCpfs() {
    if (!confirm('Remover TODOS os CPFs?')) return
    try { await fetch('/api/cpfs-autorizados', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({todos:true}) }); setCpfsSelecionados([]); buscarCpfsAutorizados() } catch(e) {}
  }
  async function toggleMes(anoMes) {
    setSalvandoMes(true)
    try { const bloqueado=mesesBloqueados.includes(anoMes); await fetch('/api/meses-bloqueados', { method:bloqueado?'DELETE':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ano_mes:anoMes}) }); buscarMesesBloqueados() } catch(e) {}
    setSalvandoMes(false)
  }
  async function toggleHorario(horario, ativo) {
    setSalvandoHorario(true)
    try { await fetch('/api/horarios-config', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({horario,ativo:!ativo}) }); buscarHorariosConfig() } catch(e) {}
    setSalvandoHorario(false)
  }
  async function adicionarDiaEspecial(tipo) {
    if (!dataInicioEspecial||!dataFimEspecial) return; setSalvandoDia(true)
    try { await fetch('/api/dias-especiais', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({data_inicio:dataInicioEspecial,data_fim:dataFimEspecial,tipo,observacao:obsEspecial}) }); setDataInicioEspecial(''); setDataFimEspecial(''); setObsEspecial(''); buscarDiasEspeciais() } catch(e) {}
    setSalvandoDia(false)
  }
  async function removerDiaEspecial(id) {
    try { await fetch('/api/dias-especiais', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); buscarDiasEspeciais() } catch(e) {}
  }
  async function adicionarEmpreendimento() {
    if (!novoEmp.trim()) return; setSalvandoEmp(true); setErroEmp('')
    try {
      const res = await fetch('/api/empreendimentos', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome:novoEmp.trim()}) })
      if (res.ok) { setNovoEmp(''); buscarEmpreendimentos() } else { const d=await res.json(); setErroEmp(d.error||'Erro ao salvar.') }
    } catch(e) { setErroEmp('Erro de conexao.') }
    setSalvandoEmp(false)
  }
  async function removerEmpreendimento(nome) {
    if (!confirm('Remover "'+nome+'"?')) return
    try { await fetch('/api/empreendimentos', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome}) }); buscarEmpreendimentos() } catch(e) {}
  }
  function confirmarCancelamento(a) { setPopup(a); setMotivoCancelamento(''); setObsCancelamento(''); setErroMotivo(false) }
  async function executarCancelamento() {
    if (!popup) return; if (!motivoCancelamento||motivoCancelamento==='Selecione o motivo') { setErroMotivo(true); return }
    try { const res=await fetch('/api/agendamentos/'+popup.id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'cancelado',motivo_cancelamento:motivoCancelamento,obs_cancelamento:obsCancelamento}) }); if(res.ok) buscarAgendamentos(); else alert('Erro ao cancelar.') } catch(e) { alert('Erro de conexao.') }
    setPopup(null)
  }
  async function atualizarStatus(id, novoStatus) {
    try { const res=await fetch('/api/agendamentos/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:novoStatus}) }); if(res.ok) buscarAgendamentos(); else alert('Erro ao atualizar.') } catch(e) { alert('Erro de conexao.') }
  }
  function exportarCSV() {
    const cab=['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Motivo Cancelamento','Obs Cancelamento','Criado Em','Acompanhante','CPF Acompanhante']
    const linhas=filtrados.map(a=>[a.nome,a.cpf||'',a.email,a.telefone,a.apartamento,new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),a.horario?.slice(0,5),a.status,a.motivo_cancelamento||'',a.obs_cancelamento||'',a.criado_em?new Date(a.criado_em).toLocaleString('pt-BR'):'',a.nome_acompanhante||'',a.cpf_acompanhante||''])
    const csv=[cab,...linhas].map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='relatorio-'+new Date().toISOString().split('T')[0]+'.csv'; link.click(); URL.revokeObjectURL(url)
  }
  async function gerarPDF() {
    setGerandoPDF(true)
    try {
      const script=document.createElement('script'); script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(script)
      await new Promise((res,rej)=>{script.onload=res;script.onerror=rej})
      const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const W=297,M=12; let y=0
      doc.setFillColor(27,47,126); doc.rect(0,0,W,32,'F'); doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('MARKINVEST',W/2,13,{align:'center'}); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text('Relatorio de Agendamentos de Vistoria',W/2,21,{align:'center'}); doc.setFontSize(7.5); doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W/2,28,{align:'center'}); y=38
      doc.setFillColor(240,243,250); doc.rect(M,y-4,W-M*2,10,'F'); doc.setTextColor(60,60,100); doc.setFontSize(7.5); doc.setFont('helvetica','italic')
      let ftxt='Filtros: Status = '+(filtro==='todos'?'Todos':filtro); if(filtroEmp) ftxt+=' | Empreendimento: '+filtroEmp; if(dataInicio) ftxt+=' | De: '+new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR'); if(dataFim) ftxt+=' | Ate: '+new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR'); ftxt+=' | Total: '+filtrados.length+' registro(s)'; doc.text(ftxt,M+3,y+2); y+=12
      const cols=[{x:M,label:'NOME'},{x:M+34,label:'EMPREENDIMENTO'},{x:M+62,label:'UNIDADE'},{x:M+118,label:'DATA'},{x:M+138,label:'HORA'},{x:M+150,label:'TELEFONE'},{x:M+176,label:'AGENDADO EM'},{x:M+206,label:'STATUS'},{x:M+222,label:'MOTIVO'}]
      doc.setFillColor(27,47,126); doc.rect(M,y,W-M*2,8,'F'); doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold'); cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5)); y+=9; doc.setFont('helvetica','normal')
      filtrados.forEach((a,idx)=>{
        if(y>185){doc.addPage();y=15;doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')}
        const rowH=8; if(idx%2===0){doc.setFillColor(247,249,255);doc.rect(M,y,W-M*2,rowH,'F')}; doc.setDrawColor(220,225,240); doc.line(M,y+rowH,W-M,y+rowH); doc.setFontSize(7.5); doc.setTextColor(30,30,30); doc.setFont('helvetica','bold'); doc.text((a.nome||'').slice(0,17),cols[0].x+1,y+5.5)
        const aptoStr=a.apartamento||''; const partes=aptoStr.split(' - '); doc.setFont('helvetica','normal'); doc.setTextColor(27,47,126); doc.text((partes[0]||'').slice(0,15),cols[1].x+1,y+5.5); doc.setTextColor(60,60,60); doc.text((partes.slice(1).join(' - ')||aptoStr).slice(0,42),cols[2].x+1,y+5.5); doc.setTextColor(27,47,126); doc.setFont('helvetica','bold'); doc.text(new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),cols[3].x+1,y+5.5); doc.text((a.horario||'').slice(0,5),cols[4].x+1,y+5.5); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80); doc.text((a.telefone||'').slice(0,14),cols[5].x+1,y+5.5)
        const criadoEm=a.criado_em?new Date(a.criado_em):null; doc.setTextColor(100,100,100); doc.text(criadoEm?criadoEm.toLocaleDateString('pt-BR')+' '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'-',cols[6].x+1,y+5.5)
        const cancelado=a.status==='cancelado'; if(cancelado){doc.setFillColor(254,226,226);doc.rect(cols[7].x,y+1.5,15,5.5,'F');doc.setTextColor(180,30,30)}else{doc.setFillColor(220,252,231);doc.rect(cols[7].x,y+1.5,15,5.5,'F');doc.setTextColor(22,101,52)}
        doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.text(cancelado?'CANCEL.':'CONF.',cols[7].x+1,y+5.5)
        if(cancelado&&a.motivo_cancelamento){doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(180,30,30);doc.text((a.motivo_cancelamento||'').slice(0,22),cols[8].x+1,y+5.5)}
        y+=rowH
      })
      const total=doc.getNumberOfPages(); for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(27,47,126);doc.rect(0,200,W,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo',W/2,204.5,{align:'center'});doc.text('Pagina '+i+' de '+total,W-M,204.5,{align:'right'})}
      doc.save('relatorio-vistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e) { console.error(e); alert('Erro ao gerar PDF.') }
    setGerandoPDF(false)
  }

  const filtrados = agendamentos.filter(a=>a.tipo!=='revistoria').filter(a=>filtro==='todos'||a.status===filtro).filter(a=>!filtroEmp||a.apartamento?.toLowerCase().includes(filtroEmp.toLowerCase())).filter(a=>{if(!busca)return true;const b=busca.toLowerCase();return a.nome?.toLowerCase().includes(b)||a.email?.toLowerCase().includes(b)||a.apartamento?.toLowerCase().includes(b)||a.telefone?.includes(b)||a.cpf?.includes(b)}).filter(a=>{if(dataInicio&&a.data<dataInicio)return false;if(dataFim&&a.data>dataFim)return false;return true}).sort((a,b)=>{const da=new Date(a.criado_em||0),db=new Date(b.criado_em||0);return ordem==='mais-antigo'?da-db:db-da})
  const totalPaginas=Math.ceil(filtrados.length/POR_PAGINA); const paginados=filtrados.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA)
  const totalConf=agendamentos.filter(a=>a.status==='confirmado'&&a.tipo!=='revistoria').length
  const totalCanc=agendamentos.filter(a=>a.status==='cancelado'&&a.tipo!=='revistoria').length
  const hoje=new Date(); const mesesGrid=[]
  for(let i=0;i<12;i++){const d=new Date(hoje.getFullYear(),hoje.getMonth()+i,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');mesesGrid.push({key,nomeMes:MESES_NOMES[d.getMonth()],anoMes:d.getFullYear(),bloqueado:mesesBloqueados.includes(key)})}
  const horariosAtivos=horariosConfig.filter(h=>h.ativo).length
  const cpfsFiltrados=cpfsAutorizados.filter(c=>{if(!buscaCpf)return true;const bL=buscaCpf.toLowerCase();const bD=buscaCpf.replace(/\D/g,'');return c.nome?.toLowerCase().includes(bL)||(bD.length>0&&c.cpf?.includes(bD))})
  const totalPaginasCpf=Math.ceil(cpfsFiltrados.length/POR_PAGINA_CPF); const cpfsPaginados=cpfsFiltrados.slice((paginaCpf-1)*POR_PAGINA_CPF,paginaCpf*POR_PAGINA_CPF)

  const revFiltradas=revistorias.filter(a=>a.status==='confirmado'&&(!filtroRevEmp||a.apartamento?.toLowerCase().includes(filtroRevEmp.toLowerCase())))
  const revAgrupadas={}
  for(const r of revFiltradas){const emp=(r.apartamento||'').split(' - ')[0];const chave=emp+'||'+r.data+'||'+r.horario;if(!revAgrupadas[chave])revAgrupadas[chave]={emp,data:r.data,horario:r.horario,unidades:[]};const unidade=(r.apartamento||'').split(' - ').slice(1).join(' - ');revAgrupadas[chave].unidades.push({id:r.id,unidade,nome:r.nome})}
  const revGrupos=Object.values(revAgrupadas).sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:a.horario<b.horario?-1:1)
  const totalPaginasRev=Math.ceil(revGrupos.length/POR_PAGINA_REAG); const revGruposPaginados=revGrupos.slice((paginaRev-1)*POR_PAGINA_REAG,paginaRev*POR_PAGINA_REAG)
  const primeiroDiaRev=new Date(anoRev,mesRev,1).getDay(); const diasNoMesRev=new Date(anoRev,mesRev+1,0).getDate()
  const diasComRev=new Set(revFiltradas.map(r=>r.data))
  const revDiaSelecionado=diaSelecionado?revGrupos.filter(g=>g.data===diaSelecionado):[]
  const empCoresMap={}; empreendimentos.forEach((emp,i)=>{empCoresMap[emp]=EMP_CORES[i%EMP_CORES.length]})

  if(status==='loading'||loading) return (<main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f3fa'}}><p style={{color:'#6b7280'}}>Carregando...</p></main>)

  return (
    <main style={{minHeight:'100vh',background:'#f0f3fa',fontFamily:"'Segoe UI',sans-serif"}}>

      {popup && (
        <div onClick={()=>setPopup(null)} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'16px',padding:'2rem',maxWidth:'420px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width:'56px',height:'56px',background:'#fee2e2',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{fontSize:'18px',fontWeight:'700',color:'#111',textAlign:'center',margin:'0 0 8px'}}>Cancelar agendamento?</h3>
            <p style={{fontSize:'13px',color:'#6b7280',textAlign:'center',margin:'0 0 4px'}}>{popup.nome}</p>
            <p style={{fontSize:'13px',color:'#6b7280',textAlign:'center',margin:'0 0 1.25rem'}}>{new Date(popup.data+'T12:00:00').toLocaleDateString('pt-BR')} as {popup.horario?.slice(0,5)}</p>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:erroMotivo?VERMELHO:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Motivo *</label>
              <select value={motivoCancelamento} onChange={e=>{setMotivoCancelamento(e.target.value);setErroMotivo(false)}} style={{width:'100%',padding:'10px 12px',border:erroMotivo?'2px solid '+VERMELHO:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
                {MOTIVOS.map(m=><option key={m} value={m==='Selecione o motivo'?'':m}>{m}</option>)}
              </select>
              {erroMotivo&&<p style={{color:VERMELHO,fontSize:'11px',margin:'4px 0 0',fontWeight:'600'}}>Selecione o motivo</p>}
            </div>
            <div style={{marginBottom:'1.25rem'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Observacao (opcional)</label>
              <textarea value={obsCancelamento} onChange={e=>setObsCancelamento(e.target.value)} placeholder="Detalhe o motivo..." style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none',resize:'none',height:'72px',boxSizing:'border-box',fontFamily:'inherit'}}/>
            </div>
            <div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px',marginBottom:'1.25rem',fontSize:'12px',color:'#dc2626',textAlign:'center',fontWeight:'600'}}>Esta acao nao podera ser desfeita facilmente</div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setPopup(null)} style={{flex:1,padding:'12px',background:'#fff',color:'#6b7280',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>NAO, MANTER</button>
              <button onClick={executarCancelamento} style={{flex:1,padding:'12px',background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>SIM, CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'0 2rem',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 20px rgba(27,47,126,0.25)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <img src="/logo.png" alt="Markinvest" style={{height:'32px',objectFit:'contain',filter:'brightness(0) invert(1)'}}/>
          <div style={{width:'1px',height:'28px',background:'rgba(255,255,255,0.2)'}}></div>
          <div style={{color:'rgba(255,255,255,0.6)',fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase'}}>Painel Administrativo</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.1)',borderRadius:'20px',padding:'5px 12px',border:'1px solid rgba(255,255,255,0.2)'}}>
            <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:'700'}}>{session?.user?.email?.charAt(0).toUpperCase()}</div>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.8)'}}>{session?.user?.email}</span>
          </div>
          <button onClick={()=>signOut({callbackUrl:'/admin/login'})} style={{padding:'6px 14px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#fff',fontWeight:'600'}}>SAIR</button>
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'2px solid #e8ecf5',display:'flex',padding:'0 2rem',gap:'4px',overflowX:'auto'}}>
        {[{id:'agendamentos',label:'📋 Agendamentos'},{id:'revistorias',label:'🔄 Revistorias'},{id:'empreendimentos',label:'🏢 Empreendimentos'},{id:'cpfs',label:'🔐 CPFs Autorizados'},{id:'configuracoes',label:'⚙️ Configuracoes'}].map(a=>(
          <button key={a.id} onClick={()=>setAbaAtiva(a.id)} style={{padding:'14px 20px',background:'none',border:'none',borderBottom:abaAtiva===a.id?'3px solid '+AZUL:'3px solid transparent',fontSize:'13px',fontWeight:'700',cursor:'pointer',color:abaAtiva===a.id?AZUL:'#9ca3af',transition:'all 0.15s',marginBottom:'-2px',whiteSpace:'nowrap'}}>{a.label}</button>
        ))}
      </div>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'1.5rem'}}>

        {abaAtiva==='revistorias'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>🔄</div>
                <div><h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:0}}>Nova Revistoria</h2><p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>Multiplas unidades podem compartilhar o mesmo horario</p></div>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',padding:'14px',background:'#f8f9ff',borderRadius:'12px',border:'1px solid #e0e5f5'}}>
                <div>
                  <label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label>
                  <select value={revEmp} onChange={e=>setRevEmp(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',minWidth:'180px'}}>
                    <option value="">Selecione...</option>
                    {empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data *</label>
                  <input type="date" value={revData} onChange={e=>setRevData(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                </div>
                <div>
                  <label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Horario *</label>
                  <select value={revHorario} onChange={e=>setRevHorario(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
                    <option value="">Selecione...</option>
                    {HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <p style={{fontSize:'12px',fontWeight:'700',color:AZUL,textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'0.05em'}}>📋 Unidades nesta revistoria</p>
              <div style={{border:'1px solid #e0e5f5',borderRadius:'10px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr auto',background:'#f0f3fa',padding:'8px 12px',borderBottom:'1px solid #e0e5f5'}}>
                  <span style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',textTransform:'uppercase'}}>Unidade</span>
                  <span style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',textTransform:'uppercase'}}>Nome do cliente</span>
                  <span></span>
                </div>
                <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:'6px'}}>
                  {revUnidades.map((u,i)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 2fr auto',gap:'8px',alignItems:'center'}}>
                      <input value={u.unidade} onChange={e=>atualizarUnidade(i,'unidade',e.target.value)} placeholder="Ex: Apto 301" style={{padding:'8px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'}}/>
                      <input value={u.nome} onChange={e=>atualizarUnidade(i,'nome',e.target.value)} placeholder="Nome completo do cliente" style={{padding:'8px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'}}/>
                      <button onClick={()=>revUnidades.length>1&&removerLinhaUnidade(i)} style={{padding:'7px 10px',background:revUnidades.length>1?'#fff5f5':'#f9fafb',border:'1px solid '+(revUnidades.length>1?'#fca5a5':'#e5e7eb'),borderRadius:'8px',fontSize:'13px',color:revUnidades.length>1?VERMELHO:'#d1d5db',cursor:revUnidades.length>1?'pointer':'not-allowed',fontWeight:'700'}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={adicionarLinhaUnidade} style={{padding:'9px 16px',background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',color:AZUL,cursor:'pointer',fontWeight:'600'}}>+ Adicionar unidade</button>
                <button onClick={salvarRevistoria} disabled={salvandoRev} style={{padding:'9px 24px',background:salvandoRev?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:salvandoRev?'not-allowed':'pointer'}}>{salvandoRev?'SALVANDO...':'SALVAR REVISTORIA'}</button>
              </div>
              {erroRev&&<div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px 14px',marginTop:'12px'}}><p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>⚠ {erroRev}</p></div>}
            </div>

            <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 2px'}}>Revistorias Cadastradas</h2>
                  <p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>{revGrupos.length} grupo(s) · {revFiltradas.length} unidade(s)</p>
                </div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                  <select value={filtroRevEmp} onChange={e=>{setFiltroRevEmp(e.target.value);setPaginaRev(1)}} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                    <option value="">Todos os empreendimentos</option>
                    {empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                  </select>
                  <button onClick={exportarCSVRevistorias} style={{padding:'8px 14px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>⬇ CSV</button>
                  <button onClick={gerarPDFRevistorias} disabled={gerandoPDFRev} style={{padding:'8px 14px',background:gerandoPDFRev?'#9ca3af':'#C0392B',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:gerandoPDFRev?'not-allowed':'pointer'}}>📄 {gerandoPDFRev?'GERANDO...':'PDF'}</button>
                  <div style={{display:'flex',gap:'4px',background:'#f4f6fb',borderRadius:'10px',padding:'4px'}}>
                    <button onClick={()=>{setVisualizacaoRev('agenda');setDiaSelecionado(null)}} style={{padding:'6px 14px',borderRadius:'8px',border:'none',background:visualizacaoRev==='agenda'?AZUL:'transparent',color:visualizacaoRev==='agenda'?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>📅 Agenda</button>
                    <button onClick={()=>setVisualizacaoRev('lista')} style={{padding:'6px 14px',borderRadius:'8px',border:'none',background:visualizacaoRev==='lista'?AZUL:'transparent',color:visualizacaoRev==='lista'?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>☰ Lista</button>
                  </div>
                </div>
              </div>

              {visualizacaoRev==='agenda'&&(
                <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'16px',alignItems:'start'}}>
                  <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                    <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <button onClick={()=>{if(mesRev===0){setMesRev(11);setAnoRev(a=>a-1)}else setMesRev(m=>m-1);setDiaSelecionado(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                      <div style={{textAlign:'center'}}>
                        <div style={{color:'#fff',fontSize:'15px',fontWeight:'700',textTransform:'uppercase'}}>{MESES_NOMES[mesRev]}</div>
                        <div style={{color:'rgba(255,255,255,0.65)',fontSize:'12px'}}>{anoRev}</div>
                      </div>
                      <button onClick={()=>{if(mesRev===11){setMesRev(0);setAnoRev(a=>a+1)}else setMesRev(m=>m+1);setDiaSelecionado(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                    </div>
                    <div style={{padding:'12px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',textAlign:'center',marginBottom:'6px'}}>
                        {['D','S','T','Q','Q','S','S'].map((d,i)=><span key={i} style={{fontSize:'10px',fontWeight:'700',color:i===0||i===6?'#e5e7eb':'#9ca3af',padding:'3px 0'}}>{d}</span>)}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
                        {Array(primeiroDiaRev).fill(null).map((_,i)=><div key={i}/>)}
                        {Array(diasNoMesRev).fill(null).map((_,i)=>{
                          const d=i+1; const date=new Date(anoRev,mesRev,d); const dow=date.getDay()
                          const ds=anoRev+'-'+String(mesRev+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                          const isWeekend=dow===0||dow===6; const temRev=diasComRev.has(ds); const isSel=diaSelecionado===ds
                          const isHoje=d===new Date().getDate()&&mesRev===new Date().getMonth()&&anoRev===new Date().getFullYear()
                          if(isSel) return <div key={d} onClick={()=>setDiaSelecionado(null)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',color:'#fff',fontSize:'12px',fontWeight:'800',boxShadow:'0 3px 10px rgba(27,47,126,0.4)'}}>{d}<div style={{width:'4px',height:'4px',borderRadius:'50%',background:'rgba(255,255,255,0.7)',marginTop:'1px'}}></div></div>
                          if(temRev&&!isWeekend) return <div key={d} onClick={()=>setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'#eff3ff',border:'2px solid '+AZUL,fontSize:'12px',fontWeight:'700',color:AZUL}}>{d}<div style={{width:'5px',height:'5px',borderRadius:'50%',background:AZUL,marginTop:'1px'}}></div></div>
                          if(isHoje&&!isWeekend) return <div key={d} onClick={()=>setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'#f0f7ff',border:'2px solid '+AZUL,fontSize:'12px',fontWeight:'700',color:AZUL}}>{d}<div style={{width:'4px',height:'4px',borderRadius:'50%',background:AZUL,marginTop:'1px'}}></div></div>
                          return <div key={d} onClick={()=>!isWeekend&&setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',fontSize:'12px',color:isWeekend?'#e5e7eb':'#6b7280',cursor:isWeekend?'default':'pointer'}}>{d}</div>
                        })}
                      </div>
                      <div style={{marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #e8ecf5',display:'flex',gap:'12px',flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:AZUL}}></div><span style={{fontSize:'10px',color:'#6b7280'}}>Com revistoria</span></div>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#e5e7eb'}}></div><span style={{fontSize:'10px',color:'#6b7280'}}>Fim de semana</span></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {!diaSelecionado&&(
                      <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'14px',padding:'2rem',textAlign:'center'}}>
                        <div style={{fontSize:'32px',marginBottom:'8px'}}>📅</div>
                        <p style={{fontSize:'14px',color:'#6b7280',margin:'0 0 4px',fontWeight:'600'}}>Selecione um dia no calendario</p>
                        <p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>Dias com ponto azul possuem revistorias</p>
                      </div>
                    )}
                    {diaSelecionado&&(
                      <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                        <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#eff3ff,#e8edff)',borderBottom:'1px solid #e0e5f5',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <p style={{fontSize:'14px',fontWeight:'700',color:AZUL,margin:0,textTransform:'capitalize'}}>{new Date(diaSelecionado+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
                          <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:AZUL,color:'#fff',fontWeight:'700'}}>{revDiaSelecionado.reduce((s,g)=>s+g.unidades.length,0)} unidade(s)</span>
                        </div>
                        {revDiaSelecionado.length===0?(
                          <div style={{padding:'2rem',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Nenhuma revistoria neste dia.</div>
                        ):(
                          <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
                            {revDiaSelecionado.map((g,gi)=>{
                              const corEmp=empCoresMap[g.emp]||AZUL
                              return (
                                <div key={gi}>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                                    <span style={{fontSize:'13px',fontWeight:'700',color:corEmp,background:corEmp+'20',padding:'3px 12px',borderRadius:'20px',border:'1px solid '+corEmp+'40'}}>{(g.horario||'').slice(0,5)}</span>
                                    <span style={{fontSize:'12px',color:'#6b7280'}}>{g.emp} · {g.unidades.length} unidade(s)</span>
                                  </div>
                                  <div style={{paddingLeft:'8px',borderLeft:'3px solid '+corEmp,display:'flex',flexDirection:'column',gap:'4px'}}>
                                    {g.unidades.map((u,ui)=>(
                                      <div key={ui} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:ui%2===0?'#f8f9ff':'#fff',borderRadius:'8px',border:'1px solid #eef0f8'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                                          <div style={{width:'30px',height:'30px',borderRadius:'8px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700',flexShrink:0}}>{(u.nome||'?').charAt(0).toUpperCase()}</div>
                                          <div><div style={{fontSize:'13px',fontWeight:'600',color:'#111'}}>{u.nome}</div><div style={{fontSize:'11px',color:'#6b7280'}}>🏠 {u.unidade}</div></div>
                                        </div>
                                        <button onClick={()=>removerRevistoria(u.id)} style={{padding:'4px 12px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:VERMELHO,cursor:'pointer',fontWeight:'700',flexShrink:0}}>REMOVER</button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {visualizacaoRev==='lista'&&(
                <>
                  {revGruposPaginados.length===0
                    ?<div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#f9fafb',borderRadius:'12px'}}>Nenhuma revistoria cadastrada.</div>
                    :(
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {revGruposPaginados.map((g,gi)=>{
                          const corEmp=empCoresMap[g.emp]||AZUL
                          return (
                            <div key={gi} style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden',boxShadow:'0 2px 8px rgba(27,47,126,0.05)'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'linear-gradient(135deg,#eff3ff,#e8edff)',borderBottom:'1px solid #e0e5f5'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',flexShrink:0}}>🔄</div>
                                  <div>
                                    <div style={{fontSize:'14px',fontWeight:'700',color:AZUL}}>{g.emp}</div>
                                    <div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>📅 {new Date(g.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}<span style={{fontWeight:'700',color:AZUL,marginLeft:'8px'}}>🕐 {(g.horario||'').slice(0,5)}</span></div>
                                  </div>
                                </div>
                                <span style={{fontSize:'12px',padding:'4px 12px',borderRadius:'20px',background:corEmp,color:'#fff',fontWeight:'700',flexShrink:0}}>{g.unidades.length} unidade(s)</span>
                              </div>
                              <div style={{padding:'10px 16px',display:'flex',flexDirection:'column',gap:'6px'}}>
                                {g.unidades.map((u,ui)=>(
                                  <div key={ui} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:ui%2===0?'#f8f9ff':'#fff',borderRadius:'10px',border:'1px solid #eef0f8'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                      <div style={{width:'34px',height:'34px',borderRadius:'10px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(u.nome||'?').charAt(0).toUpperCase()}</div>
                                      <div><div style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{u.nome}</div><div style={{fontSize:'11px',color:'#6b7280',marginTop:'1px'}}>🏠 {u.unidade}</div></div>
                                    </div>
                                    <button onClick={()=>removerRevistoria(u.id)} style={{padding:'5px 14px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'11px',color:VERMELHO,cursor:'pointer',fontWeight:'700',flexShrink:0}}>REMOVER</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  {totalPaginasRev>1&&(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'1.5rem',flexWrap:'wrap'}}>
                      <button onClick={()=>setPaginaRev(p=>Math.max(1,p-1))} disabled={paginaRev===1} style={{padding:'6px 14px',background:paginaRev===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaRev===1?'not-allowed':'pointer',color:paginaRev===1?'#9ca3af':'#374151'}}>&#8249; Anterior</button>
                      {(()=>{const paginas=[];for(let p=1;p<=totalPaginasRev;p++){if(p===1||p===totalPaginasRev||(p>=paginaRev-2&&p<=paginaRev+2))paginas.push(p)};const resultado=[];let anterior=0;for(const p of paginas){if(p-anterior>1)resultado.push('...');resultado.push(p);anterior=p};return resultado.map((p,i)=>p==='...'?<span key={'e'+i} style={{padding:'0 4px',color:'#9ca3af',fontSize:'13px'}}>...</span>:<button key={p} onClick={()=>setPaginaRev(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:paginaRev===p?'none':'1px solid #e5e7eb',background:paginaRev===p?AZUL:'#fff',color:paginaRev===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>)})()}
                      <button onClick={()=>setPaginaRev(p=>Math.min(totalPaginasRev,p+1))} disabled={paginaRev===totalPaginasRev} style={{padding:'6px 14px',background:paginaRev===totalPaginasRev?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaRev===totalPaginasRev?'not-allowed':'pointer',color:paginaRev===totalPaginasRev?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
                    </div>
                  )}
                  <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'8px'}}>{revGrupos.length===0?'Nenhum grupo':((paginaRev-1)*POR_PAGINA_REAG+1)+' - '+Math.min(paginaRev*POR_PAGINA_REAG,revGrupos.length)+' de '+revGrupos.length+' grupo(s)'}</p>
                </>
              )}
            </div>
          </div>
        )}

        {abaAtiva==='cpfs'&&(
          <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>CPFs Autorizados</h2>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px',lineHeight:'1.6'}}>Somente CPFs cadastrados aqui conseguem acessar a agenda. URL de acesso:<span style={{display:'block',marginTop:'4px',fontWeight:'600',color:AZUL,fontSize:'12px'}}>https://vistoria-agendamento.vercel.app/markinvest/verificar</span></p>
            <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Adicionar CPF autorizado</p>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:'140px'}}>
                  <label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CPF *</label>
                  <input value={novoCpf} onChange={e=>{setNovoCpf(mascaraCPF(e.target.value));setErroCpf('')}} placeholder="000.000.000-00" maxLength={14} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:2,minWidth:'180px'}}>
                  <label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nome (opcional)</label>
                  <input value={nomeNovoCpf} onChange={e=>setNomeNovoCpf(e.target.value)} placeholder="Nome do proprietario" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end'}}>
                  <button onClick={adicionarCpf} disabled={salvandoCpf||!novoCpf.trim()} style={{padding:'9px 20px',background:salvandoCpf||!novoCpf.trim()?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>{salvandoCpf?'SALVANDO...':'+ ADICIONAR'}</button>
                </div>
              </div>
              {erroCpf&&<p style={{color:'#dc2626',fontSize:'12px',margin:'8px 0 0',fontWeight:'600'}}>{erroCpf}</p>}
            </div>
            {cpfsAutorizados.length>0&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',flexWrap:'wrap',gap:'8px',padding:'10px 14px',background:'#f4f6fb',borderRadius:'10px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <input type="checkbox" checked={cpfsSelecionados.length===cpfsFiltrados.length&&cpfsFiltrados.length>0} onChange={e=>setCpfsSelecionados(e.target.checked?cpfsFiltrados.map(c=>c.cpf):[])} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:AZUL}}/>
                  <span style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>Selecionar todos</span>
                  {cpfsSelecionados.length>0&&<span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background:AZUL,color:'#fff',fontWeight:'700'}}>{cpfsSelecionados.length} selecionado(s)</span>}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {cpfsSelecionados.length>0&&(<><button onClick={()=>setCpfsSelecionados([])} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Limpar</button><button onClick={removerCpfsSelecionados} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'700'}}>🗑 Remover ({cpfsSelecionados.length})</button></>)}
                  <button onClick={removerTodosCpfs} style={{padding:'6px 14px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'700'}}>⚠ Remover todos</button>
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'12px'}}>
              <div style={{flex:1,position:'relative'}}>
                <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px'}}>🔍</span>
                <input value={buscaCpf} onChange={e=>setBuscaCpf(e.target.value)} placeholder="Buscar por CPF ou nome..." style={{width:'100%',padding:'8px 12px 8px 34px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',boxSizing:'border-box'}}/>
              </div>
              <span style={{fontSize:'12px',color:'#9ca3af',whiteSpace:'nowrap'}}>{cpfsFiltrados.length} de {cpfsAutorizados.length} CPFs</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {cpfsPaginados.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>{cpfsAutorizados.length===0?'Nenhum CPF cadastrado.':'Nenhum resultado encontrado.'}</p>}
              {cpfsPaginados.map(c=>{
                const selecionado=cpfsSelecionados.includes(c.cpf); const datas=cpfDatas[c.cpf]||[]
                return (
                  <div key={c.id} style={{background:selecionado?'#eff3ff':'#f8f9ff',borderRadius:'12px',border:selecionado?'1px solid #a5b4fc':'1px solid #e0e5f5',overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <input type="checkbox" checked={selecionado} onChange={e=>setCpfsSelecionados(prev=>e.target.checked?[...prev,c.cpf]:prev.filter(x=>x!==c.cpf))} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:AZUL}}/>
                        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(c.nome||'?').charAt(0).toUpperCase()}</div>
                        <div>
                          {c.nome&&<div style={{fontSize:'13px',fontWeight:'600',color:AZUL,marginBottom:'2px'}}>{c.nome}</div>}
                          <div style={{fontSize:'13px',color:'#374151',fontFamily:'monospace'}}>{c.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</div>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'20px',background:datas.length>0?'#dbeafe':'#dcfce7',color:datas.length>0?'#1d4ed8':'#16a34a',fontWeight:'700'}}>{datas.length>0?datas.length+' DATA(S)':'TODAS AS DATAS'}</span>
                        <button onClick={()=>{setEditandoCpf(editandoCpf===c.cpf?null:c.cpf);setNomeEditando(c.nome||'')}} style={{padding:'5px 14px',background:'none',border:'1px solid #bfdbfe',borderRadius:'6px',fontSize:'12px',color:'#1d4ed8',cursor:'pointer',fontWeight:'600'}}>✏ EDITAR</button>
                        <button onClick={()=>removerCpf(c.cpf)} style={{padding:'5px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'12px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>REMOVER</button>
                      </div>
                    </div>
                    {editandoCpf===c.cpf&&(
                      <div style={{padding:'10px 16px 14px',borderTop:'1px solid #e0e5f5',background:'#f0f7ff'}}>
                        <p style={{fontSize:'12px',fontWeight:'700',color:AZUL,margin:'0 0 8px'}}>✏ Editar nome</p>
                        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                          <input value={nomeEditando} onChange={e=>setNomeEditando(e.target.value)} placeholder="Nome do proprietario" style={{flex:1,minWidth:'160px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                          <button onClick={salvarEdicaoCpf} disabled={salvandoEdicao} style={{padding:'8px 16px',background:salvandoEdicao?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>{salvandoEdicao?'SALVANDO...':'✓ SALVAR'}</button>
                          <button onClick={()=>setEditandoCpf(null)} style={{padding:'8px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>CANCELAR</button>
                        </div>
                      </div>
                    )}
                    <div style={{padding:'0 16px 12px 16px',borderTop:'1px solid #e0e5f5'}}>
                      <p style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',margin:'10px 0 8px'}}>📅 Datas e horarios liberados {datas.length===0&&<span style={{fontWeight:'400',color:'#9ca3af'}}>(nenhuma = todas as datas disponiveis)</span>}</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'10px'}}>
                        {datas.map(entrada=>(
                          <div key={entrada.data} style={{background:'#fff',border:'1px solid #e0e5f5',borderRadius:'10px',padding:'10px 12px'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                              <span style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>📅 {new Date(entrada.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <button onClick={()=>removerDataCpf(c.cpf,entrada.data)} style={{background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:'#dc2626',cursor:'pointer',padding:'3px 10px',fontWeight:'600'}}>remover data</button>
                            </div>
                            <p style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',margin:'0 0 6px',letterSpacing:'0.05em'}}>Horarios liberados</p>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'8px'}}>
                              {(entrada.horarios||[]).map(h=>(<div key={h} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'20px'}}><span style={{fontSize:'12px',color:'#16a34a',fontWeight:'600'}}>{h}</span><button onClick={()=>removerHorarioCpf(c.cpf,entrada.data,h)} style={{background:'none',border:'none',cursor:'pointer',color:'#86efac',fontSize:'14px',padding:'0',lineHeight:'1',marginLeft:'2px'}}>×</button></div>))}
                              {(entrada.horarios||[]).length===0&&<span style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic'}}>Todos os horarios disponiveis</span>}
                            </div>
                            <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                <label style={{fontSize:'11px',color:'#6b7280',fontWeight:'600'}}>De:</label>
                                <select value={horarioSelecionado[c.cpf+'_'+entrada.data]||''} onChange={e=>setHorarioSelecionado(prev=>({...prev,[c.cpf+'_'+entrada.data]:e.target.value}))} style={{padding:'6px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff'}}>
                                  <option value="">--:--</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                <label style={{fontSize:'11px',color:'#6b7280',fontWeight:'600'}}>Ate:</label>
                                <select value={horarioSelecionado[c.cpf+'_'+entrada.data+'_fim']||''} onChange={e=>setHorarioSelecionado(prev=>({...prev,[c.cpf+'_'+entrada.data+'_fim']:e.target.value}))} style={{padding:'6px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff'}}>
                                  <option value="">--:--</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                              <button onClick={()=>adicionarHorarioCpf(c.cpf,entrada.data,horarioSelecionado[c.cpf+'_'+entrada.data],horarioSelecionado[c.cpf+'_'+entrada.data+'_fim'])} disabled={!horarioSelecionado[c.cpf+'_'+entrada.data]} style={{padding:'6px 14px',background:!horarioSelecionado[c.cpf+'_'+entrada.data]?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:!horarioSelecionado[c.cpf+'_'+entrada.data]?'not-allowed':'pointer'}}>+ Adicionar</button>
                            </div>
                          </div>
                        ))}
                        {datas.length===0&&<span style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic'}}>Sem restricao de data — pode agendar qualquer dia disponivel</span>}
                      </div>
                      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                        <input type="date" value={novaDataCpf[c.cpf]||''} onChange={e=>setNovaDataCpf(prev=>({...prev,[c.cpf]:e.target.value}))} style={{padding:'6px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                        <button onClick={()=>adicionarDataCpf(c.cpf)} disabled={!novaDataCpf[c.cpf]} style={{padding:'6px 14px',background:!novaDataCpf[c.cpf]?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:!novaDataCpf[c.cpf]?'not-allowed':'pointer'}}>+ Adicionar data</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {totalPaginasCpf>1&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'1.5rem',flexWrap:'wrap'}}>
                <button onClick={()=>setPaginaCpf(p=>Math.max(1,p-1))} disabled={paginaCpf===1} style={{padding:'6px 14px',background:paginaCpf===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaCpf===1?'not-allowed':'pointer',color:paginaCpf===1?'#9ca3af':'#374151'}}>&#8249; Anterior</button>
                {(()=>{const paginas=[];for(let p=1;p<=totalPaginasCpf;p++){if(p===1||p===totalPaginasCpf||(p>=paginaCpf-2&&p<=paginaCpf+2))paginas.push(p)};const resultado=[];let anterior=0;for(const p of paginas){if(p-anterior>1)resultado.push('...');resultado.push(p);anterior=p};return resultado.map((p,i)=>p==='...'?<span key={'e'+i} style={{padding:'0 4px',color:'#9ca3af',fontSize:'13px'}}>...</span>:<button key={p} onClick={()=>setPaginaCpf(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:paginaCpf===p?'none':'1px solid #e5e7eb',background:paginaCpf===p?AZUL:'#fff',color:paginaCpf===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>)})()}
                <button onClick={()=>setPaginaCpf(p=>Math.min(totalPaginasCpf,p+1))} disabled={paginaCpf===totalPaginasCpf} style={{padding:'6px 14px',background:paginaCpf===totalPaginasCpf?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaCpf===totalPaginasCpf?'not-allowed':'pointer',color:paginaCpf===totalPaginasCpf?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
              </div>
            )}
            <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'8px'}}>{cpfsFiltrados.length===0?'Nenhum CPF':((paginaCpf-1)*POR_PAGINA_CPF+1)+' - '+Math.min(paginaCpf*POR_PAGINA_CPF,cpfsFiltrados.length)+' de '+cpfsFiltrados.length+' CPFs'}</p>
          </div>
        )}

        {abaAtiva==='configuracoes'&&(
          <div>
            <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem',flexWrap:'wrap'}}>
              {[{id:'meses',label:'🗓 Bloquear Meses'},{id:'horarios',label:'🕐 Gerenciar Horarios'},{id:'dias',label:'📅 Periodos Especiais'},{id:'bloqueios',label:'🔒 Horarios por Data'}].map(s=>(
                <button key={s.id} onClick={()=>setSubAbaConfig(s.id)} style={{padding:'10px 20px',borderRadius:'10px',border:subAbaConfig===s.id?'none':'1px solid #e5e7eb',background:subAbaConfig===s.id?AZUL:'#fff',color:subAbaConfig===s.id?'#fff':'#6b7280',fontSize:'13px',fontWeight:'700',cursor:'pointer',boxShadow:subAbaConfig===s.id?'0 4px 12px rgba(27,47,126,0.3)':'none'}}>{s.label}</button>
              ))}
            </div>
            {subAbaConfig==='meses'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Bloquear / Liberar Meses</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 16px'}}>Meses bloqueados nao permitem novos agendamentos. Clique para alternar.</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                  {mesesGrid.map(({key,nomeMes,anoMes,bloqueado})=>(
                    <button key={key} onClick={()=>toggleMes(key)} disabled={salvandoMes} style={{padding:'16px 12px',borderRadius:'12px',border:bloqueado?'2px solid #dc2626':'2px solid #1D9E75',background:bloqueado?'#fff5f5':'#f0fdf4',cursor:'pointer',textAlign:'center',opacity:salvandoMes?0.7:1}}>
                      <div style={{fontSize:'14px',fontWeight:'700',color:bloqueado?'#dc2626':'#15803d',marginBottom:'2px'}}>{nomeMes}</div>
                      <div style={{fontSize:'11px',color:bloqueado?'#dc2626':'#15803d',marginBottom:'8px',opacity:0.7}}>{anoMes}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',borderRadius:'20px',background:bloqueado?'#dc2626':'#1D9E75',color:'#fff',fontSize:'10px',fontWeight:'700'}}>{bloqueado?'🔒 BLOQUEADO':'✓ LIBERADO'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {subAbaConfig==='horarios'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Gerenciar Horarios</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 16px'}}>Ative ou desative horarios globalmente.</p>
                <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',marginBottom:'20px'}}><p style={{fontSize:'12px',color:'#1d4ed8',margin:0,fontWeight:'600'}}>{horariosAtivos} de {horariosConfig.length} horarios ativos</p></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px'}}>
                  {horariosConfig.map(h=>(
                    <button key={h.horario} onClick={()=>toggleHorario(h.horario,h.ativo)} disabled={salvandoHorario} style={{padding:'16px 10px',borderRadius:'12px',border:h.ativo?'2px solid #1D9E75':'2px solid #e5e7eb',background:h.ativo?'#f0fdf4':'#f9fafb',cursor:'pointer',textAlign:'center',opacity:salvandoHorario?0.7:1}}>
                      <div style={{fontSize:'20px',fontWeight:'800',color:h.ativo?VERDE:'#d1d5db',marginBottom:'6px'}}>{h.horario}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',borderRadius:'20px',background:h.ativo?VERDE:'#e5e7eb',color:h.ativo?'#fff':'#9ca3af',fontSize:'10px',fontWeight:'700'}}>{h.ativo?'✓ ATIVO':'× INATIVO'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {subAbaConfig==='dias'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Periodos Especiais</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Libere ou bloqueie periodos especificos.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Adicionar novo periodo</p>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end'}}>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data inicio</label><input type="date" value={dataInicioEspecial} onChange={e=>setDataInicioEspecial(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data fim</label><input type="date" value={dataFimEspecial} onChange={e=>setDataFimEspecial(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                    <div style={{flex:1,minWidth:'160px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Observacao (opcional)</label><input value={obsEspecial} onChange={e=>setObsEspecial(e.target.value)} placeholder="Ex: Feriado..." style={{width:'100%',padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>adicionarDiaEspecial('liberado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia} style={{padding:'8px 16px',background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>✓ LIBERAR</button>
                      <button onClick={()=>adicionarDiaEspecial('bloqueado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia} style={{padding:'8px 16px',background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERMELHO,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>🔒 BLOQUEAR</button>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {diasEspeciais.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum periodo especial cadastrado.</p>}
                  {diasEspeciais.map(d=>(
                    <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:d.tipo==='liberado'?'#f0fdf4':'#fff5f5',borderRadius:'10px',border:d.tipo==='liberado'?'1px solid #86efac':'1px solid #fca5a5'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:d.tipo==='liberado'?VERDE:VERMELHO,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',fontWeight:'700',flexShrink:0}}>{d.tipo==='liberado'?'✓':'🔒'}</div>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:'700',color:d.tipo==='liberado'?VERDE:VERMELHO}}>{new Date(d.data_inicio+'T12:00:00').toLocaleDateString('pt-BR')} ate {new Date(d.data_fim+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                          <div style={{fontSize:'12px',color:'#6b7280'}}>{d.tipo==='liberado'?'Periodo liberado':'Periodo bloqueado'}{d.observacao&&' — '+d.observacao}</div>
                        </div>
                      </div>
                      <button onClick={()=>removerDiaEspecial(d.id)} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'600'}}>REMOVER</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subAbaConfig==='bloqueios'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Horarios por Data e Empreendimento</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Defina o ultimo horario disponivel por data e empreendimento. Use "Todos" para aplicar a todos.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Configurar bloqueio</p>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end'}}>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento</label><select value={novoEmpBloqueio} onChange={e=>setNovoEmpBloqueio(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="todos">Todos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data</label><input type="date" value={novaDataBloqueio} onChange={e=>setNovaDataBloqueio(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Ultimo horario disponivel</label><select value={novoUltimoHorario} onChange={e=>setNovoUltimoHorario(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                    <button onClick={salvarBloqueioData} disabled={!novaDataBloqueio||!novoUltimoHorario||salvandoBloqueio} style={{padding:'8px 20px',background:!novaDataBloqueio||!novoUltimoHorario?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!novaDataBloqueio||!novoUltimoHorario?'not-allowed':'pointer',whiteSpace:'nowrap'}}>{salvandoBloqueio?'SALVANDO...':'APLICAR'}</button>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {horariosBloqueadosData.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhuma restricao cadastrada.</p>}
                  {horariosBloqueadosData.map(b=>{
                    const idx=HORARIOS_DISPONIVEIS.indexOf(b.ultimo_horario); const bloqueados=idx>=0?HORARIOS_DISPONIVEIS.slice(idx+1):[]; const isTodos=!b.empreendimento||b.empreendimento==='todos'
                    return (
                      <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#fffbeb',borderRadius:'10px',border:'1px solid #fde68a'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:isTodos?VERMELHO:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',flexShrink:0}}>{isTodos?'🔒':'🕐'}</div>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                              <span style={{fontSize:'14px',fontWeight:'700',color:'#92400e'}}>{new Date(b.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',fontWeight:'700',background:isTodos?'#fee2e2':'#dbeafe',color:isTodos?VERMELHO:'#1d4ed8',border:'1px solid '+(isTodos?'#fca5a5':'#93c5fd')}}>{isTodos?'Todos':b.empreendimento}</span>
                            </div>
                            <div style={{fontSize:'12px',color:'#6b7280'}}>Disponivel ate {b.ultimo_horario}{bloqueados.length>0&&' · Bloqueados: '+bloqueados.join(', ')}</div>
                          </div>
                        </div>
                        <button onClick={()=>removerBloqueioData(b.id)} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'600',flexShrink:0}}>REMOVER</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {abaAtiva==='empreendimentos'&&(
          <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 8px'}}>Gerenciar Empreendimentos</h2>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Os empreendimentos cadastrados aparecerao na lista suspensa para os clientes.</p>
            <div style={{display:'flex',gap:'10px',marginBottom:'12px'}}>
              <input value={novoEmp} onChange={e=>setNovoEmp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&adicionarEmpreendimento()} placeholder="Nome do novo empreendimento" style={{flex:1,padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'10px',fontSize:'14px',outline:'none'}}/>
              <button onClick={adicionarEmpreendimento} disabled={salvandoEmp||!novoEmp.trim()} style={{padding:'10px 20px',background:salvandoEmp||!novoEmp.trim()?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>{salvandoEmp?'SALVANDO...':'+ ADICIONAR'}</button>
            </div>
            {erroEmp&&<p style={{color:'#dc2626',fontSize:'13px',margin:'0 0 12px',fontWeight:'600'}}>{erroEmp}</p>}
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {empreendimentos.map(emp=>(
                <div key={emp} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#f8f9ff',borderRadius:'10px',border:'1px solid #e0e5f5'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'18px'}}>🏢</span><span style={{fontSize:'14px',fontWeight:'600',color:AZUL}}>{emp}</span></div>
                  <button onClick={()=>removerEmpreendimento(emp)} style={{padding:'5px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'12px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>REMOVER</button>
                </div>
              ))}
              {empreendimentos.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum empreendimento cadastrado.</p>}
            </div>
          </div>
        )}

        {abaAtiva==='agendamentos'&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'1.5rem'}}>
              {[{label:'TOTAL',val:agendamentos.filter(a=>a.tipo!=='revistoria').length,cor:AZUL,icon:'📅',bg:'#eff3ff'},{label:'CONFIRMADOS',val:totalConf,cor:VERDE,icon:'✅',bg:'#f0fdf4'},{label:'CANCELADOS',val:totalCanc,cor:VERMELHO,icon:'❌',bg:'#fff5f5'}].map(c=>(
                <div key={c.label} style={{background:'#fff',borderRadius:'16px',padding:'1.25rem 1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)',borderLeft:'4px solid '+c.cor,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div><p style={{fontSize:'10px',fontWeight:'700',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 6px'}}>{c.label}</p><p style={{fontSize:'32px',fontWeight:'800',color:c.cor,margin:0,lineHeight:1}}>{c.val}</p></div>
                  <div style={{width:'48px',height:'48px',background:c.bg,borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{c.icon}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1rem 1.25rem',marginBottom:'1rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'4px',background:'#f4f6fb',borderRadius:'10px',padding:'4px'}}>
                  {['todos','confirmado','cancelado'].map(f=>(
                    <button key={f} onClick={()=>setFiltro(f)} style={{padding:'6px 16px',borderRadius:'8px',border:'none',background:filtro===f?(f==='cancelado'?VERMELHO:f==='confirmado'?VERDE:AZUL):'transparent',color:filtro===f?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer',textTransform:'uppercase'}}>{f}</button>
                  ))}
                </div>
                <div style={{flex:1,position:'relative',minWidth:'180px'}}>
                  <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px'}}>🔍</span>
                  <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, email, CPF..." style={{width:'100%',padding:'8px 12px 8px 34px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',boxSizing:'border-box'}}/>
                </div>
                <select value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                  <option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                </select>
                <select value={ordem} onChange={e=>setOrdem(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                  <option value="mais-antigo">Mais antigo primeiro</option><option value="mais-novo">Mais novo primeiro</option>
                </select>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
                <span style={{fontSize:'12px',fontWeight:'600',color:'#6b7280'}}>Filtrar por data:</span>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><label style={{fontSize:'12px',color:'#6b7280'}}>De:</label><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><label style={{fontSize:'12px',color:'#6b7280'}}>Ate:</label><input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                {(dataInicio||dataFim||filtroEmp)&&<button onClick={()=>{setDataInicio('');setDataFim('');setFiltroEmp('')}} style={{padding:'6px 12px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>Limpar</button>}
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={exportarCSV} style={{padding:'8px 18px',background:AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>⬇ EXPORTAR CSV</button>
                <button onClick={gerarPDF} disabled={gerandoPDF} style={{padding:'8px 18px',background:gerandoPDF?'#9ca3af':'#C0392B',color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:gerandoPDF?'not-allowed':'pointer'}}>📄 {gerandoPDF?'GERANDO...':'EXPORTAR PDF'}</button>
              </div>
            </div>
            {paginados.length===0?(<div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#fff',borderRadius:'16px'}}>Nenhum agendamento encontrado</div>):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {paginados.map(a=>{
                  const cancelado=a.status==='cancelado'; const partes=(a.apartamento||'').split(' - '); const empreend=partes[0]||''; const unidade=partes.slice(1).join(' - ')||''; const criadoEm=a.criado_em?new Date(a.criado_em):null
                  return (
                    <div key={a.id} style={{background:cancelado?'#fff8f8':'#fff',borderRadius:'14px',padding:'1rem 1.25rem',boxShadow:'0 2px 12px rgba(27,47,126,0.06)',border:cancelado?'1px solid #fecaca':'1px solid #e8ecf5',display:'flex',alignItems:'center',gap:'1rem',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:'5px',background:cancelado?'linear-gradient(180deg,#ef4444,#dc2626)':'linear-gradient(180deg,#1D9E75,#16a34a)',borderRadius:'14px 0 0 14px'}}></div>
                      <div style={{width:'44px',height:'44px',borderRadius:'12px',background:cancelado?'#fee2e2':'#eff3ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'800',color:cancelado?VERMELHO:AZUL,flexShrink:0,marginLeft:'8px'}}>{(a.nome||'?').charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'14px',fontWeight:'700',color:cancelado?'#9ca3af':'#111',textDecoration:cancelado?'line-through':'none'}}>{a.nome}</span>
                          <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:cancelado?'#fee2e2':'#dcfce7',color:cancelado?VERMELHO:'#16a34a',fontWeight:'700',textTransform:'uppercase'}}>{a.status}</span>
                        </div>
                        <div style={{fontSize:'12px',color:cancelado?'#d1d5db':'#6b7280',marginBottom:'4px'}}><span style={{fontWeight:'600',color:cancelado?'#d1d5db':AZUL}}>{empreend}</span>{unidade&&<span> · {unidade}</span>}</div>
                        <div style={{display:'flex',gap:'12px',fontSize:'11px',color:'#9ca3af',flexWrap:'wrap'}}>
                          <span>✉ {a.email}</span><span>📱 {a.telefone}</span>{a.cpf&&<span>🪪 {a.cpf}</span>}{a.nome_acompanhante&&<span>👤 {a.nome_acompanhante}</span>}
                        </div>
                        {cancelado&&a.motivo_cancelamento&&(<div style={{marginTop:'6px',background:'#fff5f5',borderRadius:'6px',padding:'5px 10px',borderLeft:'2px solid #dc2626',display:'inline-block'}}><span style={{fontSize:'11px',color:'#dc2626',fontWeight:'600'}}>Motivo: </span><span style={{fontSize:'11px',color:'#9ca3af'}}>{a.motivo_cancelamento}</span>{a.obs_cancelamento&&<span style={{fontSize:'11px',color:'#9ca3af'}}> — {a.obs_cancelamento}</span>}</div>)}
                      </div>
                      <div style={{textAlign:'center',flexShrink:0,background:cancelado?'#fff5f5':'#f0f7ff',borderRadius:'12px',padding:'10px 16px',border:cancelado?'1px solid #fecaca':'1px solid #bfdbfe'}}>
                        <div style={{fontSize:'18px',fontWeight:'800',color:cancelado?'#d1d5db':AZUL,lineHeight:1}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                        <div style={{fontSize:'10px',color:'#9ca3af',marginTop:'2px'}}>{new Date(a.data+'T12:00:00').getFullYear()}</div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:cancelado?'#d1d5db':'#1d4ed8',marginTop:'4px'}}>{a.horario?.slice(0,5)}</div>
                      </div>
                      <div style={{flexShrink:0,textAlign:'right'}}>
                        {criadoEm&&(<div style={{fontSize:'10px',color:'#c4c9d9',marginBottom:'8px',whiteSpace:'nowrap'}}>Agendado em<br/><span style={{fontWeight:'600',color:'#b0b8d0'}}>{criadoEm.toLocaleDateString('pt-BR')} {criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div>)}
                        {!cancelado?<button onClick={()=>confirmarCancelamento(a)} style={{padding:'6px 14px',background:'#fff0f0',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'11px',fontWeight:'700',color:VERMELHO,cursor:'pointer'}}>CANCELAR</button>:<button onClick={()=>atualizarStatus(a.id,'confirmado')} style={{padding:'6px 14px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',fontSize:'11px',fontWeight:'700',color:VERDE,cursor:'pointer'}}>REATIVAR</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {totalPaginas>1&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'1.5rem',flexWrap:'wrap'}}>
                <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{padding:'6px 14px',background:pagina===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:pagina===1?'not-allowed':'pointer',color:pagina===1?'#9ca3af':'#374151'}}>&#8249; Anterior</button>
                {Array.from({length:totalPaginas},(_,i)=>i+1).map(p=>(<button key={p} onClick={()=>setPagina(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:pagina===p?'none':'1px solid #e5e7eb',background:pagina===p?AZUL:'#fff',color:pagina===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>))}
                <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} style={{padding:'6px 14px',background:pagina===totalPaginas?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:pagina===totalPaginas?'not-allowed':'pointer',color:pagina===totalPaginas?'#9ca3af':'#374151'}}>Proximo &#8250;</button>
              </div>
            )}
            <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'1rem'}}>Mostrando {filtrados.length===0?0:((pagina-1)*POR_PAGINA)+1} - {Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length} agendamentos</p>
            <p style={{textAlign:'center',fontSize:'11px',color:'#d1d5db',marginTop:'6px',marginBottom:'1rem'}}>© 2026 Markinvest. Todos os direitos reservados.</p>
          </>
        )}
      </div>
    </main>
  )
}
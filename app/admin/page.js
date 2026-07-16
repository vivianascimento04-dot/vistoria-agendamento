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
function mascaraTelefone(v) {
  return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{1,4})$/,'$1-$2').slice(0,15)
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
  const [empEspecial, setEmpEspecial] = useState('todos')
  const [salvandoDia, setSalvandoDia] = useState(false)
  const [horariosBloqEmp, setHorariosBloqEmp] = useState([])
  const [novoEmpBloqH, setNovoEmpBloqH] = useState('')
  const [novoHorarioBloqH, setNovoHorarioBloqH] = useState('')
  const [salvandoBloqH, setSalvandoBloqH] = useState(false)
  const [horariosBloqueadosData, setHorariosBloqueadosData] = useState([])
  const [novaDataBloqueio, setNovaDataBloqueio] = useState('')
  const [novoUltimoHorario, setNovoUltimoHorario] = useState('')
  const [novoEmpBloqueio, setNovoEmpBloqueio] = useState('todos')
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false)
  const [cpfsAutorizados, setCpfsAutorizados] = useState([])
  const [novoCpf, setNovoCpf] = useState('')
  const [nomeNovoCpf, setNomeNovoCpf] = useState('')
  const [unidadeNovoCpf, setUnidadeNovoCpf] = useState('')
  const [empNovoCpf, setEmpNovoCpf] = useState('')
  const [salvandoCpf, setSalvandoCpf] = useState(false)
  const [erroCpf, setErroCpf] = useState('')
  const [buscaCpf, setBuscaCpf] = useState('')
  const [inputBuscaCpf, setInputBuscaCpf] = useState('')
  const [filtroCpfData, setFiltroCpfData] = useState('')
  const [filtroCpfEmp, setFiltroCpfEmp] = useState('')
  const [cpfsSelecionados, setCpfsSelecionados] = useState([])
  const [cpfDatas, setCpfDatas] = useState({})
  const [novaDataCpf, setNovaDataCpf] = useState({})
  const [editandoCpf, setEditandoCpf] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [unidadeEditando, setUnidadeEditando] = useState('')
  const [empEditando, setEmpEditando] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [horarioSelecionado, setHorarioSelecionado] = useState({})
  const [cpfsExpandidos, setCpfsExpandidos] = useState(new Set())
  const [cpfsVerAgend, setCpfsVerAgend] = useState(new Set())
  const [empAtribuir, setEmpAtribuir] = useState('')
  const [atribuindoEmpMassa, setAtribuindoEmpMassa] = useState(false)
  const [revEmp, setRevEmp] = useState('')
  const [revData, setRevData] = useState('')
  const [revHorario, setRevHorario] = useState('')
  const [revUnidades, setRevUnidades] = useState([{unidade:'',nome:''}])
  const [salvandoRev, setSalvandoRev] = useState(false)
  const [erroRev, setErroRev] = useState('')
  const [revistorias, setRevistorias] = useState([])
  const [filtroRevEmp, setFiltroRevEmp] = useState('')
  const [paginaRev, setPaginaRev] = useState(1)
  const [visualizacaoRev, setVisualizacaoRev] = useState('agenda')
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [anoRev, setAnoRev] = useState(new Date().getFullYear())
  const [mesRev, setMesRev] = useState(new Date().getMonth())
  const [emailAssunto, setEmailAssunto] = useState('')
  const [emailMensagem, setEmailMensagem] = useState('')
  const [emailDestinatarios, setEmailDestinatarios] = useState([])
  const [emailManual, setEmailManual] = useState('')
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [emailResultado, setEmailResultado] = useState(null)
  const [emailFiltroEmp, setEmailFiltroEmp] = useState('')
  const [emailFiltroStatus, setEmailFiltroStatus] = useState('confirmado')
  const [templateEmp, setTemplateEmp] = useState('')
  const [templateData, setTemplateData] = useState('')
  const [templateMostrar, setTemplateMostrar] = useState(false)
  const [emailsLog, setEmailsLog] = useState([])
  const [loadingLog, setLoadingLog] = useState(false)
  const [mostrarLog, setMostrarLog] = useState(false)
  const [editandoRevGrupo, setEditandoRevGrupo] = useState(null)
  const [editRevData, setEditRevData] = useState('')
  const [editRevHorario, setEditRevHorario] = useState('')
  const [salvandoEditRev, setSalvandoEditRev] = useState(false)
  const [configDiasSemana, setConfigDiasSemana] = useState({seg:true,ter:true,qua:true,qui:true,sex:true,sab:false,dom:false})
  const [configHoraInicio, setConfigHoraInicio] = useState('08:00')
  const [configHoraFim, setConfigHoraFim] = useState('17:30')
  const [configIntervalo, setConfigIntervalo] = useState(60)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [configSucesso, setConfigSucesso] = useState(false)

  // Estados Entrega de Chaves
  const [entregaCpfs, setEntregaCpfs] = useState([])
  const [entregaAgendamentos, setEntregaAgendamentos] = useState([])
  const [entregaDias, setEntregaDias] = useState([])
  const [entregaFiltroEmp, setEntregaFiltroEmp] = useState('')
  const [entregaFiltroData, setEntregaFiltroData] = useState('')
  const [entregaHorarios, setEntregaHorarios] = useState([])
  const [entregaDataSel, setEntregaDataSel] = useState(null)
  const [entregaHorarioSel, setEntregaHorarioSel] = useState(null)
  const [entregaSlotSel, setEntregaSlotSel] = useState(null)
  const [entregaAno, setEntregaAno] = useState(new Date().getFullYear())
  const [entregaMes, setEntregaMes] = useState(new Date().getMonth())
  const [entregaDiasLiberados, setEntregaDiasLiberados] = useState([])
  const [entregaDiasCheios, setEntregaDiasCheios] = useState([])
  const [entregaSubAba, setEntregaSubAba] = useState('agenda')
  const [entregaNovaData, setEntregaNovaData] = useState('')
  const [entregaNovoEmp, setEntregaNovoEmp] = useState('')
  const [salvandoEntregaDia, setSalvandoEntregaDia] = useState(false)
  const [entregaFormManual, setEntregaFormManual] = useState({nome:'',cpf:'',email:'',telefone:'',unidade:''})
  const [salvandoEntregaManual, setSalvandoEntregaManual] = useState(false)
  const [erroEntregaManual, setErroEntregaManual] = useState('')
  const [entregaCpfNovo, setEntregaCpfNovo] = useState('')
  const [entregaCpfNome, setEntregaCpfNome] = useState('')
  const [entregaCpfUnidade, setEntregaCpfUnidade] = useState('')
  const [entregaCpfEmp, setEntregaCpfEmp] = useState('')
  const [entregaCpfEmail, setEntregaCpfEmail] = useState('')
  const [entregaCpfTelefone, setEntregaCpfTelefone] = useState('')
  const [salvandoEntregaCpf, setSalvandoEntregaCpf] = useState(false)
  const [erroEntregaCpf, setErroEntregaCpf] = useState('')
  const [entregaCpfBusca, setEntregaCpfBusca] = useState('')
  const [entregaCpfsSel, setEntregaCpfsSel] = useState([])
  const [entregaEditandoCpf, setEntregaEditandoCpf] = useState(null)
  const [entregaEditNome, setEntregaEditNome] = useState('')
  const [entregaEditUnidade, setEntregaEditUnidade] = useState('')
  const [entregaEditEmp, setEntregaEditEmp] = useState('')
  const [entregaEditEmail, setEntregaEditEmail] = useState('')
  const [entregaEditTelefone, setEntregaEditTelefone] = useState('')
  const [enviandoTokens, setEnviandoTokens] = useState(false)
  const [entregaRelFiltroEmp, setEntregaRelFiltroEmp] = useState('')
  const [entregaRelFiltroStatus, setEntregaRelFiltroStatus] = useState('todos')
  const [entregaRelFiltroDataInicio, setEntregaRelFiltroDataInicio] = useState('')
  const [entregaRelFiltroDataFim, setEntregaRelFiltroDataFim] = useState('')
  const [gerandoPDFEntrega, setGerandoPDFEntrega] = useState(false)
  const [entregaTemplateEmp, setEntregaTemplateEmp] = useState('')
  const [entregaTemplateData, setEntregaTemplateData] = useState('')
  const [entregaTemplateMostrar, setEntregaTemplateMostrar] = useState(false)
  const [entregaEmailAssunto, setEntregaEmailAssunto] = useState('')
  const [entregaEmailMensagem, setEntregaEmailMensagem] = useState('')
  const [entregaEmailDestinatarios, setEntregaEmailDestinatarios] = useState([])
  const [entregaEmailManual, setEntregaEmailManual] = useState('')
  const [enviandoEntregaEmail, setEnviandoEntregaEmail] = useState(false)
  const [entregaEmailResultado, setEntregaEmailResultado] = useState(null)
  const [mostrarPreviewEmail, setMostrarPreviewEmail] = useState(false)
  const [mostrarEnvioEmail, setMostrarEnvioEmail] = useState(false)
  const [tokenResultado, setTokenResultado] = useState(null)
  const [entregaCpfsFiltroEmp, setEntregaCpfsFiltroEmp] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status])
  useEffect(() => {
    if (status === 'authenticated') {
      buscarAgendamentos(); buscarEmpreendimentos(); buscarMesesBloqueados()
      buscarHorariosConfig(); buscarDiasEspeciais(); buscarHorariosBloqueadosData(); buscarCpfsAutorizados(); buscarHorariosBloqEmp()
    }
  }, [status])
  useEffect(() => { setPagina(1) }, [filtro, busca, ordem, dataInicio, dataFim, filtroEmp])
  useEffect(() => { setPaginaCpf(1) }, [buscaCpf, filtroCpfData, filtroCpfEmp, inputBuscaCpf])
  useEffect(() => { if (abaAtiva === 'revistorias') buscarRevistorias()
    if (abaAtiva === 'entrega') { buscarEntregaCpfs(); buscarEntregaAgendamentos(); buscarEntregaDias() }
  }, [abaAtiva])

  async function buscarAgendamentos() {
    try { const res = await fetch('/api/agendamentos'); const data = await res.json(); setAgendamentos(Array.isArray(data)?data:[]) } catch(e) { setAgendamentos([]) }
    setLoading(false)
  }
  async function buscarRevistorias() {
    try { const res = await fetch('/api/agendamentos'); const data = await res.json(); setRevistorias((Array.isArray(data)?data:[]).filter(a=>a.tipo==='revistoria')) } catch(e) { setRevistorias([]) }
  }
  async function salvarRevistoria() {
    if (!revEmp||!revData||!revHorario) { setErroRev('Preencha empreendimento, data e horario.'); return }
    const unidadesValidas = revUnidades.filter(u=>u.unidade.trim()&&u.nome.trim())
    if (unidadesValidas.length===0) { setErroRev('Adicione pelo menos uma unidade com nome.'); return }
    setSalvandoRev(true); setErroRev('')
    try {
      for (const u of unidadesValidas) {
        await fetch('/api/agendamentos', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ nome:u.nome, cpf:'000.000.000-00', email:'revistoria@markinvest.com.br', telefone:'(00) 00000-0000',
            apartamento:revEmp+' - '+u.unidade, data:revData, horario:revHorario,
            nome_acompanhante:'-', cpf_acompanhante:'000.000.000-00', tipo:'revistoria' }) })
      }
      setRevEmp(''); setRevData(''); setRevHorario(''); setRevUnidades([{unidade:'',nome:''}])
      buscarRevistorias(); buscarAgendamentos()
    } catch(e) { setErroRev('Erro ao salvar. Tente novamente.') }
    setSalvandoRev(false)
  }

  async function buscarEmailsLog() {
    setLoadingLog(true)
    try { const res = await fetch('/api/enviar-email'); const data = await res.json(); setEmailsLog(Array.isArray(data)?data:[]) } catch(e) { setEmailsLog([]) }
    setLoadingLog(false)
  }

  function aplicarTemplate() {
    if (!templateEmp||!templateData) { alert('Preencha o empreendimento e a data.'); return }
    const dataObj = new Date(templateData+'T12:00:00')
    const dataFmt = dataObj.toLocaleDateString('pt-BR')
    const diasSemana = ['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado']
    const diaSemana = diasSemana[dataObj.getDay()]
    setEmailAssunto('Sua unidade foi liberada para Vistoria - '+templateEmp)
    setEmailMensagem('Prezado(a) Cliente,\n\n\nTemos uma excelente noticia: SUA UNIDADE no '+templateEmp+' acaba de ser LIBERADA pela Engenharia para a fase de VISTORIA\n\nComo estamos trabalhando para antecipar a entrega do empreendimento as vistorias estao ocorrendo em ritmo acelerado.\n\nPor isso, a agenda foi aberta agora para voce realizar o seu agendamento direto, conforme sua conveniencia.\n\nIMPORTANTE: As vagas sao limitadas e preenchidas por ordem de acesso. Recomendamos que realize o seu agendamento imediatamente para garantir os horarios disponiveis no cronograma atual.\n\nCOMO AGENDAR?\nClique no link abaixo e escolha o melhor horario para voce no dia '+dataFmt+' ('+diaSemana+').\nhttps://vistoria-agendamento.vercel.app/markinvest\n\nORIENTACOES:\nPara que possamos realizar sua vistoria sem imprevistos, observe as regras obrigatorias de obra:\n\n· Documentacao: Apresentacao indispensavel de documento oficial com foto (RG ou CNH).\n\n· Participacao: Restrita aos titulares do contrato ou representantes legais (munidos de procuracao com poderes expressos para acompanhamento da vistoria e firma reconhecida ou copia autenticada de procuracao publica com amplos poderes). E permitido apenas 01 acompanhante maior de idade. Profissionais tecnicos (Engenheiro/Arquiteto) devem apresentar a carteira do conselho (CREA/CAU) e a ART, de forma indispensavel.\n\n· Trajes e Seguranca: Por estarmos em um canteiro de obras, e obrigatorio o uso de calcados fechados e sem salto. O acesso sera impedido caso o calcado seja inadequado. Recomendamos calca comprida e roupas confortaveis.\n\n· Restricoes: Nao sera permitida a entrada de criancas menores de 12 anos ou animais domesticos.\n\n· Pontualidade: A vistoria tem duracao de 50 minutos. Solicitamos chegada com 10 minutos de antecedencia. Atrasos serao descontados do tempo total de vistoria de modo a nao impactar o cronograma e, atrasos superiores a 30 minutos implicarao no cancelamento com novo agendamento para o final do cronograma geral.\n\n\nLocalizacao: Avenida Francisco de Paula Leite, n.o 466 (entrada principal - acesso de pedestres).\n\nCorra e garanta seu horario! Estamos ansiosos para te mostrar cada detalhe do seu novo imovel\n\nEm caso de duvidas, nossa Central de Relacionamento permanece a disposicao.')
    setTemplateMostrar(false)
  }

  async function enviarEmailCustomizado() {
    if (emailDestinatarios.length === 0 && !emailManual.trim()) { alert('Adicione ao menos um destinatario.'); return }
    if (!emailAssunto.trim() || !emailMensagem.trim()) { alert('Preencha o assunto e a mensagem.'); return }
    setEnviandoEmail(true); setEmailResultado(null)
    try {
      const extras = emailManual.trim() ? emailManual.split(',').map(e=>e.trim()).filter(e=>e.includes('@')) : []
      const todos = [...new Set([...emailDestinatarios,...extras])]
      const res = await fetch('/api/enviar-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({destinatarios:todos,assunto:emailAssunto,mensagem:emailMensagem}) })
      const data = await res.json()
      setEmailResultado(data)
      if (data.success) { setEmailDestinatarios([]); setEmailManual(''); setEmailAssunto(''); setEmailMensagem(''); setTemplateEmp(''); setTemplateData('') }
    } catch(e) { setEmailResultado({error:'Erro de conexao.'}) }
    setEnviandoEmail(false)
  }

  async function removerRevistoria(id) {
    if (!confirm('Remover esta revistoria?')) return
    try {
      const res = await fetch('/api/agendamentos/'+id, { method:'DELETE' })
      if (!res.ok) { const err = await res.json().catch(()=>({})); alert('Erro ao remover: '+(err.error||'tente novamente')); return }
      buscarRevistorias(); buscarAgendamentos()
    } catch(e) { alert('Erro de conexao.') }
  }
  async function salvarEdicaoRevistoria(ids, novaData, novoHorario) {
    if (!novaData||!novoHorario) return
    setSalvandoEditRev(true)
    try {
      for (const id of ids) { await fetch('/api/agendamentos/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({data:novaData,horario:novoHorario}) }) }
      setEditandoRevGrupo(null); setEditRevData(''); setEditRevHorario(''); buscarRevistorias(); buscarAgendamentos()
    } catch(e) {}
    setSalvandoEditRev(false)
  }
  function adicionarLinhaUnidade() { setRevUnidades(prev=>[...prev,{unidade:'',nome:''}]) }
  function removerLinhaUnidade(i) { setRevUnidades(prev=>prev.filter((_,idx)=>idx!==i)) }
  function atualizarUnidade(i,campo,valor) { setRevUnidades(prev=>prev.map((u,idx)=>idx===i?{...u,[campo]:valor}:u)) }
  function toggleCpfExpandido(cpf){setCpfsExpandidos(prev=>{const next=new Set(prev);if(next.has(cpf))next.delete(cpf);else next.add(cpf);return next})}
  function toggleCpfVerAgend(cpf){setCpfsVerAgend(prev=>{const next=new Set(prev);if(next.has(cpf))next.delete(cpf);else next.add(cpf);return next})}

  async function atribuirEmpreendimentoMassa() {
    if (!cpfsSelecionados.length||!empAtribuir) return
    if (!confirm('Atribuir "'+empAtribuir+'" para '+cpfsSelecionados.length+' CPF(s)?')) return
    setAtribuindoEmpMassa(true)
    try {
      for (const cpf of cpfsSelecionados) {
        await fetch('/api/cpfs-autorizados', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cpf,empreendimento:empAtribuir}) })
      }
      setCpfsSelecionados([]); setEmpAtribuir(''); buscarCpfsAutorizados()
    } catch(e) {}
    setAtribuindoEmpMassa(false)
  }

  function exportarCSVRevistorias() {
    const cab=['Nome','Unidade','Empreendimento','Data','Horario','Status','Criado Em']
    const linhas=revFiltradas.map(r=>{const partes=(r.apartamento||'').split(' - ');return[r.nome,partes.slice(1).join(' - ')||'',partes[0]||'',new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'),(r.horario||'').slice(0,5),r.status,r.criado_em?new Date(r.criado_em).toLocaleString('pt-BR'):'']})
    const csv=[cab,...linhas].map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='revistorias-'+new Date().toISOString().split('T')[0]+'.csv'; link.click(); URL.revokeObjectURL(url)
  }
  async function gerarPDFRevistorias() {
    setGerandoPDFRev(true)
    try {
      const script=document.createElement('script'); script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(script)
      await new Promise((res,rej)=>{script.onload=res;script.onerror=rej})
      const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const W=297,M=12; let y=0
      doc.setFillColor(27,47,126); doc.rect(0,0,W,32,'F'); doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('MARKINVEST',W/2,13,{align:'center'}); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text('Relatorio de Revistorias',W/2,21,{align:'center'}); doc.setFontSize(7.5); doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W/2,28,{align:'center'}); y=38
      doc.setFillColor(240,243,250); doc.rect(M,y-4,W-M*2,10,'F'); doc.setTextColor(60,60,100); doc.setFontSize(7.5); doc.setFont('helvetica','italic')
      let ftxt='Total: '+revFiltradas.length+' revistoria(s)'; if(filtroRevEmp) ftxt+=' | Empreendimento: '+filtroRevEmp; doc.text(ftxt,M+3,y+2); y+=12
      const cols=[{x:M,label:'NOME'},{x:M+50,label:'UNIDADE'},{x:M+100,label:'EMPREENDIMENTO'},{x:M+160,label:'DATA'},{x:M+185,label:'HORA'},{x:M+200,label:'STATUS'},{x:M+220,label:'CRIADO EM'}]
      doc.setFillColor(27,47,126); doc.rect(M,y,W-M*2,8,'F'); doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold'); cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5)); y+=9; doc.setFont('helvetica','normal')
      revFiltradas.forEach((r,idx)=>{
        if(y>185){doc.addPage();y=15;doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')}
        const rowH=8; if(idx%2===0){doc.setFillColor(247,249,255);doc.rect(M,y,W-M*2,rowH,'F')}
        doc.setDrawColor(220,225,240); doc.line(M,y+rowH,W-M,y+rowH); doc.setFontSize(7.5)
        const partes=(r.apartamento||'').split(' - '); const emp=partes[0]||''; const unidade=partes.slice(1).join(' - ')||''
        doc.setTextColor(30,30,30); doc.setFont('helvetica','bold'); doc.text((r.nome||'').slice(0,22),cols[0].x+1,y+5.5)
        doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60); doc.text(unidade.slice(0,24),cols[1].x+1,y+5.5); doc.setTextColor(27,47,126); doc.text(emp.slice(0,24),cols[2].x+1,y+5.5)
        doc.setFont('helvetica','bold'); doc.text(new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'),cols[3].x+1,y+5.5); doc.text((r.horario||'').slice(0,5),cols[4].x+1,y+5.5)
        const cancelado=r.status==='cancelado'
        if(cancelado){doc.setFillColor(254,226,226);doc.rect(cols[5].x,y+1.5,18,5.5,'F');doc.setTextColor(180,30,30)}else{doc.setFillColor(220,252,231);doc.rect(cols[5].x,y+1.5,18,5.5,'F');doc.setTextColor(22,101,52)}
        doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.text(cancelado?'CANCEL.':'CONF.',cols[5].x+1,y+5.5)
        const criadoEm=r.criado_em?new Date(r.criado_em):null
        if(criadoEm){doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);doc.text(criadoEm.toLocaleDateString('pt-BR')+' '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),cols[6].x+1,y+5.5)}
        y+=rowH
      })
      const total=doc.getNumberOfPages(); for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(27,47,126);doc.rect(0,200,W,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo',W/2,204.5,{align:'center'});doc.text('Pagina '+i+' de '+total,W-M,204.5,{align:'right'})}
      doc.save('revistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e) { console.error(e); alert('Erro ao gerar PDF.') }
    setGerandoPDFRev(false)
  }

  async function buscarEmpreendimentos() { try{const res=await fetch('/api/empreendimentos');const data=await res.json();setEmpreendimentos(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarMesesBloqueados() { try{const res=await fetch('/api/meses-bloqueados');const data=await res.json();setMesesBloqueados(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarHorariosConfig() { try{const res=await fetch('/api/horarios-config');const data=await res.json();setHorariosConfig(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarDiasEspeciais() { try{const res=await fetch('/api/dias-especiais');const data=await res.json();setDiasEspeciais(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarHorariosBloqueadosData() { try{const res=await fetch('/api/horarios-bloqueados-data');const data=await res.json();setHorariosBloqueadosData(Array.isArray(data)?data:[])}catch(e){} }
  async function salvarBloqueioData() {
    if(!novaDataBloqueio||!novoUltimoHorario)return; setSalvandoBloqueio(true)
    try{await fetch('/api/horarios-bloqueados-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:novaDataBloqueio,ultimo_horario:novoUltimoHorario,empreendimento:novoEmpBloqueio||'todos'})});setNovaDataBloqueio('');setNovoUltimoHorario('');setNovoEmpBloqueio('todos');buscarHorariosBloqueadosData()}catch(e){}
    setSalvandoBloqueio(false)
  }
  async function removerBloqueioData(id) { try{await fetch('/api/horarios-bloqueados-data',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});buscarHorariosBloqueadosData()}catch(e){} }
  async function buscarCpfsAutorizados() {
    try{
      const res=await fetch('/api/cpfs-autorizados');const data=await res.json();setCpfsAutorizados(Array.isArray(data)?data:[])
      const resDatas=await fetch('/api/cpf-datas');const datas=await resDatas.json()
      const porCpf={}; if(Array.isArray(datas))datas.forEach(d=>{if(!porCpf[d.cpf])porCpf[d.cpf]=[];porCpf[d.cpf].push({data:d.data,horarios:d.horarios||[]})})
      setCpfDatas(porCpf)
    }catch(e){}
  }
  async function adicionarDataCpf(cpf){const data=novaDataCpf[cpf];if(!data)return;try{await fetch('/api/cpf-datas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,data})});setNovaDataCpf(prev=>({...prev,[cpf]:''}));buscarCpfsAutorizados()}catch(e){}}
  async function removerDataCpf(cpf,data){try{await fetch('/api/cpf-datas',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,data})});buscarCpfsAutorizados()}catch(e){}}
  async function adicionarHorarioCpf(cpf,data,horarioInicio,horarioFim){
    if(!horarioInicio)return
    const entrada=cpfDatas[cpf]?.find(d=>d.data===data);const idxI=HORARIOS_DISPONIVEIS.indexOf(horarioInicio);const idxF=horarioFim?HORARIOS_DISPONIVEIS.indexOf(horarioFim):idxI
    const novosHorarios=[...new Set([...(entrada?.horarios||[]),...HORARIOS_DISPONIVEIS.slice(idxI,idxF+1)])].sort()
    try{await fetch('/api/cpf-datas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,data,horarios:novosHorarios})});setHorarioSelecionado(prev=>({...prev,[cpf+'_'+data]:'',[cpf+'_'+data+'_fim']:''}));buscarCpfsAutorizados()}catch(e){}
  }
  async function removerHorarioCpf(cpf,data,horario){const entrada=cpfDatas[cpf]?.find(d=>d.data===data);try{await fetch('/api/cpf-datas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,data,horarios:(entrada?.horarios||[]).filter(h=>h!==horario)})});buscarCpfsAutorizados()}catch(e){}}
  async function salvarEdicaoCpf(){if(!editandoCpf)return;setSalvandoEdicao(true);try{await fetch('/api/cpfs-autorizados',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:editandoCpf,nome:nomeEditando,unidade:unidadeEditando,empreendimento:empEditando})});setEditandoCpf(null);setNomeEditando('');setUnidadeEditando('');setEmpEditando('');buscarCpfsAutorizados()}catch(e){};setSalvandoEdicao(false)}
  async function adicionarCpf(){
    if(!novoCpf.trim())return;setSalvandoCpf(true);setErroCpf('')
    try{const res=await fetch('/api/cpfs-autorizados',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:novoCpf,nome:nomeNovoCpf,unidade:unidadeNovoCpf,empreendimento:empNovoCpf})});if(res.ok){setNovoCpf('');setNomeNovoCpf('');setUnidadeNovoCpf('');setEmpNovoCpf('');buscarCpfsAutorizados()}else{const d=await res.json();setErroCpf(d.error||'Erro ao salvar.')}}catch(e){setErroCpf('Erro de conexao.')}
    setSalvandoCpf(false)
  }
  async function removerCpf(cpf){if(!confirm('Remover CPF '+cpf+'?'))return;try{await fetch('/api/cpfs-autorizados',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf})});await fetch('/api/cpf-datas',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,todos_cpf:true})});buscarCpfsAutorizados()}catch(e){}}
  async function removerCpfsSelecionados(){
    if(!cpfsSelecionados.length)return;if(!confirm('Remover '+cpfsSelecionados.length+' CPF(s)?'))return
    try{await fetch('/api/cpfs-autorizados',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpfs:cpfsSelecionados})});for(const cpf of cpfsSelecionados)await fetch('/api/cpf-datas',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf,todos_cpf:true})});setCpfsSelecionados([]);buscarCpfsAutorizados()}catch(e){}
  }
  async function removerTodosCpfs(){if(!confirm('Remover TODOS os CPFs?'))return;try{await fetch('/api/cpfs-autorizados',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({todos:true})});setCpfsSelecionados([]);buscarCpfsAutorizados()}catch(e){}}
  async function toggleMes(anoMes){setSalvandoMes(true);try{const bloqueado=mesesBloqueados.includes(anoMes);await fetch('/api/meses-bloqueados',{method:bloqueado?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ano_mes:anoMes})});buscarMesesBloqueados()}catch(e){};setSalvandoMes(false)}
  async function toggleHorario(horario,ativo){setSalvandoHorario(true);try{await fetch('/api/horarios-config',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({horario,ativo:!ativo})});buscarHorariosConfig()}catch(e){};setSalvandoHorario(false)}
  async function adicionarDiaEspecial(tipo){
    if(!dataInicioEspecial||!dataFimEspecial)return;setSalvandoDia(true)
    try{await fetch('/api/dias-especiais',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data_inicio:dataInicioEspecial,data_fim:dataFimEspecial,tipo,observacao:obsEspecial,empreendimento:empEspecial})});setDataInicioEspecial('');setDataFimEspecial('');setObsEspecial('');setEmpEspecial('todos');buscarDiasEspeciais()}catch(e){}
    setSalvandoDia(false)
  }
  async function buscarHorariosBloqEmp() { try{const res=await fetch('/api/horarios-bloqueados-emp');const data=await res.json();setHorariosBloqEmp(Array.isArray(data)?data:[])}catch(e){} }
  async function adicionarHorarioBloqEmp() {
    if(!novoEmpBloqH||!novoHorarioBloqH)return; setSalvandoBloqH(true)
    try{const res=await fetch('/api/horarios-bloqueados-emp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({empreendimento:novoEmpBloqH,horario:novoHorarioBloqH})});if(res.ok){setNovoEmpBloqH('');setNovoHorarioBloqH('');buscarHorariosBloqEmp()}}catch(e){}
    setSalvandoBloqH(false)
  }
  async function removerHorarioBloqEmp(id){try{await fetch('/api/horarios-bloqueados-emp',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});buscarHorariosBloqEmp()}catch(e){}}
  async function removerDiaEspecial(id){try{await fetch('/api/dias-especiais',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});buscarDiasEspeciais()}catch(e){}}
  async function adicionarEmpreendimento(){
    if(!novoEmp.trim())return;setSalvandoEmp(true);setErroEmp('')
    try{const res=await fetch('/api/empreendimentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:novoEmp.trim()})});if(res.ok){setNovoEmp('');buscarEmpreendimentos()}else{const d=await res.json();setErroEmp(d.error||'Erro ao salvar.')}}catch(e){setErroEmp('Erro de conexao.')}
    setSalvandoEmp(false)
  }
  async function removerEmpreendimento(nome){if(!confirm('Remover "'+nome+'"?'))return;try{await fetch('/api/empreendimentos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome})});buscarEmpreendimentos()}catch(e){}}
  function confirmarCancelamento(a){setPopup(a);setMotivoCancelamento('');setObsCancelamento('');setErroMotivo(false)}
  async function executarCancelamento(){
    if(!popup)return;if(!motivoCancelamento||motivoCancelamento==='Selecione o motivo'){setErroMotivo(true);return}
    try{const res=await fetch('/api/agendamentos/'+popup.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'cancelado',motivo_cancelamento:motivoCancelamento,obs_cancelamento:obsCancelamento})});if(res.ok)buscarAgendamentos();else alert('Erro ao cancelar.')}catch(e){alert('Erro de conexao.')}
    setPopup(null)
  }
  async function atualizarStatus(id,novoStatus){try{const res=await fetch('/api/agendamentos/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:novoStatus})});if(res.ok)buscarAgendamentos();else alert('Erro ao atualizar.')}catch(e){alert('Erro de conexao.')}}

  function exportarRelatorioGeral() {
    const cab=['Tipo','Nome','Unidade','Empreendimento','Data','Horario','Status','Email','Telefone','Criado Em']
    const linhasNormais=agendamentos.filter(a=>a.tipo!=='revistoria').map(a=>{const partes=(a.apartamento||'').split(' - ');return['Vistoria',a.nome,partes.slice(1).join(' - ')||'',partes[0]||'',new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),(a.horario||'').slice(0,5),a.status,a.email||'',a.telefone||'',a.criado_em?new Date(a.criado_em).toLocaleString('pt-BR'):'']})
    const linhasRev=revistorias.filter(r=>r.status==='confirmado').map(r=>{const partes=(r.apartamento||'').split(' - ');return['Revistoria',r.nome,partes.slice(1).join(' - ')||'',partes[0]||'',new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'),(r.horario||'').slice(0,5),r.status,'-','-',r.criado_em?new Date(r.criado_em).toLocaleString('pt-BR'):'']})
    const todas=[...linhasNormais,...linhasRev].sort((a,b)=>a[4]<b[4]?-1:1)
    const csv=[cab,...todas].map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='relatorio-geral-'+new Date().toISOString().split('T')[0]+'.csv';link.click();URL.revokeObjectURL(url)
  }
  function exportarCSV(){
    const cab=['Nome','CPF','Email','Telefone','Apartamento','Data Vistoria','Horario','Status','Motivo Cancelamento','Obs Cancelamento','Criado Em','Acompanhante','CPF Acompanhante']
    const linhas=filtrados.map(a=>[a.nome,a.cpf||'',a.email,a.telefone,a.apartamento,new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),a.horario?.slice(0,5),a.status,a.motivo_cancelamento||'',a.obs_cancelamento||'',a.criado_em?new Date(a.criado_em).toLocaleString('pt-BR'):'',a.nome_acompanhante||'',a.cpf_acompanhante||''])
    const csv=[cab,...linhas].map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='relatorio-'+new Date().toISOString().split('T')[0]+'.csv';link.click();URL.revokeObjectURL(url)
  }
  async function gerarPDF(){
    setGerandoPDF(true)
    try{
      const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';document.head.appendChild(script)
      await new Promise((res,rej)=>{script.onload=res;script.onerror=rej})
      const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const W=297,M=12;let y=0
      doc.setFillColor(27,47,126);doc.rect(0,0,W,32,'F');doc.setTextColor(255,255,255);doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('MARKINVEST',W/2,13,{align:'center'});doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('Relatorio de Agendamentos de Vistoria',W/2,21,{align:'center'});doc.setFontSize(7.5);doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W/2,28,{align:'center'});y=38
      doc.setFillColor(240,243,250);doc.rect(M,y-4,W-M*2,10,'F');doc.setTextColor(60,60,100);doc.setFontSize(7.5);doc.setFont('helvetica','italic')
      let ftxt='Filtros: Status = '+(filtro==='todos'?'Todos':filtro);if(filtroEmp)ftxt+=' | Empreendimento: '+filtroEmp;if(dataInicio)ftxt+=' | De: '+new Date(dataInicio+'T12:00:00').toLocaleDateString('pt-BR');if(dataFim)ftxt+=' | Ate: '+new Date(dataFim+'T12:00:00').toLocaleDateString('pt-BR');ftxt+=' | Total: '+filtrados.length+' registro(s)';doc.text(ftxt,M+3,y+2);y+=12
      const cols=[{x:M,label:'NOME'},{x:M+34,label:'EMPREENDIMENTO'},{x:M+62,label:'UNIDADE'},{x:M+118,label:'DATA'},{x:M+138,label:'HORA'},{x:M+150,label:'TELEFONE'},{x:M+176,label:'AGENDADO EM'},{x:M+206,label:'STATUS'},{x:M+222,label:'MOTIVO'}]
      doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFontSize(7.5);doc.setFont('helvetica','bold');cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')
      filtrados.forEach((a,idx)=>{
        if(y>185){doc.addPage();y=15;doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')}
        const rowH=8;if(idx%2===0){doc.setFillColor(247,249,255);doc.rect(M,y,W-M*2,rowH,'F')};doc.setDrawColor(220,225,240);doc.line(M,y+rowH,W-M,y+rowH);doc.setFontSize(7.5);doc.setTextColor(30,30,30);doc.setFont('helvetica','bold');doc.text((a.nome||'').slice(0,17),cols[0].x+1,y+5.5)
        const partes=a.apartamento?.split(' - ')||[];doc.setFont('helvetica','normal');doc.setTextColor(27,47,126);doc.text((partes[0]||'').slice(0,15),cols[1].x+1,y+5.5);doc.setTextColor(60,60,60);doc.text((partes.slice(1).join(' - ')||a.apartamento||'').slice(0,42),cols[2].x+1,y+5.5);doc.setTextColor(27,47,126);doc.setFont('helvetica','bold');doc.text(new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),cols[3].x+1,y+5.5);doc.text((a.horario||'').slice(0,5),cols[4].x+1,y+5.5);doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);doc.text((a.telefone||'').slice(0,14),cols[5].x+1,y+5.5)
        const criadoEm=a.criado_em?new Date(a.criado_em):null;doc.setTextColor(100,100,100);doc.text(criadoEm?criadoEm.toLocaleDateString('pt-BR')+' '+criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'-',cols[6].x+1,y+5.5)
        const cancelado=a.status==='cancelado';if(cancelado){doc.setFillColor(254,226,226);doc.rect(cols[7].x,y+1.5,15,5.5,'F');doc.setTextColor(180,30,30)}else{doc.setFillColor(220,252,231);doc.rect(cols[7].x,y+1.5,15,5.5,'F');doc.setTextColor(22,101,52)};doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.text(cancelado?'CANCEL.':'CONF.',cols[7].x+1,y+5.5)
        if(cancelado&&a.motivo_cancelamento){doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(180,30,30);doc.text((a.motivo_cancelamento||'').slice(0,22),cols[8].x+1,y+5.5)};y+=rowH
      })
      const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(27,47,126);doc.rect(0,200,W,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo',W/2,204.5,{align:'center'});doc.text('Pagina '+i+' de '+total,W-M,204.5,{align:'right'})}
      doc.save('relatorio-vistorias-'+new Date().toISOString().split('T')[0]+'.pdf')
    }catch(e){console.error(e);alert('Erro ao gerar PDF.')}
    setGerandoPDF(false)
  }

  async function buscarEntregaCpfs() { try{const res=await fetch('/api/entrega-cpfs');const data=await res.json();setEntregaCpfs(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarEntregaAgendamentos() { try{const res=await fetch('/api/entrega-agendamentos');const data=await res.json();setEntregaAgendamentos(Array.isArray(data)?data:[])}catch(e){} }
  async function buscarEntregaDias() { try{const res=await fetch('/api/entrega-dias');const data=await res.json();setEntregaDias(Array.isArray(data)?data:[])}catch(e){} }
  async function carregarEntregaMes(a,m,emp) {
    if(!emp)return
    const mesStr=a+'-'+String(m+1).padStart(2,'0')
    try{const res=await fetch('/api/entrega-horarios?mes='+mesStr+'&empreendimento='+encodeURIComponent(emp));const data=await res.json();setEntregaDiasLiberados(data.diasLiberados||[]);setEntregaDiasCheios(data.diasCheios||[])}catch(e){}
  }
  async function carregarEntregaHorarios(ds,emp) {
    if(!ds||!emp)return
    try{const res=await fetch('/api/entrega-horarios?data='+ds+'&empreendimento='+encodeURIComponent(emp));const data=await res.json();setEntregaHorarios(Array.isArray(data)?data:[])}catch(e){}
  }
  async function liberarEntregaDia() {
    if(!entregaNovaData||!entregaNovoEmp)return; setSalvandoEntregaDia(true)
    try{await fetch('/api/entrega-dias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({empreendimento:entregaNovoEmp,data:entregaNovaData})});setEntregaNovaData('');buscarEntregaDias();carregarEntregaMes(entregaAno,entregaMes,entregaNovoEmp)}catch(e){}
    setSalvandoEntregaDia(false)
  }
  async function removerEntregaDia(id) { try{await fetch('/api/entrega-dias',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});buscarEntregaDias();if(entregaFiltroEmp)carregarEntregaMes(entregaAno,entregaMes,entregaFiltroEmp)}catch(e){} }
  async function salvarEntregaManual() {
    const {nome,cpf,email,telefone,unidade}=entregaFormManual
    if(!nome||!cpf||!email||!telefone||!unidade||!entregaFiltroEmp||!entregaDataSel||!entregaHorarioSel){setErroEntregaManual('Preencha todos os campos.');return}
    setSalvandoEntregaManual(true);setErroEntregaManual('')
    try{
      const res=await fetch('/api/entrega-agendamentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome,cpf:cpf.replace(/\D/g,''),email,telefone,empreendimento:entregaFiltroEmp,unidade,data:entregaDataSel,horario:entregaHorarioSel})})
      const data=await res.json()
      if(res.ok){setEntregaFormManual({nome:'',cpf:'',email:'',telefone:'',unidade:''});buscarEntregaAgendamentos();carregarEntregaHorarios(entregaDataSel,entregaFiltroEmp)}
      else setErroEntregaManual(data.error||'Erro ao salvar.')
    }catch(e){setErroEntregaManual('Erro de conexao.')}
    setSalvandoEntregaManual(false)
  }
  async function cancelarEntrega(id) {
    if(!confirm('Cancelar este agendamento de entrega?'))return
    try{await fetch('/api/entrega-agendamentos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'cancelado'})});buscarEntregaAgendamentos();if(entregaDataSel&&entregaFiltroEmp)carregarEntregaHorarios(entregaDataSel,entregaFiltroEmp)}catch(e){}
  }
  async function reativarEntrega(id) {
    try{await fetch('/api/entrega-agendamentos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'confirmado'})});buscarEntregaAgendamentos();if(entregaDataSel&&entregaFiltroEmp)carregarEntregaHorarios(entregaDataSel,entregaFiltroEmp)}catch(e){}
  }
  async function adicionarEntregaCpf() {
    if(!entregaCpfNovo.trim())return; setSalvandoEntregaCpf(true); setErroEntregaCpf('')
    try{const res=await fetch('/api/entrega-cpfs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:entregaCpfNovo,nome:entregaCpfNome,unidade:entregaCpfUnidade,empreendimento:entregaCpfEmp,email:entregaCpfEmail,telefone:entregaCpfTelefone})});if(res.ok){setEntregaCpfNovo('');setEntregaCpfNome('');setEntregaCpfUnidade('');setEntregaCpfEmp('');setEntregaCpfEmail('');setEntregaCpfTelefone('');buscarEntregaCpfs()}else{const d=await res.json();setErroEntregaCpf(d.error||'Erro.')}}catch(e){setErroEntregaCpf('Erro.')}
    setSalvandoEntregaCpf(false)
  }
  async function removerEntregaCpf(cpf) { if(!confirm('Remover CPF '+cpf+'?'))return;try{await fetch('/api/entrega-cpfs',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf})});buscarEntregaCpfs()}catch(e){} }
  async function salvarEdicaoEntregaCpf() {
    if(!entregaEditandoCpf)return
    try{await fetch('/api/entrega-cpfs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:entregaEditandoCpf,nome:entregaEditNome,unidade:entregaEditUnidade,empreendimento:entregaEditEmp,email:entregaEditEmail,telefone:entregaEditTelefone})});setEntregaEditandoCpf(null);buscarEntregaCpfs()}catch(e){}
  }
  async function enviarTokensEntrega() {
    if(!entregaCpfsSel.length){alert('Selecione ao menos um CPF.');return}
    if(!entregaFiltroEmp){alert('Selecione o empreendimento.');return}
    if(!confirm('Enviar link de entrega para '+entregaCpfsSel.length+' cliente(s)?'))return
    setEnviandoTokens(true); setTokenResultado(null)
    try{const res=await fetch('/api/entrega-tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpfs:entregaCpfsSel,empreendimento:entregaFiltroEmp})});const data=await res.json();setTokenResultado(data);setEntregaCpfsSel([])}catch(e){setTokenResultado({error:'Erro de conexao.'})}
    setEnviandoTokens(false)
  }

  function aplicarTemplateEntrega() {
    if (!entregaTemplateEmp||!entregaTemplateData) { alert('Preencha o empreendimento e a data.'); return }
    const dataObj = new Date(entregaTemplateData+'T12:00:00')
    const dataFmt = dataObj.toLocaleDateString('pt-BR')
    const diasSemana = ['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado']
    const diaSemana = diasSemana[dataObj.getDay()]
    setEntregaEmailAssunto('Sua Entrega de Chaves foi Liberada - '+entregaTemplateEmp)
    setEntregaEmailMensagem(`Prezado(a) cliente do ${entregaTemplateEmp},

E com grande alegria que informamos que o momento tao esperado chegou! A entrega das chaves do seu novo imovel esta prestes a acontecer. 🎉🗝️

Para garantir um atendimento exclusivo, seguro e sem filas, a entrega sera feita por meio de agendamento individual. Pedimos que leia atentamente as orientacoes abaixo para garantir o seu horario.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗓️ COMO AGENDAR O SEU HORARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Acesse o link:
👉 https://vistoria-agendamento.vercel.app/markinvest/entrega

2️⃣ Escolha seu horario: Selecione o horario de sua preferencia entre as opcoes disponiveis.

3️⃣ Confirme: Preencha os dados solicitados para finalizar a reserva do seu atendimento.

⚠️ Atencao: Os horarios sao limitados e preenchidos por ordem de acesso. Realize o seu agendamento o quanto antes.

📅 Data disponivel: ${dataFmt} (${diaSemana})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👣 PASSO A PASSO NO DIA DO EVENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Pontualidade: Chegue com apenas 10 minutos de antecedencia do seu horario reservado.
2️⃣ Assinatura: Assinatura do termo de recebimento definitivo das chaves.
3️⃣ Entrega: Recebimento do kit de chaves e manual do proprietario.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 DOCUMENTOS OBRIGATORIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apresente os seguintes documentos originais no momento do atendimento:

📌 Documento de identidade oficial com foto (RG ou CNH).
📌 Procuracao registrada em cartorio (caso o proprietario titular nao possa comparecer).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMENDACOES UTEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Evite atrasos: Como os horarios sao individuais, atrasos podem comprometer o atendimento dos proximos clientes.
👨‍👩‍👧 Acompanhantes: Sua familia sera bem-vinda!
⏱️ Duracao: Seu atendimento personalizado durara cerca de 15 minutos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parabens por esta conquista! Estamos ansiosos para entregar as chaves do seu novo lar no ${entregaTemplateEmp}. 🏠✨

Atenciosamente,
Equipe Markinvest`)
    setEntregaTemplateMostrar(false)
  }

  async function enviarEmailEntrega() {
    if (entregaEmailDestinatarios.length===0 && !entregaEmailManual.trim()) { alert('Adicione ao menos um destinatario.'); return }
    if (!entregaEmailAssunto.trim()||!entregaEmailMensagem.trim()) { alert('Preencha o assunto e a mensagem.'); return }
    setEnviandoEntregaEmail(true); setEntregaEmailResultado(null)
    try {
      const extras = entregaEmailManual.trim() ? entregaEmailManual.split(',').map(e=>e.trim()).filter(e=>e.includes('@')) : []
      const todos = [...new Set([...entregaEmailDestinatarios,...extras])]
      const res = await fetch('/api/enviar-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({destinatarios:todos,assunto:entregaEmailAssunto,mensagem:entregaEmailMensagem}) })
      const data = await res.json()
      setEntregaEmailResultado(data)
      if (data.success) { setEntregaEmailDestinatarios([]); setEntregaEmailManual(''); setEntregaEmailAssunto(''); setEntregaEmailMensagem('') }
    } catch(e) { setEntregaEmailResultado({error:'Erro de conexao.'}) }
    setEnviandoEntregaEmail(false)
  }

  function gerarLinkWhatsApp(telefone, mensagem) {
    const tel = telefone.replace(/\D/g,'')
    const telFormatado = tel.startsWith('55') ? tel : '55' + tel
    return 'https://wa.me/' + telFormatado + '?text=' + encodeURIComponent(mensagem)
  }

  function abrirWhatsAppAgendamento(a) {
    const dataFmt = new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})
    const msg1 = `🎉 Ola, ${a.nome}!

Sua entrega de chaves no *${a.empreendimento}* foi CONFIRMADA com sucesso!

📍 Unidade: ${a.unidade}
📅 Data: ${dataFmt}
⏰ Horario: ${a.horario}

📋 *ORIENTACOES IMPORTANTES:*
📄 Documento oficial com foto (RG ou CNH) — obrigatorio
👟 Calcado fechado e sem salto — obrigatorio
⏱ Chegue com 10 minutos de antecedencia

📍 *Local:* Av. Francisco de Paula Leite, 466
(Entrada principal — acesso de pedestres)

Qualquer duvida estamos a disposicao! 🏠✨
*Equipe Markinvest*`

    const msg2 = `👋 Ola, ${a.nome}!

Lembrando da sua *entrega de chaves* 🗝️

🏢 ${a.empreendimento}
🏠 Unidade: ${a.unidade}
📅 ${dataFmt}
⏰ ${a.horario}

📄 Traga documento com foto
👟 Calcado fechado obrigatorio
📍 Av. Francisco de Paula Leite, 466

Ate logo! — *Markinvest* 🏠✨`

    const opcao = window.confirm(
      'Escolha a mensagem:\n\n' +
      'OK = Confirmacao completa com instrucoes\n' +
      'CANCELAR = Lembrete simples e rapido'
    )
    window.open(gerarLinkWhatsApp(a.telefone, opcao ? msg1 : msg2), '_blank')
  }

  function abrirWhatsAppCpf(c) {
    const msg1 = `🎉 Ola, ${c.nome}!

O grande dia chegou! Sua unidade *${c.unidade}* no *${c.empreendimento}* esta OFICIALMENTE LIBERADA para a *ENTREGA DE CHAVES!* 🗝️🏠

As vagas sao limitadas e preenchidas por ordem de acesso. Acesse agora e garanta o seu horario:

👉 https://vistoria-agendamento.vercel.app/markinvest/entrega

📋 *ORIENTACOES:*
📄 Documento oficial com foto (RG ou CNH)
👟 Calcado fechado e sem salto
⏱ Chegue 10 min antes

📍 Av. Francisco de Paula Leite, 466
(Entrada principal — acesso de pedestres)

Estamos ansiosos para entregar as chaves do seu novo lar! ✨
*Equipe Markinvest*`

    const msg2 = `👋 Ola, ${c.nome}!

Sua unidade no *${c.empreendimento}* esta pronta para a *entrega de chaves!* 🗝️

Clique no link e agende ja o seu horario:
👉 https://vistoria-agendamento.vercel.app/markinvest/entrega

⚠️ Vagas limitadas!

— *Markinvest* 🏠✨`

    const opcao = window.confirm(
      'Escolha a mensagem:\n\n' +
      'OK = Mensagem completa com instrucoes\n' +
      'CANCELAR = Mensagem curta com link'
    )
    window.open(gerarLinkWhatsApp(c.telefone || '', opcao ? msg1 : msg2), '_blank')
  }

  function exportarCSVEntrega(lista) {
    const cab=['Nome','CPF','Email','Telefone','Empreendimento','Unidade','Data','Horario','Status','Agendado Em']
    const linhas=lista.map(a=>[a.nome,a.cpf,a.email,a.telefone,a.empreendimento,a.unidade,new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),(a.horario||'').slice(0,5),a.status,a.criado_em?new Date(a.criado_em).toLocaleString('pt-BR'):''])
    const NL=String.fromCharCode(10);const rows=[cab,...linhas].map(l=>l.map(v=>String(v||'')).join(';')).join(NL)
    const blob=new Blob(['﻿'+rows],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='relatorio-entrega-'+new Date().toISOString().split('T')[0]+'.csv';link.click();URL.revokeObjectURL(url)
  }
  async function gerarPDFEntrega(lista) {
    setGerandoPDFEntrega(true)
    try {
      const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';document.head.appendChild(script)
      await new Promise((res,rej)=>{script.onload=res;script.onerror=rej})
      const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const W=297,M=12;let y=0
      doc.setFillColor(27,47,126);doc.rect(0,0,W,32,'F');doc.setTextColor(255,255,255);doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('MARKINVEST',W/2,13,{align:'center'});doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('Relatorio de Entrega de Chaves',W/2,21,{align:'center'});doc.setFontSize(7.5);doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W/2,28,{align:'center'});y=38
      doc.setFillColor(240,243,250);doc.rect(M,y-4,W-M*2,10,'F');doc.setTextColor(60,60,100);doc.setFontSize(7.5);doc.setFont('helvetica','italic')
      let ftxt='Total: '+lista.length+' registro(s)';if(entregaRelFiltroEmp)ftxt+=' | Empreendimento: '+entregaRelFiltroEmp;if(entregaRelFiltroStatus!=='todos')ftxt+=' | Status: '+entregaRelFiltroStatus;doc.text(ftxt,M+3,y+2);y+=12
      const cols=[{x:M,label:'NOME'},{x:M+45,label:'CPF'},{x:M+80,label:'EMPREENDIMENTO'},{x:M+120,label:'UNIDADE'},{x:M+155,label:'DATA'},{x:M+175,label:'HORA'},{x:M+190,label:'EMAIL'},{x:M+240,label:'STATUS'},{x:M+258,label:'AGENDADO EM'}]
      doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFontSize(7);doc.setFont('helvetica','bold');cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')
      lista.forEach((a,idx)=>{
        if(y>185){doc.addPage();y=15;doc.setFillColor(27,47,126);doc.rect(M,y,W-M*2,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7);cols.forEach(c=>doc.text(c.label,c.x+1,y+5.5));y+=9;doc.setFont('helvetica','normal')}
        const rowH=8;if(idx%2===0){doc.setFillColor(247,249,255);doc.rect(M,y,W-M*2,rowH,'F')};doc.setDrawColor(220,225,240);doc.line(M,y+rowH,W-M,y+rowH);doc.setFontSize(7)
        const cancelado=a.status==='cancelado'
        doc.setTextColor(30,30,30);doc.setFont('helvetica','bold');doc.text((a.nome||'').slice(0,20),cols[0].x+1,y+5.5)
        doc.setFont('helvetica','normal');doc.setTextColor(60,60,60)
        doc.text((a.cpf||'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'),cols[1].x+1,y+5.5)
        doc.setTextColor(27,47,126);doc.text((a.empreendimento||'').slice(0,18),cols[2].x+1,y+5.5)
        doc.setTextColor(60,60,60);doc.text((a.unidade||'').slice(0,16),cols[3].x+1,y+5.5)
        doc.setTextColor(27,47,126);doc.setFont('helvetica','bold');doc.text(new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR'),cols[4].x+1,y+5.5)
        doc.text((a.horario||'').slice(0,5),cols[5].x+1,y+5.5)
        doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);doc.text((a.email||'').slice(0,24),cols[6].x+1,y+5.5)
        if(cancelado){doc.setFillColor(254,226,226);doc.rect(cols[7].x,y+1.5,16,5.5,'F');doc.setTextColor(180,30,30)}else{doc.setFillColor(220,252,231);doc.rect(cols[7].x,y+1.5,16,5.5,'F');doc.setTextColor(22,101,52)}
        doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.text(cancelado?'CANCEL.':'CONF.',cols[7].x+1,y+5.5)
        const cr=a.criado_em?new Date(a.criado_em):null;if(cr){doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);doc.text(cr.toLocaleDateString('pt-BR')+' '+cr.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),cols[8].x+1,y+5.5)}
        y+=rowH
      })
      const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(27,47,126);doc.rect(0,200,W,7,'F');doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text('Markinvest - Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo',W/2,204.5,{align:'center'});doc.text('Pagina '+i+' de '+total,W-M,204.5,{align:'right'})}
      doc.save('relatorio-entrega-'+new Date().toISOString().split('T')[0]+'.pdf')
    } catch(e){console.error(e);alert('Erro ao gerar PDF.')}
    setGerandoPDFEntrega(false)
  }

  async function salvarConfigHorarios() {
    setSalvandoConfig(true); setConfigSucesso(false)
    try {
      // Gerar lista de horarios com o intervalo configurado
      const horarios = []
      const [hIni, mIni] = configHoraInicio.split(':').map(Number)
      const [hFim, mFim] = configHoraFim.split(':').map(Number)
      let totalMin = hIni * 60 + mIni
      const fimMin = hFim * 60 + mFim
      while (totalMin <= fimMin) {
        const h = String(Math.floor(totalMin/60)).padStart(2,'0')
        const m = String(totalMin%60).padStart(2,'0')
        horarios.push(h+':'+m)
        totalMin += Number(configIntervalo)
      }
      // Buscar horarios existentes
      const resExist = await fetch('/api/horarios-config')
      const existing = await resExist.json()
      // Desativar todos primeiro
      for (const h of (existing||[])) {
        await fetch('/api/horarios-config', {
          method: 'PATCH',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({id: h.id, ativo: false})
        })
      }
      // Ativar/criar os horarios do novo intervalo
      for (const hor of horarios) {
        const existe = (existing||[]).find(e => e.horario === hor)
        if (existe) {
          await fetch('/api/horarios-config', {
            method: 'PATCH',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({id: existe.id, ativo: true})
          })
        } else {
          await fetch('/api/horarios-config', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({horario: hor, ativo: true})
          })
        }
      }
      // Salvar dias da semana no localStorage
      localStorage.setItem('vistoria_dias_semana', JSON.stringify(configDiasSemana))
      setConfigSucesso(true)
      setTimeout(() => setConfigSucesso(false), 3000)
    } catch(e) { alert('Erro ao salvar: '+e.message) }
    setSalvandoConfig(false)
  }

  const filtrados=agendamentos.filter(a=>a.tipo!=='revistoria').filter(a=>filtro==='todos'||a.status===filtro).filter(a=>!filtroEmp||a.apartamento?.toLowerCase().includes(filtroEmp.toLowerCase())).filter(a=>{if(!busca)return true;const b=busca.toLowerCase();return a.nome?.toLowerCase().includes(b)||a.email?.toLowerCase().includes(b)||a.apartamento?.toLowerCase().includes(b)||a.telefone?.includes(b)||a.cpf?.includes(b)}).filter(a=>{if(dataInicio&&a.data<dataInicio)return false;if(dataFim&&a.data>dataFim)return false;return true}).sort((a,b)=>{const da=new Date(a.criado_em||0),db=new Date(b.criado_em||0);return ordem==='mais-antigo'?da-db:db-da})
  const totalPaginas=Math.ceil(filtrados.length/POR_PAGINA);const paginados=filtrados.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA)
  const totalConf=agendamentos.filter(a=>a.status==='confirmado'&&a.tipo!=='revistoria').length
  const totalCanc=agendamentos.filter(a=>a.status==='cancelado'&&a.tipo!=='revistoria').length
  const hoje=new Date();const mesesGrid=[]
  for(let i=0;i<12;i++){const d=new Date(hoje.getFullYear(),hoje.getMonth()+i,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');mesesGrid.push({key,nomeMes:MESES_NOMES[d.getMonth()],anoMes:d.getFullYear(),bloqueado:mesesBloqueados.includes(key)})}
  const horariosAtivos=horariosConfig.filter(h=>h.ativo).length
  const cpfsFiltrados=cpfsAutorizados.filter(c=>{
    const bL=buscaCpf.toLowerCase(); const bD=buscaCpf.replace(/\D/g,'')
    const passaBusca=!buscaCpf||(c.nome?.toLowerCase().includes(bL)||c.unidade?.toLowerCase().includes(bL)||c.empreendimento?.toLowerCase().includes(bL)||(bD.length>0&&c.cpf?.includes(bD)))
    if(!passaBusca)return false
    if(filtroCpfEmp&&c.empreendimento&&c.empreendimento!==filtroCpfEmp)return false
    if(!filtroCpfData)return true
    const datas=cpfDatas[c.cpf]||[]
    return datas.some(d=>d.data===filtroCpfData)
  })
  const buscaCpfLimpo=buscaCpf.replace(/\D/g,'')
  const agendamentosNaoAutorizados=buscaCpf&&buscaCpfLimpo.length>=11&&cpfsFiltrados.length===0
    ?agendamentos.filter(a=>a.tipo!=='revistoria'&&a.cpf?.replace(/\D/g,'')===buscaCpfLimpo)
    :[]
  const totalPaginasCpf=Math.ceil(cpfsFiltrados.length/POR_PAGINA_CPF);const cpfsPaginados=cpfsFiltrados.slice((paginaCpf-1)*POR_PAGINA_CPF,paginaCpf*POR_PAGINA_CPF)
  const revFiltradas=revistorias.filter(a=>a.status==='confirmado'&&(!filtroRevEmp||a.apartamento?.toLowerCase().includes(filtroRevEmp.toLowerCase())))
  const revAgrupadas={}
  for(const r of revFiltradas){const emp=(r.apartamento||'').split(' - ')[0];const chave=emp+'||'+r.data+'||'+r.horario;if(!revAgrupadas[chave])revAgrupadas[chave]={emp,data:r.data,horario:r.horario,unidades:[]};revAgrupadas[chave].unidades.push({id:r.id,unidade:(r.apartamento||'').split(' - ').slice(1).join(' - '),nome:r.nome})}
  const revGrupos=Object.values(revAgrupadas).sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:a.horario<b.horario?-1:1)
  const totalPaginasRev=Math.ceil(revGrupos.length/POR_PAGINA_REAG);const revGruposPaginados=revGrupos.slice((paginaRev-1)*POR_PAGINA_REAG,paginaRev*POR_PAGINA_REAG)
  const primeiroDiaRev=new Date(anoRev,mesRev,1).getDay();const diasNoMesRev=new Date(anoRev,mesRev+1,0).getDate()
  const diasComRev=new Set(revFiltradas.map(r=>r.data))
  const revDiaSelecionado=diaSelecionado?revGrupos.filter(g=>g.data===diaSelecionado):[]
  const empCoresMap={};empreendimentos.forEach((emp,i)=>{empCoresMap[emp]=EMP_CORES[i%EMP_CORES.length]})

  if(status==='loading'||loading)return(<main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f3fa'}}><p style={{color:'#6b7280'}}>Carregando...</p></main>)

  function renderPainelEdicao(chave, ids) {
    if (editandoRevGrupo !== chave) return null
    return (
      <div style={{padding:'12px 16px',background:'#f0f7ff',borderBottom:'1px solid #bfdbfe',display:'flex',gap:'10px',alignItems:'flex-end',flexWrap:'wrap'}}>
        <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nova data</label><input type="date" value={editRevData} onChange={e=>setEditRevData(e.target.value)} style={{padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
        <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Novo horario</label>
          <select value={editRevHorario} onChange={e=>setEditRevHorario(e.target.value)} style={{padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
            <option value="">Selecione...</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <button onClick={()=>salvarEdicaoRevistoria(ids,editRevData,editRevHorario)} disabled={!editRevData||!editRevHorario||salvandoEditRev} style={{padding:'8px 18px',background:!editRevData||!editRevHorario?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!editRevData||!editRevHorario?'not-allowed':'pointer'}}>{salvandoEditRev?'SALVANDO...':'SALVAR'}</button>
        <button onClick={()=>setEditandoRevGrupo(null)} style={{padding:'8px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>CANCELAR</button>
      </div>
    )
  }

  function renderBotaoEditar(chave, data, horario) {
    const editando = editandoRevGrupo === chave
    return (
      <button onClick={()=>{if(editando){setEditandoRevGrupo(null)}else{setEditandoRevGrupo(chave);setEditRevData(data);setEditRevHorario((horario||'').slice(0,5))}}}
        style={{padding:'5px 12px',background:editando?'#fee2e2':'#f0f7ff',border:'1px solid '+(editando?'#fca5a5':'#bfdbfe'),borderRadius:'8px',fontSize:'11px',color:editando?VERMELHO:AZUL,cursor:'pointer',fontWeight:'700',flexShrink:0,whiteSpace:'nowrap'}}>
        {editando?'FECHAR':'EDITAR'}
      </button>
    )
  }

  return (
    <main style={{minHeight:'100vh',background:'#f0f3fa',fontFamily:"'Segoe UI',sans-serif"}}>
      {popup&&(
        <div onClick={()=>setPopup(null)} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'16px',padding:'2rem',maxWidth:'420px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width:'56px',height:'56px',background:'#fee2e2',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
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
      <div style={{background:'#fff',borderBottom:'2px solid #e8ecf5',display:'flex',padding:'0 1rem',gap:'2px',overflowX:'auto'}}>
        {[
          {id:'agendamentos',label:'Agendamentos',icon:'📋'},
          {id:'revistorias',label:'Revistorias',icon:'🔄'},
          {id:'empreendimentos',label:'Empreendimentos',icon:'🏢'},
          {id:'cpfs',label:'CPFs Autorizados',icon:'🔐'},
          {id:'configuracoes',label:'Configuracoes',icon:'⚙️'},
          {id:'entrega',label:'Entrega de Chaves',icon:'🗝️'},
          {id:'emails',label:'Emails',icon:'📧'}
        ].map(a=>(
          <button key={a.id} onClick={()=>setAbaAtiva(a.id)} style={{
            padding:'12px 16px',
            background:abaAtiva===a.id?'#eff3ff':'none',
            border:'none',
            borderBottom:abaAtiva===a.id?'3px solid '+AZUL:'3px solid transparent',
            borderRadius:abaAtiva===a.id?'8px 8px 0 0':'0',
            fontSize:'12px',
            fontWeight:'700',
            cursor:'pointer',
            color:abaAtiva===a.id?AZUL:'#9ca3af',
            transition:'all 0.15s',
            marginBottom:'-2px',
            whiteSpace:'nowrap',
            display:'flex',
            alignItems:'center',
            gap:'6px'
          }}>
            <span style={{fontSize:'14px'}}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'1.5rem'}}>
        {abaAtiva==='revistorias'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>&#128260;</div>
                <div><h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:0}}>Nova Revistoria</h2><p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>Multiplas unidades podem compartilhar o mesmo horario</p></div>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',padding:'14px',background:'#f8f9ff',borderRadius:'12px',border:'1px solid #e0e5f5'}}>
                <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={revEmp} onChange={e=>setRevEmp(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',minWidth:'180px'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data *</label><input type="date" value={revData} onChange={e=>setRevData(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Horario *</label><select value={revHorario} onChange={e=>setRevHorario(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
              </div>
              <p style={{fontSize:'12px',fontWeight:'700',color:AZUL,textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'0.05em'}}>Unidades nesta revistoria</p>
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
                      <button onClick={()=>revUnidades.length>1&&removerLinhaUnidade(i)} style={{padding:'7px 10px',background:revUnidades.length>1?'#fff5f5':'#f9fafb',border:'1px solid '+(revUnidades.length>1?'#fca5a5':'#e5e7eb'),borderRadius:'8px',fontSize:'13px',color:revUnidades.length>1?VERMELHO:'#d1d5db',cursor:revUnidades.length>1?'pointer':'not-allowed',fontWeight:'700'}}>x</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={adicionarLinhaUnidade} style={{padding:'9px 16px',background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',color:AZUL,cursor:'pointer',fontWeight:'600'}}>+ Adicionar unidade</button>
                <button onClick={salvarRevistoria} disabled={salvandoRev} style={{padding:'9px 24px',background:salvandoRev?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:salvandoRev?'not-allowed':'pointer'}}>{salvandoRev?'SALVANDO...':'SALVAR REVISTORIA'}</button>
              </div>
              {erroRev&&<div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px 14px',marginTop:'12px'}}><p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{erroRev}</p></div>}
            </div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                <div><h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 2px'}}>Revistorias Cadastradas</h2><p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>{revGrupos.length} grupo(s) - {revFiltradas.length} unidade(s)</p></div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                  <select value={filtroRevEmp} onChange={e=>{setFiltroRevEmp(e.target.value);setPaginaRev(1)}} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}><option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                  <button onClick={exportarCSVRevistorias} style={{padding:'8px 14px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>CSV</button>
                  <button onClick={gerarPDFRevistorias} disabled={gerandoPDFRev} style={{padding:'8px 14px',background:gerandoPDFRev?'#9ca3af':'#C0392B',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:gerandoPDFRev?'not-allowed':'pointer'}}>{gerandoPDFRev?'GERANDO...':'PDF'}</button>
                  <div style={{display:'flex',gap:'4px',background:'#f4f6fb',borderRadius:'10px',padding:'4px'}}>
                    <button onClick={()=>{setVisualizacaoRev('agenda');setDiaSelecionado(null)}} style={{padding:'6px 14px',borderRadius:'8px',border:'none',background:visualizacaoRev==='agenda'?AZUL:'transparent',color:visualizacaoRev==='agenda'?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>Agenda</button>
                    <button onClick={()=>setVisualizacaoRev('lista')} style={{padding:'6px 14px',borderRadius:'8px',border:'none',background:visualizacaoRev==='lista'?AZUL:'transparent',color:visualizacaoRev==='lista'?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>Lista</button>
                  </div>
                </div>
              </div>
              {visualizacaoRev==='agenda'&&(
                <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'16px',alignItems:'start'}}>
                  <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                    <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <button onClick={()=>{if(mesRev===0){setMesRev(11);setAnoRev(a=>a-1)}else setMesRev(m=>m-1);setDiaSelecionado(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8249;</button>
                      <div style={{textAlign:'center'}}><div style={{color:'#fff',fontSize:'15px',fontWeight:'700',textTransform:'uppercase'}}>{MESES_NOMES[mesRev]}</div><div style={{color:'rgba(255,255,255,0.65)',fontSize:'12px'}}>{anoRev}</div></div>
                      <button onClick={()=>{if(mesRev===11){setMesRev(0);setAnoRev(a=>a+1)}else setMesRev(m=>m+1);setDiaSelecionado(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8250;</button>
                    </div>
                    <div style={{padding:'12px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',textAlign:'center',marginBottom:'6px'}}>
                        {['D','S','T','Q','Q','S','S'].map((d,i)=><span key={i} style={{fontSize:'10px',fontWeight:'700',color:i===0||i===6?'#e5e7eb':'#9ca3af',padding:'3px 0'}}>{d}</span>)}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
                        {Array(primeiroDiaRev).fill(null).map((_,i)=><div key={i}/>)}
                        {Array(diasNoMesRev).fill(null).map((_,i)=>{
                          const d=i+1;const date=new Date(anoRev,mesRev,d);const dow=date.getDay()
                          const ds=anoRev+'-'+String(mesRev+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                          const isWeekend=dow===0||dow===6;const temRev=diasComRev.has(ds);const isSel=diaSelecionado===ds
                          const isHoje=d===new Date().getDate()&&mesRev===new Date().getMonth()&&anoRev===new Date().getFullYear()
                          if(isSel)return<div key={d} onClick={()=>setDiaSelecionado(null)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',color:'#fff',fontSize:'12px',fontWeight:'800',boxShadow:'0 3px 10px rgba(27,47,126,0.4)'}}>{d}<div style={{width:'4px',height:'4px',borderRadius:'50%',background:'rgba(255,255,255,0.7)',marginTop:'1px'}}></div></div>
                          if(temRev&&!isWeekend)return<div key={d} onClick={()=>setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'#eff3ff',border:'2px solid '+AZUL,fontSize:'12px',fontWeight:'700',color:AZUL}}>{d}<div style={{width:'5px',height:'5px',borderRadius:'50%',background:AZUL,marginTop:'1px'}}></div></div>
                          if(isHoje&&!isWeekend)return<div key={d} onClick={()=>setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'#f0f7ff',border:'2px solid '+AZUL,fontSize:'12px',fontWeight:'700',color:AZUL}}>{d}</div>
                          return<div key={d} onClick={()=>!isWeekend&&setDiaSelecionado(ds)} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',fontSize:'12px',color:isWeekend?'#e5e7eb':'#6b7280',cursor:isWeekend?'default':'pointer'}}>{d}</div>
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    {!diaSelecionado&&(<div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'14px',padding:'2rem',textAlign:'center'}}><p style={{fontSize:'14px',color:'#6b7280',margin:'0 0 4px',fontWeight:'600'}}>Selecione um dia no calendario</p><p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>Dias com ponto azul possuem revistorias</p></div>)}
                    {diaSelecionado&&(
                      <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                        <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#eff3ff,#e8edff)',borderBottom:'1px solid #e0e5f5',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <p style={{fontSize:'14px',fontWeight:'700',color:AZUL,margin:0,textTransform:'capitalize'}}>{new Date(diaSelecionado+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
                          <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:AZUL,color:'#fff',fontWeight:'700'}}>{revDiaSelecionado.reduce((s,g)=>s+g.unidades.length,0)} unidade(s)</span>
                        </div>
                        {revDiaSelecionado.length===0?(<div style={{padding:'2rem',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Nenhuma revistoria neste dia.</div>):(
                          <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
                            {revDiaSelecionado.map((g,gi)=>{
                              const corEmp=empCoresMap[g.emp]||AZUL;const chave=g.emp+'||'+g.data+'||'+g.horario;const ids=g.unidades.map(u=>u.id)
                              return (
                                <div key={gi}>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',flexWrap:'wrap'}}>
                                    <span style={{fontSize:'13px',fontWeight:'700',color:corEmp,background:corEmp+'20',padding:'3px 12px',borderRadius:'20px',border:'1px solid '+corEmp+'40'}}>{(g.horario||'').slice(0,5)}</span>
                                    <span style={{fontSize:'12px',color:'#6b7280'}}>{g.emp} - {g.unidades.length} unidade(s)</span>
                                    {renderBotaoEditar(chave,g.data,g.horario)}
                                  </div>
                                  {renderPainelEdicao(chave,ids)}
                                  <div style={{paddingLeft:'8px',borderLeft:'3px solid '+corEmp,display:'flex',flexDirection:'column',gap:'4px'}}>
                                    {g.unidades.map((u,ui)=>(
                                      <div key={ui} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:ui%2===0?'#f8f9ff':'#fff',borderRadius:'8px',border:'1px solid #eef0f8'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                                          <div style={{width:'30px',height:'30px',borderRadius:'8px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700',flexShrink:0}}>{(u.nome||'?').charAt(0).toUpperCase()}</div>
                                          <div><div style={{fontSize:'13px',fontWeight:'600',color:'#111'}}>{u.nome}</div><div style={{fontSize:'11px',color:'#6b7280'}}>{u.unidade}</div></div>
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
                  {revGruposPaginados.length===0?<div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#f9fafb',borderRadius:'12px'}}>Nenhuma revistoria cadastrada.</div>:(
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      {revGruposPaginados.map((g,gi)=>{
                        const corEmp=empCoresMap[g.emp]||AZUL;const chave=g.emp+'||'+g.data+'||'+g.horario;const ids=g.unidades.map(u=>u.id)
                        return (
                          <div key={gi} style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden',boxShadow:'0 2px 8px rgba(27,47,126,0.05)'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'linear-gradient(135deg,#eff3ff,#e8edff)',borderBottom:'1px solid #e0e5f5'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',flexShrink:0}}>&#128260;</div>
                                <div><div style={{fontSize:'14px',fontWeight:'700',color:AZUL}}>{g.emp}</div><div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>{new Date(g.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}<span style={{fontWeight:'700',color:AZUL,marginLeft:'8px'}}>{(g.horario||'').slice(0,5)}</span></div></div>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <span style={{fontSize:'12px',padding:'4px 12px',borderRadius:'20px',background:corEmp,color:'#fff',fontWeight:'700'}}>{g.unidades.length} unidade(s)</span>
                                {renderBotaoEditar(chave,g.data,g.horario)}
                              </div>
                            </div>
                            {renderPainelEdicao(chave,ids)}
                            <div style={{padding:'10px 16px',display:'flex',flexDirection:'column',gap:'6px'}}>
                              {g.unidades.map((u,ui)=>(
                                <div key={ui} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:ui%2===0?'#f8f9ff':'#fff',borderRadius:'10px',border:'1px solid #eef0f8'}}>
                                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                    <div style={{width:'34px',height:'34px',borderRadius:'10px',background:corEmp,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(u.nome||'?').charAt(0).toUpperCase()}</div>
                                    <div><div style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{u.nome}</div><div style={{fontSize:'11px',color:'#6b7280',marginTop:'1px'}}>{u.unidade}</div></div>
                                  </div>
                                  <button onClick={()=>removerRevistoria(u.id)} style={{padding:'5px 14px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'11px',color:VERMELHO,cursor:'pointer',fontWeight:'700',flexShrink:0}}>REMOVER</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {totalPaginasRev>1&&(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'1.5rem',flexWrap:'wrap'}}>
                      <button onClick={()=>setPaginaRev(p=>Math.max(1,p-1))} disabled={paginaRev===1} style={{padding:'6px 14px',background:paginaRev===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaRev===1?'not-allowed':'pointer',color:paginaRev===1?'#9ca3af':'#374151'}}>Anterior</button>
                      {Array.from({length:totalPaginasRev},(_,i)=>i+1).map(p=>(<button key={p} onClick={()=>setPaginaRev(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:paginaRev===p?'none':'1px solid #e5e7eb',background:paginaRev===p?AZUL:'#fff',color:paginaRev===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>))}
                      <button onClick={()=>setPaginaRev(p=>Math.min(totalPaginasRev,p+1))} disabled={paginaRev===totalPaginasRev} style={{padding:'6px 14px',background:paginaRev===totalPaginasRev?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaRev===totalPaginasRev?'not-allowed':'pointer',color:paginaRev===totalPaginasRev?'#9ca3af':'#374151'}}>Proximo</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {abaAtiva==='cpfs'&&(
          <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>CPFs Autorizados</h2>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px',lineHeight:'1.6'}}>Somente CPFs cadastrados aqui conseguem acessar a agenda.</p>
            <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Adicionar CPF autorizado</p>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:'130px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CPF *</label><input value={novoCpf} onChange={e=>{setNovoCpf(mascaraCPF(e.target.value));setErroCpf('')}} placeholder="000.000.000-00" maxLength={14} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/></div>
                <div style={{flex:2,minWidth:'150px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nome (opcional)</label><input value={nomeNovoCpf} onChange={e=>setNomeNovoCpf(e.target.value)} placeholder="Nome do proprietario" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/></div>
                <div style={{flex:1,minWidth:'110px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Unidade</label><input value={unidadeNovoCpf} onChange={e=>setUnidadeNovoCpf(e.target.value)} placeholder="Ex: Apto 301" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/></div>
                <div style={{flex:2,minWidth:'150px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento</label><select value={empNovoCpf} onChange={e=>setEmpNovoCpf(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',boxSizing:'border-box'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                <div style={{display:'flex',alignItems:'flex-end'}}><button onClick={adicionarCpf} disabled={salvandoCpf||!novoCpf.trim()} style={{padding:'9px 20px',background:salvandoCpf||!novoCpf.trim()?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>{salvandoCpf?'SALVANDO...':'+ ADICIONAR'}</button></div>
              </div>
              {erroCpf&&<p style={{color:'#dc2626',fontSize:'12px',margin:'8px 0 0',fontWeight:'600'}}>{erroCpf}</p>}
            </div>
            <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'12px 14px',marginBottom:'12px',display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
              <div style={{flex:1,position:'relative',minWidth:'180px'}}>
                <input value={inputBuscaCpf} onChange={e=>setInputBuscaCpf(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setBuscaCpf(inputBuscaCpf)} placeholder="Buscar por CPF, nome, unidade..." style={{width:'100%',padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#fff',boxSizing:'border-box'}}/>
              </div>
              <button onClick={()=>setBuscaCpf(inputBuscaCpf)} style={{padding:'8px 16px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>Buscar</button>
              {buscaCpf&&<button onClick={()=>{setBuscaCpf('');setInputBuscaCpf('')}} style={{padding:'8px 12px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>Limpar</button>}
              <select value={filtroCpfEmp} onChange={e=>{setFiltroCpfEmp(e.target.value);setPaginaCpf(1)}} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
                <option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#6b7280',whiteSpace:'nowrap'}}>Por data:</label>
                <input type="date" value={filtroCpfData} onChange={e=>setFiltroCpfData(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#fff'}}/>
                {filtroCpfData&&<button onClick={()=>setFiltroCpfData('')} style={{padding:'6px 10px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>x</button>}
              </div>
              <span style={{fontSize:'12px',color:'#9ca3af',whiteSpace:'nowrap'}}>{cpfsFiltrados.length} de {cpfsAutorizados.length}</span>
            </div>
            {buscaCpf&&(<div style={{background:'#eff3ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'8px 14px',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontSize:'13px',color:AZUL,fontWeight:'600'}}>Resultado para: "{buscaCpf}" - {cpfsFiltrados.length} encontrado(s)</span><button onClick={()=>{setBuscaCpf('');setInputBuscaCpf('')}} style={{padding:'4px 10px',background:'none',border:'1px solid #bfdbfe',borderRadius:'6px',fontSize:'11px',color:AZUL,cursor:'pointer',fontWeight:'600'}}>Limpar</button></div>)}
            {agendamentosNaoAutorizados.length>0&&(
              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'10px',padding:'14px 16px',marginBottom:'12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <div><p style={{fontSize:'13px',fontWeight:'700',color:'#92400e',margin:0}}>CPF nao esta na lista de autorizados</p><p style={{fontSize:'12px',color:'#92400e',margin:0,opacity:0.8}}>Este CPF possui {agendamentosNaoAutorizados.length} agendamento(s) sem autorizacao.</p></div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {agendamentosNaoAutorizados.map(ag=>{
                    const cancelado=ag.status==='cancelado';const partes=(ag.apartamento||'').split(' - ');const criadoEm=ag.criado_em?new Date(ag.criado_em):null
                    return(
                      <div key={ag.id} style={{background:'#fff',borderRadius:'10px',padding:'12px 14px',border:'1px solid #fde68a'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{ag.nome}</div>
                            <div style={{fontSize:'11px',color:'#6b7280',marginTop:'2px'}}>CPF: {ag.cpf} - Email: {ag.email} - Tel: {ag.telefone}</div>
                            <div style={{fontSize:'11px',color:'#6b7280',marginTop:'2px'}}>{partes[0]||''}{partes[1]&&' - '+partes.slice(1).join(' - ')}</div>
                            {criadoEm&&<div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>Agendado em {criadoEm.toLocaleDateString('pt-BR')} {criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>}
                          </div>
                          <div style={{textAlign:'center',flexShrink:0,background:cancelado?'#fff5f5':'#fffbeb',borderRadius:'10px',padding:'8px 14px',border:'1px solid '+(cancelado?'#fca5a5':'#fde68a')}}>
                            <div style={{fontSize:'16px',fontWeight:'800',color:cancelado?VERMELHO:'#92400e',lineHeight:1}}>{new Date(ag.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                            <div style={{fontSize:'12px',fontWeight:'700',color:cancelado?VERMELHO:'#92400e',marginTop:'4px'}}>{ag.horario?.slice(0,5)}</div>
                          </div>
                          <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'20px',background:cancelado?'#fee2e2':'#fef3c7',color:cancelado?VERMELHO:'#92400e',fontWeight:'700',flexShrink:0}}>{ag.status?.toUpperCase()}</span>
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={()=>{
                    const ag=agendamentosNaoAutorizados[0];if(!ag)return
                    const cpfLimpo=ag.cpf?.replace(/\D/g,'')||buscaCpfLimpo
                    if(confirm('Adicionar CPF '+ag.cpf+' ('+ag.nome+') a lista de autorizados?')){
                      fetch('/api/cpfs-autorizados',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:cpfLimpo,nome:ag.nome,empreendimento:(ag.apartamento||'').split(' - ')[0]||''})})
                        .then(r=>r.json()).then(d=>{if(d.success||d.error==='CPF ja cadastrado'){buscarCpfsAutorizados();setBuscaCpf('');setInputBuscaCpf('')}else alert(d.error||'Erro ao adicionar.')})
                    }
                  }} style={{padding:'8px 16px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',alignSelf:'flex-start'}}>+ Adicionar a lista de autorizados</button>
                </div>
              </div>
            )}
            {cpfsAutorizados.length>0&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',flexWrap:'wrap',gap:'8px',padding:'10px 14px',background:'#f4f6fb',borderRadius:'10px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <input type="checkbox" checked={cpfsSelecionados.length===cpfsFiltrados.length&&cpfsFiltrados.length>0} onChange={e=>setCpfsSelecionados(e.target.checked?cpfsFiltrados.map(c=>c.cpf):[])} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:AZUL}}/>
                  <span style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>Selecionar todos</span>
                  {cpfsSelecionados.length>0&&<span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background:AZUL,color:'#fff',fontWeight:'700'}}>{cpfsSelecionados.length} selecionado(s)</span>}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
                  {cpfsSelecionados.length>0&&(
                    <>
                      <button onClick={()=>setCpfsSelecionados([])} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Limpar</button>
                      <button onClick={removerCpfsSelecionados} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'700'}}>Remover ({cpfsSelecionados.length})</button>
                      <select value={empAtribuir} onChange={e=>setEmpAtribuir(e.target.value)} style={{padding:'6px 10px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'12px',outline:'none',background:'#fff',cursor:'pointer'}}>
                        <option value="">Atribuir empreendimento...</option>
                        {empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                      </select>
                      <button onClick={atribuirEmpreendimentoMassa} disabled={!empAtribuir||atribuindoEmpMassa} style={{padding:'6px 14px',background:!empAtribuir||atribuindoEmpMassa?'#9ca3af':'#6366f1',border:'none',borderRadius:'8px',fontSize:'12px',color:'#fff',cursor:!empAtribuir||atribuindoEmpMassa?'not-allowed':'pointer',fontWeight:'700',whiteSpace:'nowrap'}}>{atribuindoEmpMassa?'ATRIBUINDO...':'Atribuir'}</button>
                    </>
                  )}
                  <button onClick={removerTodosCpfs} style={{padding:'6px 14px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'700'}}>Remover todos</button>
                </div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {cpfsPaginados.length===0&&!agendamentosNaoAutorizados.length&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>{cpfsAutorizados.length===0?'Nenhum CPF cadastrado.':filtroCpfData?'Nenhum CPF para esta data.':'Nenhum resultado.'}</p>}
              {cpfsPaginados.map(c=>{
                const selecionado=cpfsSelecionados.includes(c.cpf);const datas=cpfDatas[c.cpf]||[];const expandido=cpfsExpandidos.has(c.cpf)
                return (
                  <div key={c.id} style={{background:selecionado?'#eff3ff':'#f8f9ff',borderRadius:'12px',border:selecionado?'1px solid #a5b4fc':'1px solid #e0e5f5',overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',flexWrap:'wrap'}}>
                      <input type="checkbox" checked={selecionado} onChange={e=>setCpfsSelecionados(prev=>e.target.checked?[...prev,c.cpf]:prev.filter(x=>x!==c.cpf))} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:AZUL,flexShrink:0}}/>
                      <div style={{width:'36px',height:'36px',borderRadius:'10px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(c.nome||'?').charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        {c.nome&&<div style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>{c.nome}</div>}
                        <div style={{fontSize:'12px',color:'#374151',fontFamily:'monospace'}}>{c.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</div>
                        <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                          {c.unidade&&<span style={{fontSize:'11px',color:'#6b7280'}}>{c.unidade}</span>}
                          {c.empreendimento&&<span style={{fontSize:'11px',color:'#6b7280'}}>{c.empreendimento}</span>}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:datas.length>0?'#dbeafe':'#dcfce7',color:datas.length>0?'#1d4ed8':'#16a34a',fontWeight:'700',whiteSpace:'nowrap'}}>{datas.length>0?datas.length+' DATA(S)':'LIVRE'}</span>
                        <button onClick={()=>toggleCpfExpandido(c.cpf)} style={{padding:'5px 12px',background:expandido?AZUL:'#f0f7ff',border:'1px solid '+(expandido?AZUL:'#bfdbfe'),borderRadius:'8px',fontSize:'11px',color:expandido?'#fff':AZUL,cursor:'pointer',fontWeight:'700',whiteSpace:'nowrap'}}>{expandido?'Fechar':'Datas'}</button>
                        <button onClick={()=>toggleCpfVerAgend(c.cpf)} style={{padding:'5px 12px',background:cpfsVerAgend.has(c.cpf)?VERDE:'#f0fdf4',border:'1px solid '+(cpfsVerAgend.has(c.cpf)?VERDE:'#86efac'),borderRadius:'8px',fontSize:'11px',color:cpfsVerAgend.has(c.cpf)?'#fff':VERDE,cursor:'pointer',fontWeight:'700',whiteSpace:'nowrap'}}>Agend.</button>
                        <button onClick={()=>{setEditandoCpf(editandoCpf===c.cpf?null:c.cpf);setNomeEditando(c.nome||'');setUnidadeEditando(c.unidade||'');setEmpEditando(c.empreendimento||'')}} style={{padding:'5px 12px',background:'none',border:'1px solid #bfdbfe',borderRadius:'6px',fontSize:'11px',color:'#1d4ed8',cursor:'pointer',fontWeight:'600'}}>Editar</button>
                        <button onClick={()=>removerCpf(c.cpf)} style={{padding:'5px 12px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>Remover</button>
                      </div>
                    </div>
                    {editandoCpf===c.cpf&&(<div style={{padding:'10px 14px 14px',borderTop:'1px solid #e0e5f5',background:'#f0f7ff'}}><p style={{fontSize:'12px',fontWeight:'700',color:AZUL,margin:'0 0 8px'}}>Editar dados</p><div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}><input value={nomeEditando} onChange={e=>setNomeEditando(e.target.value)} placeholder="Nome" style={{flex:2,minWidth:'140px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/><input value={unidadeEditando} onChange={e=>setUnidadeEditando(e.target.value)} placeholder="Unidade" style={{flex:1,minWidth:'100px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/><select value={empEditando} onChange={e=>setEmpEditando(e.target.value)} style={{flex:2,minWidth:'140px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Empreendimento...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select><button onClick={salvarEdicaoCpf} disabled={salvandoEdicao} style={{padding:'8px 16px',background:salvandoEdicao?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>{salvandoEdicao?'SALVANDO...':'SALVAR'}</button><button onClick={()=>setEditandoCpf(null)} style={{padding:'8px 12px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Cancelar</button></div></div>)}
                    {cpfsVerAgend.has(c.cpf)&&(()=>{
                      const cpfLimpo=c.cpf.replace(/\D/g,'')
                      const agendsCpf=agendamentos.filter(a=>a.tipo!=='revistoria'&&a.cpf?.replace(/\D/g,'')===cpfLimpo)
                      return (
                        <div style={{borderTop:'1px solid #e0e5f5',padding:'12px 14px',background:'#f0fdf4'}}>
                          <p style={{fontSize:'11px',fontWeight:'700',color:VERDE,textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'0.05em'}}>Agendamentos ({agendsCpf.length})</p>
                          {agendsCpf.length===0?<p style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic',margin:0}}>Nenhum agendamento encontrado para este CPF.</p>:(
                            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                              {agendsCpf.map(ag=>{
                                const cancelado=ag.status==='cancelado';const partes=(ag.apartamento||'').split(' - ')
                                return(
                                  <div key={ag.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',background:'#fff',borderRadius:'8px',border:'1px solid '+(cancelado?'#fecaca':'#86efac')}}>
                                    <div style={{textAlign:'center',flexShrink:0,background:cancelado?'#fff5f5':'#eff3ff',borderRadius:'8px',padding:'6px 10px',minWidth:'52px'}}>
                                      <div style={{fontSize:'14px',fontWeight:'800',color:cancelado?VERMELHO:AZUL,lineHeight:1}}>{new Date(ag.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                                      <div style={{fontSize:'11px',fontWeight:'700',color:cancelado?VERMELHO:AZUL,marginTop:'2px'}}>{ag.horario?.slice(0,5)}</div>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:'12px',fontWeight:'700',color:'#111'}}>{partes[0]||''}{partes[1]&&<span style={{color:'#6b7280',fontWeight:'400'}}> - {partes.slice(1).join(' - ')}</span>}</div>
                                      {ag.criado_em&&<div style={{fontSize:'11px',color:'#9ca3af'}}>Agendado em {new Date(ag.criado_em).toLocaleDateString('pt-BR')}</div>}
                                    </div>
                                    <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:cancelado?'#fee2e2':'#dcfce7',color:cancelado?VERMELHO:'#16a34a',fontWeight:'700',flexShrink:0}}>{ag.status}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    {expandido&&(
                      <div style={{borderTop:'1px solid #e0e5f5',padding:'12px 14px',background:'#fff'}}>
                        <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'12px',marginBottom:'12px'}}>
                          <p style={{fontSize:'11px',fontWeight:'700',color:AZUL,textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'0.05em'}}>+ Adicionar nova data</p>
                          <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                            <input type="date" value={novaDataCpf[c.cpf]||''} onChange={e=>setNovaDataCpf(prev=>({...prev,[c.cpf]:e.target.value}))} style={{padding:'7px 10px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',flex:1,minWidth:'140px'}}/>
                            <button onClick={()=>adicionarDataCpf(c.cpf)} disabled={!novaDataCpf[c.cpf]} style={{padding:'7px 16px',background:!novaDataCpf[c.cpf]?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:!novaDataCpf[c.cpf]?'not-allowed':'pointer',whiteSpace:'nowrap'}}>+ Adicionar</button>
                          </div>
                        </div>
                        {datas.length===0&&<p style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic',textAlign:'center',padding:'8px 0'}}>Nenhuma data cadastrada — acesso livre a todos os dias.</p>}
                        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                          {datas.map(entrada=>{
                            const cpfLimpo=c.cpf.replace(/\D/g,'')
                            const agendDaData=agendamentos.filter(a=>a.tipo!=='revistoria'&&a.cpf?.replace(/\D/g,'')===cpfLimpo&&a.data===entrada.data)
                            return(
                            <div key={entrada.data} style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'10px',padding:'10px 12px'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                                <span style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>{new Date(entrada.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})}</span>
                                <button onClick={()=>removerDataCpf(c.cpf,entrada.data)} style={{background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:'#dc2626',cursor:'pointer',padding:'3px 10px',fontWeight:'600'}}>remover</button>
                              </div>
                              {agendDaData.length>0?(
                                <div style={{marginBottom:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>
                                  {agendDaData.map(ag=>{
                                    const cancelado=ag.status==='cancelado'
                                    return(
                                      <div key={ag.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 10px',background:cancelado?'#fff5f5':'#f0fdf4',borderRadius:'8px',border:'1px solid '+(cancelado?'#fca5a5':'#86efac')}}>
                                        <span style={{fontSize:'13px',fontWeight:'800',color:cancelado?VERMELHO:VERDE,flexShrink:0}}>{ag.horario?.slice(0,5)}</span>
                                        <span style={{fontSize:'12px',color:'#374151',fontWeight:'600',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.nome}</span>
                                        <span style={{fontSize:'11px',color:'#6b7280',flexShrink:0}}>{(ag.apartamento||'').split(' - ').slice(1).join(' - ')}</span>
                                        <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:cancelado?'#fee2e2':'#dcfce7',color:cancelado?VERMELHO:'#16a34a',fontWeight:'700',flexShrink:0}}>{ag.status}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              ):(
                                <div style={{marginBottom:'8px',padding:'5px 10px',background:'#f9fafb',borderRadius:'6px',border:'1px dashed #e5e7eb'}}>
                                  <span style={{fontSize:'11px',color:'#9ca3af'}}>Nenhum agendamento nesta data ainda</span>
                                </div>
                              )}
                              <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'8px'}}>
                                {(entrada.horarios||[]).map(h=>(<div key={h} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'20px'}}><span style={{fontSize:'12px',color:'#16a34a',fontWeight:'600'}}>{h}</span><button onClick={()=>removerHorarioCpf(c.cpf,entrada.data,h)} style={{background:'none',border:'none',cursor:'pointer',color:'#86efac',fontSize:'14px',padding:'0',lineHeight:'1',marginLeft:'2px'}}>x</button></div>))}
                                {(entrada.horarios||[]).length===0&&<span style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic'}}>Todos os horarios disponiveis</span>}
                              </div>
                              <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'4px'}}><label style={{fontSize:'11px',color:'#6b7280',fontWeight:'600'}}>De:</label><select value={horarioSelecionado[c.cpf+'_'+entrada.data]||''} onChange={e=>setHorarioSelecionado(prev=>({...prev,[c.cpf+'_'+entrada.data]:e.target.value}))} style={{padding:'6px 8px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'12px',outline:'none',background:'#fff'}}><option value="">--</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                                <div style={{display:'flex',alignItems:'center',gap:'4px'}}><label style={{fontSize:'11px',color:'#6b7280',fontWeight:'600'}}>Ate:</label><select value={horarioSelecionado[c.cpf+'_'+entrada.data+'_fim']||''} onChange={e=>setHorarioSelecionado(prev=>({...prev,[c.cpf+'_'+entrada.data+'_fim']:e.target.value}))} style={{padding:'6px 8px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'12px',outline:'none',background:'#fff'}}><option value="">--</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                                <button onClick={()=>adicionarHorarioCpf(c.cpf,entrada.data,horarioSelecionado[c.cpf+'_'+entrada.data],horarioSelecionado[c.cpf+'_'+entrada.data+'_fim'])} disabled={!horarioSelecionado[c.cpf+'_'+entrada.data]} style={{padding:'6px 12px',background:!horarioSelecionado[c.cpf+'_'+entrada.data]?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:!horarioSelecionado[c.cpf+'_'+entrada.data]?'not-allowed':'pointer'}}>+ Horario</button>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {totalPaginasCpf>1&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'1.5rem',flexWrap:'wrap'}}>
                <button onClick={()=>setPaginaCpf(p=>Math.max(1,p-1))} disabled={paginaCpf===1} style={{padding:'6px 14px',background:paginaCpf===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaCpf===1?'not-allowed':'pointer',color:paginaCpf===1?'#9ca3af':'#374151'}}>Anterior</button>
                {Array.from({length:totalPaginasCpf},(_,i)=>i+1).map(p=>(<button key={p} onClick={()=>setPaginaCpf(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:paginaCpf===p?'none':'1px solid #e5e7eb',background:paginaCpf===p?AZUL:'#fff',color:paginaCpf===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>))}
                <button onClick={()=>setPaginaCpf(p=>Math.min(totalPaginasCpf,p+1))} disabled={paginaCpf===totalPaginasCpf} style={{padding:'6px 14px',background:paginaCpf===totalPaginasCpf?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:paginaCpf===totalPaginasCpf?'not-allowed':'pointer',color:paginaCpf===totalPaginasCpf?'#9ca3af':'#374151'}}>Proximo</button>
              </div>
            )}
            <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'8px'}}>{cpfsFiltrados.length===0?'Nenhum CPF':((paginaCpf-1)*POR_PAGINA_CPF+1)+' - '+Math.min(paginaCpf*POR_PAGINA_CPF,cpfsFiltrados.length)+' de '+cpfsFiltrados.length+' CPFs'}</p>
          </div>
        )}

        {abaAtiva==='configuracoes'&&(
          <div>
            <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem',flexWrap:'wrap'}}>
              {[{id:'intervalo',label:'Intervalo e Dias'},{id:'meses',label:'Bloquear Meses'},{id:'horarios',label:'Gerenciar Horarios'},{id:'dias',label:'Periodos Especiais'},{id:'bloqueios',label:'Horarios por Data'}].map(s=>(
                <button key={s.id} onClick={()=>setSubAbaConfig(s.id)} style={{padding:'10px 20px',borderRadius:'10px',border:subAbaConfig===s.id?'none':'1px solid #e5e7eb',background:subAbaConfig===s.id?AZUL:'#fff',color:subAbaConfig===s.id?'#fff':'#6b7280',fontSize:'13px',fontWeight:'700',cursor:'pointer',boxShadow:subAbaConfig===s.id?'0 4px 12px rgba(27,47,126,0.3)':'none'}}>{s.label}</button>
              ))}
            </div>
            {subAbaConfig==='intervalo'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)',maxWidth:'600px'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Configurar Intervalo de Vistoria</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 24px'}}>Define os dias da semana e o intervalo entre cada agendamento de vistoria.</p>

                <div style={{marginBottom:'24px'}}>
                  <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'10px',textTransform:'uppercase'}}>Dias da semana disponiveis</label>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {[{k:'seg',l:'Seg'},{k:'ter',l:'Ter'},{k:'qua',l:'Qua'},{k:'qui',l:'Qui'},{k:'sex',l:'Sex'},{k:'sab',l:'Sab'},{k:'dom',l:'Dom'}].map(d=>(
                      <button key={d.k} onClick={()=>setConfigDiasSemana(prev=>({...prev,[d.k]:!prev[d.k]}))}
                        style={{padding:'10px 16px',borderRadius:'10px',border:'2px solid',fontSize:'13px',fontWeight:'700',cursor:'pointer',
                          borderColor:configDiasSemana[d.k]?AZUL:'#e5e7eb',
                          background:configDiasSemana[d.k]?AZUL:'#fff',
                          color:configDiasSemana[d.k]?'#fff':'#9ca3af'}}>
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Horario de inicio</label>
                    <input type="time" value={configHoraInicio} onChange={e=>setConfigHoraInicio(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Horario de fim</label>
                    <input type="time" value={configHoraFim} onChange={e=>setConfigHoraFim(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>

                <div style={{marginBottom:'24px'}}>
                  <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'10px',textTransform:'uppercase'}}>Intervalo entre vistorias</label>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {[{v:30,l:'30 min'},{v:60,l:'1 hora'},{v:90,l:'1h30'},{v:120,l:'2 horas'}].map(op=>(
                      <button key={op.v} onClick={()=>setConfigIntervalo(op.v)}
                        style={{padding:'10px 20px',borderRadius:'10px',border:'2px solid',fontSize:'13px',fontWeight:'700',cursor:'pointer',
                          borderColor:configIntervalo===op.v?AZUL:'#e5e7eb',
                          background:configIntervalo===op.v?AZUL:'#fff',
                          color:configIntervalo===op.v?'#fff':'#9ca3af'}}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'14px 16px',marginBottom:'20px'}}>
                  <p style={{fontSize:'12px',fontWeight:'700',color:AZUL,margin:'0 0 8px'}}>Pre-visualizacao dos horarios gerados:</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {(()=>{
                      const slots=[]
                      const [hI,mI]=configHoraInicio.split(':').map(Number)
                      const [hF,mF]=configHoraFim.split(':').map(Number)
                      let t=hI*60+mI
                      const fim=hF*60+mF
                      while(t<=fim){const h=String(Math.floor(t/60)).padStart(2,'0');const m=String(t%60).padStart(2,'0');slots.push(h+':'+m);t+=Number(configIntervalo)}
                      return slots.map(s=><span key={s} style={{padding:'3px 10px',background:'#eff3ff',borderRadius:'20px',fontSize:'12px',fontWeight:'500',color:AZUL}}>{s}</span>)
                    })()}
                  </div>
                </div>

                {configSucesso&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'10px',padding:'10px 16px',marginBottom:'16px'}}><p style={{color:'#15803d',fontSize:'13px',fontWeight:'700',margin:0}}>✅ Configuracao salva com sucesso!</p></div>}

                <button onClick={salvarConfigHorarios} disabled={salvandoConfig} style={{padding:'12px 28px',background:salvandoConfig?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:salvandoConfig?'not-allowed':'pointer'}}>
                  {salvandoConfig?'SALVANDO...':'SALVAR E GERAR HORARIOS'}
                </button>
                <p style={{fontSize:'11px',color:'#9ca3af',marginTop:'10px'}}>Os horarios existentes serao atualizados automaticamente. Agendamentos ja confirmados nao sao afetados.</p>
              </div>
            )}

            {subAbaConfig==='meses'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Bloquear / Liberar Meses</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 16px'}}>Meses bloqueados nao permitem novos agendamentos. Clique para alternar.</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                  {mesesGrid.map(({key,nomeMes,anoMes,bloqueado})=>(
                    <button key={key} onClick={()=>toggleMes(key)} disabled={salvandoMes} style={{padding:'16px 12px',borderRadius:'12px',border:bloqueado?'2px solid #dc2626':'2px solid #1D9E75',background:bloqueado?'#fff5f5':'#f0fdf4',cursor:'pointer',textAlign:'center',opacity:salvandoMes?0.7:1}}>
                      <div style={{fontSize:'14px',fontWeight:'700',color:bloqueado?'#dc2626':'#15803d',marginBottom:'2px'}}>{nomeMes}</div>
                      <div style={{fontSize:'11px',color:bloqueado?'#dc2626':'#15803d',marginBottom:'8px',opacity:0.7}}>{anoMes}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',borderRadius:'20px',background:bloqueado?'#dc2626':'#1D9E75',color:'#fff',fontSize:'10px',fontWeight:'700'}}>{bloqueado?'BLOQUEADO':'LIBERADO'}</div>
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
                      <div style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',borderRadius:'20px',background:h.ativo?VERDE:'#e5e7eb',color:h.ativo?'#fff':'#9ca3af',fontSize:'10px',fontWeight:'700'}}>{h.ativo?'ATIVO':'INATIVO'}</div>
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
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento</label><select value={empEspecial} onChange={e=>setEmpEspecial(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="todos">Todos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                    <div style={{flex:1,minWidth:'160px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Observacao</label><input value={obsEspecial} onChange={e=>setObsEspecial(e.target.value)} placeholder="Ex: Feriado..." style={{width:'100%',padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>adicionarDiaEspecial('liberado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia} style={{padding:'8px 16px',background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>LIBERAR</button>
                      <button onClick={()=>adicionarDiaEspecial('bloqueado')} disabled={!dataInicioEspecial||!dataFimEspecial||salvandoDia} style={{padding:'8px 16px',background:!dataInicioEspecial||!dataFimEspecial?'#9ca3af':VERMELHO,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>BLOQUEAR</button>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {diasEspeciais.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum periodo especial cadastrado.</p>}
                  {diasEspeciais.map(d=>(
                    <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:d.tipo==='liberado'?'#f0fdf4':'#fff5f5',borderRadius:'10px',border:d.tipo==='liberado'?'1px solid #86efac':'1px solid #fca5a5'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:d.tipo==='liberado'?VERDE:VERMELHO,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',fontWeight:'700',flexShrink:0}}>{d.tipo==='liberado'?'V':'X'}</div>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                            <span style={{fontSize:'14px',fontWeight:'700',color:d.tipo==='liberado'?VERDE:VERMELHO}}>{new Date(d.data_inicio+'T12:00:00').toLocaleDateString('pt-BR')} ate {new Date(d.data_fim+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',fontWeight:'700',background:(!d.empreendimento||d.empreendimento==='todos')?'#f3f4f6':'#eff3ff',color:(!d.empreendimento||d.empreendimento==='todos')?'#6b7280':AZUL,border:'1px solid '+( (!d.empreendimento||d.empreendimento==='todos')?'#e5e7eb':'#bfdbfe')}}>{(!d.empreendimento||d.empreendimento==='todos')?'Todos os empreendimentos':d.empreendimento}</span>
                          </div>
                          <div style={{fontSize:'12px',color:'#6b7280'}}>{d.tipo==='liberado'?'Periodo liberado':'Periodo bloqueado'}{d.observacao&&' — '+d.observacao}</div>
                        </div>
                      </div>
                      <button onClick={()=>removerDiaEspecial(d.id)} style={{padding:'6px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:VERMELHO,cursor:'pointer',fontWeight:'600'}}>REMOVER</button>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:'2rem',borderTop:'2px solid #e8ecf5',paddingTop:'1.5rem'}}>
                  <h3 style={{fontSize:'15px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Horarios Bloqueados por Empreendimento</h3>
                  <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 1.25rem'}}>Bloqueia um horario especifico permanentemente para um empreendimento, independente da data.</p>
                  <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.25rem'}}>
                    <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end'}}>
                      <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={novoEmpBloqH} onChange={e=>setNovoEmpBloqH(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                      <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Horario a bloquear *</label><select value={novoHorarioBloqH} onChange={e=>setNovoHorarioBloqH(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{HORARIOS_DISPONIVEIS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
                      <button onClick={adicionarHorarioBloqEmp} disabled={!novoEmpBloqH||!novoHorarioBloqH||salvandoBloqH} style={{padding:'8px 20px',background:!novoEmpBloqH||!novoHorarioBloqH?'#9ca3af':VERMELHO,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!novoEmpBloqH||!novoHorarioBloqH?'not-allowed':'pointer',whiteSpace:'nowrap'}}>{salvandoBloqH?'SALVANDO...':'BLOQUEAR'}</button>
                    </div>
                  </div>
                  {(()=>{
                    const porEmp={}
                    horariosBloqEmp.forEach(b=>{if(!porEmp[b.empreendimento])porEmp[b.empreendimento]=[];porEmp[b.empreendimento].push(b)})
                    const emps=Object.keys(porEmp)
                    if(emps.length===0)return<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'1.5rem'}}>Nenhum horario bloqueado por empreendimento.</p>
                    return emps.map(emp=>(
                      <div key={emp} style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'10px',padding:'12px 16px',marginBottom:'8px'}}>
                        <p style={{fontSize:'13px',fontWeight:'700',color:VERMELHO,margin:'0 0 8px'}}>{emp}</p>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                          {porEmp[emp].map(b=>(
                            <div key={b.id} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 12px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'20px'}}>
                              <span style={{fontSize:'13px',fontWeight:'700',color:VERMELHO}}>{b.horario}</span>
                              <button onClick={()=>removerHorarioBloqEmp(b.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#fca5a5',fontSize:'16px',padding:'0',lineHeight:'1',fontWeight:'700'}}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
            {subAbaConfig==='bloqueios'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Horarios por Data e Empreendimento</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Defina o ultimo horario disponivel por data e empreendimento.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
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
                    const idx=HORARIOS_DISPONIVEIS.indexOf(b.ultimo_horario);const bloqueados=idx>=0?HORARIOS_DISPONIVEIS.slice(idx+1):[];const isTodos=!b.empreendimento||b.empreendimento==='todos'
                    return (
                      <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#fffbeb',borderRadius:'10px',border:'1px solid #fde68a'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                              <span style={{fontSize:'14px',fontWeight:'700',color:'#92400e'}}>{new Date(b.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',fontWeight:'700',background:isTodos?'#fee2e2':'#dbeafe',color:isTodos?VERMELHO:'#1d4ed8'}}>{isTodos?'Todos':b.empreendimento}</span>
                            </div>
                            <div style={{fontSize:'12px',color:'#6b7280'}}>Disponivel ate {b.ultimo_horario}{bloqueados.length>0&&' - Bloqueados: '+bloqueados.join(', ')}</div>
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
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Os empreendimentos cadastrados aparecerao na lista para os clientes.</p>
            <div style={{display:'flex',gap:'10px',marginBottom:'12px'}}>
              <input value={novoEmp} onChange={e=>setNovoEmp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&adicionarEmpreendimento()} placeholder="Nome do novo empreendimento" style={{flex:1,padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'10px',fontSize:'14px',outline:'none'}}/>
              <button onClick={adicionarEmpreendimento} disabled={salvandoEmp||!novoEmp.trim()} style={{padding:'10px 20px',background:salvandoEmp||!novoEmp.trim()?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>{salvandoEmp?'SALVANDO...':'+ ADICIONAR'}</button>
            </div>
            {erroEmp&&<p style={{color:'#dc2626',fontSize:'13px',margin:'0 0 12px',fontWeight:'600'}}>{erroEmp}</p>}
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {empreendimentos.map(emp=>(
                <div key={emp} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#f8f9ff',borderRadius:'10px',border:'1px solid #e0e5f5'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'14px',fontWeight:'600',color:AZUL}}>{emp}</span></div>
                  <button onClick={()=>removerEmpreendimento(emp)} style={{padding:'5px 14px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'12px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>REMOVER</button>
                </div>
              ))}
              {empreendimentos.length===0&&<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum empreendimento cadastrado.</p>}
            </div>
          </div>
        )}
        {abaAtiva==='emails'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Email Customizado</h2>
              <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Selecione destinatarios da lista ou adicione emails manualmente.</p>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px',padding:'12px',background:'#f8f9ff',borderRadius:'12px',border:'1px solid #e0e5f5'}}>
                <select value={emailFiltroEmp} onChange={e=>setEmailFiltroEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                <select value={emailFiltroStatus} onChange={e=>setEmailFiltroStatus(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="todos">Todos os status</option><option value="confirmado">Confirmados</option><option value="cancelado">Cancelados</option></select>
                <button onClick={()=>{const lista=agendamentos.filter(a=>a.tipo!=='revistoria').filter(a=>emailFiltroStatus==='todos'||a.status===emailFiltroStatus).filter(a=>!emailFiltroEmp||a.apartamento?.toLowerCase().includes(emailFiltroEmp.toLowerCase())).map(a=>a.email).filter(Boolean);setEmailDestinatarios([...new Set(lista)])}} style={{padding:'8px 16px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>Selecionar todos filtrados</button>
                {emailDestinatarios.length>0&&<button onClick={()=>setEmailDestinatarios([])} style={{padding:'8px 16px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Limpar ({emailDestinatarios.length})</button>}
              </div>
              <div style={{maxHeight:'280px',overflowY:'auto',border:'1px solid #e0e5f5',borderRadius:'10px',marginBottom:'16px'}}>
                {agendamentos.filter(a=>a.tipo!=='revistoria').filter(a=>emailFiltroStatus==='todos'||a.status===emailFiltroStatus).filter(a=>!emailFiltroEmp||a.apartamento?.toLowerCase().includes(emailFiltroEmp.toLowerCase())).filter((a,i,arr)=>arr.findIndex(b=>b.email===a.email)===i).map((a,i)=>{
                  const selecionado=emailDestinatarios.includes(a.email)
                  return (
                    <div key={i} onClick={()=>{if(selecionado)setEmailDestinatarios(prev=>prev.filter(e=>e!==a.email));else setEmailDestinatarios(prev=>[...prev,a.email])}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',borderBottom:'1px solid #f0f3fa',cursor:'pointer',background:selecionado?'#eff3ff':'#fff'}}>
                      <input type="checkbox" checked={selecionado} onChange={()=>{}} style={{width:'16px',height:'16px',accentColor:AZUL,flexShrink:0}}/>
                      <div style={{width:'32px',height:'32px',borderRadius:'8px',background:selecionado?AZUL:'#e8ecf5',display:'flex',alignItems:'center',justifyContent:'center',color:selecionado?'#fff':'#6b7280',fontSize:'13px',fontWeight:'700',flexShrink:0}}>{(a.nome||'?').charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:'600',color:'#111'}}>{a.nome}</div><div style={{fontSize:'11px',color:'#6b7280'}}>{a.email} - {(a.apartamento||'').split(' - ')[0]}</div></div>
                      <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:a.status==='confirmado'?'#dcfce7':'#fee2e2',color:a.status==='confirmado'?'#16a34a':VERMELHO,fontWeight:'700'}}>{a.status}</span>
                    </div>
                  )
                })}
                {agendamentos.filter(a=>a.tipo!=='revistoria').length===0&&<p style={{textAlign:'center',color:'#9ca3af',fontSize:'13px',padding:'2rem'}}>Nenhum agendamento encontrado.</p>}
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Emails adicionais (separados por virgula)</label>
                <input value={emailManual} onChange={e=>setEmailManual(e.target.value)} placeholder="email1@exemplo.com, email2@exemplo.com" style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
              </div>
              {(emailDestinatarios.length>0||emailManual.trim())&&(<div style={{background:'#eff3ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px'}}><p style={{fontSize:'12px',color:AZUL,margin:0,fontWeight:'600'}}>{emailDestinatarios.length} da lista{emailManual.trim()&&' + '+emailManual.split(',').filter(e=>e.trim().includes('@')).length+' manual(is)'}</p></div>)}
              <div style={{marginBottom:'16px',border:'2px solid '+AZUL,borderRadius:'12px',overflow:'hidden'}}>
                <button onClick={()=>setTemplateMostrar(t=>!t)} style={{width:'100%',padding:'14px 16px',background:templateMostrar?AZUL:'#f0f7ff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'14px',fontWeight:'700',color:templateMostrar?'#fff':AZUL}}>
                  <span>Usar template padrao de vistoria</span>
                  <span>{templateMostrar?'▲':'▼'}</span>
                </button>
                {templateMostrar&&(
                  <div style={{padding:'16px',background:'#f0f7ff',borderTop:'1px solid #bfdbfe'}}>
                    <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
                      <div style={{flex:2,minWidth:'160px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={templateEmp} onChange={e=>setTemplateEmp(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',boxSizing:'border-box'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                      <div style={{flex:1,minWidth:'140px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data de agendamento *</label><input type="date" value={templateData} onChange={e=>setTemplateData(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    </div>
                    <button onClick={aplicarTemplate} disabled={!templateEmp||!templateData} style={{padding:'10px 24px',background:!templateEmp||!templateData?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!templateEmp||!templateData?'not-allowed':'pointer'}}>APLICAR TEMPLATE</button>
                  </div>
                )}
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Assunto *</label>
                <input value={emailAssunto} onChange={e=>setEmailAssunto(e.target.value)} placeholder="Ex: Lembrete de vistoria - Markinvest" style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Mensagem *</label>
                <textarea value={emailMensagem} onChange={e=>setEmailMensagem(e.target.value)} placeholder="Escreva sua mensagem aqui..." rows={10} style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit',lineHeight:'1.6'}}/>
              </div>
              {emailResultado&&(
                <div style={{background:emailResultado.error?'#fff5f5':emailResultado.erros?.length>0?'#fffbeb':'#f0fdf4',border:'1px solid '+(emailResultado.error?'#fca5a5':emailResultado.erros?.length>0?'#fde68a':'#86efac'),borderRadius:'10px',padding:'12px 16px',marginBottom:'16px'}}>
                  {emailResultado.error?<p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{emailResultado.error}</p>:<div><p style={{color:'#15803d',fontSize:'13px',fontWeight:'700',margin:'0 0 4px'}}>{emailResultado.enviados} email(s) enviado(s) com sucesso!</p>{emailResultado.erros?.length>0&&<p style={{color:'#92400e',fontSize:'12px',margin:0}}>Falha: {emailResultado.erros.join(', ')}</p>}</div>}
                </div>
              )}
              <button onClick={enviarEmailCustomizado} disabled={enviandoEmail} style={{width:'100%',padding:'14px',background:enviandoEmail?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:enviandoEmail?'not-allowed':'pointer'}}>
                {enviandoEmail?'ENVIANDO...':'ENVIAR EMAIL'}
              </button>
              <div style={{marginTop:'24px',borderTop:'2px solid #e8ecf5',paddingTop:'20px'}}>
                <button onClick={()=>{setMostrarLog(t=>!t);if(!mostrarLog)buscarEmailsLog()}} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'10px',fontSize:'13px',fontWeight:'700',color:AZUL,cursor:'pointer',marginBottom:'12px'}}>
                  {mostrarLog?'Ocultar':'Ver'} historico de emails enviados
                </button>
                {mostrarLog&&(
                  <div>
                    {loadingLog?<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'1rem'}}>Carregando...</p>:emailsLog.length===0?<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'1rem'}}>Nenhum email enviado ainda.</p>:(
                      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {emailsLog.map((log,i)=>(
                          <div key={i} style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'10px',padding:'12px 16px'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'6px'}}>
                              <span style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{log.assunto}</span>
                              <span style={{fontSize:'11px',color:'#9ca3af'}}>{log.criado_em?new Date(log.criado_em).toLocaleString('pt-BR'):''}</span>
                            </div>
                            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:'#eff3ff',color:AZUL,fontWeight:'700'}}>{log.total_destinatarios} destinatario(s)</span>
                              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:'#f0fdf4',color:'#16a34a',fontWeight:'700'}}>{log.total_enviados} enviado(s)</span>
                              {log.total_erros>0&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:'#fff5f5',color:VERMELHO,fontWeight:'700'}}>{log.total_erros} falha(s)</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva==='entrega'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {[{id:'agenda',label:'Agenda'},{id:'relatorio',label:'Relatorio'},{id:'cpfs',label:'CPFs Autorizados'},{id:'dias',label:'Dias Liberados'},{id:'manual',label:'Agendar Manualmente'},{id:'config',label:'Configuracoes'}].map(s=>(
                <button key={s.id} onClick={()=>setEntregaSubAba(s.id)} style={{padding:'10px 20px',borderRadius:'10px',border:entregaSubAba===s.id?'none':'1px solid #e5e7eb',background:entregaSubAba===s.id?AZUL:'#fff',color:entregaSubAba===s.id?'#fff':'#6b7280',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{s.label}</button>
              ))}
            </div>

            {entregaSubAba==='agenda'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',alignItems:'center'}}>
                  <select value={entregaFiltroEmp} onChange={e=>{setEntregaFiltroEmp(e.target.value);setEntregaDataSel(null);setEntregaHorarios([]);setEntregaSlotSel(null);if(e.target.value)carregarEntregaMes(entregaAno,entregaMes,e.target.value)}} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                    <option value="">Selecione o empreendimento...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                  </select>
                  <input type="date" value={entregaFiltroData} onChange={e=>setEntregaFiltroData(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none'}}/>
                  {entregaFiltroData&&<button onClick={()=>setEntregaFiltroData('')} style={{padding:'8px 12px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>Limpar data</button>}
                </div>
                {!entregaFiltroEmp&&<div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#f9fafb',borderRadius:'12px'}}>Selecione um empreendimento para ver a agenda.</div>}
                {entregaFiltroEmp&&(
                  <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'16px',alignItems:'start'}}>
                    <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                      <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <button onClick={()=>{if(entregaMes===0){setEntregaMes(11);setEntregaAno(a=>a-1)}else setEntregaMes(m=>m-1);setEntregaDataSel(null);setEntregaHorarios([]);setEntregaSlotSel(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8249;</button>
                        <div style={{textAlign:'center'}}><div style={{color:'#fff',fontSize:'15px',fontWeight:'700',textTransform:'uppercase'}}>{MESES_NOMES[entregaMes]}</div><div style={{color:'rgba(255,255,255,0.65)',fontSize:'12px'}}>{entregaAno}</div></div>
                        <button onClick={()=>{if(entregaMes===11){setEntregaMes(0);setEntregaAno(a=>a+1)}else setEntregaMes(m=>m+1);setEntregaDataSel(null);setEntregaHorarios([]);setEntregaSlotSel(null)}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',width:'28px',height:'28px',cursor:'pointer',fontSize:'16px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8250;</button>
                      </div>
                      <div style={{padding:'12px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',textAlign:'center',marginBottom:'6px'}}>
                          {['D','S','T','Q','Q','S','S'].map((d,i)=><span key={i} style={{fontSize:'10px',fontWeight:'700',color:i===0||i===6?'#e5e7eb':'#9ca3af',padding:'3px 0'}}>{d}</span>)}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
                          {Array(new Date(entregaAno,entregaMes,1).getDay()).fill(null).map((_,i)=><div key={i}/>)}
                          {Array(new Date(entregaAno,entregaMes+1,0).getDate()).fill(null).map((_,i)=>{
                            const d=i+1;const date=new Date(entregaAno,entregaMes,d);const dow=date.getDay()
                            const ds=entregaAno+'-'+String(entregaMes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                            const isWeekend=dow===0||dow===6;const isLiberado=entregaDiasLiberados.includes(ds);const isCheio=entregaDiasCheios.includes(ds);const isSel=entregaDataSel===ds
                            const temAgend=entregaAgendamentos.some(a=>a.data===ds&&a.empreendimento===entregaFiltroEmp&&a.status==='confirmado')
                            if(isSel)return<div key={d} onClick={()=>{setEntregaDataSel(null);setEntregaHorarios([]);setEntregaSlotSel(null)}} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',color:'#fff',fontSize:'12px',fontWeight:'800'}}>{d}</div>
                            if(!isLiberado)return<div key={d} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#d1d5db',borderRadius:'8px'}}>{d}</div>
                            if(isCheio)return<div key={d} onClick={()=>{setEntregaDataSel(ds);carregarEntregaHorarios(ds,entregaFiltroEmp);setEntregaSlotSel(null)}} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#dc2626',borderRadius:'8px',background:'#fee2e2',border:'1.5px solid #fca5a5',cursor:'pointer',fontWeight:'700'}}>{d}<div style={{fontSize:'7px',marginTop:'1px'}}>CHEIO</div></div>
                            return<div key={d} onClick={()=>{setEntregaDataSel(ds);carregarEntregaHorarios(ds,entregaFiltroEmp);setEntregaSlotSel(null)}} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',cursor:'pointer',background:temAgend?'#eff3ff':'#f0fdf4',border:'1px solid '+(temAgend?'#bfdbfe':'#86efac'),fontSize:'12px',fontWeight:'600',color:temAgend?AZUL:'#16a34a'}}>{d}{temAgend&&<div style={{width:'4px',height:'4px',borderRadius:'50%',background:AZUL,marginTop:'1px'}}></div>}</div>
                          })}
                        </div>
                        <div style={{marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #e8ecf5',display:'flex',gap:'10px',flexWrap:'wrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:AZUL}}></div><span style={{fontSize:'10px',color:'#6b7280'}}>Com agend.</span></div>
                          <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#16a34a'}}></div><span style={{fontSize:'10px',color:'#6b7280'}}>Disponivel</span></div>
                          <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#dc2626'}}></div><span style={{fontSize:'10px',color:'#6b7280'}}>Cheio</span></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      {!entregaDataSel&&<div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'14px',padding:'2rem',textAlign:'center'}}><p style={{fontSize:'14px',color:'#6b7280',margin:0,fontWeight:'600'}}>Selecione um dia no calendario</p></div>}
                      {entregaDataSel&&(
                        <div style={{border:'1px solid #e0e5f5',borderRadius:'14px',overflow:'hidden'}}>
                          <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#eff3ff,#e8edff)',borderBottom:'1px solid #e0e5f5',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <p style={{fontSize:'14px',fontWeight:'700',color:AZUL,margin:0,textTransform:'capitalize'}}>{new Date(entregaDataSel+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
                            <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:AZUL,color:'#fff',fontWeight:'700'}}>{entregaHorarios.filter(h=>h.ocupadas>0).length} slots ocupados</span>
                          </div>
                          <div style={{maxHeight:'400px',overflowY:'auto'}}>
                            {entregaHorarios.map(h=>{
                              const isSel=entregaSlotSel===h.horario;const cheio=h.ocupadas>=4
                              return(
                                <div key={h.horario} style={{borderBottom:'1px solid #e0e5f5'}}>
                                  <div onClick={()=>setEntregaSlotSel(isSel?null:h.horario)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',cursor:'pointer',background:isSel?'#eff3ff':'#fff'}}>
                                    <span style={{fontSize:'13px',fontWeight:'700',color:cheio?VERMELHO:h.ocupadas>0?AZUL:'#9ca3af',minWidth:'50px'}}>{h.horario}</span>
                                    <div style={{flex:1,display:'flex',gap:'4px',flexWrap:'wrap'}}>
                                      {h.clientes.map((c,ci)=>(
                                        <span key={ci} style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:'#eff3ff',color:AZUL,border:'1px solid #bfdbfe',fontWeight:'500'}}>{c.nome?.split(' ')[0]} · {c.unidade}</span>
                                      ))}
                                      {h.ocupadas===0&&<span style={{fontSize:'11px',color:'#d1d5db',fontStyle:'italic'}}>Sem agendamentos</span>}
                                    </div>
                                    <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:cheio?'#fee2e2':h.ocupadas>0?'#eff3ff':'#f0fdf4',color:cheio?VERMELHO:h.ocupadas>0?AZUL:'#16a34a',fontWeight:'700',flexShrink:0}}>{h.ocupadas}/4</span>
                                  </div>
                                  {isSel&&h.clientes.length>0&&(
                                    <div style={{padding:'8px 14px 12px',background:'#f8f9ff',borderTop:'1px solid #e0e5f5'}}>
                                      {entregaAgendamentos.filter(a=>a.data===entregaDataSel&&a.horario===h.horario&&a.empreendimento===entregaFiltroEmp).map(a=>(
                                        <div key={a.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',background:'#fff',borderRadius:'8px',border:'1px solid '+(a.status==='cancelado'?'#fecaca':'#e0e5f5'),marginBottom:'6px'}}>
                                          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:a.status==='cancelado'?'#fee2e2':AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:a.status==='cancelado'?VERMELHO:'#fff',fontSize:'13px',fontWeight:'700',flexShrink:0}}>{(a.nome||'?').charAt(0)}</div>
                                          <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{a.nome}</div>
                                            <div style={{fontSize:'11px',color:'#6b7280'}}>{a.unidade} · {a.email} · {a.telefone}</div>
                                          </div>
                                          <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:a.status==='cancelado'?'#fee2e2':'#dcfce7',color:a.status==='cancelado'?VERMELHO:'#16a34a',fontWeight:'700',flexShrink:0}}>{a.status}</span>
                                          {a.status==='confirmado'&&a.telefone&&<button onClick={()=>abrirWhatsAppAgendamento(a)} style={{padding:'4px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'6px',fontSize:'11px',color:'#15803d',cursor:'pointer',fontWeight:'600',flexShrink:0,display:'flex',alignItems:'center',gap:'4px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.116 1.525 5.836L.057 23.998l6.304-1.456A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.884 9.884 0 01-5.031-1.378l-.36-.214-3.742.865.944-3.617-.235-.372A9.877 9.877 0 012.106 12c0-5.461 4.433-9.894 9.894-9.894 5.461 0 9.894 4.433 9.894 9.894 0 5.461-4.433 9.894-9.894 9.894z"/></svg>WA</button>}
                          {a.status==='confirmado'?<button onClick={()=>cancelarEntrega(a.id)} style={{padding:'4px 10px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:VERMELHO,cursor:'pointer',fontWeight:'600',flexShrink:0}}>Cancelar</button>:<button onClick={()=>reativarEntrega(a.id)} style={{padding:'4px 10px',background:'none',border:'1px solid #86efac',borderRadius:'6px',fontSize:'11px',color:VERDE,cursor:'pointer',fontWeight:'600',flexShrink:0}}>Reativar</button>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div style={{marginTop:'1.5rem',borderTop:'2px solid #e8ecf5',paddingTop:'1.5rem'}}>
                  <h3 style={{fontSize:'14px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Todos os agendamentos de entrega</h3>
                  {(()=>{
                    const filtrados=entregaAgendamentos.filter(a=>(!entregaFiltroEmp||a.empreendimento===entregaFiltroEmp)&&(!entregaFiltroData||a.data===entregaFiltroData))
                    if(filtrados.length===0)return<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum agendamento encontrado.</p>
                    return(
                      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {filtrados.map(a=>(
                          <div key={a.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:a.status==='cancelado'?'#fff8f8':'#f8f9ff',borderRadius:'10px',border:'1px solid '+(a.status==='cancelado'?'#fecaca':'#e0e5f5')}}>
                            <div style={{width:'36px',height:'36px',borderRadius:'10px',background:a.status==='cancelado'?'#fee2e2':AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:a.status==='cancelado'?VERMELHO:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(a.nome||'?').charAt(0)}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'13px',fontWeight:'700',color:a.status==='cancelado'?'#9ca3af':'#111',textDecoration:a.status==='cancelado'?'line-through':'none'}}>{a.nome}</div>
                              <div style={{fontSize:'11px',color:'#6b7280'}}>{a.empreendimento} · {a.unidade} · {a.email}</div>
                            </div>
                            <div style={{textAlign:'center',flexShrink:0,background:a.status==='cancelado'?'#fff5f5':'#eff3ff',borderRadius:'10px',padding:'8px 12px',border:'1px solid '+(a.status==='cancelado'?'#fecaca':'#bfdbfe')}}>
                              <div style={{fontSize:'14px',fontWeight:'800',color:a.status==='cancelado'?'#d1d5db':AZUL}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                              <div style={{fontSize:'12px',fontWeight:'700',color:a.status==='cancelado'?'#d1d5db':AZUL,marginTop:'2px'}}>{a.horario}</div>
                            </div>
                            {a.status==='confirmado'&&a.telefone&&<button onClick={()=>abrirWhatsAppAgendamento(a)} style={{padding:'5px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',fontSize:'11px',fontWeight:'700',color:'#15803d',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:'4px'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.116 1.525 5.836L.057 23.998l6.304-1.456A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.884 9.884 0 01-5.031-1.378l-.36-.214-3.742.865.944-3.617-.235-.372A9.877 9.877 0 012.106 12c0-5.461 4.433-9.894 9.894-9.894 5.461 0 9.894 4.433 9.894 9.894 0 5.461-4.433 9.894-9.894 9.894z"/></svg>WA</button>}
                          {a.status==='confirmado'?<button onClick={()=>cancelarEntrega(a.id)} style={{padding:'5px 12px',background:'#fff0f0',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'11px',fontWeight:'700',color:VERMELHO,cursor:'pointer',flexShrink:0}}>CANCELAR</button>:<button onClick={()=>reativarEntrega(a.id)} style={{padding:'5px 12px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',fontSize:'11px',fontWeight:'700',color:VERDE,cursor:'pointer',flexShrink:0}}>REATIVAR</button>}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {entregaSubAba==='dias'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Dias Liberados para Entrega</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Por padrao todos os dias estao bloqueados. Libere os dias especificos para cada empreendimento.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end'}}>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={entregaNovoEmp} onChange={e=>setEntregaNovoEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                    <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data *</label><input type="date" value={entregaNovaData} onChange={e=>setEntregaNovaData(e.target.value)} style={{padding:'8px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                    <button onClick={liberarEntregaDia} disabled={!entregaNovaData||!entregaNovoEmp||salvandoEntregaDia} style={{padding:'8px 20px',background:!entregaNovaData||!entregaNovoEmp?'#9ca3af':VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!entregaNovaData||!entregaNovoEmp?'not-allowed':'pointer',whiteSpace:'nowrap'}}>{salvandoEntregaDia?'SALVANDO...':'+ LIBERAR DIA'}</button>
                  </div>
                </div>
                {(()=>{
                  const porEmp={}
                  entregaDias.forEach(d=>{if(!porEmp[d.empreendimento])porEmp[d.empreendimento]=[];porEmp[d.empreendimento].push(d)})
                  const emps=Object.keys(porEmp)
                  if(emps.length===0)return<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum dia liberado ainda.</p>
                  return emps.map(emp=>(
                    <div key={emp} style={{marginBottom:'16px'}}>
                      <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 8px'}}>{emp}</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                        {porEmp[emp].map(d=>(
                          <div key={d.id} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 14px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'20px'}}>
                            <span style={{fontSize:'13px',fontWeight:'600',color:'#16a34a'}}>{new Date(d.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}</span>
                            <button onClick={()=>removerEntregaDia(d.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#86efac',fontSize:'16px',padding:'0',lineHeight:'1',fontWeight:'700'}}>x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {entregaSubAba==='manual'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Agendar Entrega Manualmente</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Agende uma entrega diretamente pelo painel para um cliente especifico.</p>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px'}}>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={entregaFiltroEmp} onChange={e=>{setEntregaFiltroEmp(e.target.value);setEntregaDataSel(null);setEntregaHorarios([]);setEntregaHorarioSel(null);if(e.target.value)carregarEntregaMes(entregaAno,entregaMes,e.target.value)}} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',minWidth:'180px'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data *</label><input type="date" value={entregaDataSel||''} onChange={e=>{setEntregaDataSel(e.target.value);if(entregaFiltroEmp)carregarEntregaHorarios(e.target.value,entregaFiltroEmp)}} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Horario *</label><select value={entregaHorarioSel||''} onChange={e=>setEntregaHorarioSel(e.target.value)} style={{padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Selecione...</option>{entregaHorarios.filter(h=>h.disponivel).map(h=><option key={h.horario} value={h.horario}>{h.horario} ({4-h.ocupadas} vaga{4-h.ocupadas!==1?'s':''})</option>)}</select></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nome *</label><input value={entregaFormManual.nome} onChange={e=>setEntregaFormManual(p=>({...p,nome:e.target.value}))} placeholder="Nome completo" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CPF *</label><input value={entregaFormManual.cpf} onChange={e=>setEntregaFormManual(p=>({...p,cpf:mascaraCPF(e.target.value)}))} placeholder="000.000.000-00" maxLength={14} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Email *</label><input value={entregaFormManual.email} onChange={e=>setEntregaFormManual(p=>({...p,email:e.target.value}))} placeholder="email@exemplo.com" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                  <div><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Telefone *</label><input value={entregaFormManual.telefone} onChange={e=>setEntregaFormManual(p=>({...p,telefone:mascaraTelefone(e.target.value)}))} placeholder="(11) 99999-9999" maxLength={15} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                </div>
                <div style={{marginBottom:'16px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Unidade *</label><input value={entregaFormManual.unidade} onChange={e=>setEntregaFormManual(p=>({...p,unidade:e.target.value}))} placeholder="Ex: Torre A, Apto 301" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                {erroEntregaManual&&<div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px'}}><p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{erroEntregaManual}</p></div>}

                <button onClick={salvarEntregaManual} disabled={salvandoEntregaManual} style={{padding:'10px 24px',background:salvandoEntregaManual?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:salvandoEntregaManual?'not-allowed':'pointer'}}>{salvandoEntregaManual?'SALVANDO...':'CONFIRMAR AGENDAMENTO'}</button>
              </div>
            )}

            {entregaSubAba==='relatorio'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                  <div>
                    <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 4px'}}>Relatorio de Entrega de Chaves</h2>
                    <p style={{fontSize:'13px',color:'#6b7280',margin:0}}>Clientes que realizaram agendamento de entrega</p>
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',padding:'12px 14px',background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',alignItems:'center'}}>
                  <select value={entregaRelFiltroEmp} onChange={e=>setEntregaRelFiltroEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                    <option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                  </select>
                  <select value={entregaRelFiltroStatus} onChange={e=>setEntregaRelFiltroStatus(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}>
                    <option value="todos">Todos os status</option>
                    <option value="confirmado">Confirmados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <label style={{fontSize:'12px',color:'#6b7280',fontWeight:'600'}}>De:</label>
                    <input type="date" value={entregaRelFiltroDataInicio} onChange={e=>setEntregaRelFiltroDataInicio(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none'}}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <label style={{fontSize:'12px',color:'#6b7280',fontWeight:'600'}}>Ate:</label>
                    <input type="date" value={entregaRelFiltroDataFim} onChange={e=>setEntregaRelFiltroDataFim(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none'}}/>
                  </div>
                  {(entregaRelFiltroEmp||entregaRelFiltroStatus!=='todos'||entregaRelFiltroDataInicio||entregaRelFiltroDataFim)&&(
                    <button onClick={()=>{setEntregaRelFiltroEmp('');setEntregaRelFiltroStatus('todos');setEntregaRelFiltroDataInicio('');setEntregaRelFiltroDataFim('')}} style={{padding:'8px 12px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>Limpar</button>
                  )}
                </div>
                {(()=>{
                  const lista=entregaAgendamentos.filter(a=>
                    (!entregaRelFiltroEmp||a.empreendimento===entregaRelFiltroEmp)&&
                    (entregaRelFiltroStatus==='todos'||a.status===entregaRelFiltroStatus)&&
                    (!entregaRelFiltroDataInicio||a.data>=entregaRelFiltroDataInicio)&&
                    (!entregaRelFiltroDataFim||a.data<=entregaRelFiltroDataFim)
                  ).sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:a.horario<b.horario?-1:1)
                  const totalConf=lista.filter(a=>a.status==='confirmado').length
                  const totalCanc=lista.filter(a=>a.status==='cancelado').length
                  return(
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
                        {[{label:'TOTAL',val:lista.length,cor:AZUL,bg:'#eff3ff'},{label:'CONFIRMADOS',val:totalConf,cor:VERDE,bg:'#f0fdf4'},{label:'CANCELADOS',val:totalCanc,cor:VERMELHO,bg:'#fff5f5'}].map(c=>(
                          <div key={c.label} style={{background:'#fff',borderRadius:'12px',padding:'14px 16px',border:'1px solid #e0e5f5',borderLeft:'4px solid '+c.cor,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div><p style={{fontSize:'10px',fontWeight:'700',color:'#9ca3af',textTransform:'uppercase',margin:'0 0 4px'}}>{c.label}</p><p style={{fontSize:'28px',fontWeight:'800',color:c.cor,margin:0,lineHeight:1}}>{c.val}</p></div>
                            <div style={{width:'40px',height:'40px',background:c.bg,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{c.label==='TOTAL'?'📋':c.label==='CONFIRMADOS'?'✅':'❌'}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
                        <button onClick={()=>exportarCSVEntrega(lista)} style={{padding:'8px 18px',background:AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>⬇ EXPORTAR CSV</button>
                        <button onClick={()=>gerarPDFEntrega(lista)} disabled={gerandoPDFEntrega} style={{padding:'8px 18px',background:gerandoPDFEntrega?'#9ca3af':'#C0392B',color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:gerandoPDFEntrega?'not-allowed':'pointer'}}>{gerandoPDFEntrega?'GERANDO...':'📄 EXPORTAR PDF'}</button>
                      </div>
                      {lista.length===0?(
                        <div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#f9fafb',borderRadius:'12px'}}>Nenhum agendamento encontrado.</div>
                      ):(
                        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                          {lista.map(a=>{
                            const cancelado=a.status==='cancelado';const criadoEm=a.criado_em?new Date(a.criado_em):null
                            return(
                              <div key={a.id} style={{background:cancelado?'#fff8f8':'#f8f9ff',borderRadius:'12px',padding:'12px 16px',border:'1px solid '+(cancelado?'#fecaca':'#e0e5f5'),display:'flex',alignItems:'center',gap:'12px',position:'relative',overflow:'hidden'}}>
                                <div style={{position:'absolute',left:0,top:0,bottom:0,width:'4px',background:cancelado?VERMELHO:VERDE,borderRadius:'12px 0 0 12px'}}></div>
                                <div style={{width:'38px',height:'38px',borderRadius:'10px',background:cancelado?'#fee2e2':AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:cancelado?VERMELHO:'#fff',fontSize:'15px',fontWeight:'700',flexShrink:0,marginLeft:'6px'}}>{(a.nome||'?').charAt(0).toUpperCase()}</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                                    <span style={{fontSize:'13px',fontWeight:'700',color:cancelado?'#9ca3af':'#111',textDecoration:cancelado?'line-through':'none'}}>{a.nome}</span>
                                    <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:cancelado?'#fee2e2':'#dcfce7',color:cancelado?VERMELHO:'#16a34a',fontWeight:'700'}}>{a.status}</span>
                                  </div>
                                  <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'2px'}}><span style={{fontWeight:'600',color:AZUL}}>{a.empreendimento}</span> · {a.unidade}</div>
                                  <div style={{display:'flex',gap:'12px',fontSize:'11px',color:'#9ca3af',flexWrap:'wrap'}}>
                                    {a.email&&<span>✉ {a.email}</span>}
                                    {a.telefone&&<span>📱 {a.telefone}</span>}
                                    {a.cpf&&<span>🪪 {a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</span>}
                                  </div>
                                  {criadoEm&&<div style={{fontSize:'10px',color:'#c4c9d9',marginTop:'2px'}}>Agendado em {criadoEm.toLocaleDateString('pt-BR')} {criadoEm.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>}
                                </div>
                                <div style={{textAlign:'center',flexShrink:0,background:cancelado?'#fff5f5':'#eff3ff',borderRadius:'10px',padding:'8px 14px',border:'1px solid '+(cancelado?'#fecaca':'#bfdbfe')}}>
                                  <div style={{fontSize:'16px',fontWeight:'800',color:cancelado?'#d1d5db':AZUL,lineHeight:1}}>{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                                  <div style={{fontSize:'10px',color:'#9ca3af',marginTop:'2px'}}>{new Date(a.data+'T12:00:00').getFullYear()}</div>
                                  <div style={{fontSize:'13px',fontWeight:'700',color:cancelado?'#d1d5db':AZUL,marginTop:'4px'}}>{(a.horario||'').slice(0,5)}</div>
                                </div>
                                {a.telefone&&<button onClick={()=>{
                                  const dataFmt=new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})
                                  const msg='Ola '+a.nome+'! Lembrando da sua entrega de chaves no '+a.empreendimento+' — '+dataFmt+' as '+(a.horario||'').slice(0,5)+'. Traga documento com foto. — Markinvest'
                                  window.open(gerarLinkWhatsApp(a.telefone,msg),'_blank')
                                }} style={{padding:'5px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',fontSize:'11px',color:'#15803d',cursor:'pointer',fontWeight:'700',flexShrink:0,display:'flex',alignItems:'center',gap:'4px'}}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.116 1.525 5.836L.057 23.998l6.304-1.456A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.884 9.884 0 01-5.031-1.378l-.36-.214-3.742.865.944-3.617-.235-.372A9.877 9.877 0 012.106 12c0-5.461 4.433-9.894 9.894-9.894 5.461 0 9.894 4.433 9.894 9.894 0 5.461-4.433 9.894-9.894 9.894z"/></svg>
                                  WA
                                </button>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {entregaSubAba==='cpfs'&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>CPFs Autorizados — Entrega de Chaves</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px'}}>Somente CPFs cadastrados aqui conseguem agendar a entrega de chaves.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:'0 0 12px'}}>Adicionar CPF</p>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:'130px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CPF *</label><input value={entregaCpfNovo} onChange={e=>setEntregaCpfNovo(mascaraCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{flex:2,minWidth:'150px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nome</label><input value={entregaCpfNome} onChange={e=>setEntregaCpfNome(e.target.value)} placeholder="Nome do proprietario" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{flex:1,minWidth:'110px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Unidade</label><input value={entregaCpfUnidade} onChange={e=>setEntregaCpfUnidade(e.target.value)} placeholder="Ex: Apto 301" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{flex:2,minWidth:'160px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Email *</label><input value={entregaCpfEmail} onChange={e=>setEntregaCpfEmail(e.target.value)} placeholder="email@exemplo.com" type="email" style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{flex:1,minWidth:'140px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Telefone</label><input value={entregaCpfTelefone} onChange={e=>setEntregaCpfTelefone(mascaraTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                    <div style={{flex:2,minWidth:'150px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento</label><select value={entregaCpfEmp} onChange={e=>setEntregaCpfEmp(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',boxSizing:'border-box'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                    <div style={{display:'flex',alignItems:'flex-end'}}><button onClick={adicionarEntregaCpf} disabled={salvandoEntregaCpf||!entregaCpfNovo.trim()} style={{padding:'9px 20px',background:salvandoEntregaCpf||!entregaCpfNovo.trim()?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>{salvandoEntregaCpf?'SALVANDO...':'+ ADICIONAR'}</button></div>
                  </div>
                  {erroEntregaCpf&&<p style={{color:VERMELHO,fontSize:'12px',margin:'8px 0 0',fontWeight:'600'}}>{erroEntregaCpf}</p>}
                </div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px',alignItems:'center'}}>
                  <input value={entregaCpfBusca} onChange={e=>setEntregaCpfBusca(e.target.value)} placeholder="Buscar por CPF ou nome..." style={{flex:1,minWidth:'180px',padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none'}}/>
                  <select value={entregaCpfsFiltroEmp} onChange={e=>setEntregaCpfsFiltroEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}><option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                </div>
                {entregaCpfsSel.length>0&&(
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px',padding:'10px 14px',background:'#f0f7ff',borderRadius:'10px',border:'1px solid #bfdbfe'}}>
                    <span style={{fontSize:'12px',fontWeight:'600',color:AZUL}}>{entregaCpfsSel.length} selecionado(s)</span>
                    <select value={entregaFiltroEmp} onChange={e=>setEntregaFiltroEmp(e.target.value)} style={{padding:'6px 10px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'12px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Empreendimento para link...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                    <button onClick={enviarTokensEntrega} disabled={enviandoTokens} style={{padding:'6px 16px',background:enviandoTokens?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:enviandoTokens?'not-allowed':'pointer',whiteSpace:'nowrap'}}>{enviandoTokens?'ENVIANDO...':'Enviar link de entrega'}</button>
                    <button onClick={()=>{
                      if(!entregaCpfsSel.length)return
                      const cpfsSel=entregaCpfs.filter(c=>entregaCpfsSel.includes(c.cpf)&&c.telefone)
                      if(cpfsSel.length===0){alert('Nenhum CPF selecionado tem telefone cadastrado.');return}
                      const opcao=window.confirm('Escolha a mensagem:\n\nOK = Mensagem detalhada com link\nCANCELAR = Mensagem curta com link')
                      cpfsSel.forEach((c,i)=>{
                        setTimeout(()=>{
                          const msg1='🎉 Ola, '+c.nome+'!\n\nO grande dia chegou! Sua unidade *'+c.unidade+'* no *'+c.empreendimento+'* esta OFICIALMENTE LIBERADA para a *ENTREGA DE CHAVES!* 🗝️🏠\n\nAs vagas sao limitadas! Acesse agora:\n👉 https://vistoria-agendamento.vercel.app/markinvest/entrega\n\n📄 Documento com foto obrigatorio\n👟 Calcado fechado obrigatorio\n📍 Av. Francisco de Paula Leite, 466\n\nEstamos ansiosos para entregar as chaves do seu novo lar! ✨\n*Equipe Markinvest*'
                          const msg2='👋 Ola, '+c.nome+'! Sua unidade no *'+c.empreendimento+'* esta pronta para entrega de chaves! 🗝️\n\nAgende ja o seu horario:\n👉 https://vistoria-agendamento.vercel.app/markinvest/entrega\n\n⚠️ Vagas limitadas! — *Markinvest* 🏠✨'
                          window.open(gerarLinkWhatsApp(c.telefone, opcao?msg1:msg2),'_blank')
                        },i*1500)
                      })
                    }} style={{padding:'6px 14px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',fontSize:'12px',color:'#15803d',cursor:'pointer',fontWeight:'700',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'6px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.116 1.525 5.836L.057 23.998l6.304-1.456A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.884 9.884 0 01-5.031-1.378l-.36-.214-3.742.865.944-3.617-.235-.372A9.877 9.877 0 012.106 12c0-5.461 4.433-9.894 9.894-9.894 5.461 0 9.894 4.433 9.894 9.894 0 5.461-4.433 9.894-9.894 9.894z"/></svg>
                      WA em massa
                    </button>
                    <button onClick={()=>setEntregaCpfsSel([])} style={{padding:'6px 12px',background:'none',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'12px',color:AZUL,cursor:'pointer',fontWeight:'600'}}>Limpar</button>
                  </div>
                )}
                {tokenResultado&&(
                  <div style={{background:tokenResultado.error?'#fff5f5':'#f0fdf4',border:'1px solid '+(tokenResultado.error?'#fca5a5':'#86efac'),borderRadius:'8px',padding:'10px 14px',marginBottom:'12px'}}>
                    {tokenResultado.error?<p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{tokenResultado.error}</p>:<p style={{color:'#15803d',fontSize:'13px',fontWeight:'600',margin:0}}>Links enviados para {tokenResultado.enviados} cliente(s)!{tokenResultado.erros?.length>0&&' Falha: '+tokenResultado.erros.join(', ')}</p>}
                  </div>
                )}
                <div style={{marginTop:'16px',borderTop:'2px solid #e8ecf5',paddingTop:'16px'}}>
                  <button onClick={()=>setMostrarEnvioEmail(t=>!t)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:mostrarEnvioEmail?AZUL:'#f8f9ff',border:'1px solid '+(mostrarEnvioEmail?AZUL:'#e0e5f5'),borderRadius:'10px',fontSize:'13px',fontWeight:'700',color:mostrarEnvioEmail?'#fff':AZUL,cursor:'pointer',marginBottom:'12px'}}>
                    📧 {mostrarEnvioEmail?'Ocultar envio de email':'Enviar email para clientes'}
                  </button>
                  {mostrarEnvioEmail&&(
                    <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem'}}>
                      <div style={{marginBottom:'16px',border:'2px solid '+AZUL,borderRadius:'12px',overflow:'hidden'}}>
                        <button onClick={()=>setEntregaTemplateMostrar(t=>!t)} style={{width:'100%',padding:'14px 16px',background:entregaTemplateMostrar?AZUL:'#f0f7ff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'14px',fontWeight:'700',color:entregaTemplateMostrar?'#fff':AZUL}}>
                          <span>📝 Usar template de entrega de chaves</span>
                          <span>{entregaTemplateMostrar?'▲':'▼'}</span>
                        </button>
                        {entregaTemplateMostrar&&(
                          <div style={{padding:'16px',background:'#f0f7ff',borderTop:'1px solid #bfdbfe'}}>
                            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
                              <div style={{flex:2,minWidth:'160px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Empreendimento *</label><select value={entregaTemplateEmp} onChange={e=>setEntregaTemplateEmp(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer',boxSizing:'border-box'}}><option value="">Selecione...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select></div>
                              <div style={{flex:1,minWidth:'140px'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Data de entrega *</label><input type="date" value={entregaTemplateData} onChange={e=>setEntregaTemplateData(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/></div>
                            </div>
                            {entregaTemplateData&&(<div style={{background:'#fff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'8px 14px',marginBottom:'12px'}}><span style={{fontSize:'13px',color:AZUL,fontWeight:'700'}}>📅 {new Date(entregaTemplateData+'T12:00:00').toLocaleDateString('pt-BR')} — {['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado'][new Date(entregaTemplateData+'T12:00:00').getDay()]}</span></div>)}
                            <button onClick={aplicarTemplateEntrega} disabled={!entregaTemplateEmp||!entregaTemplateData} style={{padding:'10px 24px',background:!entregaTemplateEmp||!entregaTemplateData?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:!entregaTemplateEmp||!entregaTemplateData?'not-allowed':'pointer'}}>✓ APLICAR TEMPLATE</button>
                          </div>
                        )}
                      </div>
                      <div style={{marginBottom:'12px'}}>
                        <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Destinatarios</label>
                        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                          <button onClick={()=>{const lista=entregaCpfs.filter(c=>!entregaAgendamentos.some(a=>a.cpf===c.cpf&&a.status==='confirmado')).map(c=>c.email).filter(Boolean);setEntregaEmailDestinatarios([...new Set(lista)])}} style={{padding:'6px 14px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>Selecionar pendentes</button>
                          <button onClick={()=>{const lista=entregaCpfs.map(c=>c.email).filter(Boolean);setEntregaEmailDestinatarios([...new Set(lista)])}} style={{padding:'6px 14px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>Selecionar todos</button>
                          {entregaEmailDestinatarios.length>0&&<button onClick={()=>setEntregaEmailDestinatarios([])} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Limpar ({entregaEmailDestinatarios.length})</button>}
                        </div>
                        {entregaEmailDestinatarios.length>0&&<div style={{background:'#eff3ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'8px 14px',marginBottom:'8px'}}><p style={{fontSize:'12px',color:AZUL,margin:0,fontWeight:'600'}}>📨 {entregaEmailDestinatarios.length} destinatario(s) selecionado(s)</p></div>}
                        <input value={entregaEmailManual} onChange={e=>setEntregaEmailManual(e.target.value)} placeholder="Ou adicione emails manualmente separados por virgula" style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
                      </div>
                      <div style={{marginBottom:'12px'}}>
                        <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Assunto *</label>
                        <input value={entregaEmailAssunto} onChange={e=>setEntregaEmailAssunto(e.target.value)} placeholder="Ex: Sua entrega de chaves foi liberada" style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
                      </div>
                      <div style={{marginBottom:'16px'}}>
                        <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>Mensagem *</label>
                        <textarea value={entregaEmailMensagem} onChange={e=>setEntregaEmailMensagem(e.target.value)} placeholder="Escreva sua mensagem ou use o template acima..." rows={10} style={{width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit',lineHeight:'1.6'}}/>
                      </div>
                      {entregaEmailResultado&&(
                        <div style={{background:entregaEmailResultado.error?'#fff5f5':'#f0fdf4',border:'1px solid '+(entregaEmailResultado.error?'#fca5a5':'#86efac'),borderRadius:'10px',padding:'12px 16px',marginBottom:'16px'}}>
                          {entregaEmailResultado.error?<p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{entregaEmailResultado.error}</p>:<p style={{color:'#15803d',fontSize:'13px',fontWeight:'700',margin:0}}>✅ {entregaEmailResultado.enviados} email(s) enviado(s) com sucesso!</p>}
                        </div>
                      )}
                      <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                        <button onClick={()=>setMostrarPreviewEmail(true)} disabled={!entregaEmailMensagem.trim()||!entregaEmailAssunto.trim()} style={{flex:1,padding:'12px',background:'#f8f9ff',color:AZUL,border:'1px solid #bfdbfe',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>
                          👁 PRE-VISUALIZAR
                        </button>
                        <button onClick={enviarEmailEntrega} disabled={enviandoEntregaEmail} style={{flex:2,padding:'12px',background:enviandoEntregaEmail?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:enviandoEntregaEmail?'not-allowed':'pointer'}}>
                          {enviandoEntregaEmail?'ENVIANDO...':'📧 ENVIAR EMAIL'}
                        </button>
                      </div>

                      {mostrarPreviewEmail&&(
                        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'20px'}}>
                          <div style={{background:'#fff',borderRadius:'16px',maxWidth:'640px',width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',marginTop:'20px'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:'#f8f9ff',borderBottom:'1px solid #e0e5f5'}}>
                              <div>
                                <div style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>Pre-visualizacao do email</div>
                                <div style={{fontSize:'11px',color:'#6b7280',marginTop:'2px'}}>Assunto: {entregaEmailAssunto}</div>
                              </div>
                              <button onClick={()=>setMostrarPreviewEmail(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:'#6b7280',padding:'4px 8px',borderRadius:'6px'}}>✕</button>
                            </div>
                            <div style={{padding:'0'}}>
                              <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a4db5)',padding:'28px 32px',textAlign:'center'}}>
                                <p style={{color:'#fff',fontSize:'22px',fontWeight:'900',margin:'0 0 4px',letterSpacing:'0.08em',fontFamily:'Georgia,serif'}}>MARKINVEST</p>
                                <p style={{color:'rgba(255,255,255,0.7)',fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',margin:0}}>Entrega de Chaves</p>
                              </div>
                              <div style={{background:'#1d9e75',padding:'10px 32px',textAlign:'center'}}>
                                <p style={{color:'#fff',fontSize:'12px',fontWeight:'700',margin:0}}>🗝️ Agendamento de Entrega de Chaves</p>
                              </div>
                              <div style={{padding:'28px 32px',background:'#fff'}}>
                                <div style={{whiteSpace:'pre-wrap',fontSize:'13px',lineHeight:'1.8',color:'#374151',fontFamily:"'Segoe UI',sans-serif"}}>
                                  {entregaEmailMensagem}
                                </div>
                              </div>
                              <div style={{background:'#1B2F7E',padding:'20px 32px',textAlign:'center'}}>
                                <p style={{color:'#fff',fontSize:'13px',fontWeight:'700',margin:'0 0 4px'}}>MARKINVEST</p>
                                <p style={{color:'rgba(255,255,255,0.7)',fontSize:'11px',margin:0}}>Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
                              </div>
                            </div>
                            <div style={{padding:'14px 20px',background:'#f8f9ff',borderTop:'1px solid #e0e5f5',display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                              <button onClick={()=>setMostrarPreviewEmail(false)} style={{padding:'8px 20px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Fechar</button>
                              <button onClick={()=>{setMostrarPreviewEmail(false);enviarEmailEntrega()}} disabled={enviandoEntregaEmail} style={{padding:'8px 24px',background:AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>📧 Enviar agora</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {(()=>{
                    const filtrados=entregaCpfs.filter(c=>{
                      const b=entregaCpfBusca.toLowerCase()
                      const passaBusca=!entregaCpfBusca||(c.nome?.toLowerCase().includes(b)||c.cpf?.includes(entregaCpfBusca.replace(/\D/g,'')))
                      const passaEmp=!entregaCpfsFiltroEmp||(c.empreendimento===entregaCpfsFiltroEmp)
                      return passaBusca&&passaEmp
                    })
                    if(filtrados.length===0)return<p style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'2rem'}}>Nenhum CPF cadastrado.</p>
                    return filtrados.map(c=>(
                      <div key={c.id} style={{background:'#f8f9ff',borderRadius:'12px',border:'1px solid #e0e5f5',overflow:'hidden'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',flexWrap:'wrap'}}>
                          <input type="checkbox" checked={entregaCpfsSel.includes(c.cpf)} onChange={e=>setEntregaCpfsSel(prev=>e.target.checked?[...prev,c.cpf]:prev.filter(x=>x!==c.cpf))} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:AZUL,flexShrink:0}}/>
                          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>{(c.nome||'?').charAt(0).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            {c.nome&&<div style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>{c.nome}</div>}
                            <div style={{fontSize:'12px',color:'#374151',fontFamily:'monospace'}}>{c.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</div>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {c.unidade&&<span style={{fontSize:'11px',color:'#6b7280'}}>{c.unidade}</span>}
                              {c.empreendimento&&<span style={{fontSize:'11px',color:'#6b7280'}}>{c.empreendimento}</span>}
                              {c.email&&<span style={{fontSize:'11px',color:'#6b7280'}}>✉ {c.email}</span>}
                              {c.telefone&&<span style={{fontSize:'11px',color:'#6b7280'}}>📱 {c.telefone}</span>}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            {(()=>{const jaAgendou=entregaAgendamentos.some(a=>a.cpf===c.cpf&&a.status==='confirmado');return jaAgendou?<span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:'#dcfce7',color:'#16a34a',fontWeight:'700'}}>AGENDADO</span>:<span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:'#fff3cd',color:'#92400e',fontWeight:'700'}}>PENDENTE</span>})()}
                            {c.telefone&&<button onClick={()=>abrirWhatsAppCpf(c)} style={{padding:'5px 10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'6px',fontSize:'11px',color:'#15803d',cursor:'pointer',fontWeight:'600',display:'flex',alignItems:'center',gap:'4px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.116 1.525 5.836L.057 23.998l6.304-1.456A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.884 9.884 0 01-5.031-1.378l-.36-.214-3.742.865.944-3.617-.235-.372A9.877 9.877 0 012.106 12c0-5.461 4.433-9.894 9.894-9.894 5.461 0 9.894 4.433 9.894 9.894 0 5.461-4.433 9.894-9.894 9.894z"/></svg>WA</button>}
                            <button onClick={()=>{setEntregaEditandoCpf(entregaEditandoCpf===c.cpf?null:c.cpf);setEntregaEditNome(c.nome||'');setEntregaEditUnidade(c.unidade||'');setEntregaEditEmp(c.empreendimento||'');setEntregaEditEmail(c.email||'');setEntregaEditTelefone(c.telefone||'')}} style={{padding:'5px 12px',background:'none',border:'1px solid #bfdbfe',borderRadius:'6px',fontSize:'11px',color:AZUL,cursor:'pointer',fontWeight:'600'}}>Editar</button>
                            <button onClick={()=>removerEntregaCpf(c.cpf)} style={{padding:'5px 12px',background:'none',border:'1px solid #fca5a5',borderRadius:'6px',fontSize:'11px',color:VERMELHO,cursor:'pointer',fontWeight:'600'}}>Remover</button>
                          </div>
                        </div>
                        {entregaEditandoCpf===c.cpf&&(
                          <div style={{padding:'10px 14px 14px',borderTop:'1px solid #e0e5f5',background:'#f0f7ff'}}>
                            <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                              <input value={entregaEditNome} onChange={e=>setEntregaEditNome(e.target.value)} placeholder="Nome" style={{flex:2,minWidth:'140px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                              <input value={entregaEditUnidade} onChange={e=>setEntregaEditUnidade(e.target.value)} placeholder="Unidade" style={{flex:1,minWidth:'100px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                              <input value={entregaEditEmail} onChange={e=>setEntregaEditEmail(e.target.value)} placeholder="Email" type="email" style={{flex:2,minWidth:'160px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                              <input value={entregaEditTelefone} onChange={e=>setEntregaEditTelefone(mascaraTelefone(e.target.value))} placeholder="Telefone" maxLength={15} style={{flex:1,minWidth:'130px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
                              <select value={entregaEditEmp} onChange={e=>setEntregaEditEmp(e.target.value)} style={{flex:2,minWidth:'140px',padding:'8px 12px',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}><option value="">Empreendimento...</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                              <button onClick={salvarEdicaoEntregaCpf} style={{padding:'8px 16px',background:VERDE,color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>SALVAR</button>
                              <button onClick={()=>setEntregaEditandoCpf(null)} style={{padding:'8px 12px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'12px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {abaAtiva==='agendamentos'&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'1.5rem'}}>
              {[{label:'TOTAL',val:agendamentos.filter(a=>a.tipo!=='revistoria').length,cor:AZUL,bg:'#eff3ff'},{label:'CONFIRMADOS',val:totalConf,cor:VERDE,bg:'#f0fdf4'},{label:'CANCELADOS',val:totalCanc,cor:VERMELHO,bg:'#fff5f5'}].map(c=>(
                <div key={c.label} style={{background:'#fff',borderRadius:'16px',padding:'1.25rem 1.5rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)',borderLeft:'4px solid '+c.cor,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div><p style={{fontSize:'10px',fontWeight:'700',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 6px'}}>{c.label}</p><p style={{fontSize:'32px',fontWeight:'800',color:c.cor,margin:0,lineHeight:1}}>{c.val}</p></div>
                  <div style={{width:'48px',height:'48px',background:c.bg,borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{c.label==='TOTAL'?'📅':c.label==='CONFIRMADOS'?'✅':'❌'}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'1rem 1.25rem',marginBottom:'1rem',boxShadow:'0 2px 12px rgba(27,47,126,0.07)'}}>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'4px',background:'#f4f6fb',borderRadius:'10px',padding:'4px'}}>
                  {['todos','confirmado','cancelado'].map(f=>(<button key={f} onClick={()=>setFiltro(f)} style={{padding:'6px 16px',borderRadius:'8px',border:'none',background:filtro===f?(f==='cancelado'?VERMELHO:f==='confirmado'?VERDE:AZUL):'transparent',color:filtro===f?'#fff':'#9ca3af',fontSize:'12px',fontWeight:'700',cursor:'pointer',textTransform:'uppercase'}}>{f}</button>))}
                </div>
                <div style={{flex:1,position:'relative',minWidth:'180px'}}>
                  <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, email, CPF..." style={{width:'100%',padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',boxSizing:'border-box'}}/>
                </div>
                <select value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}><option value="">Todos os empreendimentos</option>{empreendimentos.map(emp=><option key={emp} value={emp}>{emp}</option>)}</select>
                <select value={ordem} onChange={e=>setOrdem(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'13px',outline:'none',background:'#f9fafb',cursor:'pointer'}}><option value="mais-antigo">Mais antigo primeiro</option><option value="mais-novo">Mais novo primeiro</option></select>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
                <span style={{fontSize:'12px',fontWeight:'600',color:'#6b7280'}}>Filtrar por data:</span>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><label style={{fontSize:'12px',color:'#6b7280'}}>De:</label><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><label style={{fontSize:'12px',color:'#6b7280'}}>Ate:</label><input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none'}}/></div>
                {(dataInicio||dataFim||filtroEmp)&&<button onClick={()=>{setDataInicio('');setDataFim('');setFiltroEmp('')}} style={{padding:'6px 12px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'#6b7280',fontWeight:'600'}}>Limpar</button>}
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={exportarCSV} style={{padding:'8px 18px',background:AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>EXPORTAR CSV</button>
                <button onClick={gerarPDF} disabled={gerandoPDF} style={{padding:'8px 18px',background:gerandoPDF?'#9ca3af':'#C0392B',color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:gerandoPDF?'not-allowed':'pointer'}}>{gerandoPDF?'GERANDO...':'EXPORTAR PDF'}</button>
                <button onClick={exportarRelatorioGeral} style={{padding:'8px 18px',background:VERDE,color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>RELATORIO GERAL</button>
              </div>
            </div>
            {paginados.length===0?(<div style={{textAlign:'center',padding:'3rem',color:'#9ca3af',fontSize:'14px',background:'#fff',borderRadius:'16px'}}>Nenhum agendamento encontrado</div>):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {paginados.map(a=>{
                  const cancelado=a.status==='cancelado';const partes=(a.apartamento||'').split(' - ');const empreend=partes[0]||'';const unidade=partes.slice(1).join(' - ')||'';const criadoEm=a.criado_em?new Date(a.criado_em):null
                  return (
                    <div key={a.id} style={{background:cancelado?'#fff8f8':'#fff',borderRadius:'14px',padding:'1rem 1.25rem',boxShadow:'0 2px 12px rgba(27,47,126,0.06)',border:cancelado?'1px solid #fecaca':'1px solid #e8ecf5',display:'flex',alignItems:'center',gap:'1rem',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:'5px',background:cancelado?'linear-gradient(180deg,#ef4444,#dc2626)':'linear-gradient(180deg,#1D9E75,#16a34a)',borderRadius:'14px 0 0 14px'}}></div>
                      <div style={{width:'44px',height:'44px',borderRadius:'12px',background:cancelado?'#fee2e2':'#eff3ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'800',color:cancelado?VERMELHO:AZUL,flexShrink:0,marginLeft:'8px'}}>{(a.nome||'?').charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'14px',fontWeight:'700',color:cancelado?'#9ca3af':'#111',textDecoration:cancelado?'line-through':'none'}}>{a.nome}</span>
                          <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'20px',background:cancelado?'#fee2e2':'#dcfce7',color:cancelado?VERMELHO:'#16a34a',fontWeight:'700',textTransform:'uppercase'}}>{a.status}</span>
                        </div>
                        <div style={{fontSize:'12px',color:cancelado?'#d1d5db':'#6b7280',marginBottom:'4px'}}><span style={{fontWeight:'600',color:cancelado?'#d1d5db':AZUL}}>{empreend}</span>{unidade&&<span> - {unidade}</span>}</div>
                        <div style={{display:'flex',gap:'12px',fontSize:'11px',color:'#9ca3af',flexWrap:'wrap'}}>
                          <span>{a.email}</span><span>{a.telefone}</span>{a.cpf&&<span>{a.cpf}</span>}{a.nome_acompanhante&&a.nome_acompanhante!=='-'&&<span>Acomp: {a.nome_acompanhante}</span>}
                        </div>
                        {cancelado&&a.motivo_cancelamento&&(<div style={{marginTop:'6px',background:'#fff5f5',borderRadius:'6px',padding:'5px 10px',borderLeft:'2px solid #dc2626',display:'inline-block'}}><span style={{fontSize:'11px',color:'#dc2626',fontWeight:'600'}}>Motivo: </span><span style={{fontSize:'11px',color:'#9ca3af'}}>{a.motivo_cancelamento}</span>{a.obs_cancelamento&&<span style={{fontSize:'11px',color:'#9ca3af'}}> - {a.obs_cancelamento}</span>}</div>)}
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
                <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{padding:'6px 14px',background:pagina===1?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:pagina===1?'not-allowed':'pointer',color:pagina===1?'#9ca3af':'#374151'}}>Anterior</button>
                {Array.from({length:totalPaginas},(_,i)=>i+1).map(p=>(<button key={p} onClick={()=>setPagina(p)} style={{width:'36px',height:'36px',borderRadius:'8px',border:pagina===p?'none':'1px solid #e5e7eb',background:pagina===p?AZUL:'#fff',color:pagina===p?'#fff':'#374151',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{p}</button>))}
                <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} style={{padding:'6px 14px',background:pagina===totalPaginas?'#f3f4f6':'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:pagina===totalPaginas?'not-allowed':'pointer',color:pagina===totalPaginas?'#9ca3af':'#374151'}}>Proximo</button>
              </div>
            )}
            <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'1rem'}}>Mostrando {filtrados.length===0?0:((pagina-1)*POR_PAGINA)+1} - {Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length} agendamentos</p>
            <p style={{textAlign:'center',fontSize:'11px',color:'#d1d5db',marginTop:'6px',marginBottom:'1rem'}}>Markinvest 2026</p>
          </>
        )}
      </div>
    </main>
  )
}

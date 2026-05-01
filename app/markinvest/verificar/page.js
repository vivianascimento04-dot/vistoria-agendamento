'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AZUL = '#1B2F7E'
const VERMELHO = '#C0392B'

function mascaraCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14)
}

export default function Verificar() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [status, setStatus] = useState(null)

  async function verificar(e) {
    e.preventDefault()
    if (!cpf || cpf.replace(/\D/g,'').length < 11) {
      setErro('Digite um CPF valido.')
      return
    }
    setLoading(true)
    setErro('')
    setStatus(null)
    try {
      const res = await fetch('/api/cpfs-autorizados', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ cpf })
      })
      const data = await res.json()

      if (data.autorizado) {
        // Verificar se ja tem agendamento ativo
        const resAgend = await fetch('/api/agendamentos')
        const agendamentos = await res.ok ? await resAgend.json() : []
        const cpfLimpo = cpf.replace(/\D/g,'')
        const jaAgendado = Array.isArray(agendamentos) && agendamentos.some(
          a => a.cpf && a.cpf.replace(/\D/g,'') === cpfLimpo && a.status === 'confirmado'
        )
        if (jaAgendado) {
          setStatus('ja-agendado')
        } else {
          sessionStorage.setItem('cpf_autorizado', cpf)
          router.push('/markinvest')
        }
      } else {
        setStatus('nao-autorizado')
      }
    } catch(e) {
      setErro('Erro de conexao. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1B2F7E 0%, #2a45b0 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:'100%', maxWidth:'400px'}}>

        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <img src="/logo.png" alt="Markinvest" style={{height:'56px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'12px'}}/>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:'12px', margin:0, letterSpacing:'0.1em', textTransform:'uppercase'}}>Agendamento de Vistoria</p>
        </div>

        <div style={{background:'#fff', borderRadius:'20px', padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>

          {status === null && (
            <>
              <h2 style={{fontSize:'18px', fontWeight:'700', color:AZUL, margin:'0 0 6px'}}>Verificacao de acesso</h2>
              <p style={{fontSize:'13px', color:'#9ca3af', margin:'0 0 1.5rem', lineHeight:'1.6'}}>Digite seu CPF para verificar se voce tem acesso ao agendamento de vistoria.</p>

              <form onSubmit={verificar}>
                <div style={{marginBottom:'20px'}}>
                  <label style={{fontSize:'12px', fontWeight:'700', color:'#6b7280', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={e => { setCpf(mascaraCPF(e.target.value)); setErro('') }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    style={{width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:'10px', fontSize:'16px', outline:'none', boxSizing:'border-box', fontFamily:'inherit', letterSpacing:'0.05em'}}
                    onFocus={e => e.target.style.borderColor=AZUL}
                    onBlur={e => e.target.style.borderColor='#e5e7eb'}
                  />
                  {erro && <p style={{color:VERMELHO, fontSize:'12px', margin:'6px 0 0', fontWeight:'600'}}>{erro}</p>}
                </div>
                <button type="submit" disabled={loading}
                  style={{width:'100%', padding:'13px', background:loading?'#9ca3af':'linear-gradient(135deg, #1B2F7E, #2a45b0)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:loading?'not-allowed':'pointer', letterSpacing:'0.05em', boxShadow:loading?'none':'0 4px 12px rgba(27,47,126,0.35)'}}>
                  {loading ? 'VERIFICANDO...' : 'VERIFICAR ACESSO'}
                </button>
              </form>
            </>
          )}

          {status === 'nao-autorizado' && (
            <div style={{textAlign:'center'}}>
              <div style={{width:'56px', height:'56px', background:'#fee2e2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <h3 style={{fontSize:'16px', fontWeight:'700', color:'#dc2626', margin:'0 0 8px'}}>CPF nao autorizado</h3>
              <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px', lineHeight:'1.6'}}>
                O CPF <strong>{cpf}</strong> nao esta na lista de pessoas autorizadas para agendamento.
              </p>
              <div style={{background:'#fff8e1', border:'1px solid #fde68a', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', textAlign:'left'}}>
                <p style={{fontSize:'12px', color:'#92400e', margin:0, lineHeight:'1.6'}}>
                  Em caso de duvidas, entre em contato com o Relacionamento:<br/>
                  <strong>relacionamento@markinvest.com.br</strong>
                </p>
              </div>
              <button onClick={() => { setStatus(null); setCpf('') }}
                style={{width:'100%', padding:'12px', background:'#fff', color:AZUL, border:'1.5px solid '+AZUL, borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>
                TENTAR OUTRO CPF
              </button>
            </div>
          )}

          {status === 'ja-agendado' && (
            <div style={{textAlign:'center'}}>
              <div style={{width:'56px', height:'56px', background:'#fff8e1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 style={{fontSize:'16px', fontWeight:'700', color:'#92400e', margin:'0 0 8px'}}>Voce ja possui agendamento</h3>
              <p style={{fontSize:'13px', color:'#6b7280', margin:'0 0 20px', lineHeight:'1.6'}}>
                O CPF <strong>{cpf}</strong> ja possui um agendamento ativo. Nao e possivel realizar um novo agendamento.
              </p>
              <div style={{background:'#fff8e1', border:'1px solid #fde68a', borderRadius:'10px', padding:'12px 16px', textAlign:'left'}}>
                <p style={{fontSize:'12px', color:'#92400e', margin:0, lineHeight:'1.6'}}>
                  Para alteracoes ou cancelamentos, entre em contato:<br/>
                  <strong>relacionamento@markinvest.com.br</strong>
                </p>
              </div>
            </div>
          )}

          <p style={{fontSize:'11px', color:'#d1d5db', textAlign:'center', marginTop:'1.5rem', marginBottom:0}}>
            © 2026 Markinvest. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </main>
  )
}
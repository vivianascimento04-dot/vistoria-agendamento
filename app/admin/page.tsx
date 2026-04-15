'use client'

import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Agendamento = {
  nome: string
  data: string
  horario: string
  apartamento: string
}

export default function Page() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filtrados, setFiltrados] = useState<Agendamento[]>([])
  const [dataFiltro, setDataFiltro] = useState('')

  useEffect(() => {
    fetch('/api/agendamentos')
      .then(res => res.json())
      .then(data => {
        setAgendamentos(data)
        setFiltrados(data)
      })
  }, [])

  function filtrarPorData(dataSelecionada: string) {
    setDataFiltro(dataSelecionada)

    if (!dataSelecionada) {
      setFiltrados(agendamentos)
      return
    }

    const filtrado = agendamentos.filter(a => a.data === dataSelecionada)
    setFiltrados(filtrado)
  }

  function gerarPDF() {
    const doc = new jsPDF()

    doc.text('Relatório de Agendamentos', 14, 15)

    autoTable(doc, {
      startY: 20,
      head: [['Nome', 'Data', 'Horário', 'Apartamento']],
      body: filtrados.map(a => [
        a.nome,
        new Date(a.data).toLocaleDateString('pt-BR'),
        a.horario,
        a.apartamento
      ])
    })

    doc.save('relatorio-agendamentos.pdf')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Painel Admin</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => filtrarPorData(e.target.value)}
        />

        <button onClick={() => filtrarPorData('')}>
          Limpar filtro
        </button>
      </div>

      <button onClick={gerarPDF}>
        Baixar PDF
      </button>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Apartamento</th>
          </tr>
        </thead>

        <tbody>
          {filtrados.map((a, i) => (
            <tr key={i}>
              <td>{a.nome}</td>
              <td>{new Date(a.data).toLocaleDateString('pt-BR')}</td>
              <td>{a.horario}</td>
              <td>{a.apartamento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
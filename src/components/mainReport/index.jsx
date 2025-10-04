// MainReportDashboard.jsx
import React from 'react'
import s from './mainReport.module.scss'
import { API } from '../../api'

// Иконки (замените на свои при желании)
const Icon = ({ name }) => (
  <span className={s.icon} aria-hidden>
    {name === 'income' && '💰'}
    {name === 'expense' && '📉'}
    {name === 'profit' && '📊'}
    {name === 'ticket' && '🎟️'}
    {name === 'calendar' && '📅'}
  </span>
)

// Ожидается, что у вас есть реальные методы API
// getSales() -> { data: Sale[] }  (см. пример из сообщения пользователя)
// getTransactions() -> { data: Tx[] } (для расходов)
// Если API уже импортируется из '../../api', просто замените заглушку

function numberRU(n){ return new Intl.NumberFormat('ru-RU').format(Number(n)||0) }
function daysInMonth(d=new Date()){ return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate() }
function range(n){ return Array.from({length:n},(_,i)=>i+1) }
const fmtDate = (d)=> new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit'}).format(new Date(d))

export default function MainReport(){
  const [period, setPeriod] = React.useState('month') // 'month' | '7' | '30' | 'today'
  const [sales, setSales] = React.useState([])       // источник выручки
  const [txs, setTxs] = React.useState([])           // источник расходов

  React.useEffect(()=>{
    API.getSales().then(r=> setSales(r.data||[])).catch(()=>{})
    API.getTransactions().then(r=> setTxs(r.data||[])).catch(()=>{})
  },[])

  const now = new Date()
  const curM = now.getMonth(), curY = now.getFullYear()
  const inPeriod = (d)=>{
    const dt = new Date(d)
    if(period==='today') return dt.toDateString()===now.toDateString()
    if(period==='7'){ const from = new Date(now); from.setDate(from.getDate()-6); from.setHours(0,0,0,0); return dt>=from && dt<=now }
    if(period==='30'){ const from = new Date(now); from.setDate(from.getDate()-29); from.setHours(0,0,0,0); return dt>=from && dt<=now }
    return dt.getMonth()===curM && dt.getFullYear()===curY // месяц
  }

  // --- ДАННЫЕ ЗА ПЕРИОД ---
  const salesP = React.useMemo(()=> sales.filter(s=> inPeriod(s.date)), [sales, period])
  const txP = React.useMemo(()=> txs.filter(t=> inPeriod(t.date)), [txs, period])

  // Выручка — ТОЛЬКО из sales.total
  const income = salesP.reduce((s, x)=> s + Number(x.total||0), 0)
  // Расходы — из transactions с type === 'expense'
  const expense = txP.filter(t=> t.type==='expense').reduce((s,t)=> s + Number(t.amount||0), 0)
  const profit = income - expense

  const ordersCount = salesP.length
  const avgTicket = ordersCount ? income / ordersCount : 0

  // Разложение оплат (по sales.payment_type)
  const paySum = (type)=> salesP.filter(s=> (s.payment_type||'').toLowerCase()===type).reduce((a,b)=> a + Number(b.total||0), 0)
  const cash = paySum('cash')
  const card = paySum('card')
  const other = Math.max(0, income - cash - card)

  // Тренд — по дням
  const bucketCount = period==='month' ? daysInMonth(now) : (period==='7'?7:(period==='30'?30:1))
  const labels = range(bucketCount)
  const toIdx = (d)=>{
    const dt = new Date(d)
    if(period==='month') return dt.getDate()-1
    if(period==='7'){ const from = new Date(now); from.setDate(from.getDate()-6); from.setHours(0,0,0,0); return Math.floor((dt-from)/(24*3600*1000)) }
    if(period==='30'){ const from = new Date(now); from.setDate(from.getDate()-29); from.setHours(0,0,0,0); return Math.floor((dt-from)/(24*3600*1000)) }
    return 0
  }
  const incomeSeries = Array(bucketCount).fill(0)
  const expenseSeries = Array(bucketCount).fill(0)
  salesP.forEach(s=>{ const i=Math.min(Math.max(0,toIdx(s.date)),bucketCount-1); incomeSeries[i]+=Number(s.total||0) })
  txP.filter(t=>t.type==='expense').forEach(t=>{ const i=Math.min(Math.max(0,toIdx(t.date)),bucketCount-1); expenseSeries[i]+=Number(t.amount||0) })
  const chart = buildMiniChart({ incomeSeries, expenseSeries, width:980, height:300, labels })

  // all‑time карточки
  const allIncome = sales.reduce((s,x)=> s + Number(x.total||0), 0)
  const allExpense = txs.filter(t=>t.type==='expense').reduce((s,t)=> s + Number(t.amount||0), 0)

  return (
    <div className={s.wrap}>
      {/* Переключатели периода */}
      <div className={s.periodRow}>
        {[
          {key:'month', label:'Текущий месяц'},
          {key:'7', label:'7 дней'},
          {key:'30', label:'30 дней'},
          {key:'today', label:'Сегодня'}
        ].map(p=> (
          <button key={p.key} onClick={()=>setPeriod(p.key)} className={`${s.pill} ${period===p.key? s.pillActive:''}`}>{p.label}</button>
        ))}
      </div>

      {/* KPI */}
      <div className={s.kpis}>
        <KPI icon="income" title="Оборот (выручка)" value={`${numberRU(income)} сом`} />
        <KPI icon="expense" title="Расходы" value={`${numberRU(expense)} сом`} />
        <KPI icon="profit" title="Прибыль (выручка – расходы)" value={`${numberRU(profit)} сом`} />
        <KPI icon="ticket" title="Средний чек" value={`${numberRU(avgTicket)} сом`} sub={`${ordersCount} заказов`} />
      </div>

      {/* Разложение оплат + Тренд */}
      <div className={s.twoCol}>
        <div className={s.cardTall}>
          <div className={s.cardHeader}><Icon name="calendar"/><h3>Разложение оплат</h3></div>
          <div className={s.splitBox}>
            <SplitRow label="Наличные" amount={cash} total={income} />
            <SplitRow label="Карта" amount={card} total={income} />
            {other>0 && <SplitRow label="Другое" amount={other} total={income} />}
          </div>
        </div>
        <div className={s.cardTall}>
          <div className={s.cardHeader}><Icon name="calendar"/><h3>Тренд: выручка vs расходы</h3></div>
          <div dangerouslySetInnerHTML={{__html: chart}} />
          <div className={s.legend}><LegendDot label="выручка" /><LegendDot label="расходы" type="expense"/></div>
        </div>
      </div>

      {/* Таблицы */}
      <div className={s.twoCol}>
        <TableCard title="Последние продажи" headers={["Дата","Оплата","Позиции","Сумма"]} rows={
          salesP.slice(-5).reverse().map(s=> [fmtDate(s.date), s.payment_type||'-', (s.items?.length||'-'), numberRU(s.total)+ ' сом'])
        } emptyText="Нет продаж за период" />

        <TableCard title="Последние расходы" headers={["Дата","ID","Сумма"]} rows={
          txP.filter(t=>t.type==='expense').slice(-5).reverse().map(t=> [fmtDate(t.date), t.id||'-', numberRU(t.amount)+' сом'])
        } emptyText="Нет расходов за период" />
      </div>

      {/* Низы */}
      <div className={s.twoCol}>
        <div className={s.card}>
          <div className={s.cardHeader}><Icon name="income"/><h3>Оборот / Прибыль (all‑time)</h3></div>
          <div className={s.bottomRow}><h1>{numberRU(allIncome)} сом / {numberRU(allIncome - allExpense)} сом</h1></div>
        </div>
        <div className={s.card}>
          <div className={s.cardHeader}><Icon name="expense"/><h3>Расходы (период)</h3></div>
          <div className={s.bottomRow}><h1>{numberRU(expense)} сом</h1></div>
        </div>
      </div>
    </div>
  )
}

function KPI({ icon, title, value, sub }){
  return (
    <div className={s.card}>
      <div className={s.cardHeader}><Icon name={icon}/><h3>{title}</h3></div>
      <div className={s.bottomRow}>
        <h1>{value}</h1>
        {sub ? <span className={s.sub}>{sub}</span> : <span/>}
      </div>
    </div>
  )
}

function SplitRow({ label, amount, total }){
  const pct = total>0 ? Math.round((amount/total)*100) : 0
  return (
    <div className={s.splitRow}>
      <div className={s.splitTop}><span>{label}</span><span>{numberRU(amount)} сом</span></div>
      <div className={s.bar}><div className={s.barFill} style={{width:`${pct}%`}}/></div>
    </div>
  )
}

function TableCard({ title, headers, rows, emptyText }){
  return (
    <div className={s.cardTall}>
      <div className={s.cardHeader}><Icon name="calendar"/><h3>{title}</h3></div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead><tr>{headers.map(h=> <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length? rows.map((r,i)=> <tr key={i}>{r.map((c,j)=> <td key={j}>{c}</td>)}</tr>) : (
              <tr><td colSpan={headers.length} className={s.empty}>{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LegendDot({ label, type }){
  return (
    <div className={s.legendItem}>
      <span className={`${s.dot} ${type==='expense'? s.dotRed: s.dotBlue}`}></span>
      <span>{label}</span>
    </div>
  )
}

function buildMiniChart({ incomeSeries, expenseSeries, width, height, labels }){
  const pad = {t:20,r:16,b:28,l:36}
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const maxY = Math.max(1, ...incomeSeries, ...expenseSeries)
  const sx = (i)=> (i/(incomeSeries.length-1||1))*W
  const sy = (v)=> H - (v/maxY)*H
  const path = (arr)=> arr.map((v,i)=> `${i===0?'M':'L'} ${pad.l+sx(i)} ${pad.t+sy(v)}`).join(' ')
  const grid = Array.from({length:4},(_,i)=> pad.t + (H/4)*i)
  const xTicks = 6
  const svg = `
  <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff" rx="12" />
    ${grid.map(y=>`<line x1='${pad.l}' y1='${y}' x2='${width-pad.r}' y2='${y}' stroke='#EEF2FF' />`).join('')}
    <path d='${path(incomeSeries)}' fill='none' stroke='#216EFD' stroke-width='2' />
    <path d='${path(expenseSeries)}' fill='none' stroke='#ef4444' stroke-width='2' />
    ${Array.from({length:xTicks},(_,i)=>{
      const x = pad.l + (W/(xTicks-1)) * i
      const idx = Math.round((incomeSeries.length-1) * (i/(xTicks-1)))
      const lab = labels[idx] ?? ''
      return `<text x='${x}' y='${height-8}' text-anchor='middle' font-size='10' fill='#6b7280'>${lab}</text>`
    }).join('')}
  </svg>`
  return svg
}


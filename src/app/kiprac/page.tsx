import type { Metadata } from 'next'
import {
  yen,
  pct,
  partsMaster,
  products,
  cost,
  bodyCost,
  tagCost,
  subMaterialCost,
  profitRows,
  stockRows,
  stockTotals,
  available,
  saleGroups,
  groupTotals,
  profit,
  payouts,
  payoutCost,
  purchases,
  totalPurchase,
  materialStock,
  totalMaterialStock,
  retailListings,
  simRows,
  simSales,
  simCost,
  simProfit,
  simTotalSales,
  simTotalCost,
  simTotalProfit,
  totalAvailable,
  soldCount,
  totalSales,
  soldCost,
  soldProfit,
  payoutCount,
  recoveryRate,
  forecastProfit,
  forecastMargin,
} from '@/lib/kiprac/ledger'

export const metadata: Metadata = {
  title: 'KIPRAC 製作原価台帳 | Oasis Series',
  description: 'KIPRAC（キップラック）Oasis Series の製作原価・在庫・利益・損益サマリー内部台帳',
}

const UPDATED = '2026-07-06'

const nav = [
  { id: 'summary', label: '損益サマリー' },
  { id: 'parts', label: '部材単価マスタ' },
  { id: 'cards', label: '下代カード' },
  { id: 'cost-summary', label: '下代サマリー' },
  { id: 'profit', label: '販売価格・利益' },
  { id: 'stock', label: '在庫一覧' },
  { id: 'sales', label: '販売実績' },
  { id: 'payout', label: '自着・提供' },
  { id: 'sim', label: '完売シミュレーション' },
  { id: 'purchase', label: '仕入れ明細' },
  { id: 'material', label: '材料在庫残' },
  { id: 'listing', label: 'BASE上代一覧' },
  { id: 'rules', label: '更新ルール' },
]

// ── 小さな共通パーツ ─────────────────────────────────────────
function Section({ id, index, title, sub, children }: { id: string; index?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-neutral-800 pt-10">
      <div className="mb-5 flex items-baseline gap-3">
        {index && <span className="text-sm font-mono text-[#d7ff2e]">{index}</span>}
        <h2 className="text-xl font-bold tracking-tight text-neutral-50 sm:text-2xl">{title}</h2>
      </div>
      {sub && <p className="mb-5 -mt-3 text-sm text-neutral-400">{sub}</p>}
      {children}
    </section>
  )
}

function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>
}

const th = 'whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400'
const td = 'whitespace-nowrap px-3 py-2.5 text-sm text-neutral-200'
const tdNum = 'whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums text-neutral-100'

function Stat({ label, value, accent, hint }: { label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold tabular-nums ${accent ? 'text-[#d7ff2e]' : 'text-neutral-50'}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
    </div>
  )
}

export default function KipracLedgerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-gradient-to-b from-neutral-950 to-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-[#d7ff2e]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#d7ff2e]" />
            KIPRAC / internal ledger
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-neutral-50 sm:text-6xl">
            製作原価台帳
          </h1>
          <p className="mt-2 text-lg font-medium text-neutral-400">Oasis Series ・ 下代 / 在庫 / 利益 / 損益</p>
          <p className="mt-4 text-sm text-neutral-500">
            更新日 {UPDATED} ・ 数値はすべて <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">src/lib/kiprac/ledger.ts</code> から自動算出
          </p>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-10 border-b border-neutral-800 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <ul className="flex gap-1 py-2 text-sm">
            {nav.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-50">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        {/* 損益サマリー */}
        <section id="summary" className="scroll-mt-20">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-neutral-50 sm:text-2xl">現時点 損益サマリー</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="総仕入れ額" value={yen(totalPurchase)} hint="全材料（損益の分母）" />
            <Stat label="現在の総売上" value={yen(totalSales)} hint={`販売済 ${soldCount}点`} />
            <Stat label="現在の総利益" value={yen(soldProfit)} accent hint="販売のみ" />
            <Stat label="仕入れ回収率" value={pct(recoveryRate)} hint="売上ベース" />
            <Stat label="販売分 下代" value={yen(soldCost)} />
            <Stat label="自着・提供 下代" value={yen(payoutCost)} hint={`${payoutCount}点・売上¥0`} />
            <Stat label="予測 総利益" value={yen(forecastProfit)} accent hint="残在庫EC完売時" />
            <Stat label="予測 最終利益率" value={pct(forecastMargin)} accent hint="対 総仕入れ額" />
          </div>
        </section>

        {/* 部材単価マスタ */}
        <Section id="parts" title="共通部材 単価マスタ" sub="仕入れ明細から逆算した1点あたりの按分単価。変更時はここを直す。">
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>部材</th>
                  <th className={th}>仕入実績</th>
                  <th className={th}>按分単価</th>
                  <th className={th}>備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {partsMaster.map((p) => (
                  <tr key={p.part} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{p.part}</td>
                    <td className={`${td} font-mono text-xs text-neutral-400`}>{p.source}</td>
                    <td className={`${td} font-semibold text-[#d7ff2e]`}>{p.unitPrice}</td>
                    <td className={`${td} text-neutral-400`}>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 下代カード */}
        <Section id="cards" title="商品別 下代カード" sub="下代 = 各費目 小計の合計（タグ込み）。ボディー行を更新すると下代が自動再計算されます。">
          <div className="grid gap-5 lg:grid-cols-2">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <div>
                    <span className="mr-2 font-mono text-[#d7ff2e]">{p.index}</span>
                    <span className="font-bold text-neutral-50">{p.name}</span>
                    <span className="ml-2 text-sm text-neutral-500">{p.lot}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500">下代</div>
                    <div className="text-lg font-bold tabular-nums text-[#d7ff2e]">{yen(cost(p))}</div>
                  </div>
                </div>
                <Scroll>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className={th}>費目</th>
                        <th className={th}>使用量</th>
                        <th className={`${th} text-right`}>単価</th>
                        <th className={`${th} text-right`}>小計</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {p.lines.map((l, i) => (
                        <tr key={i}>
                          <td className={td}>
                            {l.item}
                            {l.formula && <span className="ml-2 font-mono text-xs text-neutral-600">{l.formula}</span>}
                          </td>
                          <td className={`${td} text-neutral-400`}>{l.qty}</td>
                          <td className={tdNum}>{l.unit}</td>
                          <td className={`${tdNum} font-semibold`}>{yen(l.subtotal)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-neutral-700 bg-neutral-900/60">
                        <td className={`${td} font-bold`} colSpan={3}>下代合計</td>
                        <td className={`${tdNum} font-bold text-[#d7ff2e]`}>{yen(cost(p))}</td>
                      </tr>
                    </tbody>
                  </table>
                </Scroll>
                {p.note && <p className="mt-3 text-xs text-neutral-500">{p.note}</p>}
              </div>
            ))}
          </div>
        </Section>

        {/* 下代サマリー */}
        <Section id="cost-summary" title="下代サマリー（一覧）" sub="副資材計 ＝ 下代 − ボディー − タグ">
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品</th>
                  <th className={`${th} text-right`}>ボディー</th>
                  <th className={`${th} text-right`}>副資材計</th>
                  <th className={`${th} text-right`}>タグ</th>
                  <th className={`${th} text-right`}>下代</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{p.name}<span className="ml-1 text-neutral-500">{p.lot}</span></td>
                    <td className={tdNum}>{yen(bodyCost(p))}</td>
                    <td className={tdNum}>{yen(subMaterialCost(p))}</td>
                    <td className={tdNum}>{yen(tagCost(p))}</td>
                    <td className={`${tdNum} font-bold text-[#d7ff2e]`}>{yen(cost(p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 販売価格・利益 */}
        <Section id="profit" title="商品別 販売価格・利益（1点あたり）" sub="EC直販＝上代のまま／ファクトリー＝上代×70%。利益・利益率は下代から自動算出。">
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品</th>
                  <th className={`${th} text-right`}>下代</th>
                  <th className={`${th} text-right`}>上代</th>
                  <th className={`${th} text-right`}>EC利益</th>
                  <th className={`${th} text-right`}>EC率</th>
                  <th className={`${th} text-right`}>委託価格</th>
                  <th className={`${th} text-right`}>委託利益</th>
                  <th className={`${th} text-right`}>委託率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {profitRows.map((r) => (
                  <tr key={r.name} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{r.name}</td>
                    <td className={tdNum}>{yen(r.cost)}</td>
                    <td className={tdNum}>{yen(r.retail)}</td>
                    <td className={`${tdNum} font-semibold text-[#d7ff2e]`}>{yen(r.ecProfit)}</td>
                    <td className={`${tdNum} text-neutral-400`}>{pct(r.ecMargin)}</td>
                    <td className={tdNum}>{yen(r.factoryPrice)}</td>
                    <td className={`${tdNum} font-semibold`}>{yen(r.factoryProfit)}</td>
                    <td className={`${tdNum} text-neutral-400`}>{pct(r.factoryMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
          <p className="mt-3 text-xs text-neutral-500">※ Tシャツ：販売済4着は旧単価（¥2,664/着）で計上済み。残在庫以降は下代 ¥2,989/着。</p>
        </Section>

        {/* 在庫一覧 */}
        <Section id="stock" title={`在庫一覧（${UPDATED}時点）`} sub="自着＝オーナー着用（売上なし・下代のみ）／ 提供＝外部提供（売上なし・下代のみ）">
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品</th>
                  <th className={`${th} text-right`}>製作数</th>
                  <th className={`${th} text-right`}>直販</th>
                  <th className={`${th} text-right`}>委託</th>
                  <th className={`${th} text-right`}>自着</th>
                  <th className={`${th} text-right`}>提供</th>
                  <th className={`${th} text-right`}>販売可能在庫</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {stockRows.map((s) => (
                  <tr key={s.name} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{s.name}</td>
                    <td className={tdNum}>{s.made}{s.unit}</td>
                    <td className={tdNum}>{s.direct || '—'}</td>
                    <td className={tdNum}>{s.consign || '—'}</td>
                    <td className={tdNum}>{s.worn || '—'}</td>
                    <td className={tdNum}>{s.gifted || '—'}</td>
                    <td className={`${tdNum} font-bold text-[#d7ff2e]`}>{available(s)}{s.unit}</td>
                  </tr>
                ))}
                <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                  <td className={td}>合計</td>
                  <td className={tdNum}>{stockTotals.made}点</td>
                  <td className={tdNum}>{stockTotals.direct}</td>
                  <td className={tdNum}>{stockTotals.consign}</td>
                  <td className={tdNum}>{stockTotals.worn}</td>
                  <td className={tdNum}>{stockTotals.gifted}</td>
                  <td className={`${tdNum} text-[#d7ff2e]`}>{stockTotals.available}点</td>
                </tr>
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 販売実績 */}
        <Section id="sales" title="販売実績" sub={`販売済 ${soldCount}点 ・ 総売上 ${yen(totalSales)} ・ 総利益 ${yen(soldProfit)}`}>
          <div className="space-y-6">
            {saleGroups.map((g) => {
              const t = groupTotals(g)
              return (
                <div key={g.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                  <h3 className="mb-3 font-bold text-neutral-100">{g.title}</h3>
                  <Scroll>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className={th}>#</th>
                          <th className={th}>チャネル</th>
                          <th className={`${th} text-right`}>販売価格</th>
                          <th className={`${th} text-right`}>下代</th>
                          <th className={`${th} text-right`}>利益</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {g.records.map((r, i) => (
                          <tr key={i}>
                            <td className={`${td} text-neutral-400`}>{r.label}</td>
                            <td className={td}>{r.channel}</td>
                            <td className={tdNum}>{yen(r.price)}</td>
                            <td className={`${tdNum} text-neutral-400`}>{yen(r.cost)}</td>
                            <td className={`${tdNum} font-semibold text-[#d7ff2e]`}>{yen(profit(r))}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                          <td className={td} colSpan={2}>小計</td>
                          <td className={tdNum}>{yen(t.sales)}</td>
                          <td className={tdNum}>{yen(t.cost)}</td>
                          <td className={`${tdNum} text-[#d7ff2e]`}>{yen(t.profit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Scroll>
                </div>
              )
            })}

            {/* 販売合計 */}
            <div className="rounded-2xl border border-[#d7ff2e]/30 bg-[#d7ff2e]/[0.04] p-5">
              <h3 className="mb-3 font-bold text-neutral-100">販売合計</h3>
              <Scroll>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className={th}></th>
                      <th className={`${th} text-right`}>点数</th>
                      <th className={`${th} text-right`}>売上</th>
                      <th className={`${th} text-right`}>下代</th>
                      <th className={`${th} text-right`}>利益</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {saleGroups.map((g) => {
                      const t = groupTotals(g)
                      return (
                        <tr key={g.title}>
                          <td className={`${td} font-medium text-neutral-100`}>{g.title.replace(/（\d+着）/, '')}</td>
                          <td className={tdNum}>{t.count}</td>
                          <td className={tdNum}>{yen(t.sales)}</td>
                          <td className={`${tdNum} text-neutral-400`}>{yen(t.cost)}</td>
                          <td className={`${tdNum} font-semibold text-[#d7ff2e]`}>{yen(t.profit)}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                      <td className={td}>総計</td>
                      <td className={tdNum}>{soldCount}</td>
                      <td className={tdNum}>{yen(totalSales)}</td>
                      <td className={tdNum}>{yen(soldCost)}</td>
                      <td className={`${tdNum} text-[#d7ff2e]`}>{yen(soldProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </Scroll>
            </div>
          </div>
        </Section>

        {/* 自着・提供 */}
        <Section id="payout" title="自着・提供（売上なし払出）" sub={`${payoutCount}点 ・ 下代 ${yen(payoutCost)} ・ 売上 ¥0`}>
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品</th>
                  <th className={th}>区分</th>
                  <th className={`${th} text-right`}>点数</th>
                  <th className={`${th} text-right`}>下代</th>
                  <th className={th}>備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {payouts.map((p) => (
                  <tr key={p.name} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{p.name}</td>
                    <td className={td}><span className="rounded bg-neutral-800 px-2 py-0.5 text-xs">{p.kind}</span></td>
                    <td className={tdNum}>{p.count}</td>
                    <td className={tdNum}>{yen(p.cost)}</td>
                    <td className={`${td} text-neutral-400`}>{p.note}</td>
                  </tr>
                ))}
                <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                  <td className={td}>小計</td>
                  <td className={td}></td>
                  <td className={tdNum}>{payoutCount}点</td>
                  <td className={tdNum}>{yen(payoutCost)}</td>
                  <td className={`${td} text-neutral-400`}>売上 ¥0</td>
                </tr>
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 完売シミュレーション */}
        <Section id="sim" title="残在庫と完売シミュレーション" sub={`販売可能在庫 ${totalAvailable}点をEC直販で全点完売した場合の予測。`}>
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品</th>
                  <th className={`${th} text-right`}>残数</th>
                  <th className={`${th} text-right`}>上代</th>
                  <th className={`${th} text-right`}>売上</th>
                  <th className={`${th} text-right`}>下代</th>
                  <th className={`${th} text-right`}>利益</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {simRows.map((r) => (
                  <tr key={r.name} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{r.name}</td>
                    <td className={tdNum}>{r.remain}{r.unit}</td>
                    <td className={`${tdNum} text-neutral-400`}>{yen(r.retail)}</td>
                    <td className={tdNum}>{yen(simSales(r))}</td>
                    <td className={`${tdNum} text-neutral-400`}>{yen(simCost(r))}</td>
                    <td className={`${tdNum} font-semibold text-[#d7ff2e]`}>{yen(simProfit(r))}</td>
                  </tr>
                ))}
                <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                  <td className={td}>残在庫合計</td>
                  <td className={tdNum}>{totalAvailable}点</td>
                  <td className={tdNum}></td>
                  <td className={tdNum}>{yen(simTotalSales)}</td>
                  <td className={tdNum}>{yen(simTotalCost)}</td>
                  <td className={`${tdNum} text-[#d7ff2e]`}>{yen(simTotalProfit)}</td>
                </tr>
              </tbody>
            </table>
          </Scroll>

          <div className="mt-6 rounded-2xl border border-[#d7ff2e]/30 bg-[#d7ff2e]/[0.04] p-5">
            <h3 className="mb-4 font-bold text-neutral-100">現在実績 ＋ 残在庫完売（EC）の総利益</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="現在の利益（実績）" value={yen(soldProfit)} />
              <Stat label="自着・提供 下代" value={`▲${yen(payoutCost)}`} hint="回収対象外" />
              <Stat label="残在庫EC完売利益" value={yen(simTotalProfit)} hint="予測" />
              <Stat label="総利益（予測）" value={yen(forecastProfit)} accent />
              <Stat label="総仕入れ額" value={yen(totalPurchase)} />
              <Stat label="最終利益率（予測）" value={pct(forecastMargin)} accent />
            </div>
          </div>
        </Section>

        {/* 仕入れ明細 */}
        <Section id="purchase" title="仕入れ明細（全費用）" sub={`総仕入れ額 ${yen(totalPurchase)} ・ 損益サマリーの分母`}>
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={`${th} text-right`}>No.</th>
                  <th className={th}>品目</th>
                  <th className={`${th} text-right`}>数量</th>
                  <th className={`${th} text-right`}>合計金額</th>
                  <th className={`${th} text-right`}>単価</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {purchases.map((r) => (
                  <tr key={r.no} className="hover:bg-neutral-900/40">
                    <td className={`${tdNum} text-neutral-500`}>{r.no}</td>
                    <td className={`${td} font-medium text-neutral-100`}>{r.item}</td>
                    <td className={`${tdNum} text-neutral-400`}>{r.qty}</td>
                    <td className={`${tdNum} font-semibold`}>{yen(r.total)}</td>
                    <td className={`${tdNum} text-neutral-400`}>{r.unit}</td>
                  </tr>
                ))}
                <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                  <td className={td} colSpan={3}>総仕入れ額</td>
                  <td className={`${tdNum} text-[#d7ff2e]`}>{yen(totalPurchase)}</td>
                  <td className={td}></td>
                </tr>
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 材料在庫残 */}
        <Section id="material" title="材料在庫残（未使用分）" sub={`次回Lotに使える資産。在庫残合計 ${yen(totalMaterialStock)}`}>
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>品目</th>
                  <th className={`${th} text-right`}>残数</th>
                  <th className={`${th} text-right`}>在庫価値</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {materialStock.map((m) => (
                  <tr key={m.item} className="hover:bg-neutral-900/40">
                    <td className={`${td} font-medium text-neutral-100`}>{m.item}</td>
                    <td className={`${tdNum} text-neutral-400`}>{m.qty}</td>
                    <td className={tdNum}>{yen(m.value)}</td>
                  </tr>
                ))}
                <tr className="border-t border-neutral-700 bg-neutral-900/60 font-bold">
                  <td className={td} colSpan={2}>在庫残合計</td>
                  <td className={`${tdNum} text-[#d7ff2e]`}>{yen(totalMaterialStock)}</td>
                </tr>
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* BASE上代一覧 */}
        <Section id="listing" title="上代一覧（BASE掲載商品）" sub="EC（BASE）に掲載中の全商品の上代（税込）。">
          <Scroll>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className={th}>商品名</th>
                  <th className={`${th} text-right`}>上代（税込）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {retailListings.map((r) => (
                  <tr key={r.name} className={`hover:bg-neutral-900/40 ${r.soldOut ? 'opacity-50' : ''}`}>
                    <td className={`${td} font-medium text-neutral-100`}>
                      {r.name}
                      {r.soldOut && <span className="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-xs text-red-400">SOLD OUT</span>}
                    </td>
                    <td className={`${tdNum} font-semibold`}>{yen(r.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </Section>

        {/* 更新ルール */}
        <Section id="rules" title="下代の見方・更新ルール">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="mb-3 font-bold text-neutral-100">更新の流れ</h3>
              <ol className="space-y-2 text-sm text-neutral-300">
                <li className="flex gap-2"><span className="text-[#d7ff2e]">1.</span> 部材単価が変わった → <code className="rounded bg-neutral-800 px-1 text-xs">partsMaster</code> と該当カードの小計を更新</li>
                <li className="flex gap-2"><span className="text-[#d7ff2e]">2.</span> ボディー仕入が変わった → 該当カードの「ボディー」行だけ更新（Lot別）</li>
                <li className="flex gap-2"><span className="text-[#d7ff2e]">3.</span> 下代 ＝ 各費目 小計の合計（タグ込み）を自動再計算</li>
              </ol>
              <p className="mt-4 text-xs text-neutral-500">
                下代サマリー・利益表・在庫シミュレーション・損益サマリーはすべて
                <code className="mx-1 rounded bg-neutral-800 px-1">ledger.ts</code>
                の入力から派生するため、手作業の再計算は不要です。
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="mb-3 font-bold text-neutral-100">新Lot・単価変更チェックリスト</h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex gap-2"><span className="text-neutral-600">☐</span> 共通部材マスタの単価を更新した</li>
                <li className="flex gap-2"><span className="text-neutral-600">☐</span> 該当商品カードの小計・下代を再計算した</li>
                <li className="flex gap-2"><span className="text-neutral-600">☐</span> 在庫一覧の製作数・払出を更新した</li>
                <li className="flex gap-2"><span className="text-neutral-600">☐</span> 販売実績に新規販売を追記した</li>
              </ul>
              <p className="mt-4 text-xs text-neutral-500">
                チャネル：直販 / オリオンファクトリー / 自着 / 提供
              </p>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-neutral-800 py-8 text-center text-xs text-neutral-600">
        KIPRAC ・ 製作原価台帳 Oasis Series ・ Internal use only ・ {UPDATED}
      </footer>
    </div>
  )
}

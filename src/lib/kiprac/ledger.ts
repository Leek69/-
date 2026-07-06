// KIPRAC 製作原価台帳（Oasis Series）
//
// このファイルが唯一の「入力」です。部材単価・ボディー仕入・数量を変えると、
// 下代 / 利益 / 在庫 / 損益 / 完売シミュレーションはすべて自動で再計算されます。
//
// 更新ルール:
//   1. 部材単価が変わった  → partsMaster を更新
//   2. ボディー仕入が変わった → 該当商品の costCard「ボディー」行を更新（Lot別）
//   3. 各費目の小計は「使用量 × 単価」ではなく、実績に基づく確定小計を保持
//      （端数処理がロットごとに異なるため）。小計を直せば下代は自動再計算されます。

export const FACTORY_RATE = 0.7 // オリオンファクトリー委託: 上代 × 70%

// ── 表示ヘルパー ─────────────────────────────────────────────
export const yen = (n: number): string => `¥${Math.round(n).toLocaleString('ja-JP')}`
export const pct = (n: number): string => `${n.toFixed(1)}%`

// ── 共通部材 単価マスタ ──────────────────────────────────────
export interface PartMaster {
  part: string
  source: string // 仕入実績（逆算の根拠）
  unitPrice: string // 按分単価（表示用の文字列。端数を含むため）
  note: string
}

export const partsMaster: PartMaster[] = [
  { part: 'A スタッズ 6mm', source: '¥1,935÷576個 ＋ ¥452÷144個', unitPrice: '¥3.32/個', note: 'デニム系1点あたり41個使用' },
  { part: 'B ボタン 8mm', source: '¥598÷10着分', unitPrice: '¥60/着', note: 'カモ8本＋デニム2本で按分（3個/着）' },
  { part: 'C スタッズ 黄色', source: '¥867÷100個', unitPrice: '¥8.67/個', note: 'デニム系1点あたり5個使用' },
  { part: 'デニムパンツ専用ボタン', source: '¥1,189÷50個', unitPrice: '¥23.78/個', note: 'デニムパンツのみ1個/着' },
  { part: '刺繍（KIPRACロゴ）', source: '¥4,400÷5着 ／ ¥8,000÷10着', unitPrice: '¥880/着（初回）・¥800/着（新Lot）', note: 'Flower Shirtのみ' },
  { part: 'スナップボタン（白）', source: '¥5,720÷40 ＋ ¥4,290÷30', unitPrice: '¥143/個', note: 'Flower Shirt 5個/着' },
  { part: '商品タグ', source: '¥19,640÷300個', unitPrice: '¥65/着', note: '全商品共通（端数 ¥65.47→¥65）' },
  { part: 'Tシャツ プリント代', source: 'ボディー仕入に込み', unitPrice: '—', note: '別途計上なし' },
]

// ── 商品別 下代カード ────────────────────────────────────────
export interface CostLine {
  item: string
  qty: string // 使用量
  unit: string // 単価（表示用）
  subtotal: number // 小計（確定値）
  formula: string // 算出式
}

export interface ProductCost {
  id: string
  index: string // ①②③...
  name: string
  lot: string // Lot名 + 数量
  retail: number // 上代（定価・税込）
  lines: CostLine[]
  note?: string
}

// 商品カード。下代 = lines の小計合計（cost() で算出）。
export const products: ProductCost[] = [
  {
    id: 'flower-first',
    index: '①',
    name: 'Oasis Flower Shirt',
    lot: '初回Lot（5着）',
    retail: 15400,
    lines: [
      { item: 'ボディー', qty: '1着', unit: '¥4,236', subtotal: 4236, formula: '¥21,182 ÷ 5着' },
      { item: '刺繍（KIPRACロゴ）', qty: '1着分', unit: '¥880', subtotal: 880, formula: '¥4,400 ÷ 5着' },
      { item: 'スナップボタン（白）', qty: '5個', unit: '¥143', subtotal: 715, formula: '5 × ¥143' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
  },
  {
    id: 'flower-new',
    index: '②',
    name: 'Oasis Flower Shirt',
    lot: '新Lot（10着）',
    retail: 15400,
    lines: [
      { item: 'ボディー', qty: '1着', unit: '¥4,100', subtotal: 4100, formula: '¥40,995 ÷ 10着 → 切上' },
      { item: '刺繍（KIPRACロゴ）', qty: '1着分', unit: '¥800', subtotal: 800, formula: '¥8,000 ÷ 10着' },
      { item: 'スナップボタン（白）', qty: '5個', unit: '¥143', subtotal: 715, formula: '5 × ¥143' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
    note: '初回Lotとの差：ボディー ▲¥136 ＋ 刺繍 ▲¥80 → 合計 ▲¥216/着',
  },
  {
    id: 'camo-lot1',
    index: '③',
    name: 'Camo Denim Pants',
    lot: 'Lot1（3本）',
    retail: 18700,
    lines: [
      { item: 'ボディー', qty: '1本', unit: '¥3,991', subtotal: 3991, formula: '¥11,973 ÷ 3本' },
      { item: 'A スタッズ 6mm', qty: '41個', unit: '¥3.32', subtotal: 136, formula: '41 × ¥3.32' },
      { item: 'B ボタン 8mm', qty: '3個分', unit: '¥60', subtotal: 60, formula: '¥598 ÷ 10着分' },
      { item: 'C スタッズ 黄色', qty: '5個', unit: '¥8.67', subtotal: 43, formula: '5 × ¥8.67' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
  },
  {
    id: 'camo-lot2',
    index: '④',
    name: 'Camo Denim Pants',
    lot: 'Lot2（6本）',
    retail: 18700,
    lines: [
      { item: 'ボディー', qty: '1本', unit: '¥4,461', subtotal: 4461, formula: '¥26,764 ÷ 6本' },
      { item: 'A スタッズ 6mm', qty: '41個', unit: '¥3.32', subtotal: 136, formula: '41 × ¥3.32' },
      { item: 'B ボタン 8mm', qty: '3個分', unit: '¥60', subtotal: 60, formula: '¥598 ÷ 10着分' },
      { item: 'C スタッズ 黄色', qty: '5個', unit: '¥8.67', subtotal: 43, formula: '5 × ¥8.67' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
    note: 'Lot1との差：ボディーのみ ¥470高（¥3,991 → ¥4,461）。副資材は同一単価。',
  },
  {
    id: 'denim-new',
    index: '⑤',
    name: 'デニムパンツ（新作）',
    lot: '2本',
    retail: 14300,
    lines: [
      { item: 'ボディー', qty: '1本', unit: '¥3,278', subtotal: 3278, formula: '¥6,555 ÷ 2本' },
      { item: 'A スタッズ 6mm', qty: '41個', unit: '¥3.32', subtotal: 136, formula: '41 × ¥3.32' },
      { item: 'B ボタン 8mm', qty: '3個分', unit: '¥60', subtotal: 60, formula: '¥598 ÷ 10着分' },
      { item: 'C スタッズ 黄色', qty: '5個', unit: '¥8.67', subtotal: 43, formula: '5 × ¥8.67' },
      { item: 'デニムパンツ専用ボタン', qty: '1個', unit: '¥23.78', subtotal: 24, formula: '端数切上' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
    note: 'Camo Denim との差：専用ボタン ¥24 ＋ ボディー単価が安い（Lot1比 ▲¥713）',
  },
  {
    id: 'tee',
    index: '⑥',
    name: 'Tシャツ',
    lot: '8着',
    retail: 7700,
    lines: [
      { item: 'ボディー（プリント込）', qty: '1着', unit: '¥2,924', subtotal: 2924, formula: '¥23,389 ÷ 8着' },
      { item: '商品タグ', qty: '1枚', unit: '¥65', subtotal: 65, formula: '' },
    ],
  },
]

// 下代 = 各費目 小計の合計
export const cost = (p: ProductCost): number => p.lines.reduce((s, l) => s + l.subtotal, 0)
// 副資材計 = 下代 − ボディー − タグ
export const bodyCost = (p: ProductCost): number => p.lines.find((l) => l.item.startsWith('ボディー'))?.subtotal ?? 0
export const tagCost = (p: ProductCost): number => p.lines.find((l) => l.item === '商品タグ')?.subtotal ?? 0
export const subMaterialCost = (p: ProductCost): number => cost(p) - bodyCost(p) - tagCost(p)

// ── 商品別 販売価格・利益（1点あたり） ─────────────────────────
export interface ProfitRow {
  name: string
  cost: number
  retail: number
  ecProfit: number
  ecMargin: number
  factoryPrice: number
  factoryProfit: number
  factoryMargin: number
}

const displayName = (p: ProductCost): string =>
  p.id === 'flower-first' ? 'Oasis Flower Shirt（初回）'
  : p.id === 'flower-new' ? 'Oasis Flower Shirt（新Lot）'
  : p.id === 'camo-lot1' ? 'Camo Denim Lot1'
  : p.id === 'camo-lot2' ? 'Camo Denim Lot2'
  : p.id === 'denim-new' ? 'デニムパンツ'
  : 'Tシャツ'

export const profitRows: ProfitRow[] = products.map((p) => {
  const c = cost(p)
  const factoryPrice = Math.round(p.retail * FACTORY_RATE)
  return {
    name: displayName(p),
    cost: c,
    retail: p.retail,
    ecProfit: p.retail - c,
    ecMargin: ((p.retail - c) / p.retail) * 100,
    factoryPrice,
    factoryProfit: factoryPrice - c,
    factoryMargin: ((factoryPrice - c) / factoryPrice) * 100,
  }
})

// ── 在庫一覧 ─────────────────────────────────────────────────
export interface StockRow {
  name: string
  made: number // 製作数
  direct: number // 直販
  consign: number // 委託
  worn: number // 自着（オーナー着用・売上なし）
  gifted: number // 提供（外部提供・売上なし）
  unit: string // 着 / 本
}

export const stockRows: StockRow[] = [
  { name: 'Oasis Flower Shirt（初回）', made: 5, direct: 3, consign: 0, worn: 0, gifted: 0, unit: '着' },
  { name: 'Oasis Flower Shirt（新Lot）', made: 10, direct: 3, consign: 0, worn: 1, gifted: 0, unit: '着' },
  { name: 'Camo Denim Pants Lot1', made: 3, direct: 0, consign: 0, worn: 1, gifted: 0, unit: '本' },
  { name: 'Camo Denim Pants Lot2', made: 6, direct: 0, consign: 0, worn: 0, gifted: 1, unit: '本' },
  { name: 'デニムパンツ', made: 2, direct: 0, consign: 0, worn: 0, gifted: 0, unit: '本' },
  { name: 'Tシャツ', made: 8, direct: 3, consign: 1, worn: 0, gifted: 0, unit: '着' },
]

export const available = (s: StockRow): number => s.made - s.direct - s.consign - s.worn - s.gifted

// ── 販売実績 ─────────────────────────────────────────────────
export interface SaleRecord {
  label: string
  channel: string
  price: number
  cost: number
}
export interface SaleGroup {
  title: string
  records: SaleRecord[]
}

export const saleGroups: SaleGroup[] = [
  {
    title: 'Tシャツ（4着）',
    records: [
      { label: '1', channel: '直販', price: 6000, cost: 2664 },
      { label: '2', channel: '直販', price: 3000, cost: 2664 },
      { label: '3', channel: '直販', price: 7700, cost: 2664 },
      { label: '4', channel: 'オリオンファクトリー（×70%）', price: 5390, cost: 2664 },
    ],
  },
  {
    title: 'Oasis Flower Shirt — 初回Lot（3着）',
    records: [
      { label: '1着目', channel: '直販', price: 14000, cost: 5896 },
      { label: '2着目', channel: '直販', price: 14000, cost: 5896 },
      { label: '3着目', channel: '直販', price: 14000, cost: 5896 },
    ],
  },
  {
    title: 'Oasis Flower Shirt — 新Lot（3着）',
    records: [
      { label: '1着目', channel: '直販', price: 14000, cost: 5680 },
      { label: '2着目', channel: '直販', price: 14000, cost: 5680 },
      { label: '3着目', channel: '直販', price: 14000, cost: 5680 },
    ],
  },
]

export const profit = (r: SaleRecord): number => r.price - r.cost
export const groupTotals = (g: SaleGroup) => ({
  count: g.records.length,
  sales: g.records.reduce((s, r) => s + r.price, 0),
  cost: g.records.reduce((s, r) => s + r.cost, 0),
  profit: g.records.reduce((s, r) => s + profit(r), 0),
})

// ── 自着・提供（売上なし払出） ────────────────────────────────
export interface Payout {
  name: string
  kind: string // 自着 / 提供
  count: string
  cost: number
  note: string
}

export const payouts: Payout[] = [
  { name: 'Oasis Flower Shirt 新Lot', kind: '自着', count: '1着', cost: 5680, note: 'オーナー着用' },
  { name: 'Camo Denim Pants Lot1', kind: '自着', count: '1本', cost: 4295, note: 'オーナー着用' },
  { name: 'Camo Denim Pants Lot2', kind: '提供', count: '1本', cost: 4765, note: '外部提供' },
]

// ── 仕入れ明細（全費用・損益の分母） ─────────────────────────
export interface PurchaseRow {
  no: number
  item: string
  qty: string
  total: number
  unit: string
}

export const purchases: PurchaseRow[] = [
  { no: 1, item: 'Camo Denim ボディー（Lot 1）', qty: '3本', total: 11973, unit: '¥3,991/本' },
  { no: 2, item: 'A スタッズ 6mm（通常ロット）', qty: '4袋（576個）', total: 1935, unit: '¥484/袋' },
  { no: 3, item: 'B ボタン 8mm', qty: '1袋', total: 598, unit: '—' },
  { no: 4, item: 'A スタッズ 6mm（別ロット）', qty: '1袋（144個）', total: 452, unit: '¥452/袋' },
  { no: 5, item: 'C スタッズ 黄色', qty: '100個', total: 867, unit: '¥8.67/個' },
  { no: 6, item: 'Oasis Flower Shirt ボディー（初回）', qty: '5着', total: 21182, unit: '¥4,236/着' },
  { no: 7, item: '刺繍（KIPRACロゴ）初回', qty: '5着分', total: 4400, unit: '¥880/着' },
  { no: 8, item: 'スナップボタン（白）初回', qty: '40個', total: 5720, unit: '¥143/個' },
  { no: 9, item: 'デニムパンツ ボディー', qty: '2本', total: 6555, unit: '¥3,278/本' },
  { no: 10, item: 'Tシャツ ボディー（プリント込）', qty: '8着', total: 23389, unit: '¥2,924/着' },
  { no: 11, item: 'Camo Denim ボディー（Lot 2）', qty: '6本', total: 26764, unit: '¥4,461/本' },
  { no: 12, item: 'デニムパンツ専用ボタン', qty: '50個', total: 1189, unit: '¥23.78/個' },
  { no: 13, item: '商品タグ', qty: '300個', total: 19640, unit: '¥65.47/個' },
  { no: 14, item: 'Oasis Flower Shirt ボディー（新Lot）', qty: '10着', total: 40995, unit: '¥4,099.5/着' },
  { no: 15, item: '刺繍（KIPRACロゴ）新Lot', qty: '10着分', total: 8000, unit: '¥800/着' },
  { no: 16, item: 'スナップボタン（白）追加', qty: '30個', total: 4290, unit: '¥143/個' },
]

export const totalPurchase = purchases.reduce((s, r) => s + r.total, 0) // ¥177,949

// ── 材料在庫残（未使用分） ───────────────────────────────────
export interface MaterialStock {
  item: string
  qty: string
  value: number
}

export const materialStock: MaterialStock[] = [
  { item: '商品タグ', qty: '276個', value: 18070 },
  { item: 'スナップボタン（白）', qty: '45個', value: 6435 },
  { item: 'A スタッズ 6mm', qty: '約310個', value: 1029 },
  { item: 'C スタッズ 黄色', qty: '50個', value: 434 },
  { item: 'デニムパンツ専用ボタン', qty: '48個', value: 1141 },
]

export const totalMaterialStock = materialStock.reduce((s, r) => s + r.value, 0)

// ── 上代一覧（BASE掲載商品） ─────────────────────────────────
export interface RetailListing {
  name: string
  price: number
  soldOut?: boolean
}

export const retailListings: RetailListing[] = [
  { name: 'Oasis Flower Shirt（Green / Blue / Black）', price: 15400 },
  { name: 'Oasis Mirage-Camo Denim（Wide-Legs）', price: 18700 },
  { name: 'デニムパンツ（新作）', price: 14300 },
  { name: 'Oasis Mirage S/S Tee（Tribal Frame）', price: 7700 },
  { name: '3D logo S/S Tee', price: 7700 },
  { name: 'One of favorite cheesecake S/S Tee', price: 7700 },
  { name: 'KIPRAC BASIC TEE', price: 5500 },
  { name: 'KIPRAC Jagged Cardigan', price: 18700 },
  { name: 'KIPRAC × BUMM Fusion Collection L/S Tee', price: 11000 },
  { name: 'KIPRAC × BUMM Fusion Collection Doubleknee Pants', price: 28600 },
  { name: 'KIPRAC × BUMM Fusion Collection Bomber Jacket', price: 29700 },
  { name: 'Forget-me-not Shirt', price: 12100, soldOut: true },
  { name: 'Forget-me-not Shorts pants', price: 7700 },
  { name: 'How to love ラグマット', price: 7700 },
  { name: 'How to love ウォームシェルパーカ', price: 19800 },
  { name: 'How to love ジップパーカー 10oz', price: 15400 },
  { name: 'How to love プルオーバー 10oz', price: 15400 },
  { name: 'How to love スウェットパンツ 10oz', price: 11000 },
  { name: 'How to love L/S Tee', price: 9900 },
]

// ── 残在庫 完売シミュレーション ─────────────────────────────
// 商品カード（下代）× 在庫（残数・上代）から算出
const costById = (id: string): number => cost(products.find((p) => p.id === id)!)

export interface SimRow {
  name: string
  remain: number
  unit: string
  costEach: number
  retail: number
}

// stockRows と products を突き合わせ（表示名で対応）
const simSource: { id: string; stockName: string }[] = [
  { id: 'flower-first', stockName: 'Oasis Flower Shirt（初回）' },
  { id: 'flower-new', stockName: 'Oasis Flower Shirt（新Lot）' },
  { id: 'camo-lot1', stockName: 'Camo Denim Pants Lot1' },
  { id: 'camo-lot2', stockName: 'Camo Denim Pants Lot2' },
  { id: 'denim-new', stockName: 'デニムパンツ' },
  { id: 'tee', stockName: 'Tシャツ' },
]

export const simRows: SimRow[] = simSource.map(({ id, stockName }) => {
  const s = stockRows.find((r) => r.name === stockName)!
  const p = products.find((r) => r.id === id)!
  const simName =
    id === 'flower-first' ? 'Oasis Flower Shirt（初回）'
    : id === 'flower-new' ? 'Oasis Flower Shirt（新Lot）'
    : stockName
  return { name: simName, remain: available(s), unit: s.unit, costEach: costById(id), retail: p.retail }
})

export const simSales = (r: SimRow) => r.remain * r.retail
export const simCost = (r: SimRow) => r.remain * r.costEach
export const simProfit = (r: SimRow) => simSales(r) - simCost(r)

// ── 集計（損益サマリー・回収率・予測） ───────────────────────
const allSaleTotals = saleGroups.map(groupTotals)

export const soldCount = allSaleTotals.reduce((s, g) => s + g.count, 0)
export const totalSales = allSaleTotals.reduce((s, g) => s + g.sales, 0)
export const soldCost = allSaleTotals.reduce((s, g) => s + g.cost, 0)
export const soldProfit = allSaleTotals.reduce((s, g) => s + g.profit, 0)

export const payoutCount = payouts.length
export const payoutCost = payouts.reduce((s, p) => s + p.cost, 0)

export const recoveryRate = (totalSales / totalPurchase) * 100 // 総仕入れ回収率（売上ベース）

export const totalAvailable = stockRows.reduce((s, r) => s + available(r), 0)
export const simTotalSales = simRows.reduce((s, r) => s + simSales(r), 0)
export const simTotalCost = simRows.reduce((s, r) => s + simCost(r), 0)
export const simTotalProfit = simRows.reduce((s, r) => s + simProfit(r), 0)

export const forecastProfit = soldProfit - payoutCost + simTotalProfit
export const forecastMargin = (forecastProfit / totalPurchase) * 100

// 在庫サマリー（合計行）
export const stockTotals = {
  made: stockRows.reduce((s, r) => s + r.made, 0),
  direct: stockRows.reduce((s, r) => s + r.direct, 0),
  consign: stockRows.reduce((s, r) => s + r.consign, 0),
  worn: stockRows.reduce((s, r) => s + r.worn, 0),
  gifted: stockRows.reduce((s, r) => s + r.gifted, 0),
  available: totalAvailable,
}

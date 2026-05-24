import { authFetch } from './auth'

export const SHIPPING_FEE = 15000

export const BANK_INFO = {
  bankName: 'MBBank',
  accountNumber: '0795301977',
  accountHolder: 'LE QUANG VINH',
}

export async function createCheckout(apiBase, payload) {
  const res = await authFetch('/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let message = 'Không tạo được đơn hàng'
    try {
      const data = await res.json()
      const d = data.detail
      if (typeof d === 'string') message = d
      else if (Array.isArray(d)) message = d.map((x) => x.msg || x).join(', ')
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return res.json()
}

export async function fetchMyOrders(apiBase) {
  const res = await authFetch('/orders/my-orders')
  if (!res.ok) {
    throw new Error('Không tải được lịch sử đơn hàng')
  }
  return res.json()
}

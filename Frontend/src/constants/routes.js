/** Đường dẫn khu khách (đã thống nhất /home thay cho /hello). */
export const CUSTOMER_HOME = '/home'
export const CUSTOMER_PROFILE = '/home/profile'
export const CUSTOMER_SHOP_COFFEE = '/home/coffee'
export const CUSTOMER_SHOP_EQUIPMENT = '/home/equipment'

export function customerDevelopingPath(m) {
  return `${CUSTOMER_HOME}/developing?m=${encodeURIComponent(m)}`
}

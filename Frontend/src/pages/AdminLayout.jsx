import iconPet from '../assets/iconpet.svg'
import inventoryIcon from '../assets/inventory_2_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import warehouseIcon from '../assets/warehouse_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import receiptLongIcon from '../assets/receipt_long_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'

function NavItem({ active = false, icon, label }) {
  const activeClass = active
    ? 'text-primary font-bold border-r-4 border-primary bg-primary-container/10 rounded-l-lg'
    : 'text-on-surface-variant font-medium rounded-lg'

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-stack-md px-gutter py-stack-md hover:bg-surface-container-high transition-all ${activeClass}`}
    >
      <img src={icon} alt="" className="h-5 w-5 opacity-80" />
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  )
}

export default function AdminLayout({ children }) {
  return (
    <div className="bg-background text-on-background flex h-screen overflow-hidden font-body-md text-body-md">
      <nav className="fixed left-0 top-0 h-full w-64 flex flex-col z-50 overflow-y-auto bg-surface-container shadow-md hidden md:flex border-r border-outline-variant/30">
        <div className="p-container-padding-desktop pb-stack-lg flex items-center gap-stack-sm">
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-headline-md text-headline-md shadow-sm">
            <img src={iconPet} alt="logo" className="h-6 w-6" />
          </div>
          <div className="font-headline-md text-[20px] leading-[28px] font-bold text-on-surface">Admin Central</div>
        </div>
        <div className="flex flex-col gap-1 px-2">
          <NavItem active icon={inventoryIcon} label="Sản phẩm" />
          <NavItem icon={warehouseIcon} label="Quản lý kho" />
          <NavItem icon={receiptLongIcon} label="Đơn hàng" />
        </div>
      </nav>

      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden bg-surface relative">
        {children}
      </main>
    </div>
  )
}

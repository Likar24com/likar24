import CabinetLayout from '../../components/CabinetLayout'
import FinanceStub from '../../components/FinanceStub'

export default function FinancePage() {
  return (
    <CabinetLayout current="finance">
      <FinanceStub />
    </CabinetLayout>
  )
}

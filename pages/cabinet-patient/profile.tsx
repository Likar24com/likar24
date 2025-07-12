import CabinetPatientLayout from '../../components/CabinetPatientLayout'
import ProfilePatient from '../../components/ProfilePatient'

export default function ProfilePatientPage() {
  return (
    <CabinetPatientLayout current="profile">
      <ProfilePatient />
    </CabinetPatientLayout>
  )
}

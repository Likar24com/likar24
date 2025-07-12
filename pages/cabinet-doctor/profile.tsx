import CabinetLayout from '../../components/CabinetLayout'
import ProfileDoctor from '../../components/ProfileDoctor'

export default function ProfilePage() {
  return (
    <CabinetLayout current="profile">
      <ProfileDoctor />
    </CabinetLayout>
  )
}

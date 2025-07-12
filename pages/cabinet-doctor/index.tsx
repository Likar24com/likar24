import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function CabinetIndex() {
  const router = useRouter()
  useEffect(() => { router.replace('/cabinet-doctor/profile') }, [router])
  return null
}

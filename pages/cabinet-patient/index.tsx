// редірект одразу на профіль пацієнта
import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function Index() {
  const router = useRouter()
  useEffect(() => { router.replace('/cabinet-patient/profile') }, [router])
  return null
}

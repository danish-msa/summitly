"use client"

// Redirect to edit page with 'new' as ID
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewLocationPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/admin/pre-con-projects/by-location/new/edit")
  }, [router])

  return null
}


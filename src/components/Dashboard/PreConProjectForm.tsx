"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, MapPin, Upload, Loader2, Waves, Dumbbell, Square, Shield, Sparkles, UtensilsCrossed, Coffee, Car, Lock, Wifi, Tv, Gamepad2, ShoppingBag, TreePine, Mountain, Eye, ArrowUpDown, Flame, Users, Palette, Hammer, Sprout, Megaphone, Building2, Home, Ruler, Bed, Bath, Calendar, DollarSign, Construction, ChevronDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import GlobalLocationSearch from "@/components/common/GlobalLocationSearch"
import { getGeocode, getLatLng } from "use-places-autocomplete"
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'

export interface Document {
  id: string
  name: string
  url: string
  type: string
  size?: string
  uploadedDate?: string
}

export interface PendingImage {
  file: File
  preview: string
  id: string
}

export interface Unit {
  id: string
  unitName: string
  beds: string
  baths: string
  sqft: string
  price: string
  maintenanceFee: string
  status: string
  images: string[]
  pendingImages: PendingImage[]
  description: string
  features: string[]
  amenities: string[]
}

export interface FormData {
  projectName: string
  developer: string
  startingPrice: string
  endingPrice: string
  avgPricePerSqft: string
  status: string
  parkingPrice: string
  parkingPriceDetail: string
  lockerPrice: string
  lockerPriceDetail: string
  assignmentFee: string
  developmentLevies: string
  developmentCharges: string
  streetNumber: string
  streetName: string
  city: string
  state: string
  zip: string
  neighborhood: string
  majorIntersection: string
  latitude: string
  longitude: string
  propertyType: string
  subPropertyType: string
  bedroomRange: string
  bathroomRange: string
  sqftMin: string
  sqftMax: string
  hasDen: boolean
  hasStudio: boolean
  hasLoft: boolean
  hasWorkLiveLoft: boolean
  totalUnits: string
  availableUnits: string
  suites: string
  storeys: string
  height: string
  maintenanceFeesPerSqft: string
  maintenanceFeesDetail: string
  floorPremiums: string
  occupancyDate: string
  completionProgress: string
  promotions: string
  ownershipType: string
  garage: string
  basement: string
  images: string[]
  pendingImages: PendingImage[]
  imageInput: string
  videos: string[]
  videoInput: string
  amenities: Array<{ name: string; icon: string }>
  customAmenities: string[]
  customAmenityInput: string
  description: string
  depositStructure: string
  documents: Document[]
  developerInfo: string // Developer ID
  architectInfo: string // Developer ID
  interiorDesignerInfo: string // Developer ID
  builderInfo: string // Developer ID
  landscapeArchitectInfo: string // Developer ID
  marketingInfo: string // Developer ID
  salesMarketingCompany: string // Sales & Marketing Company ID
  developmentTeamOverview: string
  isPublished: boolean
  units: Unit[]
}

interface Developer {
  id: string
  name: string
  type: string
  description: string | null
  website: string | null
  image: string | null
}

interface PreConProjectFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  submitLabel?: string
  onCancel?: () => void
}

export function PreConProjectForm({
  formData,
  setFormData,
  onSubmit,
  loading = false,
  submitLabel = "Create Project",
  onCancel,
}: PreConProjectFormProps) {
  const [openSections, setOpenSections] = useState<string[]>(["basic", "address", "details", "pricing", "content", "media", "team", "units"])
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentFileInputRef = useRef<HTMLInputElement>(null)
  const unitFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [unitImageInputs, setUnitImageInputs] = useState<Record<string, string>>({})
  const [amenitySearchOpen, setAmenitySearchOpen] = useState(false)
  const [amenitySearchQuery, setAmenitySearchQuery] = useState("")
  const [unitAmenitySearchOpen, setUnitAmenitySearchOpen] = useState<Record<string, boolean>>({})
  const [unitAmenitySearchQuery, setUnitAmenitySearchQuery] = useState<Record<string, string>>({})
  const [unitCustomAmenityInput, setUnitCustomAmenityInput] = useState<Record<string, string>>({})
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(0)

  // Get sidebar width for fixed positioning
  useEffect(() => {
    const updateSidebarWidth = () => {
      // Try to find sidebar by checking for common sidebar selectors
      const sidebar = document.querySelector('[data-sidebar], .sidebar, [class*="sidebar"]') as HTMLElement
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth)
      } else {
        // Fallback: check parent container for sidebar
        const mainContainer = document.querySelector('main')?.parentElement
        if (mainContainer) {
          const sidebarElement = mainContainer.querySelector('[class*="w-"]') as HTMLElement
          if (sidebarElement && sidebarElement !== mainContainer.querySelector('main')?.parentElement) {
            setSidebarWidth(sidebarElement.offsetWidth)
          }
        }
      }
    }

    updateSidebarWidth()
    // Update on window resize and sidebar toggle
    window.addEventListener('resize', updateSidebarWidth)
    const interval = setInterval(updateSidebarWidth, 200) // Check periodically for sidebar changes
    
    return () => {
      window.removeEventListener('resize', updateSidebarWidth)
      clearInterval(interval)
    }
  }, [])

  // Cleanup preview URLs when component unmounts or images are removed
  useEffect(() => {
    return () => {
      if (formData.pendingImages) {
        formData.pendingImages.forEach((img) => {
          URL.revokeObjectURL(img.preview)
        })
      }
      // Cleanup unit pending images
      if (formData.units) {
        formData.units.forEach((unit) => {
          if (unit.pendingImages) {
            unit.pendingImages.forEach((img) => {
              URL.revokeObjectURL(img.preview)
            })
          }
        })
      }
    }
  }, [formData.pendingImages, formData.units])

  // Fetch developers for dropdowns
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/development-team?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setDevelopers(data.developers || [])
        }
      } catch (error) {
        console.error('Error fetching developers:', error)
      }
    }
    fetchDevelopers()
  }, [])

  // Helper to get developers by type
  const getDevelopersByType = (type: string) => {
    return developers.filter(d => d.type === type)
  }

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  })

  // Helper function to parse address components and update form
  const updateFormFromAddress = useCallback(async (lat: number, lng: number) => {
    try {
      // Reverse geocode to get address from coordinates
      const results = await getGeocode({ location: { lat, lng } })
      const place = results[0]
      
      // Extract address components
      const addressComponents = place.address_components || []
      
      // Helper function to get component by type
      const getComponent = (types: string[]) => {
        const component = addressComponents.find((comp: { types: string[] }) =>
          types.some(type => comp.types.includes(type))
        )
        return component ? component.long_name : ""
      }
      
      // Helper function to get short name component
      const getShortComponent = (types: string[]) => {
        const component = addressComponents.find((comp: { types: string[] }) =>
          types.some(type => comp.types.includes(type))
        )
        return component ? component.short_name : ""
      }
      
      // Parse street address
      const streetNumber = getComponent(["street_number"])
      const route = getComponent(["route"])
      
      // Parse city, state, zip
      const city = getComponent(["locality", "administrative_area_level_2"])
      const state = getShortComponent(["administrative_area_level_1"])
      const zip = getComponent(["postal_code"])
      
      // Parse neighborhood
      const neighborhood = getComponent(["neighborhood", "sublocality", "sublocality_level_1"])
      
      // Update form data
      setFormData((prev) => ({
        ...prev,
        streetNumber,
        streetName: route,
        city,
        state,
        zip,
        neighborhood,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }))
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      // At least update coordinates
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }))
    }
  }, [setFormData])

  // Handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      updateFormFromAddress(lat, lng)
    }
  }, [updateFormFromAddress])

  // Update marker position when coordinates change
  useEffect(() => {
    if (mapLoaded && mapRef.current && formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const position = { lat, lng }
        
        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setPosition(position)
        } else {
          markerRef.current = new google.maps.Marker({
            position,
            map: mapRef.current,
            draggable: true,
          })
          
          // Handle marker drag end
          markerRef.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const newLat = e.latLng.lat()
              const newLng = e.latLng.lng()
              updateFormFromAddress(newLat, newLng)
            }
          })
        }
        
        // Center map on marker
        mapRef.current.setCenter(position)
      }
    }
  }, [mapLoaded, formData.latitude, formData.longitude, updateFormFromAddress])

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setMapLoaded(true)
    
    // Set initial center to Canada if no coordinates
    if (!formData.latitude || !formData.longitude) {
      map.setCenter({ lat: 56.1304, lng: -106.3468 }) // Center of Canada
      map.setZoom(4)
    }
  }, [formData.latitude, formData.longitude])

  // Predefined amenities list from mock data with icon mappings
  const predefinedAmenities: Array<{ name: string; icon: string }> = [
    { name: 'Pool', icon: 'Waves' },
    { name: 'Gym', icon: 'Dumbbell' },
    { name: 'Concierge', icon: 'Shield' },
    { name: 'Spa', icon: 'Sparkles' },
    { name: 'Lounge', icon: 'Users' },
    { name: 'Rooftop Deck', icon: 'Square' },
    { name: 'Rooftop Terrace', icon: 'Square' },
    { name: 'Marina Access', icon: 'Car' },
    { name: 'Restaurant', icon: 'UtensilsCrossed' },
    { name: 'Private Dining Room', icon: 'UtensilsCrossed' },
    { name: 'Wine Cellar', icon: 'Sparkles' },
    { name: 'Fitness Centre', icon: 'Dumbbell' },
    { name: 'Steam Room', icon: 'Sparkles' },
    { name: 'Sauna', icon: 'Sparkles' },
    { name: 'Yoga Studio', icon: 'Users' },
    { name: 'Games Room', icon: 'Gamepad2' },
    { name: 'Visitor Parking', icon: 'Car' },
    { name: 'Screening Room', icon: 'Tv' },
    { name: 'Co Working Space', icon: 'Home' },
    { name: 'Co-working Space', icon: 'Home' },
    { name: 'Media Room', icon: 'Tv' },
    { name: 'Outdoor Patio', icon: 'Square' },
    { name: 'BBQ Permitted', icon: 'Flame' },
    { name: 'Storage', icon: 'Home' },
    { name: 'Library', icon: 'Home' },
    { name: 'Pet Spa', icon: 'Sparkles' },
    { name: 'Kids Play Room', icon: 'Users' },
    { name: 'Coffee Bar', icon: 'Coffee' },
    { name: 'Lobby', icon: 'Building2' },
    { name: 'Conference Rooms', icon: 'Home' },
    { name: 'Spin Room', icon: 'Dumbbell' },
    { name: 'Porte Cochere', icon: 'Car' },
    { name: 'Billiard Table', icon: 'Gamepad2' },
    { name: 'Billiards / Table Tennis Room', icon: 'Gamepad2' },
    { name: 'Training Studio', icon: 'Dumbbell' },
    { name: 'Indoor Childrens Play Spaces', icon: 'Users' },
    { name: 'Indoor Child Play Area', icon: 'Users' },
    { name: 'Outdoor Childrens Play Spaces', icon: 'TreePine' },
    { name: 'Parents Lounge', icon: 'Users' },
    { name: 'Meditation Garden', icon: 'TreePine' },
    { name: 'Private Treatment Room', icon: 'Sparkles' },
    { name: 'Laundry Room', icon: 'Sparkles' },
    { name: 'Storage Room', icon: 'Home' },
    { name: 'Dining Area', icon: 'UtensilsCrossed' },
    { name: 'Dining Room', icon: 'UtensilsCrossed' },
    { name: 'Catering Kitchen', icon: 'UtensilsCrossed' },
    { name: 'Parcel Storage', icon: 'Home' },
    { name: 'Coin Laundry', icon: 'Sparkles' },
    { name: 'On-Site Laundry', icon: 'Sparkles' },
    { name: 'Bike Storage', icon: 'Car' },
    { name: 'Community Park', icon: 'TreePine' },
    { name: 'Walking Trails', icon: 'Mountain' },
    { name: 'Playground', icon: 'Users' },
    { name: 'Tennis Courts', icon: 'Square' },
    { name: 'Community Centre', icon: 'Building2' },
    { name: 'Parks', icon: 'TreePine' },
    { name: 'Schools Nearby', icon: 'Building2' },
    { name: 'Shopping', icon: 'ShoppingBag' },
    { name: 'Community Pool', icon: 'Waves' },
    { name: 'Clubhouse', icon: 'Building2' },
    { name: 'Transit Access', icon: 'Car' },
    { name: 'Party Room', icon: 'Users' },
    { name: 'Kids Play Area', icon: 'Users' },
  ]

  // Icon mapping for features
  const featureIcons = {
    Waves: Waves,
    Dumbbell: Dumbbell,
    Square: Square,
    Shield: Shield,
    Sparkles: Sparkles,
    UtensilsCrossed: UtensilsCrossed,
    Coffee: Coffee,
    Car: Car,
    Lock: Lock,
    Wifi: Wifi,
    Tv: Tv,
    Gamepad2: Gamepad2,
    ShoppingBag: ShoppingBag,
    TreePine: TreePine,
    Mountain: Mountain,
    Eye: Eye,
    ArrowUpDown: ArrowUpDown,
    Flame: Flame,
    Users: Users,
    Palette: Palette,
    Hammer: Hammer,
    Sprout: Sprout,
    Megaphone: Megaphone,
    Building2: Building2,
    Home: Home,
    Ruler: Ruler,
    Bed: Bed,
    Bath: Bath,
    Calendar: Calendar,
    DollarSign: DollarSign,
    Construction: Construction,
  } as const

  type FeatureIconName = keyof typeof featureIcons

  // Toggle predefined amenity
  const togglePredefinedAmenity = (amenity: { name: string; icon: string }) => {
    setFormData((prev) => {
      const isSelected = prev.amenities.some(a => a.name === amenity.name)
      if (isSelected) {
        return {
          ...prev,
          amenities: prev.amenities.filter(a => a.name !== amenity.name),
        }
      } else {
        return {
          ...prev,
          amenities: [...prev.amenities, amenity],
        }
      }
    })
  }

  // Add custom amenity
  const addCustomAmenity = () => {
    if (!formData.customAmenityInput.trim()) return
    setFormData((prev) => ({
      ...prev,
      customAmenities: [...prev.customAmenities, prev.customAmenityInput.trim()],
      customAmenityInput: "",
    }))
  }

  // Remove custom amenity
  const removeCustomAmenity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customAmenities: prev.customAmenities.filter((_, i) => i !== index),
    }))
  }

  // Unit amenities helpers
  const toggleUnitPredefinedAmenity = (unitId: string, amenity: { name: string; icon: string }) => {
    setFormData((prev) => {
      const unit = prev.units.find(u => u.id === unitId)
      if (!unit) return prev

      const isSelected = unit.amenities.includes(amenity.name)
      const updatedAmenities = isSelected
        ? unit.amenities.filter(a => a !== amenity.name)
        : [...unit.amenities, amenity.name]

      return {
        ...prev,
        units: prev.units.map(u =>
          u.id === unitId ? { ...u, amenities: updatedAmenities } : u
        ),
      }
    })
  }

  const addUnitCustomAmenity = (unitId: string) => {
    const input = unitCustomAmenityInput[unitId]
    if (!input?.trim()) return

    setFormData((prev) => {
      const unit = prev.units.find(u => u.id === unitId)
      if (!unit) return prev

      return {
        ...prev,
        units: prev.units.map(u =>
          u.id === unitId
            ? { ...u, amenities: [...u.amenities, input.trim()] }
            : u
        ),
      }
    })

    setUnitCustomAmenityInput(prev => ({ ...prev, [unitId]: "" }))
  }

  const removeUnitAmenity = (unitId: string, index: number) => {
    setFormData((prev) => {
      const unit = prev.units.find(u => u.id === unitId)
      if (!unit) return prev

      return {
        ...prev,
        units: prev.units.map(u =>
          u.id === unitId
            ? { ...u, amenities: u.amenities.filter((_, i) => i !== index) }
            : u
        ),
      }
    })
  }

  const addArrayItem = (field: "images" | "videos", inputField: "imageInput" | "videoInput") => {
    const input = formData[inputField]
    if (!input.trim()) return
    
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], input.trim()],
      [inputField]: "",
    }))
  }

  const removeArrayItem = (field: "images" | "videos", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: "",
      url: "",
      type: "brochure",
    }
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, newDoc],
    }))
  }

  const updateDocument = (index: number, field: keyof Document, value: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      ),
    }))
  }

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  // Helper function to convert video URLs to embed URLs
  const getVideoEmbedUrl = (url: string): string | undefined => {
    if (!url) return undefined
    
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    
    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    
    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) {
      return url
    }
    
    // For direct video URLs, return undefined to show link instead
    return undefined
  }

  // Handle image file selection (store locally, don't upload yet)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit.')
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    const pendingImage: PendingImage = {
      file,
      preview,
      id: `pending-${Date.now()}-${Math.random()}`,
    }

    // Add to pending images (will be uploaded when project is created)
    setFormData((prev) => ({
      ...prev,
      pendingImages: [...(prev.pendingImages || []), pendingImage],
    }))

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove pending image
  const removePendingImage = (id: string) => {
    setFormData((prev) => {
      const imageToRemove = prev.pendingImages?.find((img) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return {
        ...prev,
        pendingImages: prev.pendingImages?.filter((img) => img.id !== id) || [],
      }
    })
  }

  // Handle unit image file selection
  const handleUnitImageUpload = (unitId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit.')
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    const pendingImage: PendingImage = {
      file,
      preview,
      id: `pending-${Date.now()}-${Math.random()}`,
    }

    // Add to unit's pending images
    setFormData((prev) => ({
      ...prev,
      units: prev.units?.map((u) =>
        u.id === unitId
          ? { ...u, pendingImages: [...(u.pendingImages || []), pendingImage] }
          : u
      ) || [],
    }))

    // Reset file input
    if (unitFileInputRefs.current[unitId]) {
      unitFileInputRefs.current[unitId]!.value = ''
    }
  }

  // Remove unit pending image
  const removeUnitPendingImage = (unitId: string, imageId: string) => {
    setFormData((prev) => {
      const unit = prev.units?.find((u) => u.id === unitId)
      if (unit) {
        const imageToRemove = unit.pendingImages?.find((img) => img.id === imageId)
        if (imageToRemove) {
          URL.revokeObjectURL(imageToRemove.preview)
        }
      }
      return {
        ...prev,
        units: prev.units?.map((u) =>
          u.id === unitId
            ? { ...u, pendingImages: u.pendingImages?.filter((img) => img.id !== imageId) || [] }
            : u
        ) || [],
      }
    })
  }

  // Add unit image URL
  const addUnitImageUrl = (unitId: string) => {
    const imageUrl = unitImageInputs[unitId]?.trim()
    if (!imageUrl) return

    setFormData((prev) => ({
      ...prev,
      units: prev.units?.map((u) =>
        u.id === unitId
          ? { ...u, images: [...(u.images || []), imageUrl] }
          : u
      ) || [],
    }))

    // Clear input
    setUnitImageInputs((prev) => ({ ...prev, [unitId]: '' }))
  }

  // Remove unit image
  const removeUnitImage = (unitId: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      units: prev.units?.map((u) =>
        u.id === unitId
          ? { ...u, images: u.images?.filter((_, i) => i !== index) || [] }
          : u
      ) || [],
    }))
  }

  // Handle document file upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ]
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG are allowed.')
      return
    }

    // Validate file size (max 20MB for documents)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      alert('File size exceeds 20MB limit.')
      return
    }

    setUploadingDocument(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('projectName', formData.projectName || 'project')
      uploadFormData.append('docType', 'brochure') // Default type, user can change it later

      const response = await fetch('/api/admin/upload/document', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload document')
      }

      const data = await response.json()
      
      // Add uploaded document to documents array
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for name
        url: data.path,
        type: "brochure", // Default type, user can change it
      }
      
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }))

      // Reset file input
      if (documentFileInputRef.current) {
        documentFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setUploadingDocument(false)
    }
  }

  // Scroll to section and open it
  const navigateToSection = (section: string) => {
    if (!openSections.includes(section)) {
      setOpenSections((prev) => [...prev, section])
    }
    setTimeout(() => {
      const element = sectionRefs.current[section]
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const sections = [
    { id: "basic", label: "Basic Info" },
    { id: "address", label: "Address" },
    { id: "details", label: "Property Details" },
    { id: "pricing", label: "Pricing Details" },
    { id: "content", label: "Content" },
    { id: "media", label: "Media" },
    { id: "team", label: "Development Team" },
    { id: "units", label: "Units Details" },
  ]

  return (
    <form onSubmit={onSubmit} className="space-y-6 relative pb-24">
      {/* Fixed Navigation Header - Below Dashboard Header (h-16 = 64px) */}
      <div className="fixed z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm" style={{ 
        top: '64px', // Header height
        left: `${sidebarWidth}px`,
        right: '0px'
      }}>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {sections.map((section) => (
              <Button
                key={section.id}
                type="button"
                variant={openSections.includes(section.id) ? "default" : "outline"}
                onClick={() => navigateToSection(section.id)}
                className="rounded-lg"
              >
                {section.label}
              </Button>
            ))}
          </div>
        </div>
      </div>


      {/* Collapsible Sections */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4"
      >
        {/* Basic Information Section */}
        <div ref={(el) => { sectionRefs.current["basic"] = el }}>
          <AccordionItem value="basic">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Basic Information
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential project details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    className="rounded-lg"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="developer">Developer</Label>
                  <Select
                    value={formData.developer}
                    onValueChange={(value) => setFormData({ ...formData, developer: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDevelopersByType("DEVELOPER").map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Selling Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platinum-access">Platinum Access</SelectItem>
                      <SelectItem value="now-selling">Now Selling</SelectItem>
                      <SelectItem value="assignments">Assignments</SelectItem>
                      <SelectItem value="new-release-coming-soon">New Release</SelectItem>
                      <SelectItem value="coming-soon">Coming Soon</SelectItem>
                      <SelectItem value="register-now">Register Now</SelectItem>
                      <SelectItem value="resale">Resale</SelectItem>
                      <SelectItem value="sold-out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Address Section */}
        <div ref={(el) => { sectionRefs.current["address"] = el }}>
          <AccordionItem value="address">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Address & Location
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
          <Card>
            <CardHeader>
              <CardTitle>Address & Location</CardTitle>
              <CardDescription>
                Project location and geographic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Location field above the map */}
              <div className="space-y-2">
                <Label htmlFor="search-location">Search Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                  <GlobalLocationSearch
                    placeholder="Search for an address or location"
                    countryRestriction="ca"
                    onSelect={async (address, coordinates) => {
                      try {
                        // Get detailed address components
                        const results = await getGeocode({ address })
                        const place = results[0]
                        
                        // Extract address components
                        const addressComponents = place.address_components || []
                        
                        // Helper function to get component by type
                        const getComponent = (types: string[]) => {
                          const component = addressComponents.find((comp: { types: string[] }) =>
                            types.some(type => comp.types.includes(type))
                          )
                          return component ? component.long_name : ""
                        }
                        
                        // Helper function to get short name component
                        const getShortComponent = (types: string[]) => {
                          const component = addressComponents.find((comp: { types: string[] }) =>
                            types.some(type => comp.types.includes(type))
                          )
                          return component ? component.short_name : ""
                        }
                        
                        // Parse street address
                        const streetNumber = getComponent(["street_number"])
                        const route = getComponent(["route"])
                        
                        // Parse city, state, zip
                        const city = getComponent(["locality", "administrative_area_level_2"])
                        const state = getShortComponent(["administrative_area_level_1"])
                        const zip = getComponent(["postal_code"])
                        
                        // Parse neighborhood
                        const neighborhood = getComponent(["neighborhood", "sublocality", "sublocality_level_1"])
                        
                        // Get coordinates
                        const { lat, lng } = coordinates || await getLatLng(place)
                        
                        // Update form data with parsed address
                        setFormData((prev) => ({
                          ...prev,
                          streetNumber,
                          streetName: route,
                          city,
                          state,
                          zip,
                          neighborhood,
                          latitude: lat.toString(),
                          longitude: lng.toString(),
                        }))
                      } catch (error) {
                        console.error("Error parsing address:", error)
                        // If parsing fails, at least set coordinates if available
                        if (coordinates) {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: coordinates.lat.toString(),
                            longitude: coordinates.lng.toString(),
                          }))
                        }
                      }
                    }}
                    className="w-full"
                    inputClassName="rounded-lg pl-10"
                    showLocationButton={false}
                    showSearchButton={false}
                  />
                </div>
              </div>
              
              {/* Interactive Map */}
              <div className="space-y-2">
                <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border relative">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={
                        formData.latitude && formData.longitude
                          ? {
                              lat: parseFloat(formData.latitude) || 56.1304,
                              lng: parseFloat(formData.longitude) || -106.3468,
                            }
                          : { lat: 56.1304, lng: -106.3468 }
                      }
                      zoom={formData.latitude && formData.longitude ? 15 : 4}
                      onLoad={onMapLoad}
                      onClick={handleMapClick}
                      options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true,
                      }}
                    >
                      {formData.latitude && formData.longitude && (
                        <Marker
                          position={{
                            lat: parseFloat(formData.latitude),
                            lng: parseFloat(formData.longitude),
                          }}
                          draggable={true}
                          onDragEnd={(e) => {
                            if (e.latLng) {
                              const lat = e.latLng.lat()
                              const lng = e.latLng.lng()
                              updateFormFromAddress(lat, lng)
                            }
                          }}
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-muted-foreground">Loading map...</div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click on the map or drag the marker to select a location. The address fields will be automatically filled.
                </p>
              </div>
              
              {/* Row 1: Street Number, Street Name, Neighborhood */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="streetNumber">Street Number</Label>
                  <Input
                    id="streetNumber"
                    className="rounded-lg"
                    value={formData.streetNumber}
                    onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetName">Street Name</Label>
                  <Input
                    id="streetName"
                    className="rounded-lg"
                    value={formData.streetName}
                    onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Neighborhood</Label>
                  <Input
                    id="neighborhood"
                    className="rounded-lg"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Row 2: Major Intersection, City, State/Province, ZIP/Postal Code */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="majorIntersection">Major Intersection</Label>
                  <Input
                    id="majorIntersection"
                    className="rounded-lg"
                    value={formData.majorIntersection}
                    onChange={(e) => setFormData({ ...formData, majorIntersection: e.target.value })}
                    placeholder="e.g., Main Street & King Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    className="rounded-lg"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    className="rounded-lg"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    className="rounded-lg"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Property Details Section */}
        <div ref={(el) => { sectionRefs.current["details"] = el }}>
          <AccordionItem value="details">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Property Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Unit specifications and building information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Property Type, Sub-Property Type (conditional), Beds */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value, subPropertyType: "" })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Condos">Condos</SelectItem>
                      <SelectItem value="Houses">Houses</SelectItem>
                      <SelectItem value="Lofts">Lofts</SelectItem>
                      <SelectItem value="Master-Planned Communities">Master-Planned Communities</SelectItem>
                      <SelectItem value="Multi Family">Multi Family</SelectItem>
                      <SelectItem value="Offices">Offices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.propertyType === "Condos" && (
                  <div className="space-y-2">
                    <Label htmlFor="subPropertyType">Condo Type</Label>
                    <Select
                      value={formData.subPropertyType}
                      onValueChange={(value) => setFormData({ ...formData, subPropertyType: value })}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low-Rise">Low-Rise</SelectItem>
                        <SelectItem value="Mid-Rise">Mid-Rise</SelectItem>
                        <SelectItem value="High-Rise">High-Rise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.propertyType === "Houses" && (
                  <div className="space-y-2">
                    <Label htmlFor="subPropertyType">House Type</Label>
                    <Select
                      value={formData.subPropertyType}
                      onValueChange={(value) => setFormData({ ...formData, subPropertyType: value })}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Link">Link</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Semi-Detached">Semi-Detached</SelectItem>
                        <SelectItem value="Detached">Detached</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="bedroomRange">Beds Range</Label>
                  <Input
                    id="bedroomRange"
                    className="rounded-lg"
                    placeholder="e.g., 1-3"
                    value={formData.bedroomRange}
                    onChange={(e) => setFormData({ ...formData, bedroomRange: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Bathroom Range, Square Foot Range, Total Units */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bathroomRange">Bathroom Range</Label>
                  <Input
                    id="bathroomRange"
                    className="rounded-lg"
                    placeholder="e.g., 1-3"
                    value={formData.bathroomRange}
                    onChange={(e) => setFormData({ ...formData, bathroomRange: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Square Foot Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="sqftMin"
                      type="number"
                      className="rounded-lg"
                      placeholder="Min"
                      value={formData.sqftMin}
                      onChange={(e) => setFormData({ ...formData, sqftMin: e.target.value })}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      id="sqftMax"
                      type="number"
                      className="rounded-lg"
                      placeholder="Max"
                      value={formData.sqftMax}
                      onChange={(e) => setFormData({ ...formData, sqftMax: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">Total Units</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    className="rounded-lg"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2.5: Unit Type Checkboxes */}
              <div className="space-y-2">
                <Label>Unit Types Available</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasDen"
                      checked={formData.hasDen}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasDen: checked === true })
                      }
                    />
                    <Label htmlFor="hasDen" className="font-normal cursor-pointer">
                      Den
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasStudio"
                      checked={formData.hasStudio}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasStudio: checked === true })
                      }
                    />
                    <Label htmlFor="hasStudio" className="font-normal cursor-pointer">
                      Studio
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasLoft"
                      checked={formData.hasLoft}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasLoft: checked === true })
                      }
                    />
                    <Label htmlFor="hasLoft" className="font-normal cursor-pointer">
                      Loft
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasWorkLiveLoft"
                      checked={formData.hasWorkLiveLoft}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasWorkLiveLoft: checked === true })
                      }
                    />
                    <Label htmlFor="hasWorkLiveLoft" className="font-normal cursor-pointer">
                      Work/Live Loft
                    </Label>
                  </div>
                </div>
              </div>

              {/* Row 3: Available Units, Suites, Storeys, Occupancy Date */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableUnits">Available Units</Label>
                  <Input
                    id="availableUnits"
                    type="number"
                    className="rounded-lg"
                    value={formData.availableUnits}
                    onChange={(e) => setFormData({ ...formData, availableUnits: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suites">Suites</Label>
                  <Input
                    id="suites"
                    type="number"
                    className="rounded-lg"
                    value={formData.suites}
                    onChange={(e) => setFormData({ ...formData, suites: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeys">Storeys</Label>
                  <Input
                    id="storeys"
                    type="number"
                    className="rounded-lg"
                    value={formData.storeys}
                    onChange={(e) => setFormData({ ...formData, storeys: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (M)</Label>
                  <Input
                    id="height"
                    type="text"
                    className="rounded-lg"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="e.g., 9'0&quot; to 10'0&quot;"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupancyDate">Occupancy Date</Label>
                  <Input
                    id="occupancyDate"
                    className="rounded-lg"
                    placeholder="e.g., Q4 2025"
                    value={formData.occupancyDate}
                    onChange={(e) => setFormData({ ...formData, occupancyDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Construction Status, Promotions */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completionProgress">Construction Status</Label>
                  <Select
                    value={formData.completionProgress}
                    onValueChange={(value) => setFormData({ ...formData, completionProgress: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-construction">Pre-construction</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="promotions">Promotions</Label>
                  <Input
                    id="promotions"
                    className="rounded-lg"
                    value={formData.promotions}
                    onChange={(e) => setFormData({ ...formData, promotions: e.target.value })}
                    placeholder="e.g., 5% Down Payment, 10% Down Payment, etc."
                  />
                </div>
              </div>

              {/* Row 5: Ownership Type, Garage, Basement */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownershipType">Ownership Type</Label>
                  <Input
                    id="ownershipType"
                    className="rounded-lg"
                    value={formData.ownershipType}
                    onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                    placeholder="e.g., Freehold, Condo, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="garage">Garage</Label>
                  <Select
                    value={formData.garage}
                    onValueChange={(value) => setFormData({ ...formData, garage: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select garage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basement">Basement</Label>
                  <Select
                    value={formData.basement}
                    onValueChange={(value) => setFormData({ ...formData, basement: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select basement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finished">Finished</SelectItem>
                      <SelectItem value="unfinished">Unfinished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Pricing Details Section */}
        <div ref={(el) => { sectionRefs.current["pricing"] = el }}>
          <AccordionItem value="pricing">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Pricing Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Details</CardTitle>
                    <CardDescription>
                      All pricing and fee information for the project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Main Pricing */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startingPrice">Starting Price</Label>
                        <Input
                          id="startingPrice"
                          type="number"
                          className="rounded-lg"
                          value={formData.startingPrice}
                          onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endingPrice">Ending Price</Label>
                        <Input
                          id="endingPrice"
                          type="number"
                          className="rounded-lg"
                          value={formData.endingPrice}
                          onChange={(e) => setFormData({ ...formData, endingPrice: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avgPricePerSqft">Avg. Price (/ft)</Label>
                        <Input
                          id="avgPricePerSqft"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.avgPricePerSqft}
                          onChange={(e) => setFormData({ ...formData, avgPricePerSqft: e.target.value })}
                          placeholder="e.g., 850.50"
                        />
                      </div>
                    </div>

                    {/* Parking & Locker Pricing */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="parkingPrice">Parking Price</Label>
                        <Input
                          id="parkingPrice"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.parkingPrice}
                          onChange={(e) => setFormData({ ...formData, parkingPrice: e.target.value })}
                          placeholder="e.g., 50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lockerPrice">Locker Price</Label>
                        <Input
                          id="lockerPrice"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.lockerPrice}
                          onChange={(e) => setFormData({ ...formData, lockerPrice: e.target.value })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parkingPriceDetail">Parking Price Detail</Label>
                        <Textarea
                          id="parkingPriceDetail"
                          className="rounded-lg"
                          value={formData.parkingPriceDetail}
                          onChange={(e) => setFormData({ ...formData, parkingPriceDetail: e.target.value })}
                          placeholder="Additional details about parking pricing"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lockerPriceDetail">Locker Price Detail</Label>
                        <Textarea
                          id="lockerPriceDetail"
                          className="rounded-lg"
                          value={formData.lockerPriceDetail}
                          onChange={(e) => setFormData({ ...formData, lockerPriceDetail: e.target.value })}
                          placeholder="Additional details about locker pricing"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Additional Fees */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="assignmentFee">Assignment Fee</Label>
                        <Input
                          id="assignmentFee"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.assignmentFee}
                          onChange={(e) => setFormData({ ...formData, assignmentFee: e.target.value })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="developmentLevies">Development Levies</Label>
                        <Input
                          id="developmentLevies"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.developmentLevies}
                          onChange={(e) => setFormData({ ...formData, developmentLevies: e.target.value })}
                          placeholder="e.g., 15000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="developmentCharges">Development Charges</Label>
                        <Input
                          id="developmentCharges"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.developmentCharges}
                          onChange={(e) => setFormData({ ...formData, developmentCharges: e.target.value })}
                          placeholder="e.g., 20000"
                        />
                      </div>
                    </div>

                    {/* Maintenance Fees */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceFeesPerSqft">Maintenance Fees (/ft)</Label>
                        <Input
                          id="maintenanceFeesPerSqft"
                          type="number"
                          step="0.01"
                          className="rounded-lg"
                          value={formData.maintenanceFeesPerSqft}
                          onChange={(e) => setFormData({ ...formData, maintenanceFeesPerSqft: e.target.value })}
                          placeholder="e.g., 0.65"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="maintenanceFeesDetail">Maintenance Fees Detail</Label>
                        <Textarea
                          id="maintenanceFeesDetail"
                          className="rounded-lg"
                          value={formData.maintenanceFeesDetail}
                          onChange={(e) => setFormData({ ...formData, maintenanceFeesDetail: e.target.value })}
                          placeholder="Additional details about maintenance fees"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="floorPremiums">Floor Premiums</Label>
                        <Textarea
                          id="floorPremiums"
                          className="rounded-lg"
                          value={formData.floorPremiums}
                          onChange={(e) => setFormData({ ...formData, floorPremiums: e.target.value })}
                          placeholder="Details about floor premiums (e.g., $5,000 per floor above 10th)"
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Content Section */}
        <div ref={(el) => { sectionRefs.current["content"] = el }}>
          <AccordionItem value="content">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Content
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Description & Documents</CardTitle>
                    <CardDescription>
                      Project description and downloadable documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={6}
                        placeholder="Detailed project description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depositStructure">Deposit Structure</Label>
                      <Textarea
                        id="depositStructure"
                        value={formData.depositStructure}
                        onChange={(e) => setFormData({ ...formData, depositStructure: e.target.value })}
                        rows={2}
                        placeholder="e.g., 5% on signing, 10% within 6 months, 5% at occupancy"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Documents</Label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            ref={documentFileInputRef}
                            onChange={handleDocumentUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                            className="hidden"
                            disabled={uploadingDocument}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => documentFileInputRef.current?.click()}
                            disabled={uploadingDocument}
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Document
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addDocument}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add URL
                          </Button>
                        </div>
                      </div>
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                          <Input
                            className="rounded-lg"
                            placeholder="Document name"
                            value={doc.name}
                            onChange={(e) => updateDocument(index, "name", e.target.value)}
                          />
                          <Input
                            className="rounded-lg"
                            placeholder="URL"
                            value={doc.url}
                            onChange={(e) => updateDocument(index, "url", e.target.value)}
                          />
                          <Select
                            value={doc.type}
                            onValueChange={(value) => updateDocument(index, "type", value)}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brochure">Brochure</SelectItem>
                              <SelectItem value="floorplan">Floorplan</SelectItem>
                              <SelectItem value="specification">Specification</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDocument(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                    <CardDescription>
                      Select predefined amenities or add custom ones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Searchable Amenities Dropdown */}
                    <div className="space-y-3">
                      <Label>Select Amenities</Label>
                      <Popover open={amenitySearchOpen} onOpenChange={setAmenitySearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={amenitySearchOpen}
                            className="w-full justify-between rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {formData.amenities.length > 0 
                                  ? `${formData.amenities.length} selected` 
                                  : "Search and select amenities..."}
                              </span>
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <div className="p-2">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <Input
                                placeholder="Search amenities..."
                                value={amenitySearchQuery}
                                onChange={(e) => setAmenitySearchQuery(e.target.value)}
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto p-1">
                              {predefinedAmenities
                                .filter((amenity) =>
                                  amenity.name.toLowerCase().includes(amenitySearchQuery.toLowerCase())
                                )
                                .map((amenity) => {
                                  const isSelected = formData.amenities.some(a => a.name === amenity.name)
                                  const IconComponent = featureIcons[amenity.icon as FeatureIconName] || Sparkles
                                  return (
                                    <div
                                      key={amenity.name}
                                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
                                      onClick={() => {
                                        togglePredefinedAmenity(amenity)
                                      }}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => {
                                          togglePredefinedAmenity(amenity)
                                        }}
                                      />
                                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm flex-1">{amenity.name}</span>
                                    </div>
                                  )
                                })}
                              {predefinedAmenities.filter((amenity) =>
                                amenity.name.toLowerCase().includes(amenitySearchQuery.toLowerCase())
                              ).length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No amenities found
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Custom Amenities */}
                    <div className="space-y-3">
                      <Label htmlFor="customAmenityInput">Add Custom Amenity</Label>
                      <div className="flex gap-2">
                        <Input
                          id="customAmenityInput"
                          className="rounded-lg"
                          placeholder="Enter custom amenity name"
                          value={formData.customAmenityInput}
                          onChange={(e) => setFormData({ ...formData, customAmenityInput: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addCustomAmenity()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addCustomAmenity}
                          className="rounded-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Selected Amenities List */}
                    {(formData.amenities.length > 0 || formData.customAmenities.length > 0) && (
                      <div className="space-y-2">
                        <Label>Selected Amenities ({formData.amenities.length + formData.customAmenities.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.amenities.map((amenity, index) => {
                            const IconComponent = featureIcons[amenity.icon as FeatureIconName] || Sparkles
                            return (
                              <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                                <IconComponent className="h-4 w-4" />
                                {amenity.name}
                                <button
                                  type="button"
                                  onClick={() => togglePredefinedAmenity(amenity)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })}
                          {formData.customAmenities.map((amenity, index) => (
                            <Badge key={`custom-${index}`} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                              {amenity}
                              <button
                                type="button"
                                onClick={() => removeCustomAmenity(index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Media Section */}
        <div ref={(el) => { sectionRefs.current["media"] = el }}>
          <AccordionItem value="media">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Media
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                {/* Images and Videos in the same row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Images</CardTitle>
                      <CardDescription>
                        Project images and media URLs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Upload Section */}
                      <div className="space-y-2">
                        <Label htmlFor="imageUpload">Upload Image</Label>
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            id="imageUpload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                          <p className="text-sm text-muted-foreground self-center">
                            Max 10MB (JPEG, PNG, WebP, GIF)
                          </p>
                        </div>
                      </div>

                      {/* URL Input Section */}
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Or Enter Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="imageUrl"
                            className="rounded-lg"
                            placeholder="Image URL"
                            value={formData.imageInput}
                            onChange={(e) => setFormData({ ...formData, imageInput: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addArrayItem("images", "imageInput")
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addArrayItem("images", "imageInput")}
                            className="rounded-lg"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Pending Images Preview (not yet uploaded) */}
                      {formData.pendingImages && formData.pendingImages.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selected Images ({formData.pendingImages.length}) - Will be uploaded when project is created</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {formData.pendingImages.map((pendingImg) => (
                              <div
                                key={pendingImg.id}
                                className="relative group border rounded-lg overflow-hidden aspect-square border-primary/50"
                              >
                                <img
                                  src={pendingImg.preview}
                                  alt={`Pending image ${pendingImg.file.name}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePendingImage(pendingImg.id)}
                                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                  {pendingImg.file.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Already Uploaded Images Preview (from URLs) */}
                      {formData.images.length > 0 && (
                        <div className="space-y-2">
                          <Label>Image URLs ({formData.images.length})</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {formData.images.map((img, index) => (
                              <div
                                key={index}
                                className="relative group border rounded-lg overflow-hidden aspect-square"
                              >
                                <img
                                  src={img}
                                  alt={`Project image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/images/p1.jpg'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem("images", index)}
                                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                  {img.split('/').pop()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Videos Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Videos</CardTitle>
                      <CardDescription>
                        Project videos and media URLs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* URL Input Section */}
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">Enter Video URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="videoUrl"
                            className="rounded-lg"
                            placeholder="Video URL (YouTube, Vimeo, etc.)"
                            value={formData.videoInput}
                            onChange={(e) => setFormData({ ...formData, videoInput: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addArrayItem("videos", "videoInput")
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addArrayItem("videos", "videoInput")}
                            className="rounded-lg"
                          >
                            <Plus className="h-4 w-4" /> 
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Supports YouTube, Vimeo, and direct video URLs
                        </p>
                      </div>

                      {/* Videos Preview */}
                      {formData.videos.length > 0 && (
                        <div className="space-y-2">
                          <Label>Added Videos ({formData.videos.length})</Label>
                          <div className="space-y-3">
                            {formData.videos.map((video, index) => (
                              <div
                                key={index}
                                className="relative group border rounded-lg overflow-hidden"
                              >
                                <div className="aspect-video bg-muted flex items-center justify-center">
                                  {getVideoEmbedUrl(video) ? (
                                    <iframe
                                      src={getVideoEmbedUrl(video)}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      title={`Project video ${index + 1}`}
                                    />
                                  ) : (
                                    <div className="text-center p-4">
                                      <p className="text-sm text-muted-foreground mb-2">Video Preview</p>
                                      <a
                                        href={video}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                      >
                                        {video.length > 50 ? `${video.substring(0, 50)}...` : video}
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem("videos", index)}
                                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Development Team Section */}
        <div ref={(el) => { sectionRefs.current["team"] = el }}>
          <AccordionItem value="team">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Development Team
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
          <Card>
            <CardHeader>
              <CardTitle>Development Team</CardTitle>
              <CardDescription>
                Information about the development team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamOverview">Team Overview</Label>
                <Textarea
                  id="teamOverview"
                  className="rounded-lg"
                  value={formData.developmentTeamOverview}
                  onChange={(e) => setFormData({ ...formData, developmentTeamOverview: e.target.value })}
                  rows={3}
                  placeholder="Overview of the development team..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: "developerInfo", label: "Developer", type: "DEVELOPER" },
                  { key: "architectInfo", label: "Architect", type: "ARCHITECT" },
                  { key: "interiorDesignerInfo", label: "Interior Designer", type: "INTERIOR_DESIGNER" },
                  { key: "builderInfo", label: "Builder", type: "BUILDER" },
                  { key: "landscapeArchitectInfo", label: "Landscape Architect", type: "LANDSCAPE_ARCHITECT" },
                  { key: "marketingInfo", label: "Marketing", type: "MARKETING" },
                ].map(({ key, label, type }) => {
                  const selectedId = formData[key as keyof typeof formData] as string
                  const selectedDeveloper = developers.find(d => d.id === selectedId)
                  const availableDevelopers = getDevelopersByType(type)
                  
                  return (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Select
                        value={selectedId || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            [key]: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableDevelopers.map((dev) => (
                            <SelectItem key={dev.id} value={dev.id}>
                              {dev.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedDeveloper && (
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <p className="text-sm font-medium">{selectedDeveloper.name}</p>
                          {selectedDeveloper.description && (
                            <p className="text-sm text-muted-foreground mt-1">{selectedDeveloper.description}</p>
                          )}
                          {selectedDeveloper.website && (
                            <a
                              href={selectedDeveloper.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline mt-1 block"
                            >
                              {selectedDeveloper.website}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Sales & Marketing Company */}
                <div className="space-y-2">
                  <Label htmlFor="salesMarketingCompany">Sales & Marketing Company</Label>
                  <Select
                    value={formData.salesMarketingCompany || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        salesMarketingCompany: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select sales & marketing company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {getDevelopersByType("MARKETING").map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.salesMarketingCompany && (
                    (() => {
                      const selectedCompany = developers.find(d => d.id === formData.salesMarketingCompany)
                      return selectedCompany ? (
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <p className="text-sm font-medium">{selectedCompany.name}</p>
                          {selectedCompany.description && (
                            <p className="text-sm text-muted-foreground mt-1">{selectedCompany.description}</p>
                          )}
                          {selectedCompany.website && (
                            <a
                              href={selectedCompany.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline mt-1 block"
                            >
                              {selectedCompany.website}
                            </a>
                          )}
                        </div>
                      ) : null
                    })()
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Units Details Section */}
        <div ref={(el) => { sectionRefs.current["units"] = el }}>
          <AccordionItem value="units">
            <AccordionTrigger className="container text-lg font-semibold px-6">
              Units Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 container">
                <Card>
                  <CardHeader>
                    <CardTitle>Unit Details</CardTitle>
                    <CardDescription>
                      Add individual unit information. Total Units: {formData.totalUnits || "0"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Unit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          const newUnit: Unit = {
                            id: `unit-${Date.now()}-${Math.random()}`,
                            unitName: "",
                            beds: "",
                            baths: "",
                            sqft: "",
                            price: "",
                            maintenanceFee: "",
                            status: "for-sale",
                            images: [],
                            pendingImages: [],
                            description: "",
                            features: [],
                            amenities: [],
                          }
                          setFormData((prev) => ({
                            ...prev,
                            units: [...(prev.units || []), newUnit],
                          }))
                        }}
                        className="rounded-lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </div>

                    {/* Units List */}
                    {formData.units && formData.units.length > 0 ? (
                      <div className="space-y-4">
                        {formData.units.map((unit, index) => (
                          <Card key={unit.id} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  Unit {index + 1} {unit.unitName && `- ${unit.unitName}`}
                                </CardTitle>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      units: prev.units?.filter((u) => u.id !== unit.id) || [],
                                    }))
                                  }}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Row 1: Unit Name, Beds, Baths, Sqft */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-name-${unit.id}`}>Unit Name</Label>
                                  <Input
                                    id={`unit-name-${unit.id}`}
                                    className="rounded-lg"
                                    placeholder="e.g., 101, 202"
                                    value={unit.unitName}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, unitName: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-beds-${unit.id}`}>Beds</Label>
                                  <Input
                                    id={`unit-beds-${unit.id}`}
                                    type="text"
                                    className="rounded-lg"
                                    placeholder="e.g., 2"
                                    value={unit.beds}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, beds: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-baths-${unit.id}`}>Baths</Label>
                                  <Input
                                    id={`unit-baths-${unit.id}`}
                                    type="text"
                                    className="rounded-lg"
                                    placeholder="e.g., 2"
                                    value={unit.baths}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, baths: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-sqft-${unit.id}`}>Sqft</Label>
                                  <Input
                                    id={`unit-sqft-${unit.id}`}
                                    type="number"
                                    className="rounded-lg"
                                    placeholder="e.g., 1200"
                                    value={unit.sqft}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, sqft: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Row 2: Price, Maintenance Fee, Status */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-price-${unit.id}`}>Price</Label>
                                  <Input
                                    id={`unit-price-${unit.id}`}
                                    type="number"
                                    step="0.01"
                                    className="rounded-lg"
                                    placeholder="e.g., 500000"
                                    value={unit.price}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, price: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-maintenance-${unit.id}`}>Maintenance Fee</Label>
                                  <Input
                                    id={`unit-maintenance-${unit.id}`}
                                    type="number"
                                    step="0.01"
                                    className="rounded-lg"
                                    placeholder="e.g., 500"
                                    value={unit.maintenanceFee}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, maintenanceFee: e.target.value } : u
                                        ) || [],
                                      }))
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-status-${unit.id}`}>Status</Label>
                                  <Select
                                    value={unit.status}
                                    onValueChange={(value) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        units: prev.units?.map((u) =>
                                          u.id === unit.id ? { ...u, status: value } : u
                                        ) || [],
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className="rounded-lg">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="for-sale">For Sale</SelectItem>
                                      <SelectItem value="sold-out">Sold Out</SelectItem>
                                      <SelectItem value="reserved">Reserved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Row 3: Unit Images */}
                              <div className="space-y-4">
                                <Label>Unit Images</Label>
                                
                                {/* File Upload Section */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      ref={(el) => {
                                        unitFileInputRefs.current[unit.id] = el
                                      }}
                                      onChange={(e) => handleUnitImageUpload(unit.id, e)}
                                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                      className="hidden"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => unitFileInputRefs.current[unit.id]?.click()}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </Button>
                                    <p className="text-sm text-muted-foreground self-center">
                                      Max 10MB (JPEG, PNG, WebP, GIF)
                                    </p>
                                  </div>
                                </div>

                                {/* URL Input Section */}
                                <div className="space-y-2">
                                  <Label htmlFor={`unit-image-url-${unit.id}`}>Or Enter Image URL</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`unit-image-url-${unit.id}`}
                                      className="rounded-lg"
                                      placeholder="Image URL"
                                      value={unitImageInputs[unit.id] || ''}
                                      onChange={(e) => setUnitImageInputs((prev) => ({ ...prev, [unit.id]: e.target.value }))}
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault()
                                          addUnitImageUrl(unit.id)
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => addUnitImageUrl(unit.id)}
                                      className="rounded-lg"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Pending Images Preview (not yet uploaded) */}
                                {unit.pendingImages && unit.pendingImages.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Selected Images ({unit.pendingImages.length}) - Will be uploaded when project is saved</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {unit.pendingImages.map((pendingImg) => (
                                        <div
                                          key={pendingImg.id}
                                          className="relative group border rounded-lg overflow-hidden aspect-square border-primary/50"
                                        >
                                          <img
                                            src={pendingImg.preview}
                                            alt={`Pending image ${pendingImg.file.name}`}
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeUnitPendingImage(unit.id, pendingImg.id)}
                                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                            {pendingImg.file.name}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Already Uploaded Images Preview (from URLs) */}
                                {unit.images && unit.images.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Image URLs ({unit.images.length})</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {unit.images.map((img, index) => (
                                        <div
                                          key={index}
                                          className="relative group border rounded-lg overflow-hidden aspect-square"
                                        >
                                          <img
                                            src={img}
                                            alt={`Unit image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement
                                              target.src = '/images/p1.jpg'
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeUnitImage(unit.id, index)}
                                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                            {img.split('/').pop()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Row 4: Description */}
                              <div className="space-y-2">
                                <Label htmlFor={`unit-description-${unit.id}`}>Description</Label>
                                <Textarea
                                  id={`unit-description-${unit.id}`}
                                  className="rounded-lg"
                                  placeholder="Unit description..."
                                  rows={3}
                                  value={unit.description}
                                  onChange={(e) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      units: prev.units?.map((u) =>
                                        u.id === unit.id ? { ...u, description: e.target.value } : u
                                      ) || [],
                                    }))
                                  }}
                                />
                              </div>

                              {/* Row 5: Features */}
                              <div className="space-y-2">
                                <Label htmlFor={`unit-features-${unit.id}`}>Features (comma-separated)</Label>
                                <Input
                                  id={`unit-features-${unit.id}`}
                                  className="rounded-lg"
                                  placeholder="e.g., Balcony, Parking, Storage"
                                  value={unit.features.join(", ")}
                                  onChange={(e) => {
                                    const features = e.target.value
                                      .split(",")
                                      .map((f) => f.trim())
                                      .filter((f) => f.length > 0)
                                    setFormData((prev) => ({
                                      ...prev,
                                      units: prev.units?.map((u) =>
                                        u.id === unit.id ? { ...u, features } : u
                                      ) || [],
                                    }))
                                  }}
                                />
                                {unit.features.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {unit.features.map((feature, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Row 6: Unit Amenities */}
                              <div className="space-y-4 border-t pt-4">
                                <div>
                                  <Label>Unit Amenities</Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Select predefined amenities or add custom ones
                                  </p>
                                </div>

                                {/* Searchable Amenities Dropdown */}
                                <div className="space-y-3">
                                  <Label>Select Amenities</Label>
                                  <Popover 
                                    open={unitAmenitySearchOpen[unit.id] || false} 
                                    onOpenChange={(open) => setUnitAmenitySearchOpen(prev => ({ ...prev, [unit.id]: open }))}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={unitAmenitySearchOpen[unit.id] || false}
                                        className="w-full justify-between rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Search className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            {unit.amenities.length > 0 
                                              ? `${unit.amenities.length} selected` 
                                              : "Search and select amenities..."}
                                          </span>
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                      <div className="p-2">
                                        <div className="flex items-center border-b px-3">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                          <Input
                                            placeholder="Search amenities..."
                                            value={unitAmenitySearchQuery[unit.id] || ""}
                                            onChange={(e) => setUnitAmenitySearchQuery(prev => ({ ...prev, [unit.id]: e.target.value }))}
                                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                          />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                          {predefinedAmenities
                                            .filter((amenity) =>
                                              amenity.name.toLowerCase().includes((unitAmenitySearchQuery[unit.id] || "").toLowerCase())
                                            )
                                            .map((amenity) => {
                                              const isSelected = unit.amenities.includes(amenity.name)
                                              const IconComponent = featureIcons[amenity.icon as FeatureIconName] || Sparkles
                                              return (
                                                <div
                                                  key={amenity.name}
                                                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
                                                  onClick={() => {
                                                    toggleUnitPredefinedAmenity(unit.id, amenity)
                                                  }}
                                                >
                                                  <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => {
                                                      toggleUnitPredefinedAmenity(unit.id, amenity)
                                                    }}
                                                  />
                                                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                                                  <span className="text-sm flex-1">{amenity.name}</span>
                                                </div>
                                              )
                                            })}
                                          {predefinedAmenities.filter((amenity) =>
                                            amenity.name.toLowerCase().includes((unitAmenitySearchQuery[unit.id] || "").toLowerCase())
                                          ).length === 0 && (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                              No amenities found
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {/* Custom Amenities */}
                                <div className="space-y-3">
                                  <Label htmlFor={`unit-custom-amenity-${unit.id}`}>Add Custom Amenity</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`unit-custom-amenity-${unit.id}`}
                                      className="rounded-lg"
                                      placeholder="Enter custom amenity name"
                                      value={unitCustomAmenityInput[unit.id] || ""}
                                      onChange={(e) => setUnitCustomAmenityInput(prev => ({ ...prev, [unit.id]: e.target.value }))}
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault()
                                          addUnitCustomAmenity(unit.id)
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => addUnitCustomAmenity(unit.id)}
                                      className="rounded-lg"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Selected Amenities List */}
                                {unit.amenities.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Selected Amenities ({unit.amenities.length})</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {unit.amenities.map((amenityName, index) => {
                                        const amenity = predefinedAmenities.find(a => a.name === amenityName)
                                        const IconComponent = amenity 
                                          ? (featureIcons[amenity.icon as FeatureIconName] || Sparkles)
                                          : Sparkles
                                        return (
                                          <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                                            <IconComponent className="h-4 w-4" />
                                            {amenityName}
                                            <button
                                              type="button"
                                              onClick={() => removeUnitAmenity(unit.id, index)}
                                              className="ml-1 hover:text-destructive"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No units added yet. Click "Add Unit" to get started.</p>
                        <p className="text-sm mt-2">
                          Based on "Total Units" field: {formData.totalUnits || "0"} units
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>
      </Accordion>

      {/* Spacer to account for fixed action buttons */}
      <div className="h-24" />

      {/* Fixed Action Buttons at Bottom */}
      <div className="fixed bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg" style={{ 
        left: `${sidebarWidth}px`,
        right: '0px'
      }}>
        <div className="px-6 py-4">
          <div className="flex justify-between gap-4 max-w-7xl mx-auto items-center">
            {onCancel && (
              <Button
                type="button"
                variant="destructive"
                onClick={onCancel}
                disabled={loading}
                className="min-w-[120px]"
              >
                Cancel
              </Button>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isPublished: checked === true })
                  }
                />
                <Label 
                  htmlFor="isPublished" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Publish project (unchecked = draft)
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                {formData.isPublished 
                  ? "Project will be visible on the website" 
                  : "Project will be saved as draft (not visible on website)"}
              </div>
            </div>
            <div className="flex-1" />
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                formData.isPublished ? submitLabel : "Save as Draft"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}


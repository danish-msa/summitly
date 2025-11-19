"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export interface FormData {
  projectName: string
  developer: string
  startingPrice: string
  endingPrice: string
  status: string
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
  sqftRange: string
  totalUnits: string
  availableUnits: string
  storeys: string
  completionDate: string
  completionProgress: string
  promotions: string
  images: string[]
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
  developmentTeamOverview: string
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
  const [activeTab, setActiveTab] = useState("basic")
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentFileInputRef = useRef<HTMLInputElement>(null)
  const [amenitySearchOpen, setAmenitySearchOpen] = useState(false)
  const [amenitySearchQuery, setAmenitySearchQuery] = useState("")
  const [developers, setDevelopers] = useState<Developer[]>([])

  // Fetch developers for dropdowns
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/developers?limit=1000')
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

  // Handle image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Add uploaded image path to images array
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, data.path],
      }))

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
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

  return (
    <form onSubmit={onSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid max-w-5xl w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="details">Property Details</TabsTrigger>
          <TabsTrigger value="media">Media & Content</TabsTrigger>
          <TabsTrigger value="team">Development Team</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 container">
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
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    className="rounded-lg"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="developer">Developer *</Label>
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
                  <Label htmlFor="startingPrice">Starting Price *</Label>
                  <Input
                    id="startingPrice"
                    type="number"
                    className="rounded-lg"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endingPrice">Ending Price *</Label>
                  <Input
                    id="endingPrice"
                    type="number"
                    className="rounded-lg"
                    value={formData.endingPrice}
                    onChange={(e) => setFormData({ ...formData, endingPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Selling Status *</Label>
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
                      <SelectItem value="new-release-coming-soon">New Release Coming Soon</SelectItem>
                      <SelectItem value="coming-soon">Coming Soon</SelectItem>
                      <SelectItem value="resale">Resale</SelectItem>
                      <SelectItem value="sold-out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-6 container">
          <Card>
            <CardHeader>
              <CardTitle>Address & Location</CardTitle>
              <CardDescription>
                Project location and geographic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  
                  {/* Search Location field at the bottom of the map */}
                  <div className="absolute bottom-4 left-4 right-4 max-w-5xl z-10">
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
                        inputClassName="rounded-lg pl-10 bg-white shadow-lg"
                        showLocationButton={false}
                        showSearchButton={false}
                      />
                    </div>
                  </div>
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
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    className="rounded-lg"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    className="rounded-lg"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
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
        </TabsContent>

        {/* Property Details Tab */}
        <TabsContent value="details" className="space-y-6 container">
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
                  <Label htmlFor="propertyType">Property Type *</Label>
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
                    <Label htmlFor="subPropertyType">Condo Type *</Label>
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
                    <Label htmlFor="subPropertyType">House Type *</Label>
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
                  <Label htmlFor="bedroomRange">Beds *</Label>
                  <Select
                    value={formData.bedroomRange}
                    onValueChange={(value) => setFormData({ ...formData, bedroomRange: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="1 Bdrm">1 Bdrm</SelectItem>
                      <SelectItem value="1 Bdrm + Den">1 Bdrm + Den</SelectItem>
                      <SelectItem value="2 Bdrms">2 Bdrms</SelectItem>
                      <SelectItem value="2 Bdrms + Den">2 Bdrms + Den</SelectItem>
                      <SelectItem value="3 Bdrms">3 Bdrms</SelectItem>
                      <SelectItem value="3 Bdrms + Den">3 Bdrms + Den</SelectItem>
                      <SelectItem value="4 Bdrms">4 Bdrms</SelectItem>
                      <SelectItem value="4 Bdrms + Den">4 Bdrms + Den</SelectItem>
                      <SelectItem value="5 Bdrms">5 Bdrms</SelectItem>
                      <SelectItem value="5 Bdrms + Den">5 Bdrms + Den</SelectItem>
                      <SelectItem value="6 Bdrms">6 Bdrms</SelectItem>
                      <SelectItem value="Loft">Loft</SelectItem>
                      <SelectItem value="Work / Live Loft">Work / Live Loft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Bathroom Range, Square Foot Range, Total Units */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bathroomRange">Bathroom Range *</Label>
                  <Input
                    id="bathroomRange"
                    className="rounded-lg"
                    placeholder="e.g., 1-3"
                    value={formData.bathroomRange}
                    onChange={(e) => setFormData({ ...formData, bathroomRange: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqftRange">Square Foot Range *</Label>
                  <Input
                    id="sqftRange"
                    className="rounded-lg"
                    placeholder="e.g., 650-1,450"
                    value={formData.sqftRange}
                    onChange={(e) => setFormData({ ...formData, sqftRange: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">Total Units *</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    className="rounded-lg"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Available Units, Storeys, Completion Date */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableUnits">Available Units *</Label>
                  <Input
                    id="availableUnits"
                    type="number"
                    className="rounded-lg"
                    value={formData.availableUnits}
                    onChange={(e) => setFormData({ ...formData, availableUnits: e.target.value })}
                    required
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
                  <Label htmlFor="completionDate">Completion Date *</Label>
                  <Input
                    id="completionDate"
                    className="rounded-lg"
                    placeholder="e.g., Q4 2025"
                    value={formData.completionDate}
                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Construction Status, Promotions */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completionProgress">Construction Status *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="promotions">Promotions</Label>
                  <Select
                    value={formData.promotions}
                    onValueChange={(value) => setFormData({ ...formData, promotions: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select promotion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5% Down Payment">5% Down Payment</SelectItem>
                      <SelectItem value="10% Down Payment">10% Down Payment</SelectItem>
                      <SelectItem value="15% Down Payment">15% Down Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Content Tab */}
        <TabsContent value="media" className="space-y-6 container">
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
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="rounded-lg"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
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

                {/* Images Preview */}
                {formData.images.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Images ({formData.images.length})</Label>
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
        </TabsContent>

        {/* Development Team Tab */}
        <TabsContent value="team" className="space-y-6 container">
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
                      value={selectedId || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          [key]: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-4 mt-6">
        {onCancel && (
          <Button
            type="button"
            variant="destructive"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <div className="flex-1" />
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}


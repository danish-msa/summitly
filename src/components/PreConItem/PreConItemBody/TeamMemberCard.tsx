import React from 'react'
import { LucideIcon } from 'lucide-react'

interface TeamMemberStats {
  totalProjects: number
  activelySelling: number
  launchingSoon: number
  registrationPhase: number
  soldOut: number
  resale: number
  cancelled: number
}

interface TeamMember {
  id?: string
  name: string
  description?: string
  website?: string
  image?: string
  email?: string
  phone?: string
  stats?: TeamMemberStats
}

interface TeamMemberCardProps {
  member: TeamMember
  icon: LucideIcon
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, icon: Icon }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
    const fallback = target.nextElementSibling as HTMLElement
    if (fallback) {
      fallback.classList.remove('hidden')
    }
  }

  return (
    <div className="space-y-6">
      {/* Member Info */}
      <div className="flex items-start gap-4">
        {member.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.image}
              alt={member.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              onError={handleImageError}
            />
          </>
        ) : null}
        <div
          className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${
            member.image ? 'hidden' : ''
          }`}
        >
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{member.name}</h3>
          {member.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {member.description}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Visit Website →
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {member.email}
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {member.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {member.stats && <TeamMemberStats stats={member.stats} />}
    </div>
  )
}

interface TeamMemberStatsProps {
  stats: TeamMemberStats
}

const TeamMemberStats: React.FC<TeamMemberStatsProps> = ({ stats }) => {
  const getStatBlockColor = (statType: string): string => {
    const colorMap: Record<string, string> = {
      activelySelling: 'bg-green-50 border-green-200 text-green-700',
      launchingSoon: 'bg-blue-50 border-blue-200 text-blue-700',
      registrationPhase: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      soldOut: 'bg-gray-50 border-gray-200 text-gray-700',
      resale: 'bg-purple-50 border-purple-200 text-purple-700',
      cancelled: 'bg-red-50 border-red-200 text-red-700',
    }
    return colorMap[statType] || 'bg-muted border-border'
  }

  const statItems = [
    { key: 'activelySelling', label: 'Actively Selling', value: stats.activelySelling },
    { key: 'launchingSoon', label: 'Launching Soon', value: stats.launchingSoon },
    { key: 'registrationPhase', label: 'Registration Phase', value: stats.registrationPhase },
    { key: 'soldOut', label: 'Sold Out', value: stats.soldOut },
    { key: 'resale', label: 'Resale', value: stats.resale },
    { key: 'cancelled', label: 'Cancelled', value: stats.cancelled },
  ]

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">{stats.totalProjects} Total Projects</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => (
          <div
            key={item.key}
            className={`text-center p-3 rounded-lg border ${getStatBlockColor(item.key)}`}
          >
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamMemberCard
export type { TeamMember, TeamMemberStats }

